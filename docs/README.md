# 📚 Documentation Hub

Welcome to the comprehensive documentation repository for the **Aries Modern Warships Discord Bot & Clan Management Ecosystem**. This documentation is divided into organized modules covering every aspect of the platform: setup, running procedures, database architectures, system design, and product specifications.

---

## 🗂️ Documentation Structure

```
docs/
├── README.md                      # (You are here) Central Documentation Index
│
├── setup/                         # Installation, Prerequisites & Configurations
│   ├── PREREQUISITES.md           # System requirements, software, runtime versions (PHP 8.2+, Node.js, Composer)
│   ├── INSTALLATION.md            # Step-by-step setup for Laravel Bot, API, and Admin
│   ├── ENVIRONMENT_VARIABLES.md   # Complete reference for all .env variables (Bot, API, Admin)
│   └── DISCORD_SETUP.md           # Discord Developer Portal, Intents, and Permissions
│
├── running/                       # Execution, Workflows & Operational Guides
│   ├── RUNNING_GUIDE.md           # Running via Full Laravel Monolith or Hybrid Stack
│   ├── PROCESS_MANAGEMENT.md      # Process supervision with PM2 & systemd background daemons
│   └── TROUBLESHOOTING.md         # Diagnostic steps for common errors and edge cases
│
├── database/                      # Schemas, Migrations & Data Dictionary
│   ├── DATABASE_GUIDE.md          # Multi-driver setup (SQLite, MySQL, Supabase/PostgreSQL)
│   ├── SCHEMA_REFERENCE.md        # Comprehensive table definitions and column details
│   └── MIGRATIONS_AND_SEEDERS.md  # How to run SQL schemas, Laravel migrations & seeders
│
├── architecture/                  # Deep Dives into Core Systems
│   ├── ARCHITECTURE.md            # Dual-engine architecture (Full Laravel vs Hybrid Node.js)
│   ├── RBAC_SYSTEM.md             # Unified Discord & Web RBAC (1:1 Role Sync)
│   └── OCR_PIPELINE.md            # Dual-engine OCR (Gemini Vision + Cloud Vision)
│
└── specifications/                # Original Requirements & Product Specifications
    ├── BRD.md                     # Business Requirements Document
    ├── PRD.md                     # Product Requirements Document
    └── SRS.md                     # Software Requirements Specification
```

---

## 🚀 Quick Navigation

| If you want to... | Read this document |
| :--- | :--- |
| **Get started quickly from scratch** | [Installation Guide](setup/INSTALLATION.md) |
| **Learn about all required API keys and `.env`** | [Environment Variables Guide](setup/ENVIRONMENT_VARIABLES.md) |
| **Configure Discord Bot intents, tokens & permissions** | [Discord Bot Setup](setup/DISCORD_SETUP.md) |
| **Run the Bot in Full Laravel or Hybrid Node.js** | [Running Guide](running/RUNNING_GUIDE.md) |
| **Understand the database structure and tables** | [Database Guide](database/DATABASE_GUIDE.md) & [Schema Reference](database/SCHEMA_REFERENCE.md) |
| **Understand the dual-engine architecture (Laravel 12 + DiscordPHP)** | [System Architecture](architecture/ARCHITECTURE.md) |
| **Understand how Discord roles map 1:1 to Web permissions** | [Unified RBAC System](architecture/RBAC_SYSTEM.md) |
| **Understand how Modern Warships OCR works** | [OCR Pipeline Deep-Dive](architecture/OCR_PIPELINE.md) |
| **Fix runtime errors, port conflicts or rate limits** | [Troubleshooting Guide](running/TROUBLESHOOTING.md) |

---

## 🏗️ Ecosystem Components

1. **Native Laravel Discord Bot Engine (`mw-api/app/Console/Commands/RunDiscordBot.php`)**:
   Runs 100% inside **Laravel 12.71.0** via `team-reflex/discord-php`. Direct native access to Laravel Eloquent models (`VerificationTicket`, `VerifiedPlayer`, `RbacRole`) without network overhead or separate Node.js processes.
2. **Node.js Discord Bot Engine (`src/`)**:
   Alternative Node.js 18+/20+ application utilizing `discord.js v14`, featuring automated verification tickets, Google Gemini 1.5 Flash Vision OCR, clan war tracking, scoreboard extraction, audit logs, and REST API bridges.
3. **Backend REST API (`mw-api/`)**:
   Powered by **Laravel 12.71.0** providing RESTful endpoints, database migrations, Sanctum authentication, player records, clan wars, seasons, ship catalogs, and dynamic RBAC role provisioning.
4. **Admin Dashboard (`mw-verification-admin/`)**:
   React 18 SPA built with Vite, TypeScript, and Tailwind CSS. Features dark mode, live member monitoring, ticket management, clan war scoring, and custom multi-select RBAC controls. Builds directly to `mw-api/public/` for unified hosting.
