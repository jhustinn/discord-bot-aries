# 📋 System Prerequisites

Before setting up the project, make sure your operating system meets the following software and runtime requirements.

---

## 💻 Operating System Support
- **Windows**: Windows 10/11 or Windows Server (PowerShell 5.1+ or PowerShell 7+ recommended).
- **Linux**: Ubuntu 20.04+, Debian 11+, CentOS 8+, Arch Linux, or any modern distribution.
- **macOS**: macOS Monterey (12.0) or newer (Apple Silicon & Intel supported).

---

## 📦 Required Software Runtimes

| Tool / Runtime | Minimum Version | Recommended / Tested | Purpose |
| :--- | :--- | :--- | :--- |
| **PHP** | `8.2.0` | `8.2.4` / `8.3.x` | Laravel 12.71.0 Backend API & Native DiscordPHP Bot |
| **Composer** | `2.5.0` | `2.6.x` / `2.7.x+` | PHP dependency manager |
| **Node.js** | `v18.0.0` | `v20.x LTS` or `v22.x LTS` | Admin Panel build tool (and Node.js Bot if used) |
| **npm** | `v9.0.0` | `v10.x` | Node package manager |
| **Git** | `2.30.0` | Latest | Version control |

---

## 🐘 Required PHP Extensions
Ensure the following PHP extensions are enabled in your `php.ini` file:

```ini
extension=bcmath         ; Required for Discord Snowflake IDs & large integers
extension=curl           ; Required for HTTP requests & Discord API
extension=fileinfo       ; Required for image MIME detection
extension=gd             ; Required for image manipulation
extension=intl           ; Required for Unicode string handling
extension=mbstring       ; Required for multi-byte Unicode player names
extension=openssl        ; Required for HTTPS & Discord Gateway WebSocket SSL
extension=pdo_sqlite     ; If using SQLite (default plug-and-play)
extension=sqlite3        ; If using SQLite (default plug-and-play)
extension=pdo_mysql      ; If using MySQL
extension=pdo_pgsql      ; If using PostgreSQL / Supabase
```

To verify your installed PHP version and modules:
```bash
php -v
php -m
```

---

## 🔑 External API Accounts & Credentials

1. **Discord Developer Account**:
   - Access to [Discord Developer Portal](https://discord.com/developers/applications).
   - Application & Bot Token.
   - Privileged Gateway Intents: **SERVER MEMBERS INTENT** and **MESSAGE CONTENT INTENT** enabled.
2. **Google Gemini API Key (Recommended for OCR)**:
   - Obtain free from [Google AI Studio](https://aistudio.google.com/).
   - Fast, multimodal, and natively preserves Modern Warships Unicode characters.
3. **Database (Choose One)**:
   - **SQLite (Default & Easiest)**: Zero configuration required; file stored locally in `mw-api/database/database.sqlite`.
   - **MySQL / MariaDB**: Local or cloud-hosted MySQL 8.0+.
   - **Supabase / PostgreSQL**: Free database project created at [supabase.com](https://supabase.com).
