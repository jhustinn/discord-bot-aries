# ⚙️ Production Process Management (PM2 & systemd)

For 24/7 high-availability deployment on a VPS (Linux/Ubuntu or Windows Server), use a process manager like **PM2** or **systemd** to keep processes running continuously, restart automatically on crashes, and start on system reboots.

---

## 🚀 Option 1: Process Management with PM2 (Recommended)

PM2 can manage both the Laravel API and the Native Laravel Bot daemon.

### 1. Install PM2 Globally
```bash
npm install -g pm2
```

### 2. Ecosystem Configuration File
Create or update `ecosystem.config.js` at the project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'aries-discord-bot-laravel',
      script: 'artisan',
      interpreter: 'php',
      args: 'discord:run',
      cwd: './mw-api',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        APP_ENV: 'production'
      }
    },
    {
      name: 'aries-laravel-api',
      script: 'artisan',
      interpreter: 'php',
      args: 'serve --port=8000 --no-reload',
      cwd: './mw-api',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        APP_ENV: 'production',
        PHP_CLI_SERVER_WORKERS: '4'
      }
    }
  ]
};
```

### 3. Starting the Services
```bash
# Start all applications defined in ecosystem
pm2 start ecosystem.config.js

# View live dashboard and logs
pm2 status
pm2 logs

# Save configuration across server reboots
pm2 save
pm2 startup
```

---

## 🐧 Option 2: Linux systemd Service Units

For dedicated Linux deployments using Nginx and PHP-FPM:

### 1. Bot Service (`/etc/systemd/system/aries-bot.service`):
```ini
[Unit]
Description=Aries Modern Warships Discord Bot (Laravel Daemon)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/discord-bot-aries/mw-api
ExecStart=/usr/bin/php artisan discord:run
Restart=always
RestartSec=5
Environment=APP_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable aries-bot
sudo systemctl start aries-bot
sudo systemctl status aries-bot
```

### 2. Serving Laravel via Nginx & PHP-FPM:
Point your Nginx `root` directive to `/var/www/discord-bot-aries/mw-api/public`, and configure PHP 8.2+ FastCGI pass.
All requests to `/` will serve the compiled React Admin Dashboard, and `/api/*` will route to Laravel!
