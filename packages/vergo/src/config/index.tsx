import { resolveConfig as esBuildResolveConfig } from "esbuild-resolve-config";
import { getMainBranch } from "../tools/git";
import { vergoCliLogger } from "../tools/log";
import { DEFAULT_IS_BETA, DEFAULT_MAIN_BRANCH, DEFAULT_REGISTRY } from "./constant";

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
   * Changelog tagPrefix
   */
  tagPrefix?: string;
  /**
   * Should the log be appended to existing data.
   */
  append?: string
  /**
   * Set to 0 to regenerate all.
   */
  releaseCount?: number
}

export type UserConfig = Partial<Config>




export default function resolveConfig(commandConfig): Config {

  const userConfig = esBuildResolveConfig<UserConfig>(".vergorc", {}) || {}

  const config = {
    ...commandConfig,
    ...userConfig,
  }

  return config;
}


export async function getRuntimeConfig( commandConfig: UserConfig){


  vergoCliLogger.await('initialize running config')

  const defaultConfig: UserConfig = {
    registry: process.env.REGISTRY || DEFAULT_REGISTRY,
    beta: process.env.BETA === 'true' || DEFAULT_IS_BETA, 
  }

  const unResolvedConfig = {
    ...defaultConfig,
    ...commandConfig,
  }

  const resolvedConfig = resolveConfig(unResolvedConfig)

  const mainBranch = commandConfig.mainBranch || process.env.MAIN_BRANCH || await getMainBranch() || DEFAULT_MAIN_BRANCH

  const runtimeConfig: Config = {
    ...resolvedConfig,
    mainBranch
  }

  // running config
  vergoCliLogger.log('initialize running config: ' + JSON.stringify(runtimeConfig, null, 2))

  return runtimeConfig

}