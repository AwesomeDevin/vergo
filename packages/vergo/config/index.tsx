import { resolveConfig as esBuildResolveConfig } from "esbuild-resolve-config";


export interface Config {
  /**
   * The registry to publish to
   */
  registry: string;
  /**
   * is this a beta release
   */
  beta: boolean;
  /**
   * The version to publish
   */
  set?: string;
  /**
   * enable def mode
   */
  def: boolean
}


export default function resolveConfig(commandConfig): Config {

  const userConfig: Partial<Config> = esBuildResolveConfig<Config>(".vergorc", {}) || {}

  const config = {
    ...commandConfig,
    ...userConfig,
  }

  return config;
}
