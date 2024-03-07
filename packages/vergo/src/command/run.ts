import { getWorkspaceInfo } from '../../../utils';
import { UserConfig, getRuntimeConfig } from '../config';
import { PWD_PATH } from '../config/constant';
import { getType } from '../tools';
import { diffBranch } from '../tools/git';
import { vergoCliLogger } from '../tools/log';
import { getAllPackages, getWaitingForUpgradePackages, upgradePackageVersion } from '../tools/version';
import { upgradePkgDeps } from '../tools/version/dep-analysis';
import { IWaitingForUpgradePackage, TVergoPackage } from '../typing';

export * from '../config/constant';

export default async function run(commandConfig: UserConfig) {
  const runtimeConfig = await getRuntimeConfig(commandConfig);

  const { registry, beta, set, mainBranch, analyzeDeps } = runtimeConfig;

  const type = getType(beta);

  const workspaceInfo = await getWorkspaceInfo(PWD_PATH);
  let allPackages: TVergoPackage[] = [];
  let doubleDiffCheck = false; // enable use prepub.xxx.json to doubleDiffCheck in .avergo

  try {
    // by git diff
    const diffFiles = await diffBranch(mainBranch);
    allPackages = await getAllPackages(workspaceInfo, diffFiles);
  } catch (e: any) {
    allPackages = await getAllPackages(workspaceInfo);
    doubleDiffCheck = true;
  }
  const waitingForUpgradePackages: IWaitingForUpgradePackage[] = await getWaitingForUpgradePackages(allPackages);

  if (!waitingForUpgradePackages.length) {
    vergoCliLogger.log('no packages need to be upgraded');
    return;
  }

  vergoCliLogger.log(`packages will be upgraded: ${waitingForUpgradePackages.map((pkg) => pkg.name).join(', ')}`);

  const upgradedPackages = (
    await Promise.all(
      waitingForUpgradePackages.map((pkg) =>
        upgradePackageVersion({
          waitingForUpgradePackage: pkg,
          type,
          registry,
          set,
          doubleDiffCheck,
        }),
      ),
    )
  ).filter((pkg) => !!pkg);

  // @ts-ignore
  analyzeDeps && upgradedPackages.length && (await upgradePkgDeps(upgradedPackages, workspaceInfo, allPackages));

  vergoCliLogger.success(analyzeDeps ? 'all packages and deps have been upgraded ' : 'all packages have been upgraded');

  process.exit(0);
}
