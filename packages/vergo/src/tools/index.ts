import * as fs from 'fs';
import * as path from 'path';
import { VersionType } from './version/update-version';

/**
 *  get type
 * @param beta 
 * @returns 
 */
export function getType(beta?: boolean): VersionType {
  return beta ? 'beta' : 'patch';
}

/**
 *  check file exists and create
 * @param filePath 
 */
export async function checkFileExistsAndCreate(filePath: string) {
  const { $ } = await import('execa')
  if(!fs.existsSync(filePath)){
    await $`touch ${filePath}`
  }
  await $`chmod +x ${filePath}`
}

/**
 *  check dir exists and create
 * @param dirPath 
 */
export async function checkDirExistsAndCreate(dirPath: string) {
  const { $ } = await import('execa')
  if(!fs.existsSync(dirPath)){
    await $`mkdir -p ${dirPath}`
  }
}


/**
 *  append str to file
 * @param filePath 
 * @param str 
 */
export function appendStrToFile(filePath: string, str: string) {
  fs.appendFileSync(filePath, str + '\n', { mode: 0o600 });
}



/**
 * match str in file and return boolean
 */
export async function matchStrInFile(filePath: string, str: string) {
  const data = fs.readFileSync(filePath, 'utf8');
  return data.indexOf(str) !== -1;
}

/**
 * 
 * @returns root path of the project
 */
function returnProjectRoot() {
  let res = ''
  return async function(runningPath?: string){
    if(runningPath) return runningPath
    if(res) return res
    const { findUpSync } = await import('find-up')
    const packageJsonPath = findUpSync('package.json', { cwd: path.join(__dirname, '../../') });
    res = packageJsonPath ? path.dirname(packageJsonPath) : process.cwd()
    return res
    }
}

export const getProjectRoot = returnProjectRoot()