import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['build', 'dist', '.next'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
    ],
    plugins: {
      react,
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react/jsx-newline': ['error', { prevent: true }],
      'no-multiple-empty-lines': ['error', { max: 0 }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  }
);
