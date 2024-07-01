import semver from 'semver';
import { vergoCliLogger } from '../log';
import { getVersionInfo } from './index';

export type VersionType = 'patch' | 'beta';

export default async (pkgJSON: { name: string; version: string }, type: VersionType, registry: string) => {
  const { name, version } = pkgJSON;

  if (!version || !name) {
    vergoCliLogger.warn('package name or version is empty');
    return;
  }

  const latestVersionObj = await getVersionInfo(name, registry);

  const versions = latestVersionObj.versions || [];

  // 获取最新的版本号包括 beta 版本
  const allLatestVersion = latestVersionObj.latestVersion || version;

  // 获取最新的版本号不包括 beta 版本
  const latestVersion = latestVersionObj.stableLatestVersion || version;

  // 需发布正式版，传入版本号为正式版本且未发布
  const notReleasedAndNoBeta = !versions.includes(version) && type === 'patch' && !version.includes('beta');

  // 需发布 beta 版，传入版本号为 beta 版且未发布
  const notReleasedAndBeta = !versions.includes(version) && type === 'beta' && version.includes('beta');

  if (notReleasedAndNoBeta || notReleasedAndBeta) {
    // 传入版本号未发布，且符合要发的版本号规范，直接使用传入版本号
    vergoCliLogger.log(`${name} version unpublished, no update occurred, type: ${type}, version: ${version}`);
    return version;
  }

  let newVersion: string;
  if (type === 'beta') {
    if (!version.includes('beta') && (!versions.some((str) => str.includes(`${version}-beta`)) || !versions.length)) {
      // 传入版本号未发布，但是不是 beta 版本，按 beta 递增版本号
      newVersion = `${version}-beta.0`;
    } else {
      newVersion = semver.inc(allLatestVersion, 'prerelease', 'beta') as any;
    }
  } else {
    if (versions.includes(version) && !version.includes('beta')) {
      // 传入版本号已发布，不是beta版本，按 patch 递增版本好
      newVersion = semver.inc(latestVersion, 'patch') as any;
    } else {
      newVersion = version.split('-')[0];
      // 传入版本号未发布，直接使用传入版本号
    }
  }
  vergoCliLogger.log(`${name} publish type: ${type}, Upgrade ${version} to ${newVersion}`);
  return newVersion;
};
