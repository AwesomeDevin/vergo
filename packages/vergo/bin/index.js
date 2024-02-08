const pkg = require('../package.json');
const { program } = require('commander');

const run = require('../dist/index.cjs').default

program
  .name(pkg.name)
  .version(pkg.version)

program.command('run')
  .option('-r, --registry <registry>', 'npm registry')
  .option('-b, --beta', 'is beta version')
  .option('-s, --set <version>', 'set version')
  .option('-d, --def', 'enable def config', false)

  .action((config) => {
    run(config).then(() => {
      process.exit(0);
    })
  })

program.parse();