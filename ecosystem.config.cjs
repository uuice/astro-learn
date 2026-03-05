module.exports = {
  apps: [
    {
      name: 'astro-blog',
      script: 'server.mjs',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', PORT: 8080 },
      env_production: { NODE_ENV: 'production', PORT: 8080 },
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'astro-blog-bun',
      script: 'server.mjs',
      interpreter: 'bun',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', PORT: 8081 },
      env_production: { NODE_ENV: 'production', PORT: 8081 },
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
