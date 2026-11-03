# 🔐 Environment Variables Reference

This document provides a complete dictionary of all configuration parameters used across the three services: Root Discord Bot, Laravel Backend API (`mw-api`), and Admin Frontend (`mw-verification-admin`).

---

## 1. Discord Bot Engine (`/.env`)

Located at the repository root.

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `DISCORD_TOKEN` | **Yes** | - | Bot token generated from the Discord Developer Portal. |
| `GUILD_ID` | **Yes** | - | Discord Guild (Server) ID. Used for instant slash command synchronization. |
| `WELCOME_CHANNEL_ID` | **Yes** | - | Channel ID where the `/verify-panel` embed with "Verifikasi Akun" button is posted. |
| `TICKET_CATEGORY_ID` | **Yes** | - | Discord category ID under which new `open-ticket-XX` channels are created. |
| `CLOSED_CATEGORY_ID` | No | - | Discord category ID where closed/archived ticket channels are moved. |
| `VERIFIED_ROLE_ID` | **Yes** | - | Default Discord Role ID granted when an applicant is verified and approved. |
| `PORT` | No | `3000` | Port for the bot's internal HTTP server and Discord API REST bridge. |
| `API_SECRET_KEY` | **Yes** | `aries-admin-2024` | Secret key used to authenticate requests between Laravel API and the Discord Bot. |
| `MW_API_URL` | No | `http://localhost:8000/api` | Base URL of the Laravel API service for webhook/callback synchronization. |
| `GEMINI_API_KEY` | Recommended | - | Google Gemini API key used by `src/services/ocr-gemini.js` for fast Modern Warships screenshot extraction. |
| `GOOGLE_CREDENTIALS` | No | - | JSON string of Google Cloud Service Account credentials (for Google Cloud Vision OCR fallback). |
| `OCR_API_KEY` | No | `helloworld` | API Key for OCR.space fallback. |
| `SUPABASE_URL` | Optional | - | Supabase project URL (if using Supabase storage or cloud PostgreSQL). |
| `SUPABASE_KEY` | Optional | - | Supabase anon/service_role API key. |

---

## 2. Laravel Backend API (`mw-api/.env`)

Located inside the `mw-api/` directory.

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `APP_NAME` | No | `Laravel` | Application name. |
| `APP_ENV` | **Yes** | `local` | Environment mode (`local`, `production`, `testing`). |
| `APP_KEY` | **Yes** | - | Base64 AES-256 encryption key generated via `php artisan key:generate`. |
| `APP_DEBUG` | **Yes** | `true` | Show detailed debug backtraces on exceptions (set to `false` in production). |
| `APP_URL` | **Yes** | `http://localhost:8000` | Base URL where Laravel API is served. |
| `PHP_CLI_SERVER_WORKERS` | No | `4` | Number of concurrent workers for `php artisan serve`. |
| `DB_CONNECTION` | **Yes** | `sqlite` | Database driver (`sqlite`, `mysql`, `pgsql`). |
| `DB_HOST` | Conditional | `127.0.0.1` | Database server host (for MySQL/PostgreSQL). |
| `DB_PORT` | Conditional | `3306` / `5432` | Database port. |
| `DB_DATABASE` | Conditional | `database/database.sqlite` | Database name or absolute path to SQLite file. |
| `DB_USERNAME` | Conditional | `root` | Database username. |
| `DB_PASSWORD` | Conditional | - | Database password. |
| `DISCORD_BOT_API_URL` | **Yes** | `http://localhost:3000/api/discord` | Internal bridge URL to communicate with the running Discord bot. |
| `DISCORD_API_KEY` | **Yes** | `aries-admin-2024` | Secret API key passed in `x-api-key` header to the Discord bot. |

---

## 3. React Admin Dashboard (`mw-verification-admin/.env`)

Located inside the `mw-verification-admin/` directory.

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `VITE_API_URL` | **Yes** | `http://localhost:8000/api` | REST API URL of the Laravel backend. |
| `VITE_BOT_API_URL` | No | `http://localhost:3000` | Direct Discord bot API URL for live ping/bot monitor. |
| `VITE_API_KEY` | No | `aries-admin-2024` | Header key for direct bot API calls. |
| `VITE_SUPABASE_URL` | Optional | - | Optional direct Supabase connection URL. |
| `VITE_SUPABASE_KEY` | Optional | - | Optional Supabase public anon key. |
