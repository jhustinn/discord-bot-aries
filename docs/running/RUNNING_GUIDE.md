# 🚀 Running the Platform

This guide explains how to start, execute, and monitor the three components of the platform: the Discord Bot, the Laravel API backend, and the React Admin Dashboard.

---

## 🏃 Running in Development Mode

In development mode, you can run each service in a separate terminal window to inspect live logs, hot reload code, and debug API calls.

### Terminal 1: Discord Bot Engine
Runs on `http://localhost:3000`

```bash
# In project root:
npm start
# or for auto-restart on file edits:
npm run dev
```

Expected startup logs:
```
[INFO] [Bot] Logged in as Aries Bot#1234
[INFO] [Bot] Registering slash commands for guild 1023370561507840052...
[INFO] [Bot] Slash commands successfully registered.
[INFO] [HTTP] Internal API server listening on port 3000
```

---

### Terminal 2: Laravel Backend API
Runs on `http://localhost:8000`

```bash
cd mw-api

# Start with multi-worker support for concurrent API handling:
php artisan serve --port=8000 --no-reload
```
> [!TIP]
> Setting `$env:PHP_CLI_SERVER_WORKERS=4` (PowerShell) or `PHP_CLI_SERVER_WORKERS=4` (Linux) enables PHP's built-in multi-threaded server so concurrent requests from the frontend and Discord bot do not block each other.

---

### Terminal 3: React Admin Dashboard (Vite Dev Server)
Runs on `http://localhost:5173`

```bash
cd mw-verification-admin
npm run dev
```

The admin dashboard will be accessible at [http://localhost:5173](http://localhost:5173).

---

## 🏭 Running in Production Mode (Unified Single-Port Deployment)

In production, you can build the React dashboard into static assets and let Laravel serve both the REST API and the Admin Web Interface on a single port (`8000` or standard `80`/`443`).

### 1. Build the Admin Dashboard:
```bash
cd mw-verification-admin
npm run build
```
This automatically compiles assets into `../mw-api/public/` (Vite output dir).

### 2. Serve from Laravel:
Now, navigating to `http://localhost:8000/` or `http://your-server-ip/` directly displays the React Admin Dashboard, with all `/api/*` endpoints resolving to Laravel controllers!

---

## 🎯 Verifying Service Status

You can test that all endpoints are operational with quick HTTP requests:

1. **Check Discord Bot API**:
   ```bash
   curl http://localhost:3000/health
   # Returns: {"status":"healthy","bot":"online","uptime":...}
   ```

2. **Check Laravel API**:
   ```bash
   curl http://localhost:8000/api/tickets
   ```

3. **Check Discord Role Synchronization**:
   ```bash
   curl -H "x-api-key: aries-admin-2024" http://localhost:3000/api/discord/roles
   ```

---

## 🎮 Initial Discord Server Initialization

Once the bot is online in your Discord server:

1. Go to your verification channel (`WELCOME_CHANNEL_ID`).
2. Run the slash command:
   ```
   /verify-panel
   ```
3. An embed message with the **"Verifikasi Akun"** button will be dispatched.
4. When a user clicks the button, a private ticket channel `open-ticket-XX-<username>` is instantly created with instructions to submit their Modern Warships profile screenshot!
