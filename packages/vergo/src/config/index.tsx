import * as path from 'path';
import { readJsonFromFile } from '../tools';
import { getMainBranch } from '../tools/git';
import { vergoCliLogger } from '../tools/log';
import { DEFAULT_IS_BETA, DEFAULT_MAIN_BRANCH, DEFAULT_REGISTRY, PWD_PATH, VERGO_CONFIG_FILE_NAME } from './constant';

export interface Config {
  /**
   * The registry to publish to
   */
  registry: string;
  /**
   * Is this a beta release
   */
  beta: boolean;
  /**
   * The version to publish
   */
  set?: string;
  /**
   * Main branch of the repo
   */
  mainBranch: string;
  /**
   * Enable analyze dependencies
   */
  analyzeDeps?: boolean;

  /**
   * The packages to exclude
   */
  excludes: string[];

}

export type UserConfig = Partial<Config>;

export default async function resolveConfig(commandConfig): Promise<Config> {
  const configPath = path.join(PWD_PATH, VERGO_CONFIG_FILE_NAME)
  const userConfig = await readJsonFromFile<UserConfig>(configPath) || {};


  const config = {
    ...commandConfig,
    ...userConfig,
  };

  return config;
}

export async function getRuntimeConfig(commandConfig: UserConfig) {
  vergoCliLogger.await('initialize running config');

  const defaultConfig: UserConfig = {
    registry: process.env.REGISTRY || DEFAULT_REGISTRY,
    beta: process.env.BETA === 'true' || DEFAULT_IS_BETA,
  };

  const unResolvedConfig = {
    ...defaultConfig,
    ...commandConfig,
  };

  const resolvedConfig = await resolveConfig(unResolvedConfig);

  const mainBranch =
    commandConfig.mainBranch || process.env.MAIN_BRANCH || (await getMainBranch()) || DEFAULT_MAIN_BRANCH;

  const runtimeConfig: Config = {
    ...resolvedConfig,
    mainBranch,
  };

  // running config
  vergoCliLogger.log(`initialize running config: ${JSON.stringify(runtimeConfig)}`);

  return runtimeConfig;
}
