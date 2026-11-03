// ─── Main Entry Point ─────────────────────────────────────────────────────────
require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');
const commandHandler = require('./handlers/commands');
const interactionHandler = require('./handlers/interactions');
const messageHandler = require('./handlers/messages');
const { createDiscordRouter } = require('./handlers/discordApi');

// New API Routes
const { createPlayersRouter } = require('./routes/players');
const { createTeamsRouter } = require('./routes/teams');
const { createWarsRouter } = require('./routes/wars');
const { createPointsRouter } = require('./routes/points');
const { createSeasonsRouter } = require('./routes/seasons');
const { createRBACRouter } = require('./routes/rbac');

// ─── Validate Environment ─────────────────────────────────────────────────────
config.validateEnv();

// ─── Discord Client ───────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ─── Active Ticket Tracking ───────────────────────────────────────────────────
const activeTickets = new Map();

// ─── Keep-Alive Server ────────────────────────────────────────────────────────
function startKeepAliveServer() {
  const app = express();

  // CORS for admin dashboard
  app.use(cors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
    credentials: true
  }));

  // Handle preflight requests
  app.options('*', cors());

  app.use(express.json());

  // Static uploads directory for screenshots
  const path = require('path');
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Health check
  app.get('/', (req, res) => {
    res.json({
      status: 'online',
      bot: client.user?.tag || 'starting',
      uptime: process.uptime(),
      activeTickets: activeTickets.size
    });
  });

  // ─── Public Transcript Viewer & API Endpoints ──────────────────────────────
  app.get('/transcript/:ticketId', async (req, res) => {
    try {
      const { ticketId } = req.params;
      const transcriptService = require('./services/transcript');
      const database = require('./services/database');

      const archivedData = await transcriptService.getTicketTranscript(ticketId);
      const ticket = await database.getTicketById(ticketId).catch(() => null);

      if (!ticket && !archivedData) {
        return res.status(404).send('<h1 style="font-family:sans-serif; text-align:center; margin-top:50px;">404 - Transcript Not Found</h1>');
      }

      let liveMessages = [];
      const guild = client.guilds.cache.first();
      if (guild && ticket) {
        const channelId = activeTickets.get(ticket.user_id);
        let channel = channelId ? guild.channels.cache.get(channelId) : null;
        if (!channel) {
          channel = guild.channels.cache.find(c =>
            (c.name.startsWith('open-ticket-') || c.name.startsWith('closed-ticket-')) &&
            (c.permissionOverwrites.cache.has(ticket.user_id) || c.name.toLowerCase().includes(ticket.in_game_name?.toLowerCase() || 'xyz'))
          );
        }
        if (channel && channel.isTextBased()) {
          liveMessages = await transcriptService.fetchChannelMessages(channel, 100);
        }
      }

      const messages = (archivedData && archivedData.messages && archivedData.messages.length > 0)
        ? archivedData.messages
        : liveMessages;

      const html = transcriptService.generateTranscriptHtml({ messages, ...archivedData }, ticket);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err) {
      logger.error('API', 'Public transcript error', { error: err.message });
      res.status(500).send('Error rendering transcript: ' + err.message);
    }
  });

  app.get('/api/transcript/:ticketId', async (req, res) => {
    try {
      const { ticketId } = req.params;
      const transcriptService = require('./services/transcript');
      const database = require('./services/database');

      const archivedData = await transcriptService.getTicketTranscript(ticketId);
      const ticket = await database.getTicketById(ticketId).catch(() => null);

      if (!ticket && !archivedData) {
        return res.status(404).json({ error: 'Transcript not found' });
      }

      let liveMessages = [];
      const guild = client.guilds.cache.first();
      if (guild && ticket) {
        const channelId = activeTickets.get(ticket.user_id);
        let channel = channelId ? guild.channels.cache.get(channelId) : null;
        if (!channel) {
          channel = guild.channels.cache.find(c =>
            (c.name.startsWith('open-ticket-') || c.name.startsWith('closed-ticket-')) &&
            c.permissionOverwrites.cache.has(ticket.user_id)
          );
        }
        if (channel && channel.isTextBased()) {
          liveMessages = await transcriptService.fetchChannelMessages(channel, 100);
        }
      }

      const messages = (archivedData && archivedData.messages && archivedData.messages.length > 0)
        ? archivedData.messages
        : liveMessages;

      const format = req.query.format || 'json';
      if (format === 'raw' || format === 'text') {
        const text = transcriptService.generateTranscriptText(messages, ticket);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(text);
      }

      res.json({
        success: true,
        ticketId,
        ticket,
        messageCount: messages.length,
        messages,
        screenshotUrl: ticket?.permanent_image_url || null,
        ocrText: ticket?.extracted_text || null,
        archivedAt: archivedData?.archivedAt || null,
        publicUrl: `http://localhost:3000/transcript/${ticketId}`
      });
    } catch (err) {
      logger.error('API', 'Public transcript JSON error', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  // Discord API routes
  app.use('/api/discord', createDiscordRouter(client, activeTickets));

  // Clan Management API routes
  app.use('/api/players', createPlayersRouter());
  app.use('/api/teams', createTeamsRouter());
  app.use('/api/wars', createWarsRouter());
  app.use('/api/points', createPointsRouter());
  app.use('/api/seasons', createSeasonsRouter());
  app.use('/api/rbac', createRBACRouter());

  app.listen(config.PORT, () => {
    logger.info('Server', `Listening on port ${config.PORT}`);
    logger.info('Server', 'API endpoints available:');
    logger.info('Server', '  - /api/discord/* (Discord management)');
    logger.info('Server', '  - /api/players/* (Player management)');
    logger.info('Server', '  - /api/teams/* (Team management)');
    logger.info('Server', '  - /api/wars/* (War management)');
    logger.info('Server', '  - /api/points/* (Points management)');
    logger.info('Server', '  - /api/seasons/* (Season management)');
    logger.info('Server', '  - /api/rbac/* (RBAC management)');
  });
}

// ─── Register Commands ────────────────────────────────────────────────────────
async function registerCommands() {
  const { REST, Routes } = require('discord.js');
  const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

  try {
    logger.info('Commands', 'Registering slash commands...');
    
    // Register instantly to all connected guilds
    const guilds = client.guilds.cache;
    if (guilds.size > 0) {
      for (const [guildId, guild] of guilds) {
        await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), {
          body: commandHandler.commands.map(c => c.toJSON())
        });
        logger.info('Commands', `Slash commands registered instantly for guild: ${guild.name} (${guildId})`);
      }
    } else {
      // Fallback global registration
      await rest.put(Routes.applicationCommands(client.user.id), {
        body: commandHandler.commands.map(c => c.toJSON())
      });
      logger.info('Commands', 'Slash commands registered globally');
    }
  } catch (error) {
    logger.error('Commands', 'Registration failed', { error: error.message });
  }
}

// ─── Event: Bot Ready ─────────────────────────────────────────────────────────
client.once('ready', async () => {
  logger.info('Bot', `Logged in as ${client.user.tag}`);
  logger.info('Bot', `Serving ${client.guilds.cache.size} guild(s)`);

  await registerCommands();
  startKeepAliveServer();
});

// ─── Event: Button Interactions ───────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === 'open_ticket') {
      await interaction.deferReply({ ephemeral: true });
      await interactionHandler.handleOpenTicket(interaction, activeTickets, client);
    }
  }

  if (interaction.isChatInputCommand()) {
    switch (interaction.commandName) {
      case 'verify-panel':
        await commandHandler.handleVerifyPanel(interaction);
        break;
      case 'verify-close':
        await commandHandler.handleVerifyClose(interaction, activeTickets);
        break;
      case 'verify-stats':
        await commandHandler.handleVerifyStats(interaction);
        break;
      case 'rank-check':
        await commandHandler.handleRankCheck(interaction);
        break;
      case 'rank-history':
        await commandHandler.handleRankHistory(interaction);
        break;
      case 'record-submit':
        await commandHandler.handleRecordSubmit(interaction);
        break;
      case 'record-board':
        await commandHandler.handleRecordBoard(interaction);
        break;
      case 'rbac':
        await commandHandler.handleRbac(interaction);
        break;
    }
  }
});

