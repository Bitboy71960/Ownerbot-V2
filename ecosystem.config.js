module.exports = {
  apps: [{
    name: "discord-bot",
    script: "index.js",
    watch: true,
    max_memory_restart: "500M",
    env: {
      NODE_ENV: "production",
    },
    restart_delay: 5000,
    max_restarts: 20,
    exp_backoff_restart_delay: 100,
    instances: 1,
    exec_mode: "fork"
  }]
}; 