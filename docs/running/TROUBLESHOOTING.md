# 🩺 Troubleshooting Guide

Common issues, error codes, and step-by-step solutions for the Aries platform.

---

## 1. Discord Bot Issues

### Error: `Disallowed Intents (Privileged Intent)`
- **Symptom**: Bot crashes immediately on startup with `Error [DisallowedIntents]: Privileged intent provided is not allowed or requested`.
- **Cause**: The bot code requests `GuildMembers` or `MessageContent`, but they are disabled in the Discord Developer Portal.
- **Solution**:
  1. Open [Discord Developer Portal](https://discord.com/developers/applications) > Select Application > **Bot**.
  2. Toggle **ON** both **Server Members Intent** and **Message Content Intent**.
  3. Save changes and restart the bot.

---

### Error: `DiscordAPIError[50013]: Missing Permissions`
- **Symptom**: The bot fails to assign roles or create channels.
- **Cause**: 
  1. The bot's role in Discord is lower than the role it is trying to assign.
  2. The bot does not have `Manage Roles` or `Manage Channels` permissions in the server or category.
- **Solution**:
  1. Go to Discord Server Settings > **Roles**.
  2. Drag the bot's role to the top of the list (above all assignable roles).
  3. Ensure the category settings allow the bot role to view, create, and manage channels.

---

### Error: `Duplicate Ticket Numbering`
- **Symptom**: Creating a new ticket attempts to recreate `open-ticket-1` or clashes with an existing channel name.
- **Solution**: The bot uses intelligent scanning of both database records and active guild channels. Make sure `GUILD_ID` is set correctly in `.env` so the bot can fetch channel name suffixes accurately.

---

## 2. OCR Issues

### Issue: Modern Warships Player Names with Unicode Not Recognized
- **Symptom**: Player names with symbols (e.g. `Ψ・Aries`, `『MVP』Dark`, `Ωmega`) get stripped or converted to empty strings.
- **Solution**:
  1. Use **Google Gemini 1.5 Flash Vision** (`GEMINI_API_KEY` in `.env`). Gemini natively handles UTF-8, Japanese, Cyrillic, and Greek symbols without stripping.
  2. Test your Gemini API key in [Google AI Studio](https://aistudio.google.com/) to ensure it has valid quota.

---

## 3. Laravel API & Database Issues

### Error: `database.sqlite does not exist` or `database file is locked`
- **Symptom**: `Illuminate\Database\QueryException: database file does not exist` or `database is locked`.
- **Solution**:
  1. Create the SQLite file:
     ```bash
     touch mw-api/database/database.sqlite
     ```
  2. In Windows PowerShell:
     ```powershell
     New-Item -ItemType File -Path mw-api\database\database.sqlite -Force
     ```
  3. Run `php artisan migrate --seed` inside `mw-api/`.
  4. If experiencing SQLite locking under heavy concurrency, run Laravel with `--no-reload` and set `PHP_CLI_SERVER_WORKERS=4`.

---

### Error: `CORS (Cross-Origin Resource Sharing) blocked`
- **Symptom**: Frontend console displays `Access to XMLHttpRequest at 'http://localhost:8000/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy`.
- **Solution**:
  - Check `mw-api/config/cors.php`. Ensure `'allowed_origins' => ['*']` or includes `http://localhost:5173`.
  - Alternatively, build the frontend (`npm run build`) and serve directly from Laravel on the same origin (`http://localhost:8000`).

---

## 4. Admin Frontend & Vite Issues

### Error: `CustomSelect dropdown clipped inside modal dialog`
- **Symptom**: Dropdown menu opens but gets cut off at the bottom of the modal popup.
- **Solution**: The updated `CustomSelect` component includes dynamic placement detection (`placement="auto" | "top" | "bottom"`). For modal forms, pass `placement="top"` and ensure modal wrapper has `overflow-visible` and high z-index (`z-[999999]`).
