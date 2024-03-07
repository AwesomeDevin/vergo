import { program } from 'commander';
import diff from './command/diff';
import init from './command/init';
import run from './command/run';
import { UserConfig } from './config';
import { vergoCliLogger } from './tools/log';

export default function initCommand(fnConfig: UserConfig) {
  const pkg = require('../package.json');

  program.name(pkg.name).version(pkg.version);

  program
    .command('init')
    .option('-m, --mainBranch <branch>', 'main branch')
    .option('-p, --path <path>', 'running path')
    .action(async (commandConfig: UserConfig & { path?: string }) => {
      try {
        await init({
          ...fnConfig,
          ...commandConfig,
        });
      } catch (e: any) {
        vergoCliLogger.error(e.message);
      }
    });

  program
    .command('run')
    .option('-r, --registry <registry>', 'npm registry')
    .option('-b, --beta', 'enable beta version')
    .option('--no-beta', 'disable beta version')
    .option('-s, --set <version>', 'set version')
    .option('-m, --mainBranch <branch>', 'main branch')
    .option('--analyze-deps', 'enable analyze dependencies', false)
    .option('--no-analyze-deps', 'disable analyze dependencies')

    .action(async (commandConfig: UserConfig) => {
      try {
        await run({
          ...fnConfig,
          ...commandConfig,
        });
      } catch (e: any) {
        vergoCliLogger.error(e.message);
      }
    });

  program
    .command('diff')
    .option('-m, --mainBranch <branch>', 'main branch')
    .option('--analyze-deps', 'enable analyze dependencies', true)
    .option('--no-analyze-deps', 'disable analyze dependencies')
    .action(async (commandConfig: UserConfig) => {
      try {
        await diff({
          ...fnConfig,
          ...commandConfig,
        });
      } catch (e: any) {
        vergoCliLogger.error(e.message);
      }
    });

  program.parse();
}
