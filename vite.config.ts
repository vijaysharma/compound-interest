import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
const VITE_CONFIGS = {
  plugins: [react(), tailwindcss()],
  server: {
    hmr: { overlay: true },
    proxy: {
      "/api/imf-inflation": {
        target: "https://www.imf.org",
        changeOrigin: true,
        rewrite: () =>
          "/external/datamapper/api/v1/PCPIPCH/IND/USA/EU/WEOWORLD",
      },
    },
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
