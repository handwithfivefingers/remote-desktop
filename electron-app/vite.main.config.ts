import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    commonjsOptions: {
      //   ignoreDynamicRequires: true,
      dynamicRequireTargets: ["@nut-tree-fork/nut-js"],
    },
  },
});
