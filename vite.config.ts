import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { Plugin } from 'vite';
import imfInflation from './api/imf-inflation.ts';
import syncImf from './api/admin/sync-imf.ts';
import syncMutualFunds from './api/admin/sync-mutual-funds.ts';
import mutualFunds from './api/mutual-funds/index.ts';
import mutualFundBySchemeCode from './api/mutual-funds/[schemeCode].ts';
const readRequestBody = async (request: import('node:http').IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
};
const localApiPlugin = (): Plugin => ({
  name: 'local-api-handlers',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      if (!request.url?.startsWith('/api/')) {
        next();
        return;
      }
      const path = request.url.split('?')[0];
      const handler =
        path === '/api/imf-inflation'
          ? imfInflation
          : path === '/api/mutual-funds'
            ? mutualFunds
            : path === '/api/admin/sync-mutual-funds'
              ? syncMutualFunds
              : path === '/api/admin/sync-imf'
                ? syncImf
                : path.startsWith('/api/mutual-funds/')
                  ? mutualFundBySchemeCode
                  : null;
      if (!handler) {
        next();
        return;
      }
      try {
        const body =
          request.method === 'GET' || request.method === 'HEAD'
            ? undefined
            : await readRequestBody(request);
        const handlerRequest = new Request(`http://localhost${request.url}`, {
          method: request.method,
          headers: Object.fromEntries(
            Object.entries(request.headers).flatMap(([key, value]) =>
              value === undefined ? [] : [[key, Array.isArray(value) ? value.join(', ') : value]]
            )
          ),
          body,
        });
        const handlerResponse = await handler(handlerRequest);
        response.statusCode = handlerResponse.status;
        handlerResponse.headers.forEach((value, key) => response.setHeader(key, value));
        response.end(Buffer.from(await handlerResponse.arrayBuffer()));
      } catch (error) {
        response.statusCode = 500;
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ error: 'Local API handler failed', detail: String(error) }));
      }
    });
  },
});
const VITE_CONFIGS = {
  plugins: [react(), tailwindcss(), localApiPlugin()],
  server: {
    hmr: { overlay: true },
  },
  root: './',
  build: {
    outDir: './build',
    emptyOutDir: true,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (
            id.includes('ag-charts-react') ||
            id.includes('ag-charts-community') ||
            id.includes('ag-charts-types')
          ) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/to-words/')) {
            return 'vendor-to-words';
          }
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'vendor-react';
          }
        },
      },
    },
  },
};
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);
  return {
    // vite config
    ...VITE_CONFIGS,
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
  };
});
