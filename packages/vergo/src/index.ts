import * as path from "path";
import resolveConfig, { Config } from "./config";
import { DEFAULT_IS_BETA, DEFAULT_MAIN_BRANCH, DEFAULT_REGISTRY } from "./config/constant";
import { diffBranch } from "./tools/git";
import { asvCliLogger } from "./tools/log";
import { getPackages, updatePackageVersion } from "./tools/version";
import { VersionType } from "./tools/version/update-version";

export * from './config/constant';

const commonDefaultConfig: Config = {
  registry: DEFAULT_REGISTRY,
  beta: DEFAULT_IS_BETA,
  mainBranch: DEFAULT_MAIN_BRANCH,
}



export default async function run(commandConfig: Config) {


  const resolvedConfig = resolveConfig(commandConfig)

  const finalConfig = {
    ...commonDefaultConfig,
    ...resolvedConfig,
  }



  const {
    registry,
    beta,
    set,
    mainBranch,
    append
  } = finalConfig;


  try {
    let type: VersionType = beta ? 'beta' : 'patch';

    const diffFiles = await diffBranch(mainBranch)

    const waitForUpdatePackages = await getPackages(diffFiles)

    const updatePackages = waitForUpdatePackages.filter(pkg => pkg.isDiff)

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


