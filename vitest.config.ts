import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    env: {
      NODE_ENV: 'development',
    },
    environment: 'node',
    include: ['src/**/*.test.ts'],
    pool: 'forks',
    fileParallelism: false,
    maxConcurrency: 1,
    sequence: {
      concurrent: false,
    },
  },
})
