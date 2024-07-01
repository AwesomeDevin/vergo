import { PackageJSON } from '@changesets/types';
import type { Package } from '@manypkg/get-packages';

export interface IWaitingForUpgradePackage {
  name: string;
  relativeDir: string;
  diffFiles: string[];
  isDependOn?: string[];
}

export type TVergoPackage = Package & { isDiff: boolean; diffFiles: string[] };

export type TDepType = 'dependencies' | 'peerDependencies' | 'devDependencies';
export interface IUpdatedPackage {
  pkgJSON: PackageJSON;
  newVersion: string;
  oldVersion: string;
  relativeDir: string
}
