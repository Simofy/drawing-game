module.exports = {
  apps: [
    {
      name: 'drawing-game',
      cwd: './drawing-game',
      script: 'yarn',
      args: 'server:prod',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      env: {
        MONGO_URL: 'mongodb://127.0.0.1:27017',
        VITE_PORT: 3004
      }
    }
  ]
}
