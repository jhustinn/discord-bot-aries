# 🛠️ Step-by-Step Installation Guide

Follow these instructions to clone, install dependencies, and configure the entire ecosystem from scratch.

---

## 1. Clone the Repository

```bash
git clone https://github.com/jhustinn/discord-bot-aries.git
cd discord-bot-aries
```

---

## 2. Setup Discord Bot Engine (Root Directory)

The Discord bot engine manages verification tickets, OCR processing, clan war tracking, and the internal REST API.

```bash
# In the root repository directory:
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

Open `.env` and fill in your Discord credentials and Gemini OCR API Key:
```env
DISCORD_TOKEN=your_bot_token_here
GUILD_ID=your_discord_guild_id_here
WELCOME_CHANNEL_ID=your_verification_channel_id_here
TICKET_CATEGORY_ID=your_ticket_category_id_here
VERIFIED_ROLE_ID=your_verified_role_id_here
GEMINI_API_KEY=your_gemini_api_key_here
API_SECRET_KEY=aries-admin-2024
PORT=3000
```
*(For detailed descriptions of all variables, refer to [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md).)*

---

## 3. Setup Backend API (`mw-api`)

The backend API is powered by Laravel 11 and manages persistence, RBAC roles, seasons, ships, and REST routes.

```bash
cd mw-api
composer install
```

### Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
# Inside mw-api directory:
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Generate Laravel application encryption key:
```bash
php artisan key:generate
```

### Initialize Database
By default, the backend uses SQLite for rapid, zero-setup development.

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

---

## 4. Setup React Admin Dashboard (`mw-verification-admin`)

The admin dashboard allows managing members, verification tickets, roles, wars, and transcripts in a modern web UI.

```bash
cd ../mw-verification-admin
npm install
```

### Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
# Inside mw-verification-admin directory:
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

## ✅ Installation Complete!

You are now ready to run the application. Head over to the [Running Guide](../running/RUNNING_GUIDE.md) to start all services.
