module.exports = {
  apps: [
    {
      name: 'cc-erp',
      cwd: './frontend',
      script: 'node_modules/vite/bin/vite.js',
      args: '--port 9090 --host',
      env: {
        NODE_ENV: 'production',
      },
      // Auto-restart
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,

      // Logs
      out_file: './logs/cc-erp-out.log',
      error_file: './logs/cc-erp-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
