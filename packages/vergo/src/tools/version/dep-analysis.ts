import * as path from 'path';
import { getDependentsGraph } from '@changesets/get-dependents-graph';
import { PackageJSON } from '@changesets/types';
import { Packages } from '@manypkg/get-packages';
import { overwriteJsonToFile } from '..';
import { IUpdatedPackage, TDepType, TVergoPackage } from '../../typing';
import { vergoCliLogger } from '../log';

export async function upgradePkgDeps(
  upgradedPackages: IUpdatedPackage[],
  workspaceInfo: Packages,
  allPackages: TVergoPackage[],
) {
  vergoCliLogger.await('upgrading dependent packages ...');

  const hostPkgNamesRecord: Map<string, string[]> = new Map();

  const depGraph = await getDepGraph(workspaceInfo);

  for (const upgradedPackage of upgradedPackages) {
    const hostPkgNames = depGraph.get(upgradedPackage.pkgJSON.name);
    if (hostPkgNames?.length) {
      const { pkg: hostPkg, depType } = getDepHostPkgAndType(upgradedPackage.pkgJSON, allPackages);
      if (hostPkg && depType) {
        const recordKey = `package: ${hostPkg.packageJson.name}`;
        const upgradedData = await upgradeHostAndDepVersion(hostPkg.packageJson, upgradedPackage, depType);
        const hostPkgJsonDir = path.join(hostPkg.dir, 'package.json');

        await overwriteJsonToFile(hostPkgJsonDir, upgradedData.pkgJson);

        const record = hostPkgNamesRecord.get(recordKey) || [];
        record.push(
          `${depType}: ${upgradedPackage.pkgJSON.name}@${upgradedData.oldVersion} -> ${upgradedPackage.pkgJSON.name}@${upgradedData.newVersion}`,
        );
        hostPkgNamesRecord.set(recordKey, record);
      }
    }
  }

  hostPkgNamesRecord.size
    ? vergoCliLogger.log('dependent packages upgraded:', hostPkgNamesRecord)
    : vergoCliLogger.log('no dependent packages upgraded');
}

export function getDepHostPkgAndType(
  upgradedPackage: PackageJSON,
  allPackages: TVergoPackage[],
): {
  pkg?: TVergoPackage;
  depType?: TDepType;
} {
  for (const pkg of allPackages) {
    if (pkg.packageJson.dependencies?.[upgradedPackage.name]) {
      return {
        pkg,
        depType: 'dependencies',
      };
    }
    if (pkg.packageJson.peerDependencies?.[upgradedPackage.name]) {
      return {
        pkg,
        depType: 'peerDependencies',
      };
    }
    if (pkg.packageJson.devDependencies?.[upgradedPackage.name]) {
      return {
        pkg,
        depType: 'devDependencies',
      };
    }
  }
  return {};
}

export async function getDepGraph(workspaceInfo: Packages) {
  return getDependentsGraph(workspaceInfo, {
    bumpVersionsWithWorkspaceProtocolOnly: false,
  });
}

export async function upgradeHostAndDepVersion(
  targetPkg: PackageJSON,
  upgradedPackage: IUpdatedPackage,
  depType: TDepType,
) {
  if (!targetPkg[depType]) {
    throw new Error(`no ${depType} in ${targetPkg.name}`);
  }

  const oldVersion = targetPkg[depType]?.[upgradedPackage.pkgJSON.name];
  const newVersion = upgradedPackage.newVersion;

  const newPkgJson = {
    ...targetPkg,
    version: newVersion,
    [depType]: {
      ...targetPkg[depType],
      [upgradedPackage.pkgJSON.name]: newVersion,
    },
  };

  return {
    pkgJson: newPkgJson,
    oldVersion,
    newVersion,
  };
}
