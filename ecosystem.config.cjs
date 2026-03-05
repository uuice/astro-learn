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
  ],
}
