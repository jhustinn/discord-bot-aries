# 🔄 Migrations & Seeders Guide

This guide details how to execute database migrations, apply updates, and seed initial demo/production data.

---

## 🐘 1. Running Laravel Database Migrations

Laravel migrations are located in `mw-api/database/migrations/`.

### Run all pending migrations:
```bash
cd mw-api
php artisan migrate
```

### Run migrations with seeders:
```bash
php artisan migrate --seed
```

### Fresh Reset (Wipes all tables & rebuilds from scratch):
> [!CAUTION]
> This command will delete all existing data in the database. Use only in development or initial setup.
```bash
php artisan migrate:fresh --seed
```

---

## 🌱 2. Available Seeders

The seeders in `mw-api/database/seeders/` populate essential lookup records:

1. **`DatabaseSeeder.php`**: Orchestrates master seeding.
2. **`ShipSeeder.php`**: Seeds 100+ Modern Warships naval vessels across Tier I, Tier II, and Tier III with accurate class and nationality tags.
3. **`RestoreBackupSeeder.php`**: Imports default RBAC roles (`Super Admin`, `Clan Leader`, `Verified Member`) and assigns default admin access.

To execute an individual seeder:
```bash
php artisan db:seed --class=ShipSeeder
php artisan db:seed --class=RestoreBackupSeeder
```

---

## 🗄️ 3. Direct SQL Scripts Execution (Supabase / PostgreSQL)

If you are using Supabase or direct PostgreSQL:

### Initial Setup
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard) > **SQL Editor**.
2. Open and run [`schema.sql`](../../schema.sql) to create `verification_tickets` and base audit tables.
3. Open and run [`schema_v2.sql`](../../schema_v2.sql) to add clan wars, teams, points, seasons, and RBAC tables.
4. Run [`schema_battle_records.sql`](../../schema_battle_records.sql) and [`schema_rank_history.sql`](../../schema_rank_history.sql).

### Using psql Command Line:
```bash
psql -U postgres -h db.your-supabase.co -d postgres -f schema.sql
psql -U postgres -h db.your-supabase.co -d postgres -f schema_v2.sql
psql -U postgres -h db.your-supabase.co -d postgres -f schema_battle_records.sql
psql -U postgres -h db.your-supabase.co -d postgres -f schema_rank_history.sql
```
