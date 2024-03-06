import { program } from 'commander';
import resolveConfig, { Config, UserConfig } from "./config";
import { DEFAULT_IS_BETA, DEFAULT_MAIN_BRANCH, DEFAULT_REGISTRY } from "./config/constant";
import run from './run';
import { getMainBranch, initGitRemote } from './tools/git';
import { vergoCliLogger } from './tools/log';


export async function action( commandConfig: UserConfig){

  vergoCliLogger.log('start')

  vergoCliLogger.log('init config')

  const defaultConfig: UserConfig = {
    registry: process.env.REGISTRY || DEFAULT_REGISTRY,
    beta: process.env.BETA === 'true' || DEFAULT_IS_BETA, 
  }


  const unResolvedConfig = {
    ...defaultConfig,
    ...commandConfig,
  }

  const runConfig = resolveConfig(unResolvedConfig)

  await initGitRemote(runConfig.remoteUrl)

  const mainBranch = commandConfig.mainBranch || process.env.MAIN_BRANCH || await getMainBranch() || DEFAULT_MAIN_BRANCH

  const resolvedConfig: Config = {
    ...runConfig,
    mainBranch
  }


  vergoCliLogger.log('init config')

  // registry
  vergoCliLogger.log('registry: ' + resolvedConfig.registry)

   // main branch
  vergoCliLogger.log('main branch: ' + resolvedConfig.mainBranch)

  // beta
  vergoCliLogger.log('beta: ' + resolvedConfig.beta)


  run(resolvedConfig).then(() => {
    process.exit(0);
  })
}



export default  function initCommand(fnConfig: UserConfig){

  const pkg = require('../package.json');

  program
    .name(pkg.name)
    .version(pkg.version)

  program.command('run')
    .option('-r, --registry <registry>', 'npm registry')
    .option('-b, --beta', 'is beta version')
    .option('-s, --set <version>', 'set version')
    .option('-m, --mainBranch <branch>', 'main branch')
    .option('-o, --remoteUrl <remoteUrl>', 'git remote url')

    .action(async(commandConfig: UserConfig) => {

      await action({
        ...fnConfig,
        ...commandConfig,
      })
      
    })

  program.parse();
}