// ─── Command Handlers ─────────────────────────────────────────────────────────
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const database = require('../services/database');
const logger = require('../utils/logger');

const commands = [
  new SlashCommandBuilder()
    .setName('verify-panel')
    .setDescription('Post the verification panel in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('verify-close')
    .setDescription('Close and delete the current verification ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder()
    .setName('verify-stats')
    .setDescription('View verification statistics')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('rank-check')
    .setDescription('Submit your profile screenshot for a season rank check')
    .addIntegerOption(option =>
      option.setName('season')
        .setDescription('Season number (e.g. 14)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addAttachmentOption(option =>
      option.setName('screenshot')
        .setDescription('Modern Warships profile / statistics screenshot')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('rank-history')
    .setDescription('View rank history and seasonal points progression')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Member to view rank history for (default: yourself)')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('record-submit')
    .setDescription('Submit an end-of-battle scoreboard screenshot for clan damage records')
    .addAttachmentOption(option =>
      option.setName('screenshot')
        .setDescription('Scoreboard results screenshot showing damage and ship')
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option.setName('rewards_screenshot')
        .setDescription('Optional: Rewards / Clan activity points screenshot')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('ship')
        .setDescription('Optional: Ship name override (e.g. IT FREMM-EVO, Pan Spatial Argonas)')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('damage')
        .setDescription('Optional: Damage amount override (e.g. 1633758)')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('record-board')
    .setDescription('Display or update the Clan Damage Leaderboard for a ship class')
    .addStringOption(option =>
      option.setName('class')
        .setDescription('Ship class to view leaderboard for')
        .setRequired(false)
        .addChoices(
          { name: '🚢 Frigates', value: 'frigates' },
          { name: '⚔️ Destroyers', value: 'destroyers' },
          { name: '🛡️ Cruisers', value: 'cruisers' },
          { name: '💥 Battleships', value: 'battleships' },
          { name: '🦈 Submarines', value: 'submarines' },
          { name: '✈️ Aircraft Carriers', value: 'carriers' },
          { name: '🦅 Assault Carriers', value: 'assault-carriers' },
          { name: '🚀 Ekranoplans', value: 'ekranoplan' },
          { name: '💨 Hovercrafts', value: 'hovercrafts' },
          { name: '🏝️ Assault Landing Ships', value: 'assault-landing-ships' }
        )
    ),
  new SlashCommandBuilder()
    .setName('rbac')
    .setDescription('Manage Clan & Server RBAC Roles, Permissions, and Discord Role sync')
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all active RBAC roles and permissions summary')
    )
    .addSubcommand(sub =>
      sub.setName('user')
        .setDescription('Inspect active roles and permissions for a user')
        .addUserOption(opt =>
          opt.setName('target')
            .setDescription('Member to inspect (default: yourself)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('assign')
        .setDescription('Assign an RBAC role to a member')
        .addUserOption(opt =>
          opt.setName('target')
            .setDescription('Member to assign role to')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('role')
            .setDescription('Role name or slug (e.g. super_admin, admin, leader, moderator, member)')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('revoke')
        .setDescription('Revoke an RBAC role from a member')
        .addUserOption(opt =>
          opt.setName('target')
            .setDescription('Member to revoke role from')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('role')
            .setDescription('Role name or slug to revoke')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('link-discord')
        .setDescription('Link a Discord Guild Server Role to an RBAC Role')
        .addStringOption(opt =>
          opt.setName('role')
            .setDescription('RBAC Role name or slug')
            .setRequired(true)
        )
        .addRoleOption(opt =>
          opt.setName('discord_role')
            .setDescription('Discord server role to link')
            .setRequired(true)
        )
    )
];

function getVerificationPanel() {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('Verification Required')
    .setDescription(
      'To gain access to this server, you must complete the verification process.\n\n' +
      '**Steps:**\n' +
      '1. Click the **Open Ticket** button below\n' +
      '2. A private channel will be created for you\n' +
      '3. Send your **in-game name** and a **verification screenshot**\n' +
      '4. Wait for confirmation\n\n' +
      'Your screenshot will be stored permanently for audit purposes.'
    )
    .setFooter({ text: 'Verification System v1.0.0' })
    .setTimestamp();

  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_ticket')
      .setLabel('Open Ticket')
      .setEmoji('🎫')
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

async function handleVerifyPanel(interaction) {
  const panel = getVerificationPanel();
  await interaction.reply({ ...panel, flags: require('discord.js').MessageFlags.Ephemeral });
  logger.info('Commands', 'Verification panel posted (ephemeral)', { channel: interaction.channel.name, by: interaction.user.tag });
}

async function handleVerifyClose(interaction, activeTickets) {
  const channel = interaction.channel;
  const config = require('../config');

  if (!channel.name.startsWith('open-ticket-') && !channel.name.startsWith('closed-ticket-')) {
    await interaction.reply({
      content: 'This command can only be used in verification ticket channels.',
      ephemeral: true
    });
    return;
  }

  // Find ticket opener from active tracking
  let openerId = null;
  for (const [userId, channelId] of activeTickets.entries()) {
    if (channelId === channel.id) {
      openerId = userId;
      activeTickets.delete(userId);
      break;
    }
  }

  // Fallback: find opener from member overwrites (works even after bot restart)
  if (!openerId) {
    for (const [id, overwrite] of channel.permissionOverwrites.cache) {
      if (id !== interaction.guild.id && id !== interaction.client.user.id && overwrite.type === 1) {
        openerId = id;
        break;
      }
    }
  }

  // Rename channel to closed
  const closedName = channel.name.startsWith('closed-ticket-')
    ? channel.name
    : channel.name.replace('open-ticket-', 'closed-ticket-');
  await channel.setName(closedName);

  // Move to closed category if configured
  if (config.CLOSED_CATEGORY_ID) {
    try {
      await channel.setParent(config.CLOSED_CATEGORY_ID, { lockPermissions: false });
      logger.info('Commands', 'Ticket moved to closed category', { channel: closedName });
    } catch (err) {
      logger.warn('Commands', 'Could not move to closed category', { error: err.message });
    }
  }

  // Lock ticket opener: no more messages, reactions, or threads
  if (openerId) {
    try {
      await channel.permissionOverwrites.edit(openerId, {
        SendMessages: false,
        SendMessagesInThreads: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false,
        AddReactions: false
      });
      logger.info('Commands', 'Ticket opener locked', { channelId: channel.id, openerId });
    } catch (err) {
      logger.error('Commands', 'Could not lock ticket opener', { error: err.message, openerId });
    }
  }

  // Sweep any other non-admin member overwrites as safety net
  for (const [id, overwrite] of channel.permissionOverwrites.cache) {
    if (id !== interaction.guild.id && id !== interaction.client.user.id && overwrite.type === 1) {
      try {
        await channel.permissionOverwrites.edit(id, { SendMessages: false });
      } catch (err) {
        logger.warn('Commands', 'Could not lock overwrite', { id, error: err.message });
      }
    }
  }

  const closedEmbed = new EmbedBuilder()
    .setColor('#ED4245')
    .setTitle('Ticket Closed')
    .setDescription(
      'This verification ticket has been closed and archived.\n' +
      'You can no longer send messages in this channel.\n\n' +
      'If you need help, please open a new ticket.'
    )
    .setTimestamp();

  await channel.send({ embeds: [closedEmbed] });
  await interaction.reply({ content: 'Ticket closed, archived, and locked.', ephemeral: true });
  logger.info('Commands', 'Ticket closed', { channel: closedName, openerId });
}

async function handleVerifyStats(interaction) {
  const stats = await database.getStats();

  const statsEmbed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('Verification Statistics')
    .addFields(
      { name: 'Total Users', value: `${stats.totalUsers}`, inline: true },
      { name: 'Total Tickets', value: `${stats.totalTickets}`, inline: true },
      { name: 'Pending', value: `${stats.pending}`, inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [statsEmbed], ephemeral: true });
  logger.info('Commands', 'Stats requested', { requestedBy: interaction.user.tag });
}

// ─── Rank Check Handler ───────────────────────────────────────────────────
async function handleRankCheck(interaction) {
  await interaction.deferReply();

  try {
    const seasonNumber = interaction.options.getInteger('season');
    const attachment = interaction.options.getAttachment('screenshot');
    const user = interaction.user;

    // 1. Validate file
    if (!attachment.contentType?.startsWith('image/')) {
      return interaction.editReply({
        content: '❌ Attachment must be an image file (PNG, JPG, JPEG, WEBP).'
      });
    }

    // 2. Download image buffer
    const axios = require('axios');
    const imageResponse = await axios.get(attachment.url, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);

    // 3. Process OCR
    const ocrGemini = require('../services/ocr-gemini');
    const ocrSpace = require('../services/ocr');
    const useGemini = !!process.env.GEMINI_API_KEY;
    const ocrService = useGemini ? ocrGemini : ocrSpace;

    logger.info('Commands', 'Running OCR on rank screenshot...');
    const ocrResult = await ocrService.processImage(imageBuffer);

    // 4. Upload to permanent storage
    const storage = require('../services/storage');
    const fileExtension = attachment.name?.split('.').pop() || 'png';
    const targetPath = `ranks/${user.id}-season-${seasonNumber}-${Date.now()}.${fileExtension}`;
    await storage.uploadFile(imageBuffer, targetPath, attachment.contentType);
    const permanentImageUrl = storage.getPublicUrl(targetPath);

    // 5. Save to rank history service
    const rankHistory = require('../services/rankHistory');
    const result = await rankHistory.saveRankSubmission({
      discordUserId: user.id,
      discordUsername: user.username,
      seasonNumber,
      permanentImageUrl,
      ocrResult,
      rawText: ocrResult.rawText
    });

    const curr = result.currentData;
    const prev = result.previousData;

    // Broadcast Real-time Notification
    const { sendNotification } = require('../services/apiClient');
    sendNotification({
      type: 'rank_check',
      title: result.isUpdate ? 'Season Rank Proof Updated' : 'New Rank Proof Submitted',
      message: `${user.username} submitted Season ${seasonNumber} rank: ${curr.rank_tier || 'Checked'} (${curr.rank_points || 0} pts)`,
      link: '/records',
      icon: '📊',
      meta: {
        user_id: user.id,
        username: user.username,
        season: seasonNumber,
        rank_tier: curr.rank_tier,
        rank_points: curr.rank_points
      }
    }).catch(() => {});

    // 6. Build Embed Response
    if (result.isUpdate) {
      const diff = (curr.rank_points || 0) - (prev?.rank_points || 0);
      const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;

      const updateEmbed = new EmbedBuilder()
        .setColor('#FEE75C')
        .setTitle(`🔄 Season ${seasonNumber} Rank Updated!`)
        .setDescription(
          `Rank proof for **<@${user.id}>** in **Season ${seasonNumber}** has been updated successfully.\n` +
          `Screenshot and OCR data are archived permanently.`
        )
        .addFields(
          { name: '👤 Player', value: `**${curr.player_name}** (${curr.player_id})\nLv. ${curr.player_level || '-'}`, inline: true },
          { name: '🎖️ Current Rank', value: `**${curr.current_rank}**\n*(Previous: ${prev?.current_rank || '-'})*`, inline: true },
          { name: '⭐ Best Rank', value: `**${curr.best_rank}**`, inline: true },
          { name: '📊 Rank / Clan Points', value: `**${curr.rank_points}** pts\n*(Previous: ${prev?.rank_points || 0} pts • Diff: \`${diffStr}\`)*`, inline: true },
          { name: '📸 Screenshot Proof', value: `[Open Original Image ↗](${permanentImageUrl})`, inline: true }
        )
        .setThumbnail(permanentImageUrl)
        .setFooter({ text: 'ARIES Clan Rank History System' })
        .setTimestamp();

      await interaction.editReply({ embeds: [updateEmbed] });
    } else {
      const successEmbed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle(`🏆 Season ${seasonNumber} Rank Recorded!`)
        .setDescription(
          `Rank proof for **<@${user.id}>** in **Season ${seasonNumber}** has been recorded successfully!\n` +
          `Game profile screenshot is archived permanently.`
        )
        .addFields(
          { name: '👤 Player', value: `**${curr.player_name}** (${curr.player_id})\nLv. ${curr.player_level || '-'}`, inline: true },
          { name: '🎖️ Current Rank', value: `**${curr.current_rank}**`, inline: true },
          { name: '⭐ Best Rank', value: `**${curr.best_rank}**`, inline: true },
          { name: '📊 Rank / Clan Points', value: `**${curr.rank_points}** pts`, inline: true },
          { name: '📸 Screenshot Proof', value: `[Open Original Image ↗](${permanentImageUrl})`, inline: true }
        )
        .setThumbnail(permanentImageUrl)
        .setFooter({ text: 'ARIES Clan Rank History System' })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });
    }

    logger.info('Commands', 'Rank check completed', { userId: user.id, seasonNumber, isUpdate: result.isUpdate });
  } catch (error) {
    logger.error('Commands', 'Rank check error', { error: error.message });
    await interaction.editReply({
      content: `❌ Failed to process rank check: ${error.message}`
    });
  }
}

// ─── Rank History Handler ─────────────────────────────────────────────────
async function handleRankHistory(interaction) {
  await interaction.deferReply();

  try {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const rankHistory = require('../services/rankHistory');
    const records = await rankHistory.getUserRankHistory(targetUser.id);

    if (records.length === 0) {
      return interaction.editReply({
        content: `ℹ️ No rank records found for <@${targetUser.id}>.\nUse \`/rank-check\` to submit your seasonal rank proof.`
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`📜 Rank History — ${targetUser.username}`)
      .setDescription(`Seasonal rank & points progression for **<@${targetUser.id}>**:`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
      .setFooter({ text: `Total Recorded Seasons: ${records.length}` })
      .setTimestamp();

    for (const rec of records) {
      embed.addFields({
        name: `🏆 Season ${rec.season_number} (${rec.season_name || 'Season ' + rec.season_number})`,
        value: `🎖️ **Current:** ${rec.current_rank} • ⭐ **Best:** ${rec.best_rank}\n📊 **Points:** ${rec.rank_points} pts • [📸 Proof](${rec.permanent_image_url})\n*Recorded: ${new Date(rec.submitted_at).toLocaleDateString()}*`
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error('Commands', 'Rank history error', { error: error.message });
    await interaction.editReply({ content: `❌ Failed to retrieve rank history: ${error.message}` });
  }
}

// ─── Battle Record Submission Handler ──────────────────────────────────────
async function handleRecordSubmit(interaction) {
  await interaction.deferReply();

  try {
    const screenshot = interaction.options.getAttachment('screenshot');
    const rewardsScreenshot = interaction.options.getAttachment('rewards_screenshot');
    const inputShip = interaction.options.getString('ship');
    const inputDamage = interaction.options.getInteger('damage');
    const user = interaction.user;

    // 1. Validate file
    if (!screenshot.contentType?.startsWith('image/')) {
      return interaction.editReply({
        content: '❌ Screenshot must be an image file (PNG, JPG, JPEG, WEBP).'
      });
    }

    // 2. Download scoreboard image buffer
    const axios = require('axios');
    const imageRes = await axios.get(screenshot.url, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageRes.data);

    // 3. Process OCR
    const ocrGemini = require('../services/ocr-gemini');
    const ocrSpace = require('../services/ocr');
    const useGemini = !!process.env.GEMINI_API_KEY;
    const ocrService = useGemini ? ocrGemini : ocrSpace;

    logger.info('Commands', 'Processing scoreboard OCR for record submission...');
    const ocrResult = await ocrService.processImage(imageBuffer);

    // 4. Parse Scoreboard Data
    const scoreboardOcr = require('../services/scoreboardOcr');
    const parsed = scoreboardOcr.parseScoreboardText(ocrResult.rawText, {
      discordUsername: user.username,
      inputShip,
      inputDamage
    });

    if (!parsed.damage || parsed.damage <= 0) {
      return interaction.editReply({
        content: '⚠️ Could not detect damage from the scoreboard screenshot. Please try running `/record-submit` with the `damage:` and `ship:` options provided.'
      });
    }

    // 5. Upload screenshots to Supabase storage
    const storage = require('../services/storage');
    const ext = screenshot.name?.split('.').pop() || 'png';
    const targetPath = `records/${user.id}-${Date.now()}.${ext}`;
    await storage.uploadFile(imageBuffer, targetPath, screenshot.contentType);
    const permanentScreenshotUrl = storage.getPublicUrl(targetPath);

    let permanentRewardsUrl = null;
    if (rewardsScreenshot && rewardsScreenshot.contentType?.startsWith('image/')) {
      const rewRes = await axios.get(rewardsScreenshot.url, { responseType: 'arraybuffer' });
      const rewExt = rewardsScreenshot.name?.split('.').pop() || 'png';
      const rewPath = `records/rewards-${user.id}-${Date.now()}.${rewExt}`;
      await storage.uploadFile(Buffer.from(rewRes.data), rewPath, rewardsScreenshot.contentType);
      permanentRewardsUrl = storage.getPublicUrl(rewPath);
    }

    // 6. Save battle record
    const battleRecords = require('../services/battleRecords');
    const saveResult = await battleRecords.saveBattleRecord({
      discordUserId: user.id,
      discordUsername: user.username,
      playerId: parsed.playerId,
      playerName: parsed.playerName,
      shipName: parsed.shipName,
      shipClass: parsed.shipClass,
      damage: parsed.damage,
      kills: parsed.kills,
      assists: parsed.assists,
      mapName: parsed.mapName,
      screenshotUrl: permanentScreenshotUrl,
      rewardsScreenshotUrl: permanentRewardsUrl,
      extractedOcrText: ocrResult.rawText,
      rawOcrData: parsed
    });

    const { SHIP_CLASSES } = require('../config/ships');
    const classInfo = SHIP_CLASSES[parsed.shipClass] || { name: parsed.shipClass, icon: '🚢' };

    // Broadcast Real-time Notification
    const { sendNotification } = require('../services/apiClient');
    sendNotification({
      type: 'record_new',
      title: saveResult.isNewClanRecord ? '🏆 NEW CLAN RECORD BROKEN!' : 'New Battle Record Submitted',
      message: `${user.username} submitted ${parsed.damage?.toLocaleString('en-US') || 0} DMG with ${parsed.shipName || 'Ship'} (${classInfo.name})`,
      link: '/records',
      icon: saveResult.isNewClanRecord ? '🏆' : '⚔️',
      meta: {
        user_id: user.id,
        username: user.username,
        ship_name: parsed.shipName,
        ship_class: parsed.shipClass,
        damage: parsed.damage,
        kills: parsed.kills,
        is_new_clan_record: saveResult.isNewClanRecord
      }
    }).catch(() => {});

    // 7. Build Response Embed
    if (saveResult.isNewClanRecord) {
      const prevDamg = saveResult.previousRecord ? saveResult.previousRecord.damage.toLocaleString('en-US') : '0';
      const recordEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`🏆 NEW CLAN RECORD BROKEN! 🏆`)
        .setDescription(
          `Congratulations <@${user.id}>! You have set the **#1 Highest Clan Damage** for **${parsed.shipName}**!\n` +
          `The record board in <#${parsed.shipClass}> has been updated.`
        )
        .addFields(
          { name: '👑 Record Holder', value: `<@${user.id}> (${parsed.playerName})`, inline: true },
          { name: `${classInfo.icon} Ship`, value: `**${parsed.shipName}** (${classInfo.name})`, inline: true },
          { name: '💥 Damage Dealt', value: `\`${parsed.damage.toLocaleString('en-US')}\` pts\n*(Previous Record: ${prevDamg})*`, inline: true },
          { name: '⚔️ Combat Stats', value: `${parsed.kills} Kills • ${parsed.assists} Assists`, inline: true },
          { name: '🗺️ Map', value: `${parsed.mapName}`, inline: true },
          { name: '📸 Scoreboard Proof', value: `[Open Image ↗](${permanentScreenshotUrl})`, inline: true }
        )
        .setThumbnail(permanentScreenshotUrl)
        .setFooter({ text: `ARIES Clan Records • ${classInfo.name}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [recordEmbed] });

      // Auto-update class channel leaderboard if it exists in guild
      try {
        const guild = interaction.guild;
        const targetChannel = guild.channels.cache.find(c => c.name.toLowerCase() === parsed.shipClass.toLowerCase());
        if (targetChannel && targetChannel.isTextBased()) {
          const boardEmbed = await battleRecords.generateClassLeaderboardEmbed(parsed.shipClass);
          await targetChannel.send({ embeds: [boardEmbed] });
        }
      } catch (postErr) {
        logger.warn('Commands', 'Could not auto-post to class channel', { error: postErr.message });
      }
    } else {
      const normalEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`⚔️ Battle Record Recorded!`)
        .setDescription(
          `Battle scoreboard for **<@${user.id}>** recorded successfully!\n` +
          `Screenshot archived for clan statistics and verification.`
        )
        .addFields(
          { name: '👤 Sailor', value: `<@${user.id}> (${parsed.playerName})`, inline: true },
          { name: `${classInfo.icon} Ship`, value: `**${parsed.shipName}** (${classInfo.name})`, inline: true },
          { name: '💥 Damage', value: `\`${parsed.damage.toLocaleString('en-US')}\` pts`, inline: true },
          { name: '⚔️ Combat Stats', value: `${parsed.kills} Kills • ${parsed.assists} Assists`, inline: true },
          { name: '🏆 Clan Record', value: saveResult.previousRecord ? `\`${saveResult.previousRecord.damage.toLocaleString('en-US')}\` by <@${saveResult.previousRecord.discord_user_id}>` : 'Unclaimed', inline: true },
          { name: '📸 Proof', value: `[Open Image ↗](${permanentScreenshotUrl})`, inline: true }
        )
        .setThumbnail(permanentScreenshotUrl)
        .setFooter({ text: `ARIES Clan Records • ${classInfo.name}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [normalEmbed] });
    }
  } catch (error) {
    logger.error('Commands', 'Record submit error', { error: error.message });
    await interaction.editReply({ content: `❌ Failed to submit battle record: ${error.message}` });
  }
}

// ─── Record Board Handler ─────────────────────────────────────────────────
async function handleRecordBoard(interaction) {
  await interaction.deferReply();

  try {
    let shipClass = interaction.options.getString('class');

    // Auto-detect class from current channel name if not provided
    if (!shipClass) {
      const chName = interaction.channel.name.toLowerCase();
      const { SHIP_CLASSES } = require('../config/ships');
      for (const key of Object.keys(SHIP_CLASSES)) {
        if (chName.includes(key)) {
          shipClass = key;
          break;
        }
      }
    }

    if (!shipClass) shipClass = 'frigates';

    const battleRecords = require('../services/battleRecords');
    const embed = await battleRecords.generateClassLeaderboardEmbed(shipClass);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error('Commands', 'Record board error', { error: error.message });
    await interaction.editReply({ content: `❌ Failed to generate leaderboard: ${error.message}` });
  }
}

// ─── RBAC Handler ─────────────────────────────────────────────────────────
async function handleRbac(interaction) {
  await interaction.deferReply();
  const sub = interaction.options.getSubcommand();
  const rbac = require('../services/rbac');

  try {
    if (sub === 'list') {
      const { data: roles } = await rbac.getRoles();
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🛡️ Clan & Server RBAC Roles')
        .setDescription(
          'List of all active RBAC roles, permission sets, and Discord guild mappings:\n' +
          'Manage full permissions and matrix anytime via the [Web Admin Panel](http://localhost:8000/roles).'
        )
        .setFooter({ text: `Total Roles: ${roles.length}` })
        .setTimestamp();

      for (const r of roles) {
        const sysBadge = r.is_system ? '🔒 *System Role*' : '✨ *Custom Role*';
        const discordMap = r.discord_role_id ? ` • Discord: <@&${r.discord_role_id}>` : '';
        embed.addFields({
          name: `${r.icon || '🛡️'} ${r.role_name} (\`${r.role_slug}\`)`,
          value: `${r.description || 'No description'}\n${sysBadge} • **${r.permissions_count || (r.permissions ? r.permissions.length : 0)}** Perms • **${r.members_count || 0}** Members${discordMap}`
        });
      }

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'user') {
      const targetUser = interaction.options.getUser('target') || interaction.user;
      const targetMember = interaction.guild.members.cache.get(targetUser.id) || await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      const { roles, permissions, isSuperAdmin } = await rbac.getUserRolesAndPermissions(targetUser.id, targetMember);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`🛡️ User RBAC Profile — ${targetUser.username}`)
        .setDescription(`Active clan roles and effective permissions for <@${targetUser.id}>:`)
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .addFields(
          {
            name: '👑 Assigned Roles',
            value: roles.length > 0
              ? roles.map(r => `• ${r.icon || '🛡️'} **${r.role_name}** (\`${r.role_slug}\`)`).join('\n')
              : '*No explicit roles assigned (Default Member)*',
            inline: false
          },
          {
            name: `🔑 Effective Permissions (${isSuperAdmin ? 'All 35 Permissions' : permissions.length})`,
            value: isSuperAdmin
              ? '🌟 **Super Admin Override** (Full unrestricted system access)'
              : permissions.length > 0
                ? permissions.slice(0, 15).map(p => `\`${p}\``).join(', ') + (permissions.length > 15 ? ` *+${permissions.length - 15} more*` : '')
                : '*No administrative permissions*',
            inline: false
          }
        )
        .setFooter({ text: 'ARIES Clan RBAC System' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'assign') {
      // Check caller permission
      const hasPerm = await rbac.checkPermission(interaction.user.id, 'roles.manage', interaction.member);
      if (!hasPerm && !interaction.member.permissions.has('Administrator')) {
        return interaction.editReply({
          content: '❌ You do not have permission to assign roles (`roles.manage` required).'
        });
      }

      const targetUser = interaction.options.getUser('target');
      const roleInput = interaction.options.getString('role').trim().toLowerCase();

      const { data: allRoles } = await rbac.getRoles();
      const targetRole = allRoles.find(r =>
        r.role_id === roleInput ||
        r.role_slug.toLowerCase() === roleInput ||
        r.role_name.toLowerCase() === roleInput
      );

      if (!targetRole) {
        return interaction.editReply({
          content: `❌ Role \`${roleInput}\` not found. Use \`/rbac list\` to see available roles.`
        });
      }

      await rbac.assignUserRole(targetUser.id, targetRole.role_id, interaction.user.tag);

      const embed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('✅ Role Assigned Successfully')
        .setDescription(
          `Successfully assigned ${targetRole.icon || '🛡️'} **${targetRole.role_name}** to <@${targetUser.id}>!\n` +
          `Permissions are now active immediately.`
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'revoke') {
      // Check caller permission
      const hasPerm = await rbac.checkPermission(interaction.user.id, 'roles.manage', interaction.member);
      if (!hasPerm && !interaction.member.permissions.has('Administrator')) {
        return interaction.editReply({
          content: '❌ You do not have permission to revoke roles (`roles.manage` required).'
        });
      }

      const targetUser = interaction.options.getUser('target');
      const roleInput = interaction.options.getString('role').trim().toLowerCase();

      const { data: allRoles } = await rbac.getRoles();
      const targetRole = allRoles.find(r =>
        r.role_id === roleInput ||
        r.role_slug.toLowerCase() === roleInput ||
        r.role_name.toLowerCase() === roleInput
      );

      if (!targetRole) {
        return interaction.editReply({
          content: `❌ Role \`${roleInput}\` not found. Use \`/rbac list\` to see available roles.`
        });
      }

      await rbac.removeUserRole(targetUser.id, targetRole.role_id);

      const embed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('🗑️ Role Revoked')
        .setDescription(
          `Successfully revoked ${targetRole.icon || '🛡️'} **${targetRole.role_name}** from <@${targetUser.id}>.`
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'link-discord') {
      // Check caller permission
      const hasPerm = await rbac.checkPermission(interaction.user.id, 'roles.manage', interaction.member);
      if (!hasPerm && !interaction.member.permissions.has('Administrator')) {
        return interaction.editReply({
          content: '❌ You do not have permission to configure Discord role mappings (`roles.manage` required).'
        });
      }

      const roleInput = interaction.options.getString('role').trim().toLowerCase();
      const discordRole = interaction.options.getRole('discord_role');

      const { data: allRoles } = await rbac.getRoles();
      const targetRole = allRoles.find(r =>
        r.role_id === roleInput ||
        r.role_slug.toLowerCase() === roleInput ||
        r.role_name.toLowerCase() === roleInput
      );

      if (!targetRole) {
        return interaction.editReply({
          content: `❌ Role \`${roleInput}\` not found. Use \`/rbac list\` to see available roles.`
        });
      }

      await rbac.updateRole(targetRole.role_id, {
        discord_role_id: discordRole.id,
        discord_role_name: discordRole.name
      });

      const embed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('🔗 Discord Role Linked')
        .setDescription(
          `Successfully linked Discord Server Role **<@&${discordRole.id}>** to RBAC Role ${targetRole.icon || '🛡️'} **${targetRole.role_name}**!\n` +
          `Any server member with this Discord role will automatically inherit these permissions.`
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }
  } catch (err) {
    logger.error('RBAC', 'Command handleRbac error', { error: err.message });
    return interaction.editReply({ content: `❌ RBAC Command failed: ${err.message}` });
  }
}

module.exports = {
  commands,
  handleVerifyPanel,
  handleVerifyClose,
  handleVerifyStats,
  handleRankCheck,
  handleRankHistory,
  handleRecordSubmit,
  handleRecordBoard,
  handleRbac
};

