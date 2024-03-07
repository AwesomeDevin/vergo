import initCommand from './command'
import run from './command/run'
import type { Config, UserConfig } from './config'
import { getMainBranch } from './tools/git'


export default initCommand

export {
  getMainBranch,
  run
}

export type {
  Config,
  UserConfig
}

