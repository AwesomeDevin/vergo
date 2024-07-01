import * as path from 'path';
import { isMonorepo } from '../../../utils';
import { getPrePubDiffJsonFileName, overwriteJsonToFile, readJsonFromFile } from '../tools';
import { vergoCliLogger } from '../tools/log';
import { PWD_PATH } from './run';

export default async function buildCommand() {
  
  if (!(await isMonorepo(PWD_PATH))) {
    vergoCliLogger.error('build command only support monorepo project.');
    process.exit(1);
  }

  const rootPackagePath = path.join(PWD_PATH, 'package.json');
  const rootPackageJson = await readJsonFromFile(rootPackagePath);
  if (!rootPackageJson) {
    vergoCliLogger.error('package.json not found in root path.');
    process.exit(1);
  }

  const prePubDiffJsonFileName = getPrePubDiffJsonFileName();
  const prePubDiffJson = await readJsonFromFile(prePubDiffJsonFileName);
  const prePubPackageNames = prePubDiffJson?.packages.map((item) => item.name) || [];

  if (prePubPackageNames.length) {
    const buildCommand = prePubPackageNames.map((name) => `--filter ${name}`).join(' ');
    rootPackageJson.scripts.build = `pnpm ${buildCommand} run build`;
  } else {
    // 如果没有 prepub.json 文件，则默认构建所有包
    rootPackageJson.scripts.build = 'pnpm -r --filter=./packages/**/* run build';
  }

  await overwriteJsonToFile(rootPackagePath, rootPackageJson);

  vergoCliLogger.success('script.build updated.');
}
