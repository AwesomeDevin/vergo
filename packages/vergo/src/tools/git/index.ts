import conventionalChangelog from 'conventional-changelog';
import { PWD_PATH } from '../../config/constant';
// import * as fs from 'fs';
// import * as path from 'path';


/**
 * diff current branch with main branch
 */
export async function diffBranch(defaultBranch) {
  const { $ } = await import('execa')
  const { stdout } = await $`git diff --name-only origin/${defaultBranch}`

  console.log('stdout',stdout)
  const pwdPath = PWD_PATH
  return stdout.split('\n').map(item => `${pwdPath}/${item}`)
}


/**
 * write to CHANGELOG.md 
 */
export async function generateChangeLog(params?: {
  packagePath?: string
  releaseCount?: number
  tagPrefix?: string
  append?: string
}) {

  const {
    packagePath,
    releaseCount = 0,
    tagPrefix = 'v',
    append,
  } = params || {}


  const transform = (commit) => {
    if (!commit.subject) {
      commit.subject = commit.header;
    }
    if (commit.authorName && commit.authorEmail && commit.committerDate) {
      commit.subject += ` 「by ${commit.authorName} <${commit.authorEmail}> ${commit.committerDate}」`;
    }
    return commit;
  };

  const gitRawCommitsOpts = {
    format: '%B%n-shortHash-%n%h%n-gitTags-%n%d%n-committerDate-%n%ci%n-authorName-%n%an%n-authorEmail-%n%ae%n-gpgStatus-%n%G?%n-gpgSigner-%n%GS',
  };

  const changelogStream = conventionalChangelog({
    releaseCount,
    append,
    tagPrefix,

  }, {}, gitRawCommitsOpts, {}, { transform })

  changelogStream
    .pipe(process.stdout)
  //   .pipe(fs.createWriteStream(path.join(packagePath, 'CHANGELOG.md')));
}