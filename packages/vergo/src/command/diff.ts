import { getWorkspaceInfo } from '../../../utils';
import { UserConfig, getRuntimeConfig } from '../config';
import { PWD_PATH, VERGO_DIR_NAME } from '../config/constant';
import {
  checkDirExistsAndCreate,
  checkFileExistsAndCreate,
  getPrePubDiffJsonFileName,
  overwriteJsonToFile,
  readJsonFromFile,
} from '../tools';
import { diffBranch } from '../tools/git';
import { vergoCliLogger } from '../tools/log';
import { getAllPackages, getWaitingForUpgradePackages } from '../tools/version';
import { getDepGraph } from '../tools/version/dep-analysis';
import { IWaitingForUpgradePackage, TVergoPackage } from '../typing';

function findTargetPkg({
  waitingForUpgradePackages,
  allPackages,
  targetPackageName,
}: {
  waitingForUpgradePackages: IWaitingForUpgradePackage[];
  allPackages: TVergoPackage[];
  targetPackageName: string;
}) {
  const res1 = waitingForUpgradePackages.find((item) => item.name === targetPackageName);
  if (res1) {
    return res1;
  }
  const res2 = allPackages.find((item) => item.packageJson.name === targetPackageName);
  if (res2) {
    return res2;
  }
  return undefined;
}

function generateDependOn({
  targetPackageName,
  depGraph,
  allPackages,
  result,
  waitingForUpgradePackages,
}: {
  targetPackageName: string;
  depGraph?: Map<string, string[]>;
  allPackages: TVergoPackage[];
  result: IWaitingForUpgradePackage[];
  waitingForUpgradePackages: IWaitingForUpgradePackage[];
}) {
  const dependOnPkgNames = depGraph?.get(targetPackageName);

  const pkg = findTargetPkg({
    waitingForUpgradePackages,
    allPackages,
    targetPackageName,
  });

  const item: IWaitingForUpgradePackage = {
    name: targetPackageName,
    dir: pkg?.dir || 'unknown',
    diffFiles: pkg?.diffFiles || [],
    isDependOn: dependOnPkgNames,
  };

  result.push(item);

  if (dependOnPkgNames) {
    dependOnPkgNames?.forEach((hostPkgName) => {
      const hostPkgWaitingForUpdate = result.some((item) => item.name === hostPkgName);
      if (!hostPkgWaitingForUpdate) {
        generateDependOn({
          targetPackageName: hostPkgName,
          depGraph,
          allPackages,
          result,
          waitingForUpgradePackages,
        });
      }
    });
  }
}

export async function touchDiffJsonFile(
  waitingForUpgradePackages: IWaitingForUpgradePackage[],
  allPackages: TVergoPackage[],
  depGraph?: Map<string, string[]>,
) {
  await vergoCliLogger.await('processing pre-commit ...');

  const diffJsonFileName = getPrePubDiffJsonFileName();
  await checkFileExistsAndCreate(diffJsonFileName);

  const oldData = await readJsonFromFile(diffJsonFileName);
  const packages: IWaitingForUpgradePackage[] = [];

  for (const pkg of waitingForUpgradePackages) {
    if (depGraph) {
      generateDependOn({
        targetPackageName: pkg.name,
        depGraph,
        allPackages,
        result: packages,
        waitingForUpgradePackages,
      });
    } else {
      packages.push(pkg);
    }
  }

  const newData = {
    ...oldData,
    packages,
  };
  await overwriteJsonToFile(diffJsonFileName, newData);
}

export default async function diff(config: UserConfig) {
  const runtimeConfig = await getRuntimeConfig(config);
  const { mainBranch, analyzeDeps } = runtimeConfig;

  const diffFiles = await diffBranch(mainBranch);

  const workspaceInfo = await getWorkspaceInfo(PWD_PATH);
  const allPackages = await getAllPackages(workspaceInfo, diffFiles);
  const waitingForUpgradePackages = await getWaitingForUpgradePackages(allPackages);

  const depGraph = analyzeDeps ? await getDepGraph(workspaceInfo) : undefined;

  await checkDirExistsAndCreate(VERGO_DIR_NAME);

  await touchDiffJsonFile(waitingForUpgradePackages, allPackages, depGraph);

  await vergoCliLogger.success('generated version diff file');

  const { $ } = await import('execa');
  await $`git add ${VERGO_DIR_NAME}`;
}
