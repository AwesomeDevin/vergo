import { program } from 'commander';
import { Config, UserConfig } from "./config";
import { DEFAULT_IS_BETA, DEFAULT_MAIN_BRANCH, DEFAULT_REGISTRY } from "./config/constant";
import run from './run';
import { getMainBranch } from './tools/git';
import { vergoCliLogger } from './tools/log';

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

    .action(async(config: UserConfig) => {

      vergoCliLogger.start('start')


      const defaultConfig: Config = {
        registry: process.env.REGISTRY || DEFAULT_REGISTRY,
        beta: process.env.BETA === 'true' || DEFAULT_IS_BETA, 
        mainBranch: config.mainBranch || process.env.MAIN_BRANCH || await getMainBranch() || DEFAULT_MAIN_BRANCH
      }

      vergoCliLogger.await('init config')


      const runConfig = {
        ...defaultConfig,
        ...fnConfig,
        ...config
      }

      vergoCliLogger.complete('init config')

      // registry
      vergoCliLogger.log('registry: ' + runConfig.registry)

       // main branch
      vergoCliLogger.log('main branch: ' + defaultConfig.mainBranch)

      // beta
      vergoCliLogger.log('beta: ' + runConfig.beta)

      run(runConfig).then(() => {
        process.exit(0);
      })
    })

  program.parse();
}