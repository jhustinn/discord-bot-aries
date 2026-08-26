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
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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

module.exports = {
  commands,
  handleVerifyPanel,
  handleVerifyClose,
  handleVerifyStats
};
