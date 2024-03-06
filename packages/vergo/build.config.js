import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    "src/index.ts",
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true
  },
  alias: {
    // we can always use non-transpiled code since we support 14.18.0+
    '@': __dirname.replace('/packages/vergo',''),
  },
});
