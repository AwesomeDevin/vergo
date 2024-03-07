import * as path from 'path';
import { PackageJSON } from '@changesets/types';
import { Packages } from '@manypkg/get-packages';
import { readFile } from 'fs-extra';
import { IUpdatedPackage, IWaitingForUpgradePackage, TVergoPackage } from '../../typing';
import { getPrePubDiffJsonFileName, overwriteJsonToFile, readJsonFromFile } from '../index';
import { vergoCliLogger } from '../log';
import upgradeVersion, { VersionType } from './upgrade-version';

export async function packageDoubleCheckFailed(pkg: IWaitingForUpgradePackage) {
  const prePubDiffJsonFileName = getPrePubDiffJsonFileName();
  const prePubDiffJson = await readJsonFromFile(prePubDiffJsonFileName);
  const packages = prePubDiffJson?.packages || [];
  if (!packages.some((item) => item.name === pkg.name)) {
    return true;
  }
  return false;
}

/**
 * upgrade package version
 */
export async function upgradePackageVersion({
  waitingForUpgradePackage,
  type,
  registry,
  set,
  doubleDiffCheck,
}: {
  waitingForUpgradePackage: IWaitingForUpgradePackage;
  type: VersionType;
  registry: string;
  set?: string;
  doubleDiffCheck?: boolean;
}) {
  const packageJSONPath = path.join(waitingForUpgradePackage.dir, 'package.json');

  const pkgJSON: PackageJSON = JSON.parse(await readFile(packageJSONPath, 'utf8'));

  const newVersion = await upgradeVersion(
    {
      name: pkgJSON.name,
      version: set || pkgJSON.version,
    },
    type,
    registry,
  );

  if (doubleDiffCheck) {
    vergoCliLogger.await(
      `git diff failed, double checking for ${waitingForUpgradePackage.name} version: ${newVersion} ...`,
    );
    if (await packageDoubleCheckFailed(waitingForUpgradePackage)) {
      vergoCliLogger.warn(
        `double check failed for ${waitingForUpgradePackage.name} version: ${newVersion}, skip upgrade.`,
      );
      return;
    }
  }

  await overwriteJsonToFile(packageJSONPath, {
    ...pkgJSON,
    version: newVersion,
  });

  const res: IUpdatedPackage = {
    pkgJSON,
    newVersion,
    oldVersion: pkgJSON.version,
  };

  return res;
}

/**
 * calculate new version by type
 * @param param
 * @returns
 */
export async function getNewVersion({
  packageName,
  currentVersion,
  type,
  registry,
}: {
  packageName: string;
  currentVersion: string;
  type: VersionType;
  registry: string;
}) {
  const newVersion = await upgradeVersion(
    {
      name: packageName,
      version: currentVersion,
    },
    type,
    registry,
  );
  return newVersion;
}

/**
 * get all packages
 */
export async function getAllPackages(workspaceInfo: Packages, diffFiles?: string[]) {
  const packages: TVergoPackage[] = workspaceInfo.packages.map((pkg) => {
    const curDiffFiles = typeof diffFiles === 'undefined' ? [] : diffFiles?.filter((file) => file.startsWith(pkg.dir));
    return {
      ...pkg,
      isDiff: typeof diffFiles === 'undefined' ? true : curDiffFiles.length > 0,
      diffFiles: curDiffFiles,
    };
  });
  return packages;
}

/**
 * get waiting for upgrade packages
 * @param diffFiles
 * @returns
 */
export async function getWaitingForUpgradePackages(allPackages: TVergoPackage[]): Promise<IWaitingForUpgradePackage[]> {
  const res: IWaitingForUpgradePackage[] = allPackages
    .filter((pkg) => pkg.isDiff)
    .map((item) => ({
      dir: item.dir,
      name: item.packageJson.name,
      diffFiles: item.diffFiles,
    }));
  return res;
}