// ─── Event: Message Handler ───────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Enforce locked tickets: delete any member message in closed ticket channels
  if (message.channel.name?.startsWith('closed-ticket-')) {
    await message.delete().catch(() => {});
    return;
  }

  // Automatic Clan Records Submission Listener (#submissions channel)
  if (message.channel.name?.includes('submission') && message.attachments.size > 0) {
    const imageAttachment = message.attachments.find(a => a.contentType?.startsWith('image/'));
    if (imageAttachment) {
      try {
        const axios = require('axios');
        const imageRes = await axios.get(imageAttachment.url, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageRes.data);

        const ocrGemini = require('./services/ocr-gemini');
        const ocrSpace = require('./services/ocr');
        const useGemini = !!process.env.GEMINI_API_KEY;
        const ocrService = useGemini ? ocrGemini : ocrSpace;

        const ocrResult = await ocrService.processImage(imageBuffer);
        const scoreboardOcr = require('./services/scoreboardOcr');
        const parsed = scoreboardOcr.parseScoreboardText(ocrResult.rawText, {
          discordUsername: message.author.username,
          inputDamage: message.content.replace(/[^0-9]/g, '')
        });

        if (parsed.damage > 0) {
          const storage = require('./services/storage');
          const ext = imageAttachment.name?.split('.').pop() || 'png';
          const targetPath = `records/${message.author.id}-${Date.now()}.${ext}`;
          await storage.uploadFile(imageBuffer, targetPath, imageAttachment.contentType);
          const permanentScreenshotUrl = storage.getPublicUrl(targetPath);

          const battleRecords = require('./services/battleRecords');
          const saveResult = await battleRecords.saveBattleRecord({
            discordUserId: message.author.id,
            discordUsername: message.author.username,
            playerId: parsed.playerId,
            playerName: parsed.playerName,
            shipName: parsed.shipName,
            shipClass: parsed.shipClass,
            damage: parsed.damage,
            kills: parsed.kills,
            assists: parsed.assists,
            mapName: parsed.mapName,
            screenshotUrl: permanentScreenshotUrl,
            extractedOcrText: ocrResult.rawText,
            rawOcrData: parsed
          });

          // React with checkmark
          await message.react('✅').catch(() => {});

          if (saveResult.isNewClanRecord) {
            await message.reply({
              content: `🏆 **NEW CLAN RECORD!** <@${message.author.id}> has set the **#1 Damage Record** for **${parsed.shipName}** with **\`${parsed.damage.toLocaleString('en-US')}\`** damage!`
            });

            // Update class channel leaderboard if it exists in guild
            try {
              const targetChannel = message.guild.channels.cache.find(c => c.name.toLowerCase() === parsed.shipClass.toLowerCase());
              if (targetChannel && targetChannel.isTextBased()) {
                const boardEmbed = await battleRecords.generateClassLeaderboardEmbed(parsed.shipClass);
                await targetChannel.send({ embeds: [boardEmbed] });
              }
            } catch (postErr) {
              logger.warn('Index', 'Could not auto-post to class channel', { error: postErr.message });
            }
          }
        }
      } catch (err) {
        logger.error('Index', 'Failed to auto-process submission in channel', { error: err.message });
      }
    }
  }

  if (!message.channel.name?.startsWith('open-ticket-')) return;
  if (message.attachments.size ===0 && !message.content?.trim()) return;

  if (message.attachments.size >0) {
    await messageHandler.processVerification(message);
  }
});

// ─── Event: Member Leave Cleanup ──────────────────────────────────────────────
client.on('guildMemberRemove', async (member) => {
  const channelId = activeTickets.get(member.id);
  if (channelId) {
    const channel = member.guild.channels.cache.get(channelId);
    if (channel) {
      await channel.send('User has left the server. Closing ticket...');
      setTimeout(() => channel.delete().catch(() => {}),3000);
    }
    activeTickets.delete(member.id);
  }
});

// ─── Error Handling ───────────────────────────────────────────────────────────
process.on('unhandledRejection', (error) => {
  logger.error('System', 'Unhandled rejection', { error: error.message });
});

process.on('uncaughtException', (error) => {
  logger.error('System', 'Uncaught exception', { error: error.message });
});

// ─── Login ────────────────────────────────────────────────────────────────────
client.login(config.DISCORD_TOKEN);
