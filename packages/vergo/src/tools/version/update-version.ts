import { getVersions } from 'ice-npm-utils';
import semver from 'semver';
import { asvCliLogger } from '../log';


export type VersionType = 'patch' | 'beta';

export default async (pkgJSON: { name: string, version: string }, type: VersionType, registry: string) => {
  const { name, version } = pkgJSON;

  let versions: string[] = [];

  try {
    versions = await getVersions(name, registry);
  } catch (e: any) {
    asvCliLogger.warn('Find Versions Error:' + e.message);
  }

  const stableVersions = versions.filter((version) => {
    return semver.valid(version) && !semver.prerelease(version);
  }).sort(semver.rcompare);

  // 获取最新的版本号包括 beta 版本
  const allLatestVersion = versions.length ? versions[versions.length - 1] : version;

  // 获取最新的版本号不包括 beta 版本
  const latestVersion = stableVersions.length ? stableVersions[stableVersions.length - 1] : version;


  const notReleasedAndNoBeta = !versions.includes(version) && type === 'patch' && !version.includes('beta')
  const notReleasedAndBeta = !versions.includes(version) && type === 'beta' && version.includes('beta')


  if (notReleasedAndNoBeta || notReleasedAndBeta) {
    // 传入版本号未发布，且符合要发的版本号规范，直接使用传入版本号
    asvCliLogger.success(`Project version unpublished, no update occurred, type: ${type}, version: ${version}`);
    return version;
  }


  let newVersion: string;
  if (type === 'beta') {
    if (!version.includes('beta') && (!versions.some(str => str.includes(`${version}-beta`)) || !versions.length)) {
      // 传入版本号未发布，但是不是 beta 版本，按 beta 递增版本号
      newVersion = `${version}-beta.0`;
    } else {
      newVersion = (semver.inc(allLatestVersion, 'prerelease', 'beta')) as any;
    }
  } else {
    if (versions.includes(version) && !version.includes('beta')) {
      // 传入版本号已发布，不是beta版本，按 patch 递增版本好
      newVersion = (semver.inc(latestVersion, 'patch')) as any;
    } else {
      newVersion = version.split('-')[0];
      // 传入版本号未发布，直接使用传入版本号
    }
  }
  asvCliLogger.success(`type: ${type}, Update ${version} to ${newVersion}`);
  return newVersion;
}