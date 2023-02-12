const path = require('node:path');

module.exports = {
  extends: [
    'airbnb',
    'airbnb-typescript',
    // 'plugin:@typescript-eslint/recommended',
    'plugin:eslint-comments/recommended',
    // "plugin:jest/recommended",
    'plugin:promise/recommended',
    'plugin:unicorn/recommended',
    'plugin:react/jsx-runtime', // react 17
    'plugin:jest-formatting/strict',
    'plugin:@cspell/recommended',
    'prettier',
  ],
  env: {
    node: true,
    browser: true,
    // jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: path.resolve(__dirname, 'tsconfig.eslint.json'),
  },
  settings: {
    react: {
      version: '17',
    },
  },
  rules: {
    // Too restrictive, writing ugly code to defend against a very unlikely scenario: https://eslint.org/docs/rules/no-prototype-builtins
    'no-prototype-builtins': 'off',
    // https://basarat.gitbooks.io/typescript/docs/tips/defaultIsBad.html
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'off',
    // Too restrictive: https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/destructuring-assignment.md
    'react/destructuring-assignment': 'off',
    // No jsx extension: https://github.com/facebook/create-react-app/issues/87#issuecomment-234627904
    'react/jsx-filename-extension': 'off',
    // Use function hoisting to improve code readability
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
    // Allow most functions to rely on type inference. If the function is exported, then `@typescript-eslint/explicit-module-boundary-types` will ensure it's typed.
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-use-before-define': [
      'error',
      { functions: false, classes: true, variables: true, typedefs: true },
    ],
    // Common abbreviations are known and readable
    'unicorn/prevent-abbreviations': 'off',
    // Airbnb prefers forEach
    'unicorn/no-array-for-each': 'off',
    'unicorn/no-null': 'off',
    'unicorn/filename-case': [
      'error',
      {
        cases: {
          camelCase: true,
          pascalCase: true,
        },
        ignore: ['vite-env.d.ts'],
      },
    ],
    // It's not accurate in the monorepo style
    'import/no-extraneous-dependencies': 'off',
    'no-debugger': 'warn',
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error', 'assert', 'info'],
      },
    ],
    'no-alert': 'error',
    'consistent-return': 'off',
    'no-plusplus': [
      'error',
      {
        allowForLoopAfterthoughts: true,
      },
    ],
    'max-classes-per-file': ['error', { ignoreExpressions: true, max: 1 }],
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.mts', '*.cts'],
      // extends: ['plugin:@typescript-eslint/recommended-requiring-type-checking'],
      rules: {
        'no-use-before-define': 'off',
        '@typescript-eslint/no-unused-expressions': [
          'warn',
          {
            allowShortCircuit: true,
            allowTernary: true,
            enforceForJSX: true,
          },
        ],
      },
    },
    {
      files: ['*.js', '**/*.js', 'vite.config.ts'],
      rules: {
        // Allow CJS until ESM support improves
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        'unicorn/prefer-module': 'off',
      },
    },
    {
      files: ['**/*.stories.*'],
      rules: {
        'import/no-anonymous-default-export': 'off',
        'jsx-a11y/anchor-is-valid': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'no-alert': 'off',
        'no-console': 'off',
        'react/prop-types': 'off',
        'react/state-in-constructor': 'off',
      },
    },
    {
      files: ['**/*.test.*', '**/*.spec.*'],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-shadow': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        'class-methods-use-this': 'off',
        'max-classes-per-file': 'off',
        'no-console': 'off',
        'no-undef': 'off',
        'no-unused-vars': 'off',
        'no-use-before-define': 'off',
        'react/prop-types': 'off',
        'unicorn/consistent-function-scoping': 'off',
      },
    },
  ],
};
