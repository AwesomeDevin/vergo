export const NAME = 'vergo';
export const DEFAULT_REGISTRY = 'https://registry.npmjs.org/';
export const DEFAULT_IS_BETA = false;
export const DEFAULT_MAIN_BRANCH = 'main';
export const PWD_PATH = process.cwd();
export const VERGO_DIR_NAME = `.${NAME}`;
export const VERSION_FILE_NAME = 'prepub';

// pre-commit file content
export const preCommitShells = ['#!/bin/sh', `npx @ali/${NAME} diff`];
