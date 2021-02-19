module.exports = {
  root: true,
  ignorePatterns: ['**/*.*', '!**/*.js', '!**/*.cjs', 'node_modules', '/dist'],
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:jsdoc/recommended',
    'plugin:unicorn/recommended',
    'plugin:node/recommended',
    'prettier-standard/prettier-file',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  settings: {
    jsdoc: {
      mode: 'typescript',
    },
  },
  // Keep rules grouped by plugin and sorted alphabetically
  rules: {
    'padding-line-between-statements': [
      'error',
      /* Empty line after import */
      { blankLine: 'always', prev: 'import', next: '*' },
      { blankLine: 'any', prev: 'import', next: 'import' },
      /* Empty line before return */
      { blankLine: 'always', prev: '*', next: 'return' },
      /* Empty line after const, let */
      { blankLine: 'always', prev: ['const', 'let'], next: '*' },
      { blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let'] },
      /* Empty line between case and default inside switch */
      { blankLine: 'always', prev: 'case', next: ['case', 'default'] },
    ],

    /* eslint-plugin-jsdoc */

    // Descriptions should be sentence-like not comment-like
    'jsdoc/require-description-complete-sentence': 'warn',
    'jsdoc/require-hyphen-before-param-description': [
      'error',
      'never',
      { tags: { property: 'never' } },
    ],
    // Adding JSDoc is preferable but not required
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-property-description': 'off',
    'jsdoc/require-returns-description': 'off',
    'jsdoc/require-returns': 'off',

    /* eslint-plugin-unicorn */

    // I like reduce
    'unicorn/no-array-reduce': 'off',

    /* eslint-plugin-import */

    // Require extension for imports. This is needed for Node.js because it fails to import module w/o extensions
    'import/extensions': ['error', 'always', { ignorePackages: true }],
    // Force using only named exports
    'import/no-default-export': 'error',

    /* eslint-plugin-prettier */

    'prettier/prettier': 'warn',
  },
  overrides: [
    {
      files: 'tests/**/*',
      plugins: ['ava'],
      extends: ['plugin:ava/recommended'],
    },
  ],
}
