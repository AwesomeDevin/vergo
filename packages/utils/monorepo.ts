import { getPackages, type Packages } from '@manypkg/get-packages';
import * as _fs from 'fs-extra';
import * as _path from 'node:path';

// insurance logic
export const getCurPackage = async (path: string) => {
  const packagePath = _path.join(path, 'package.json');
  let packageJson: any = {};

  try {
    packageJson = await _fs.default.readJson(packagePath);
  } catch (e) {
    console.log(`Error reading package.json at ${packagePath}`);
  }

  return {
    packages: [
      {
        dir: path,
        packageJson,
      } as any,
    ],
    tool: {} as any,
    rootDir: '',
    root: {
      dir: path,
      packageJson,
    },
  };
};

export const getWorkspaceInfo: (path: string) => Promise<Packages> = (path: string) => {
  return getPackages(path).catch(() => getCurPackage(path));
};

export const isMonorepo = async (path: string) => {
  const workspaceInfo = await getWorkspaceInfo(path);
  return workspaceInfo.packages.length > 1;
};

