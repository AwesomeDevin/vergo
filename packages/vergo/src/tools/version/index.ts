import { Package } from "@manypkg/get-packages";
import { readFile, writeJSON } from "fs-extra";
import { getWorkspaceInfo } from '../../../../../utils/monorepo';
import { PWD_PATH } from "../../command/run";
import updateVersion, { VersionType } from "./update-version";


/**
 * update package version 
 */
export async function updatePackageVersion({
  packagePath, type, registry, set
}: {
  packagePath: string,
  type: VersionType,
  registry: string,
  set?: string
}) {
  const pkgJSON = JSON.parse(await readFile(packagePath, 'utf8'))
  const newVersion = await updateVersion({
    name: pkgJSON.name,
    version: set || pkgJSON.version
  }, type, registry);
  pkgJSON.version = newVersion;
  await writeJSON(packagePath, pkgJSON, { spaces: 2 });
  return pkgJSON
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
  registry
}: {
  packageName: string,
  currentVersion: string,
  type: VersionType
  registry: string
}) {
  const newVersion = await updateVersion({
    name: packageName,
    version: currentVersion
  }, type, registry);
  return newVersion;
}


/**
 * get packages
 */
export async function getPackages(diffFiles: string[]) {
  const workspaceInfo = await getWorkspaceInfo(PWD_PATH)
  const packages: (Package & { isDiff: boolean })[] = workspaceInfo.packages.map(pkg => ({
    ...pkg,
    isDiff: diffFiles.some(file => file.startsWith(pkg.dir))
  }))
  return packages
}

/**
 * get waiting for update packages
 * @param diffFiles 
 * @returns 
 */
export async function getWaitingForUpdatePackages(diffFiles: string[]){
  const allPackages = await getPackages(diffFiles)
  return allPackages.filter(pkg => pkg.isDiff)
}



// export async function updateDepPackages(updatePackages, allPackages){
//   console.log('updateDepPackages',updateDepPackages)
    // allPackages
    // .forEach((pkg) => {
    //   const curPkgDeps = updatePackages.filter((updatePkg) => (
    //     updatePkg.name &&
    //      ((pkg.packageJson.dependencies?.length && updatePkg.name in pkg.packageJson.dependencies) ||
    //     (pkg.packageJson.devDependencies?.length && updatePkg.name in pkg.packageJson.devDependencies))
    //   ))
    //   if (!curPkgDeps.length) return;
      
    //   // update version
    //   curPkgDeps.forEach((curPkg) => {
    //     const newVersion = curPkg.version;
    //     if (pkg.packageJson.dependencies?.length && curPkg.name in pkg.packageJson.dependencies) {
    //       pkg.packageJson.dependencies[curPkg.name] = `^${newVersion}`;
    //     }
    //     if (pkg.packageJson.devDependencies?.length && curPkg.name in pkg.packageJson.devDependencies) {
    //       pkg.packageJson.devDependencies[curPkg.name] = `^${newVersion}`;
    //     }
    //   });

    // });
// }