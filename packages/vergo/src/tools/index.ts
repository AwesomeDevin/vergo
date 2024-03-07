import * as fs from 'fs';
import * as path from 'path';
import { readJson, writeJson } from 'fs-extra';
import { PWD_PATH, VERGO_DIR_NAME, VERSION_FILE_NAME } from '../config/constant';
import { VersionType } from './version/upgrade-version';

/**
 *  get type
 * @param beta
 * @returns
 */
export function getType(beta?: boolean): VersionType {
  return beta ? 'beta' : 'patch';
}

export function getPrePubDiffJsonFileName() {
  return path.join(PWD_PATH, VERGO_DIR_NAME, `${VERSION_FILE_NAME}.json`);
}

/**
 *  check file exists and create
 * @param filePath
 */
export async function checkFileExistsAndCreate(filePath: string) {
  const { $ } = await import('execa');
  if (!fs.existsSync(filePath)) {
    await $`touch ${filePath}`;
  }
  await $`chmod +x ${filePath}`;
}

/**
 *  check dir exists and create
 * @param dirPath
 */
export async function checkDirExistsAndCreate(dirPath: string) {
  const { $ } = await import('execa');
  if (!fs.existsSync(dirPath)) {
    await $`mkdir -p ${dirPath}`;
  }
}

/**
 *  append str to file
 * @param filePath
 * @param str
 */
export function appendStrToFile(filePath: string, str: string) {
  fs.appendFileSync(filePath, `${str}\n`, { mode: 0o600 });
}

/**
 *  overwrite file
 * @param filePath
 * @param str
 */
export function overwriteStrToFile(filePath: string, str: string) {
  fs.writeFileSync(filePath, str, { mode: 0o600 });
}

/**
 *
 * @param filePath
 * @param obj
 */
export async function overwriteJsonToFile(filePath: string, obj: any) {
  await writeJson(filePath, obj, { spaces: 2 });
}

/**
 *
 * @param filePath
 * @returns
 */
export async function readJsonFromFile(filePath: string): Promise<null | Record<string, any>> {
  try {
    return await readJson(filePath);
  } catch (e) {
    return null;
  }
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
  let res = '';
  return async (runningPath?: string) => {
    if (runningPath) return runningPath;
    if (res) return res;
    const { findUpSync } = await import('find-up');
    const packageJsonPath = findUpSync('package.json', { cwd: path.join(__dirname, '../../') });
    res = packageJsonPath ? path.dirname(packageJsonPath) : process.cwd();
    return res;
  };
}

export const getProjectRoot = returnProjectRoot();
