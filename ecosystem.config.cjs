module.exports = {
  apps: [
    {
      name: "retailink-api",
      script: "src/index.ts",
      interpreter: "node_modules/.bin/tsx",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};