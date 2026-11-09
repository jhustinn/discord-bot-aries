# 🚀 Running the Platform

This guide explains how to start, execute, and monitor the services. You can choose between **Architecture 1: Full Laravel Monolith** (100% PHP, zero Node.js backend) or **Architecture 2: Hybrid Stack** (Node.js Bot + Laravel API + React Admin).

---

## 🌟 Option 1: Full Laravel Monolith (Recommended)

In this mode, the Discord Bot runs directly inside Laravel via `team-reflex/discord-php`, with direct access to Eloquent models, migrations, and database records.

### Terminal 1: Native Laravel Discord Bot
Runs as a background event-driven daemon:

```bash
cd mw-api
php artisan discord:run
```

Expected output:
```
======================================================
🚀 DISCORD BOT SUCCESSFULLY CONNECTED VIA LARAVEL!
🤖 Logged in as: TestBotVerificatiom#9217 (ID: 1528949636746706945)
🏰 Guilds connected: 1
   - Place For Us (ID: 1230512877606277130, Members: 2)

📊 DIRECT LARAVEL ELOQUENT ACCESS TEST:
   - Total Verification Tickets in DB: 29
   - Total Verified Players in DB: 2
   - Total RBAC Roles in DB: 10
======================================================
📡 Bot is listening for events (Type !ping in any server channel to test)...
```

---

### Terminal 2: Laravel Backend API & Web Server
Serves the REST API and the compiled React Admin Dashboard:

```bash
cd mw-api
php artisan serve --port=8000 --no-reload
```

---

### Terminal 3: React Admin Dashboard (Development Only)
If actively developing the frontend with hot-module replacement (Vite):

```bash
cd mw-verification-admin
npm run dev
# Accessible at http://localhost:5173
```

---

## 🏭 Production Single-Port Deployment

In production, you can build the React dashboard into static assets and let Laravel serve both the REST API and the Admin Web Interface on a single port (`8000` or standard `80`/`443`).

### 1. Build the Admin Dashboard:
```bash
cd mw-verification-admin
npm run build
```
This automatically compiles assets into `../mw-api/public/assets` and `../mw-api/public/index.html`.

### 2. Serve from Laravel:
Now, navigating to `http://localhost:8000/` or `http://your-server-ip/` directly displays the React Admin Dashboard, with all `/api/*` endpoints resolving to Laravel controllers!

---

## 🌿 Option 2: Hybrid Stack (Node.js Bot Engine)

If you prefer using the Node.js implementation:

* **Terminal 1 (Node.js Bot)**:
  ```bash
  npm start
  # Bot runs on port 3000
  ```
* **Terminal 2 (Laravel API)**:
  ```bash
  cd mw-api
  php artisan serve --port=8000 --no-reload
  ```
* **Terminal 3 (Admin Panel)**:
  ```bash
  cd mw-verification-admin
  npm run dev
  ```

---

## 🎯 Verifying Service Status

1. **Test Bot Responsiveness**:
   Type `!ping` in any channel on your Discord server. The bot will respond with:
   > 🏓 **Pong from Laravel 12 & PHP 8.2!**  
   > ⚡ Bot berjalan 100% murni di dalam Laravel.  
   > 📊 **Live Eloquent DB Data:**  
   > • Verified Players: **2**  
   > • Total Tickets: **29**

2. **Check Laravel REST API**:
   ```bash
   curl http://localhost:8000/api/tickets
   ```

3. **Check Admin Dashboard**:
   Open [http://localhost:8000](http://localhost:8000) or [http://localhost:5173](http://localhost:5173) in your browser.
