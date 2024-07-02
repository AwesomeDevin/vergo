import { PackageJSON } from '@changesets/types';
import { Packages } from '@manypkg/get-packages';
import { readFile } from 'fs-extra';
import { getVersions } from 'ice-npm-utils';
import * as path from 'path';
import semver from 'semver';
import { PWD_PATH } from '../../config/constant';
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
  projectRoot = '',
  doubleDiffCheck,
}: {
  waitingForUpgradePackage: IWaitingForUpgradePackage;
  type: VersionType;
  registry: string;
  set?: string;
  projectRoot?: string;
  doubleDiffCheck?: boolean;
}) {
  if (!waitingForUpgradePackage.relativeDir) {
    throw new Error(`${waitingForUpgradePackage.relativeDir} is required`);
  }

  const packageJSONPath = path.join(projectRoot, waitingForUpgradePackage.relativeDir, 'package.json');

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
    relativeDir: waitingForUpgradePackage.relativeDir,
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


export function findTargetPkg({
  waitingUpgradePackagesByChange,
  allPackages,
  targetPackageName,
  projectRoot = '',
}: {
  waitingUpgradePackagesByChange: IWaitingForUpgradePackage[];
  allPackages: TVergoPackage[];
  targetPackageName: string;
  projectRoot: string;
}): IWaitingForUpgradePackage | undefined {
  const res1 = waitingUpgradePackagesByChange.find((item) => item.name === targetPackageName);
  if (res1) {
    return res1;
  }
  const res2 = allPackages.find((item) => item.packageJson.name === targetPackageName);
  if (res2) {
    return {
      name: res2.packageJson.name,
      relativeDir: res2.dir.replace(projectRoot, ''),
      diffFiles: res2.diffFiles,
    };
  }
  return undefined;
}

export function generateDependOn({
  targetPackageName,
  depGraph,
  allPackages,
  result,
  waitingUpgradePackagesByChange,
  projectRoot,
}: {
  targetPackageName: string;
  depGraph?: Map<string, string[]>;
  allPackages: TVergoPackage[];
  result: IWaitingForUpgradePackage[];
  waitingUpgradePackagesByChange: IWaitingForUpgradePackage[];
  projectRoot: string;
}) {
  const dependOnPkgNames = depGraph?.get(targetPackageName);

  const pkg = findTargetPkg({
    waitingUpgradePackagesByChange,
    allPackages,
    targetPackageName,
    projectRoot,
  });

  const item: IWaitingForUpgradePackage = {
    name: targetPackageName,
    relativeDir: pkg?.relativeDir || 'unknown',
    diffFiles: pkg?.diffFiles || [],
    isDependOn: dependOnPkgNames,
  };

  if (!result.some((item) => item.name === targetPackageName)) {
    result.push(item);
  }

  if (dependOnPkgNames) {
    dependOnPkgNames?.forEach((hostPkgName) => {
      const hostPkgWaitingForUpdate = result.some((item) => item.name === hostPkgName);
      if (!hostPkgWaitingForUpdate) {
        generateDependOn({
          targetPackageName: hostPkgName,
          depGraph,
          allPackages,
          result,
          waitingUpgradePackagesByChange,
          projectRoot,
        });
      }
    });
  }
}

/**
 * get all packages
 */
export async function getAllPackages({workspaceInfo, diffFiles, excludes }: {workspaceInfo: Packages, diffFiles?: string[], excludes?: string[]}) {
  const packages: TVergoPackage[] = workspaceInfo.packages.map((pkg) => {
    const curDiffFiles = typeof diffFiles === 'undefined' ? [] : diffFiles?.filter((file) => file.startsWith(pkg.dir));
    return {
      ...pkg,
      isDiff: typeof diffFiles === 'undefined' ? true : curDiffFiles.length > 0,
      diffFiles: curDiffFiles,
    };
  });
  const pkgs = packages.filter(
    (pkg) =>
      !excludes?.some((exclude) => {
        return pkg.dir.match(new RegExp(`^${path.join(PWD_PATH, exclude)}`));
      }) && pkg.dir.match(new RegExp(`^${PWD_PATH}`)),
  );
  return pkgs

}

/**
 * get waiting for upgrade packages
 * @param diffFiles
 * @returns
 */
export async function getWaitingForUpgradePackages(
  allPackages: TVergoPackage[],
  depGraph?: Map<string, string[]>,
  projectRoot = '',
): Promise<IWaitingForUpgradePackage[]> {
  const packages: IWaitingForUpgradePackage[] = [];
  const waitingUpgradePackagesByChange = allPackages
    .filter((pkg) => pkg.isDiff)
    .map((item) => {
      const res: IWaitingForUpgradePackage = {
        relativeDir: item.dir.replace(projectRoot, ''),
        name: item.packageJson.name,
        diffFiles: item.diffFiles.map((file) => file.replace(projectRoot, '')),
      };
      return res;
    });

  for (const pkg of waitingUpgradePackagesByChange) {
    if (depGraph) {
      generateDependOn({
        targetPackageName: pkg.name,
        depGraph,
        allPackages,
        result: packages,
        waitingUpgradePackagesByChange,
        projectRoot,
      });
    } else {
      packages.push(pkg);
    }
  }

  return packages;
}


export async function getVersionInfo(name: string, registry: string) {
  let versions: string[] = [];
  try {
    versions = (await getVersions(name, registry)).sort(semver.rcompare);
  } catch (e: any) {
    vergoCliLogger.warn(`${name} find Versions Error: ${e.message}`);
  }

  const stableVersions = versions.filter((version) => {
    return semver.valid(version) && !semver.prerelease(version);
  });

  // 获取最新的版本号包括 beta 版本
  const latestVersion = versions.length ? versions[0] : undefined;

  // 获取最新的版本号不包括 beta 版本
  const stableLatestVersion = stableVersions.length ? stableVersions[0] : undefined;

  return {
    latestVersion,
    stableLatestVersion,
    versions,
  };
}