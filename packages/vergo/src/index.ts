import initCommand, { action as vergoAction } from './command'
import type { Config, UserConfig } from './config'
import run from './run'
import { getMainBranch } from './tools/git'

export default initCommand

export {
  getMainBranch, run, vergoAction
}

export type {
  Config,
  UserConfig
}

