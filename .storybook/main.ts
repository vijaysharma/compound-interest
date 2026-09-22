import type { StorybookConfig } from '@storybook/nextjs';
/**
 * Storybook runs on the Next.js framework preset rather than a standalone
 * bundler so the stories compile the components exactly as the app does: the
 * same SCSS-module pipeline, the same `@/*` path alias from tsconfig, and the
 * same `next/*` shims. A picker that renders here renders in the app.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  // Docs pages carry the prop tables and the per-story notes, so the addon is
  // load-bearing here rather than optional.
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  staticDirs: ['../public'],
  typescript: {
    // Prop tables are generated from the TSX interfaces, so the doc comments on
    // ValuePickerProps and PairedValuePickerProps are the prop documentation —
    // there is no second copy to keep in sync.
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => !prop.parent?.fileName.includes('node_modules'),
    },
  },
};
export default config;
