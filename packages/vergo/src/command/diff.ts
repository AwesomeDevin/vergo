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
import { IWaitingForUpgradePackage } from '../typing';

export async function touchDiffJsonFile(packages: IWaitingForUpgradePackage[]) {
  await vergoCliLogger.await('processing pre-commit ...');

  const diffJsonFileName = getPrePubDiffJsonFileName();
  await checkFileExistsAndCreate(diffJsonFileName);

  const oldData = await readJsonFromFile(diffJsonFileName);

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
  const depGraph = analyzeDeps ? await getDepGraph(workspaceInfo) : undefined;
  const allPackages = await getAllPackages(workspaceInfo, diffFiles);
  const waitingForUpgradePackages = await getWaitingForUpgradePackages(allPackages, depGraph, workspaceInfo.root.dir);

  await checkDirExistsAndCreate(VERGO_DIR_NAME);

  await touchDiffJsonFile(waitingForUpgradePackages);

  await vergoCliLogger.success('generated version diff file');

  const { $ } = await import('execa');
  await $`git add ${VERGO_DIR_NAME}`;
}
