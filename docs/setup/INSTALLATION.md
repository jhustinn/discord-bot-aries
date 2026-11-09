# 🛠️ Step-by-Step Installation Guide

Follow these instructions to clone, install dependencies, and configure the entire ecosystem from scratch.

---

## 1. Clone the Repository

```bash
git clone https://github.com/jhustinn/discord-bot-aries.git
cd discord-bot-aries
```

---

## 2. Setup Backend API & Native Laravel Bot (`mw-api`)

The backend API and native Discord bot engine run on **Laravel 12.71.0** with **PHP 8.2+**.

```bash
cd mw-api
composer install
```

### Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Generate Laravel application encryption key:
```bash
php artisan key:generate
```

Open `.env` in `mw-api/` and configure your credentials:
```env
APP_NAME="Modern Warships Bot Admin API"
APP_ENV=local
APP_KEY=base64:...
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite

# Discord Bot Credentials
DISCORD_TOKEN=your_bot_token_here
GUILD_ID=your_guild_id_here
WELCOME_CHANNEL_ID=your_welcome_channel_id_here
TICKET_CATEGORY_ID=your_ticket_category_id_here
VERIFIED_ROLE_ID=your_verified_role_id_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### Initialize Database
By default, the backend uses SQLite for rapid, zero-setup development:

1. Ensure the SQLite database file exists:
   ```bash
   # Windows (PowerShell)
   if (!(Test-Path database\database.sqlite)) { New-Item -ItemType File -Path database\database.sqlite }

   # Linux / macOS
   touch database/database.sqlite
   ```

2. Run migrations and database seeders:
   ```bash
   php artisan migrate --seed
   ```
   *This seeds default administrative users, RBAC permissions, default ships catalog, and sample records.*

### Test Native Discord Bot Connection:
```bash
php artisan discord:run --test
```
*This performs a self-test: authenticates with Discord Gateway v10, checks guild availability, queries Eloquent models, and cleanly disconnects.*

---

## 3. Setup React Admin Dashboard (`mw-verification-admin`)

The admin dashboard allows managing members, verification tickets, roles, wars, and transcripts in a modern web UI.

```bash
cd ../mw-verification-admin
npm install
```

### Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Verify contents of `mw-verification-admin/.env`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_BOT_API_URL=http://localhost:3000
VITE_API_KEY=aries-admin-2024
```

### Build Production Assets
To serve the admin dashboard directly from Laravel:
```bash
npm run build
```
*This compiles the React SPA directly into `../mw-api/public/assets` and `../mw-api/public/index.html`.*

---

## 4. (Optional) Setup Node.js Bot Engine (Root Directory)

If you prefer to run the Node.js implementation of the bot (`discord.js v14`):

```bash
# In the root repository directory:
npm install
cp .env.example .env
```
Fill in `.env` at the root with your Discord Bot Token and keys.

---

## ✅ Installation Complete!

You are now ready to run the application. Head over to the [Running Guide](../running/RUNNING_GUIDE.md) to start the services.
