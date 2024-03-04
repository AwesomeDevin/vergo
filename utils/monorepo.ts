import { getPackages } from "@manypkg/get-packages";

export const getWorkspaceInfo: typeof getPackages = (path: string) => {
  return getPackages(path);
}

export const isMonorepo = async (path: string) => {
  const workspaceInfo = await getWorkspaceInfo(path);
  return workspaceInfo.tool.isMonorepoRoot(path);
}