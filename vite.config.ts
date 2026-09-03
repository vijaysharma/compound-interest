import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { Plugin } from 'vite';
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
      let modulePath: string | null = null;
      if (path === '/api/auth/signup') {
        modulePath = '/api/auth/signup';
      } else if (path === '/api/auth/login') {
        modulePath = '/api/auth/login';
      } else if (path === '/api/auth/google') {
        modulePath = '/api/auth/google';
      } else if (path === '/api/auth/me') {
        modulePath = '/api/auth/me';
      } else if (path === '/api/auth/logout') {
        modulePath = '/api/auth/logout';
      } else if (path === '/api/user/track-usage') {
        modulePath = '/api/user/track-usage';
      } else if (path === '/api/payments/settings') {
        modulePath = '/api/payments/settings';
      } else if (path === '/api/payments/submit') {
        modulePath = '/api/payments/submit';
      } else if (path === '/api/payments/razorpay/create-order') {
        modulePath = '/api/payments/razorpay/create-order';
      } else if (path === '/api/payments/razorpay/verify') {
        modulePath = '/api/payments/razorpay/verify';
      } else if (path === '/api/admin/payments') {
        modulePath = '/api/admin/payments';
      } else if (path === '/api/admin/users') {
        modulePath = '/api/admin/users';
      } else if (path === '/api/imf-inflation') {
        modulePath = '/api/imf-inflation';
      } else if (path === '/api/mutual-funds') {
        modulePath = '/api/mutual-funds/index';
      } else if (path === '/api/admin/sync-mutual-funds') {
        modulePath = '/api/admin/sync-mutual-funds';
      } else if (path === '/api/admin/sync-imf') {
        modulePath = '/api/admin/sync-imf';
      } else if (path === '/api/admin/notes') {
        modulePath = '/api/admin/notes';
      } else if (path === '/api/admin/shiprocket-rates') {
        modulePath = '/api/admin/shiprocket-rates';
      } else if (path.startsWith('/api/mutual-funds/')) {
        modulePath = '/api/mutual-funds/[schemeCode]';
      }
      if (!modulePath) {
        next();
        return;
      }
      try {
        const mod = await server.ssrLoadModule(modulePath);
        const handler = mod.default;
        if (!handler) {
          next();
          return;
        }
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
        handlerResponse.headers.forEach((value: string, key: string) =>
          response.setHeader(key, value)
        );
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
