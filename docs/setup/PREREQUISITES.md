# 📋 System Prerequisites

Before setting up the project, make sure your operating system meets the following software and runtime requirements.

---

## 💻 Operating System Support
- **Windows**: Windows 10/11 or Windows Server (PowerShell 5.1+ or PowerShell 7+ recommended).
- **Linux**: Ubuntu 20.04+, Debian 11+, CentOS 8+, Arch Linux, or any modern distribution.
- **macOS**: macOS Monterey (12.0) or newer (Apple Silicon & Intel supported).

---

## 📦 Required Software Runtimes

| Tool / Runtime | Minimum Version | Recommended Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.0.0` | `v20.x LTS` or `v22.x LTS` | Bot runtime & Admin Panel build tool |
| **npm** | `v9.0.0` | `v10.x` | Node package manager |
| **PHP** | `8.2.0` | `8.2.x` or `8.3.x` | Laravel 11 Backend API engine |
| **Composer** | `2.5.0` | `2.7.x+` | PHP dependency manager |
| **Git** | `2.30.0` | Latest | Version control |

---

## 🐘 Required PHP Extensions
Ensure the following PHP extensions are enabled in your `php.ini` file:

```ini
extension=curl
extension=fileinfo
extension=mbstring
extension=openssl
extension=pdo_sqlite     ; If using SQLite (default)
extension=sqlite3        ; If using SQLite (default)
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

To unlock the full features of the bot, prepare the following API keys:

1. **Discord Developer Account**:
   - Access to [Discord Developer Portal](https://discord.com/developers/applications).
   - Application & Bot Token.
   - Privileged Gateway Intents: **SERVER MEMBERS INTENT** and **MESSAGE CONTENT INTENT** enabled.
2. **Google Gemini API Key (Recommended for OCR)**:
   - Obtain free from [Google AI Studio](https://aistudio.google.com/).
   - No credit card required. Fast and handles Modern Warships Unicode characters.
3. **Database (Choose One)**:
   - **SQLite (Default & Easiest)**: Zero configuration required; file stored locally in `mw-api/database/database.sqlite`.
   - **Supabase / PostgreSQL**: Free database project created at [supabase.com](https://supabase.com).
   - **MySQL / MariaDB**: Local or cloud-hosted MySQL 8.0+.
