import eslintPluginAstro from 'eslint-plugin-astro';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals'; 

export default [
  js.configs.recommended,
  {
    files: ['server.mjs'],
    languageOptions: { globals: globals.node },
  },
  ...eslintPluginAstro.configs.recommended,
  {
    files: [
      '**/*.js',
      '**/*.ts',
      '**/*.tsx',
      '**/*.jsx',
      '**/*.mjs',
      '**/*.astro',
    ],
    ignores: [
      '.astro/**',
      'dist/**',
      'node_modules/**',
    ],
    rules: {
      'no-console': 'off',
      'no-empty': 'off',
      'no-unused-vars': 'warn',
      // 禁用分号
      'semi': ['error', 'never'],
      // 确保分号前后空格的一致性（虽然我们不使用分号）
      'semi-spacing': 'off',
      'semi-style': 'off',
      // 可以添加更多规则
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: { 'no-undef': 'off' },
  },
  {
    files: ['eslint.config.js'],
    rules: {
      'semi': ['error', 'always']
    }
  }
];