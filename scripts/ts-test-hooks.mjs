/**
 * Module hooks for `npm test`.
 *
 * Node runs the TypeScript sources directly (type stripping), but Node's ESM
 * resolver never guesses file extensions, while the app's TypeScript sources
 * use extensionless relative imports (`moduleResolution: "bundler"`). This hook
 * retries a failed relative resolution with a `.ts` suffix so the test runner
 * can load the source files unchanged, with no build step.
 */
import { registerHooks } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
try {
  if (typeof process.loadEnvFile === 'function') {
    try { process.loadEnvFile('.env.local'); } catch {}
    try { process.loadEnvFile('.env'); } catch {}
  }
} catch {}
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier === 'next/server') {
        return nextResolve('next/server.js', context);
      }
      if (specifier.startsWith('@/')) {
        const sub = specifier.slice(2);
        const basePath = path.resolve(process.cwd(), 'src', sub);
        let target = basePath;
        if (!/\.[cm]?[jt]sx?$/.test(target)) {
          if (fs.existsSync(`${basePath}.ts`)) {
            target = `${basePath}.ts`;
          } else if (fs.existsSync(`${basePath}.tsx`)) {
            target = `${basePath}.tsx`;
          } else if (fs.existsSync(path.join(basePath, 'index.ts'))) {
            target = path.join(basePath, 'index.ts');
          } else {
            target = `${basePath}.ts`;
          }
        }
        return nextResolve(pathToFileURL(target).href, context);
      }
      if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});
