import { resolveConfig as esBuildResolveConfig } from "esbuild-resolve-config";


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


export default function resolveConfig(commandConfig): Config {

  const userConfig: Partial<Config> = esBuildResolveConfig<Config>(".vergorc", {}) || {}

  const config = {
    ...commandConfig,
    ...userConfig,
  }

  return config;
}
