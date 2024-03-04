import * as path from "path";
import resolveConfig, { Config } from "./config";
import { diffBranch } from "./tools/git";
import { asvCliLogger } from "./tools/log";
import { getPackages, updatePackageVersion } from "./tools/version";
import { VersionType } from "./tools/version/update-version";


export * from './config/constant';


export default async function run(commandConfig: Config) {

  const finalConfig = resolveConfig(commandConfig)

  const {
    registry,
    beta,
    set,
    mainBranch,
    // append
  } = finalConfig;


  try {
    let type: VersionType = beta ? 'beta' : 'patch';

    const diffFiles = await diffBranch(mainBranch)

    const waitForUpdatePackages = await getPackages(diffFiles)

    const updatePackages = waitForUpdatePackages.filter(pkg => pkg.isDiff)

    if (!updatePackages.length) {
      asvCliLogger.success('No packages need to be updated')
      return
    }else{
      asvCliLogger.success('Packages need to be updated: ' + updatePackages.map(pkg => pkg.packageJson.name).join(', '))
    }

    for (const pkg of updatePackages) {
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
  } catch (e: any) {
    asvCliLogger.error('[vergo] error:' + e.message);
  }

}