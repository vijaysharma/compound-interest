import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const VITE_CONFIGS = {
  plugins: [react()],
  server: {
    hmr: { overlay: true },
  },
  root: "./",
  build: {
    outDir: "./build",
    emptyOutDir: true,
  },
};

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    // vite config
    ...VITE_CONFIGS,
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
  };
});
