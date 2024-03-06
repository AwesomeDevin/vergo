import { spawn } from 'child_process';
import conventionalChangelog from 'conventional-changelog';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PWD_PATH } from '../../config/constant';
import { vergoCliLogger } from '../log';




export async function initGitRemote(remoteUrl?: string){
  try{
    const { $ } = await import('execa')
    await $`git remote`
    vergoCliLogger.log('git remote already exists')
  } catch(e) {
    if(!remoteUrl)
    {
      vergoCliLogger.error('remoteUrl is required')
      return 
    }
    const { $, execa } = await import('execa')

    const match = remoteUrl.match(/git@([^:]+)/) || remoteUrl.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/)
    const remoteHost =  match ? match[1] : null
    if(!remoteHost){
      vergoCliLogger.error('remoteHost is required')
      return 
    }
    vergoCliLogger.log('git remoteHost:' + remoteHost)

    const sshDir = path.join(os.homedir(), '.ssh');
    const knownHostsPath = path.join(sshDir, 'known_hosts');

    // 确保 .ssh 目录存在
    if (!fs.existsSync(sshDir)) {
      fs.mkdirSync(sshDir, { mode: 0o700 }); // 创建 .ssh 目录，权限设置为仅当前用户可读写执行
    }

    // 将远程主机的公钥添加到 known_hosts 文件中
    const remotePublicKey = await execa('ssh-keyscan', [remoteHost]);
    fs.appendFileSync(knownHostsPath, remotePublicKey.stdout+ '\n', { mode: 0o600 });

    await $`git init`

    await new Promise((resolve)=>{

      const gitRemoteAdd = spawn('git', ['remote', 'add', 'origin', remoteUrl], { stdio: 'pipe' });
      vergoCliLogger.log('gitRemoteAdd.stdout:' + gitRemoteAdd.stdout)
      gitRemoteAdd.stdout?.pipe(process.stdout);
      // 监听子进程需要输入的情况
      gitRemoteAdd.stdout?.on('data', (data) => {
        vergoCliLogger.log('data.toString():' + data.toString())
        if (data.toString().includes('Are you sure you want to continue connecting')) {
          // 当子进程请求确认时，发送 'yes' 并回车
          gitRemoteAdd.stdin?.write('yes\n');
        }
      });
      gitRemoteAdd.on('exit', (code) => {
        resolve(true)
      });
    })

    await $`git fetch origin`
    vergoCliLogger.log('git remote added')
  }
  
}


/**
 * diff current branch with main branch
 */
export async function diffBranch(defaultBranch) {
  const { $ } = await import('execa')
  const { stdout } = await $`git diff --name-only origin/${defaultBranch}`

  const pwdPath = PWD_PATH
  return stdout.length ? stdout.split('\n').map(item => `${pwdPath}/${item}`) : []
}

/**
 * get main branch
 * @returns main branch
 */
export async function getMainBranch(){
  const { $ } = await import('execa')
  const { stdout } = await $`git remote show origin`
  const mainBranch = stdout.match(/HEAD branch: (.*)/)?.[1]
  return mainBranch

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