import { getPackages, Packages } from "@manypkg/get-packages";
import { readFile } from "fs-extra";
import * as _path from 'path';

// insurance logic
export const getCurPackage = async (path: string) => {
  const packagePath = _path.join(path, 'package.json');

  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));

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
  return new Promise((resolve, reject) => {
    getPackages(path)
      .then((res) => {
        return resolve(res);
      })
      .catch(() => {
        resolve(getCurPackage(path));
      });
  });
};

export const isMonorepo = async (path: string) => {
  const workspaceInfo = await getWorkspaceInfo(path);
  return workspaceInfo.packages.length > 1;
};