import initCommand from './command'
import type { Config, UserConfig } from './config'
import run from './run'
import { getMainBranch } from './tools/git'

export default initCommand

export {
  getMainBranch, run
}

export type {
  Config,
  UserConfig
}

