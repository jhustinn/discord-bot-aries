# 🔐 Environment Variables Reference

This document provides a complete dictionary of all configuration parameters across: Laravel Backend & Native Bot (`mw-api/.env`), React Admin Dashboard (`mw-verification-admin/.env`), and the optional Node.js Bot (`/.env`).

---

## 1. Laravel Backend & Native Bot (`mw-api/.env`)

Located inside the `mw-api/` directory. Powers both the REST API and the native `php artisan discord:run` bot daemon.

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `APP_NAME` | No | `Modern Warships Bot Admin API` | Application name. |
| `APP_ENV` | **Yes** | `local` | Environment mode (`local`, `production`, `testing`). |
| `APP_KEY` | **Yes** | - | Base64 AES-256 encryption key generated via `php artisan key:generate`. |
| `APP_DEBUG` | **Yes** | `true` | Show detailed debug backtraces on exceptions (set to `false` in production). |
| `APP_URL` | **Yes** | `http://localhost:8000` | Base URL where Laravel API is served. |
| `PHP_CLI_SERVER_WORKERS` | No | `4` | Number of concurrent workers for `php artisan serve`. |
| `DB_CONNECTION` | **Yes** | `sqlite` | Database driver (`sqlite`, `mysql`, `pgsql`). |
| `DB_HOST` | Conditional | `127.0.0.1` | Database server host (for MySQL/PostgreSQL). |
| `DB_PORT` | Conditional | `3306` / `5432` | Database port. |
| `DB_DATABASE` | Conditional | `database/database.sqlite` | Database name or path to SQLite file. |
| `DB_USERNAME` | Conditional | `root` | Database username. |
| `DB_PASSWORD` | Conditional | - | Database password. |
| `DISCORD_TOKEN` | **Yes** | - | Bot token from Discord Developer Portal. |
| `GUILD_ID` | **Yes** | - | Discord Guild (Server) ID for command synchronization. |
| `WELCOME_CHANNEL_ID` | **Yes** | - | Channel ID where the `/verify-panel` embed is dispatched. |
| `TICKET_CATEGORY_ID` | **Yes** | - | Discord category ID under which `open-ticket-XX` channels are created. |
| `CLOSED_CATEGORY_ID` | No | - | Discord category ID where archived closed ticket channels are placed. |
| `VERIFIED_ROLE_ID` | **Yes** | - | Discord Role ID granted when verification is approved. |
| `GEMINI_API_KEY` | Recommended | - | Google Gemini API key used for Modern Warships OCR vision extraction. |
| `DISCORD_BOT_API_URL` | Conditional | `http://localhost:3000/api/discord` | Bridge URL when using Node.js bot (not needed if using native Laravel bot). |
| `DISCORD_API_KEY` | Conditional | `aries-admin-2024` | Secret API key passed in `x-api-key` header to Node.js bot. |

---

## 2. React Admin Dashboard (`mw-verification-admin/.env`)

Located inside the `mw-verification-admin/` directory.

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `VITE_API_URL` | **Yes** | `http://localhost:8000/api` | REST API URL of the Laravel backend. |
| `VITE_BOT_API_URL` | No | `http://localhost:3000` | Optional direct bot API URL. |
| `VITE_API_KEY` | No | `aries-admin-2024` | Optional header key for direct bot calls. |
| `VITE_SUPABASE_URL` | Optional | - | Optional direct Supabase connection URL. |
| `VITE_SUPABASE_KEY` | Optional | - | Optional Supabase public anon key. |

---

## 3. Node.js Bot Engine (`/.env`)

Located at the repository root (only required if running the Node.js implementation).

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `DISCORD_TOKEN` | **Yes** | - | Bot token generated from Discord Developer Portal. |
| `GUILD_ID` | **Yes** | - | Discord Guild (Server) ID. |
| `WELCOME_CHANNEL_ID` | **Yes** | - | Channel ID for verification embed. |
| `TICKET_CATEGORY_ID` | **Yes** | - | Category ID for active tickets. |
| `VERIFIED_ROLE_ID` | **Yes** | - | Verified Member role ID. |
| `PORT` | No | `3000` | Port for the bot's internal HTTP server. |
| `API_SECRET_KEY` | **Yes** | `aries-admin-2024` | Secret key authenticating Laravel API requests. |
| `GEMINI_API_KEY` | Recommended | - | Google Gemini API key for OCR extraction. |
| `SUPABASE_URL` | Optional | - | Supabase project URL. |
| `SUPABASE_KEY` | Optional | - | Supabase anon/service_role API key. |
