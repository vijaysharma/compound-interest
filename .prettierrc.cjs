module.exports = {
  // Basic formatting
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'es5',
  printWidth: 100,

  // JSX/React
  bracketSpacing: true,
  bracketSameLine: false,
  jsxSingleQuote: false,
  arrowParens: 'always',

  // Line endings
  endOfLine: 'lf',

  // Other
  quoteProps: 'as-needed',
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',
  singleAttributePerLine: false,

  // Overrides for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        trailingComma: 'none',
        singleQuote: false,
        printWidth: 80,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      files: '*.{css,scss}',
      options: {
        singleQuote: false,
        tabWidth: 2,
        printWidth: 80,
      },
    },
    {
      files: '*.{html,htm}',
      options: {
        singleQuote: false,
        printWidth: 80,
      },
    },
    {
      files: '*.{yml,yaml}',
      options: {
        singleQuote: false,
        tabWidth: 2,
        printWidth: 80,
      },
    },
  ],
};