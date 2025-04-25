import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "./src/index.ts",
    "./src/cli/cli.ts",
  ],
  dts: true,
  treeshake: true,
  outDir: "./dist",
  format: "esm",
  clean: true,
  publint: true,
});
