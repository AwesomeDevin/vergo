import { getWorkspaceInfo } from '../../../utils';
import { UserConfig, getRuntimeConfig } from '../config';
import { PWD_PATH } from '../config/constant';
import { getPrePubDiffJsonFileName, getType, readJsonFromFile } from '../tools';
import { diffBranch } from '../tools/git';
import { vergoCliLogger } from '../tools/log';
import { getAllPackages, getWaitingForUpgradePackages, upgradePackageVersion } from '../tools/version';
import { getDepGraph, upgradePkgDeps } from '../tools/version/dep-analysis';
import { IUpdatedPackage, IWaitingForUpgradePackage, TVergoPackage } from '../typing';


export * from '../config/constant';

export default async function run(commandConfig: UserConfig) {
  const runtimeConfig = await getRuntimeConfig(commandConfig);

  const { registry, beta, set, mainBranch, analyzeDeps } = runtimeConfig;

  const type = getType(beta);

  const workspaceInfo = await getWorkspaceInfo(PWD_PATH);
  const projectRoot = workspaceInfo.root.dir;
  let allPackages: TVergoPackage[] = [];
  let waitingForUpgradePackages: IWaitingForUpgradePackage[] = [];
  let doubleDiffCheck = false; // enable use prepub.xxx.json to doubleDiffCheck in .avergo
  const prePubJson = await readJsonFromFile(getPrePubDiffJsonFileName());


  try {
    // by git diff
    const diffFiles = await diffBranch(mainBranch);
    allPackages = await getAllPackages(workspaceInfo, diffFiles);
  } catch (e: any) {
    allPackages = await getAllPackages(workspaceInfo);
    doubleDiffCheck = true;
  }


  if (prePubJson) {
    waitingForUpgradePackages = prePubJson.packages;
  } else {
    const depGraph = analyzeDeps ? await getDepGraph(workspaceInfo) : undefined;
    waitingForUpgradePackages = await getWaitingForUpgradePackages(allPackages, depGraph, projectRoot);
  }

  if (!waitingForUpgradePackages.length) {
    vergoCliLogger.log('no packages need to be upgraded');
    return;
  }

  vergoCliLogger.log(`packages will be upgraded: ${waitingForUpgradePackages.map((pkg) => pkg.name).join(', ')}`);

  const upgradingPackages = (
    await Promise.all(
      waitingForUpgradePackages.map((pkg) =>
        upgradePackageVersion({
          waitingForUpgradePackage: pkg,
          type,
          registry,
          set,
          projectRoot,
        }),
      ),
    )
  ).filter((pkg) => !!pkg);

  if (analyzeDeps && upgradingPackages?.length) {
    // 更新依赖有改动的包
    await upgradePkgDeps(upgradingPackages as IUpdatedPackage[], workspaceInfo, allPackages);

    // 替换不发布的包，但有 workspace 依赖 为最新版本号
    // await Promise.all(
    //   upgradingPackages.map(async (item) => {
    //     if (item?.pkgJSON) {
    //       const newJson = await replaceWorkspaceProtocolWithVersion(item?.pkgJSON, registry);
    //       await overwriteJsonToFile(path.join(projectRoot, item.relativeDir, 'package.json'), newJson);
    //     }
    //   }),
    // );
  }

  vergoCliLogger.success(analyzeDeps ? 'all packages and deps have been upgraded ' : 'all packages have been upgraded');

  process.exit(0);
}
