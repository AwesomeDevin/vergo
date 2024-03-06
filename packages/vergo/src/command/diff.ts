import * as path from 'path';
import { Config, UserConfig, getRuntimeConfig } from "../config";
import { VERGO_DIR_NAME, VERSION_FILE_NAME } from "../config/constant";
import { checkDirExistsAndCreate, checkFileExistsAndCreate, getType, overwriteJsonToFile, readJsonFromFile } from "../tools";
import { diffBranch } from "../tools/git";
import { vergoCliLogger } from '../tools/log';
import { getNewVersion, getWaitingForUpdatePackages } from "../tools/version";


export async function touchDiffJsonFile(waitingForUpdatePackages, runtimeConfig: Config){

  const { set , beta, registry } = runtimeConfig

  const type = getType(beta)

  for(const pkg of waitingForUpdatePackages){

    await vergoCliLogger.await(`processing package: ${pkg.packageJson.name} ...`)

    const newVersion = await getNewVersion({
      packageName: pkg.packageJson.name,
      currentVersion: set || pkg.packageJson.version,
      type,
      registry
    })

    const mainVersion = newVersion.split('-')[0]

    const diffJsonFileName = path.join(VERGO_DIR_NAME, `${VERSION_FILE_NAME}.${mainVersion}.json`)


    await checkFileExistsAndCreate(diffJsonFileName)

    let oldData = await readJsonFromFile(diffJsonFileName)

    const newData  = {
      ...oldData,
      packages:  Array.from(new Set([...oldData.packages || [], pkg.packageJson.name]))
    }

    await overwriteJsonToFile(diffJsonFileName, newData)

  }

}

export default async function diff(config: UserConfig){

  const runtimeConfig = await getRuntimeConfig(config)
  const { mainBranch } = runtimeConfig

  const diffFiles = await diffBranch(mainBranch)
  const waitingForUpdatePackages = await getWaitingForUpdatePackages(diffFiles)


  await checkDirExistsAndCreate(VERGO_DIR_NAME)

  await touchDiffJsonFile(waitingForUpdatePackages, runtimeConfig)

  await vergoCliLogger.success('generated version diff file')


}