# 🤖 Discord Bot Setup & Permissions

This guide walks you through registering the application in the Discord Developer Portal, generating the bot token, enabling privileged gateway intents, and inviting the bot with appropriate server permissions.

---

## 1. Create Application in Discord Developer Portal

1. Navigate to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** in the top right corner.
3. Enter a name (e.g. `Aries Verification Bot`) and agree to the Developer Terms.
4. (Optional) Upload an avatar icon for your bot.

---

## 2. Generate and Configure Bot Token

1. Select **Bot** from the left-hand navigation sidebar.
2. Under **Token**, click **Reset Token** and copy the resulting string.
3. Save this token into your root `.env` as `DISCORD_TOKEN`.
   > [!CAUTION]
   > Never commit or publicly share your Discord Bot Token. If exposed, reset it immediately.

---

## 3. Enable Privileged Gateway Intents

The bot requires access to server members and message contents for ticket management and OCR verification:

1. On the **Bot** page, scroll down to the **Privileged Gateway Intents** section.
2. Toggle **ON** the following intents:
   - ✅ **PRESENCE INTENT**
   - ✅ **SERVER MEMBERS INTENT** *(Required to assign roles, fetch member lists, and check verification)*
   - ✅ **MESSAGE CONTENT INTENT** *(Required to read player image attachments in ticket channels for OCR)*
3. Click **Save Changes**.

```
[✓] Presence Intent
[✓] Server Members Intent    <-- CRITICAL
[✓] Message Content Intent   <-- CRITICAL
```

---

## 4. Generate Bot Invite Link with OAuth2 URL Generator

1. In the sidebar, navigate to **OAuth2 > URL Generator**.
2. Under **Scopes**, select:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Under **Bot Permissions**, select the following:
   - **General Permissions**:
     - `Manage Roles` *(To assign verified and clan roles)*
     - `Manage Channels` *(To create, lock, and archive ticket channels)*
     - `View Channels`
   - **Text Permissions**:
     - `Send Messages`
     - `Send Messages in Threads`
     - `Create Public/Private Threads`
     - `Manage Messages`
     - `Embed Links`
     - `Attach Files` *(To send transcripts and scoreboards)*
     - `Read Message History`
     - `Use Slash Commands`
4. Copy the generated invite link at the bottom and open it in your browser.
5. Select your Discord server and authorize the bot.

---

## 5. Discord Role Hierarchy Configuration

> [!IMPORTANT]
> In Discord, a bot can **only manage roles positioned lower than its own highest role** in the server hierarchy.

1. Open your Discord Server Settings > **Roles**.
2. Locate the role automatically created for your bot (e.g. `Aries Bot`).
3. Drag the bot's role **above** all roles that it will assign (e.g. above `Verified Member`, `@everyone`, and all Clan roles).
4. Save changes.

---

## 6. Obtain Discord Channel & Category IDs

Enable **Developer Mode** in Discord to copy IDs:
1. Open Discord Settings > **Advanced** > Toggle **Developer Mode** to **ON**.
2. Right-click your verification welcome channel > **Copy Channel ID** (`WELCOME_CHANNEL_ID`).
3. Right-click your ticket category header > **Copy Category ID** (`TICKET_CATEGORY_ID`).
4. Right-click your verified role in Server Settings > **Copy Role ID** (`VERIFIED_ROLE_ID`).
5. Right-click the server icon > **Copy Server ID** (`GUILD_ID`).
