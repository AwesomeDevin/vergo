import * as fs from 'fs';
import * as path from 'path';
import { getWorkspaceInfo } from '../../../../utils/monorepo';
import { preCommitShells } from '../config/constant';
import { appendStrToFile, getProjectRoot, matchStrInFile } from '../tools';
import { vergoCliLogger } from '../tools/log';


/**
 * init pre commit hook based on git hooks
 */
export default async function initPreCommitHook(runningPath?: string) {
  
  vergoCliLogger.await('initialize pre-commit')

  const { $ } = await import('execa')
  
  const projectRoot =  await getProjectRoot(runningPath);

  const { rootPackage } = await getWorkspaceInfo(projectRoot)
  const rootDir = rootPackage?.dir
  if(!rootDir) {
    vergoCliLogger.error('initialize pre-commit failed, rootDir not found in workspace, you can specify running path by -p option.')
    return
  }
  const hookDir = path.join(rootDir, '.git/hooks')
  const preCommitPath = path.join(hookDir, 'pre-commit')

  if (!fs.existsSync(hookDir)) {
    fs.mkdirSync(hookDir, { mode: 0o700 });
  }

  if(!fs.existsSync(preCommitPath)){
    await $`touch ${preCommitPath}`
  }

  for(const shellStr of preCommitShells){
    if(!await matchStrInFile(preCommitPath, shellStr)){
      appendStrToFile(preCommitPath, shellStr)
    }
  }

  await $`chmod +x ${preCommitPath}`

  vergoCliLogger.success('initialize pre-commit')

  process.exit(0);
}