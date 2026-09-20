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
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});
