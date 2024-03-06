import { program } from 'commander';
import diff from './command/diff';
import init from './command/init';
import run from './command/run';
import { UserConfig } from "./config";
import { vergoCliLogger } from './tools/log';


export default  function initCommand(fnConfig: UserConfig){

  const pkg = require('../package.json');

  program
    .name(pkg.name)
    .version(pkg.version)

  program.command('init')
    .option('-p, --path <path>', 'running path')
    .action(async(args: { path?: string }) => {
      try{
        await init(args.path)
      } catch (e: any) {
        vergoCliLogger.error(e.message);
      }
  })




  program.command('run')
    .option('-r, --registry <registry>', 'npm registry')
    .option('-b, --beta', 'is beta version')
    .option('-s, --set <version>', 'set version')
    .option('-m, --mainBranch <branch>', 'main branch')

    .action(async(commandConfig: UserConfig) => {
      try{
        await run({
          ...fnConfig,
          ...commandConfig,
        })
      } catch (e: any) {
        vergoCliLogger.error(e.message);
      }
    })


  program.command('diff')
    .option('-r, --registry <registry>', 'npm registry')
    .option('-b, --beta', 'is beta version')
    .option('-s, --set <version>', 'set version')
    .option('-m, --mainBranch <branch>', 'main branch')
    .action(async(config: UserConfig) => {
      try{
        await diff(config)
      } catch (e: any) {
        vergoCliLogger.error(e.message);
      }
    })
  

  program.parse();
}