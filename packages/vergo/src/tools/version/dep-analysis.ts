import { getDependentsGraph } from '@changesets/get-dependents-graph';
import { PackageJSON } from '@changesets/types';
import { Packages } from '@manypkg/get-packages';
import * as path from 'path';
import { getVersionInfo } from '.';
import { overwriteJsonToFile } from '..';
import { IUpdatedPackage, TDepType, TVergoPackage } from '../../typing';
import { vergoCliLogger } from '../log';

export async function upgradePkgDeps(
  upgradedPackages: IUpdatedPackage[],
  workspaceInfo: Packages,
  allPackages: TVergoPackage[],
  enableTransformWorkspaceProtocol?: boolean,
) {
  vergoCliLogger.await('upgrading dependent packages ...');

  const hostPkgNamesRecord: Map<string, string[]> = new Map();

  const depGraph = await getDepGraph(workspaceInfo);

  await Promise.all(
    upgradedPackages.map(async (upgradedPackage) => {
      const hostPkgNames = depGraph.get(upgradedPackage.pkgJSON.name);
      if (hostPkgNames?.length) {
        const { pkg: hostPkg, depType } = getDepHostPkgAndType(upgradedPackage.pkgJSON, allPackages);
        if (hostPkg && depType) {
          const recordKey = `package: ${hostPkg.packageJson.name}`;
          const newHostPkgJson = await upgradeHostAndDepVersion(hostPkg.packageJson, upgradedPackage, depType, enableTransformWorkspaceProtocol);
          const hostPkgJsonDir = path.join(hostPkg.dir, 'package.json');

          await overwriteJsonToFile(hostPkgJsonDir, newHostPkgJson.pkgJSON);

          const record = hostPkgNamesRecord.get(recordKey) || [];
          record.push(
            `${depType}: ${upgradedPackage.pkgJSON.name}@${newHostPkgJson.oldVersion} -> ${upgradedPackage.pkgJSON.name}@${newHostPkgJson.newVersion}`,
          );
          hostPkgNamesRecord.set(recordKey, record);
        }
      }
    }),
  );

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
  hostPkgJson: PackageJSON,
  upgradedPackage: IUpdatedPackage,
  depType: TDepType,
  enableTransformWorkspaceProtocol?: boolean,
): Promise<IUpdatedPackage> {
  if (!hostPkgJson[depType]) {
    throw new Error(`no ${depType} in ${hostPkgJson.name}`);
  }

  const oldVersion = hostPkgJson[depType]?.[upgradedPackage.pkgJSON.name];
  if (!oldVersion?.match(/workspace/)) {
    vergoCliLogger.warn(`old version is not a workspace protocol: ${upgradedPackage.pkgJSON.name}`);

    if (!oldVersion) {
      throw new Error(`no old version for ${upgradedPackage.pkgJSON.name}`);
    }

    if (!hostPkgJson) {
      throw new Error(`no target package for ${upgradedPackage.pkgJSON.name}`);
    }

    return {
      pkgJSON: hostPkgJson,
      oldVersion,
      newVersion: oldVersion,
      relativeDir: upgradedPackage.relativeDir,
    };
  }
  const newVersion = upgradedPackage.newVersion;

  const newPkgJson = {
    ...hostPkgJson,
    version: newVersion,

    // if enableTransformWorkspaceProtocol is true, replace workspace protocol with version
    ...enableTransformWorkspaceProtocol  ? { [depType]: {
      ...hostPkgJson[depType],
      [upgradedPackage.pkgJSON.name]: newVersion,
    },} : {},
  };

  return {
    pkgJSON: newPkgJson,
    oldVersion,
    newVersion,
    relativeDir: upgradedPackage.relativeDir,
  };
}


export async function replaceWorkspaceProtocolWithVersion(pkgJson: PackageJSON, registry: string) {
  async function replaceWorkspaceProtocol(deps: Record<string, string>) {
    const newDeps = await Promise.all(
      Object.keys(deps).map(async (dep) => {
        if (deps[dep].match(/workspace/)) {
          const { stableLatestVersion } = await getVersionInfo(pkgJson.name, registry);
          if (!stableLatestVersion) {
            throw new Error(`no stableLatestVersion for ${pkgJson.name}`);
          }
          return {
            [dep]: stableLatestVersion,
          };
        }
        return { [dep]: deps[dep] };
      }),
    );
    return newDeps.reduce((acc, cur) => Object.assign(acc, cur), {});
  }

  const newPkgJson = {
    ...pkgJson,
    ...(pkgJson.dependencies && { dependencies: await replaceWorkspaceProtocol(pkgJson.dependencies) }),
    ...(pkgJson.devDependencies && { devDependencies: await replaceWorkspaceProtocol(pkgJson.devDependencies) }),
    ...(pkgJson.peerDependencies && { peerDependencies: await replaceWorkspaceProtocol(pkgJson.peerDependencies) }),
  };

  return newPkgJson;
}
