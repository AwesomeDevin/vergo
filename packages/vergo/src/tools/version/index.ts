import { Package } from "@manypkg/get-packages";
import { readFile, writeJSON } from "fs-extra";
import { getWorkspaceInfo } from '../../../../../utils/monorepo';
import { PWD_PATH } from "../../config/constant";
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
  console.log('diffFiles',diffFiles)
  const packages: (Package & { isDiff: boolean })[] = workspaceInfo.packages.map(pkg => ({
    ...pkg,
    isDiff: diffFiles.some(file => file.startsWith(pkg.dir))
  }))

  return packages
}