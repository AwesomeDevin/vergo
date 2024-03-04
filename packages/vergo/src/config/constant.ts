

export const DEFAULT_REGISTRY = process.env.REGISTRY || 'https://registry.npmjs.org/'
export const DEFAULT_IS_BETA = process.env.BETA === 'true' || false
export const DEFAULT_MAIN_BRANCH = process.env.MAIN_BRANCH || 'main'
export const PWD_PATH = process.cwd()