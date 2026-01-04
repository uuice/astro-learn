import eslintPluginAstro from 'eslint-plugin-astro';
import js from '@eslint/js';

export default [
  js.configs.recommended,
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
      // 忽略Astro自动生成的类型文件
      '.astro/**',
    ],
    rules: {
      // 启用一些基本规则来测试ESLint是否生效
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      // 禁用分号
      'semi': ['error', 'never'],
      // 确保分号前后空格的一致性（虽然我们不使用分号）
      'semi-spacing': 'off',
      'semi-style': 'off',
      // 可以添加更多规则
    }
  },
  // 配置文件本身使用标准JavaScript规则（包含分号）
  {
    files: ['eslint.config.js'],
    rules: {
      'semi': ['error', 'always']
    }
  }
];