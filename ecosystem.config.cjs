module.exports = {
  apps: [
    {
      name: "harshitrv-portfolio",
      cwd: "/home/harshitrvpi/code/pro/harshitrv-portfolio",
      script: ".output/server/index.mjs",
      interpreter: "/home/harshitrvpi/.nvm/versions/node/v24.14.1/bin/node",
      // Secrets stay in the gitignored .env; values set below still win over it.
      node_args: "--env-file=.env",
      // The app is the sole writer of the projects JSON document.
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        NITRO_HOST: "127.0.0.1",
        NITRO_PORT: "3374",
      },
    },
  ],
};
