import * as path from "path";
import { UserConfig, getRuntimeConfig } from "../config";
import { getType } from "../tools";
import { diffBranch } from "../tools/git";
import { vergoCliLogger } from "../tools/log";
import { getWaitingForUpdatePackages, updatePackageVersion } from "../tools/version";


export * from '../config/constant';


export default async function run(commandConfig: UserConfig) {


  const runtimeConfig = await getRuntimeConfig(commandConfig)
  
  const {
    registry,
    beta,
    set,
    mainBranch,
    // append
  } = runtimeConfig;


  let type = getType(beta)

  const diffFiles = await diffBranch(mainBranch)

  const waitingForUpdatePackages = await getWaitingForUpdatePackages(diffFiles)

  if (!waitingForUpdatePackages.length) {
    vergoCliLogger.log('no packages need to be updated')
    return
  }else{
    vergoCliLogger.log('packages will be updated: ' + waitingForUpdatePackages.map(pkg => pkg.packageJson.name).join(', '))
  }

  for (const pkg of waitingForUpdatePackages) {
    await updatePackageVersion({
      packagePath: path.join(pkg.dir, 'package.json'),
      type,
      registry,
      set
    })
    // await generateChangeLog({
    //   packagePath: pkg.dir,
    //   append
    // })
  }

  process.exit(0);
  
}
