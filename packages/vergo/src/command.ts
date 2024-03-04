import { program } from 'commander';
import { Config } from "./config";
import { DEFAULT_IS_BETA, DEFAULT_MAIN_BRANCH, DEFAULT_REGISTRY } from "./config/constant";
import run from './run';

const defaultConfig: Config = {
  registry: DEFAULT_REGISTRY,
  beta: DEFAULT_IS_BETA,
  mainBranch: DEFAULT_MAIN_BRANCH,
}

export default function initCommand(fnConfig: Config){

  const pkg = require('../package.json');


  program
    .name(pkg.name)
    .version(pkg.version)

  program.command('run')
    .option('-r, --registry <registry>', 'npm registry')
    .option('-b, --beta', 'is beta version')
    .option('-s, --set <version>', 'set version')
    .option('-m, --mainBranch <branch>', 'main branch')

    .action((config) => {
      const initConfig = {
        ...defaultConfig,
        ...fnConfig,
        ...config
      }
      run(initConfig).then(() => {
        process.exit(0);
      })
    })

  program.parse();
}