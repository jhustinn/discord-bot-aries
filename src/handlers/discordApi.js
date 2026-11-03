// ─── Discord API Routes ───────────────────────────────────────────────────────
const express = require('express');
const logger = require('../utils/logger');

function createDiscordRouter(client, activeTickets) {
  const router = express.Router();

  // Middleware: Simple API key auth
  const API_KEY = process.env.API_SECRET_KEY || 'aries-admin-2024';

  function authenticate(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    if (apiKey !== API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  }

  router.use(authenticate);

  // Helper: resolve guild (fallback to first cached guild if GUILD_ID is not set)
  function getGuild(req) {
    const guildId = req.query.guild_id || process.env.GUILD_ID;
    if (guildId) {
      return client.guilds.cache.get(guildId);
    }
    return client.guilds.cache.first();
  }
  // ─── Guild Info ─────────────────────────────────────────────────────────
  router.get('/guild', async (req, res) => {
    try {
      const guild = getGuild(req);

      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      res.json({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        memberCount: guild.memberCount,
        owner: guild.ownerId,
        createdAt: guild.createdAt
      });
    } catch (error) {
      logger.error('API', 'Get guild failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Members ────────────────────────────────────────────────────────────
  router.get('/members', async (req, res) => {
    try {
      const guild = getGuild(req);

      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      const members = await guild.members.fetch({ limit: 100 });
      const memberList = members.map(member => ({
        id: member.id,
        username: member.user.username,
        displayName: member.displayName,
        avatar: member.user.displayAvatarURL(),
        joinedAt: member.joinedAt,
        roles: member.roles.cache.map(role => ({
          id: role.id,
          name: role.name,
          color: role.hexColor
        })),
        isBot: member.user.bot
      }));

      res.json({
        total: memberList.length,
        members: memberList
      });
    } catch (error) {
      logger.error('API', 'Get members failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Get Single Member ──────────────────────────────────────────────────
  router.get('/members/:userId', async (req, res) => {
    try {
      const guild = getGuild(req);

      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      const member = await guild.members.fetch(req.params.userId);

      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }

      res.json({
        id: member.id,
        username: member.user.username,
        displayName: member.displayName,
        avatar: member.user.displayAvatarURL(),
        joinedAt: member.joinedAt,
        roles: member.roles.cache.map(role => ({
          id: role.id,
          name: role.name,
          color: role.hexColor
        })),
        isBot: member.user.bot,
        permissions: member.permissions.toArray()
      });
    } catch (error) {
      logger.error('API', 'Get member failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Assign Role to Member ──────────────────────────────────────────────
  router.post('/members/:userId/roles', async (req, res) => {
    try {
      const { roleId } = req.body;
      const guild = getGuild(req);

      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      const member = await guild.members.fetch(req.params.userId);
      const role = guild.roles.cache.get(roleId);

      if (!member || !role) {
        return res.status(404).json({ error: 'Member or role not found' });
      }

      await member.roles.add(role);

      logger.info('API', 'Role assigned', { userId: req.params.userId, roleId });
      res.json({ success: true, message: `Role ${role.name} assigned to ${member.displayName}` });
    } catch (error) {
      logger.error('API', 'Assign role failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Remove Role from Member ────────────────────────────────────────────
  router.delete('/members/:userId/roles/:roleId', async (req, res) => {
    try {
      const guild = getGuild(req);

      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      const member = await guild.members.fetch(req.params.userId);
      const role = guild.roles.cache.get(req.params.roleId);

      if (!member || !role) {
        return res.status(404).json({ error: 'Member or role not found' });
      }

      await member.roles.remove(role);

      logger.info('API', 'Role removed', { userId: req.params.userId, roleId: req.params.roleId });
      res.json({ success: true, message: `Role ${role.name} removed from ${member.displayName}` });
    } catch (error) {
      logger.error('API', 'Remove role failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Kick Member ────────────────────────────────────────────────────────
  router.post('/members/:userId/kick', async (req, res) => {
    try {
      const { reason } = req.body;
      const guild = getGuild(req);

      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      const member = await guild.members.fetch(req.params.userId);

      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }

      await member.kick(reason || 'Kicked by admin');

      logger.info('API', 'Member kicked', { userId: req.params.userId, reason });
      res.json({ success: true, message: `${member.displayName} has been kicked` });
    } catch (error) {
      logger.error('API', 'Kick failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Ban Member ─────────────────────────────────────────────────────────
  router.post('/members/:userId/ban', async (req, res) => {
    try {
      const { reason } = req.body;
      const guild = getGuild(req);

      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      await guild.members.ban(req.params.userId, {
        reason: reason || 'Banned by admin'
      });

      logger.info('API', 'Member banned', { userId: req.params.userId, reason });
      res.json({ success: true, message: 'User has been banned' });
    } catch (error) {
      logger.error('API', 'Ban failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Unban Member ───────────────────────────────────────────────────────
  router.post('/members/:userId/unban', async (req, res) => {
    try {
      const guild = getGuild(req);

      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      await guild.members.unban(req.params.userId);

      logger.info('API', 'Member unbanned', { userId: req.params.userId });
      res.json({ success: true, message: 'User has been unbanned' });
    } catch (error) {
      logger.error('API', 'Unban failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Roles ──────────────────────────────────────────────────────────────
  router.get('/roles', async (req, res) => {
    try {
      const guild = getGuild(req);

      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      const roles = guild.roles.cache.map(role => ({
        id: role.id,
        name: role.name,
        color: role.hexColor,
        position: role.position,
        hoist: role.hoist,
        mentionable: role.mentionable,
        memberCount: role.members.size,
        permissions: role.permissions.toArray()
      }));

      res.json({
        total: roles.length,
        roles: roles.sort((a, b) => b.position - a.position)
      });
    } catch (error) {
      logger.error('API', 'Get roles failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Create Role
  router.post('/roles', async (req, res) => {
    try {
      const guild = getGuild(req);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const { name, color, hoist, mentionable, permissions } = req.body;
      if (!name) return res.status(400).json({ error: 'Role name is required' });

      const newRole = await guild.roles.create({
        name,
        color: color || '#99AAB5',
        hoist: !!hoist,
        mentionable: !!mentionable,
        permissions: permissions || [],
        reason: 'Created via ARIES Web Admin'
      });

      logger.info('API', 'Role created', { roleId: newRole.id, name: newRole.name });
      res.json({
        success: true,
        message: `Role "${newRole.name}" created successfully`,
        role: {
          id: newRole.id,
          name: newRole.name,
          color: newRole.hexColor,
          position: newRole.position,
          hoist: newRole.hoist,
          mentionable: newRole.mentionable,
          permissions: newRole.permissions.toArray()
        }
      });
    } catch (error) {
      logger.error('API', 'Create role failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Update Role
  router.put('/roles/:roleId', async (req, res) => {
    try {
      const guild = getGuild(req);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const role = guild.roles.cache.get(req.params.roleId);
      if (!role) return res.status(404).json({ error: 'Role not found' });

      const { name, color, hoist, mentionable, permissions, position } = req.body;
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (color !== undefined) updates.color = color;
      if (hoist !== undefined) updates.hoist = hoist;
      if (mentionable !== undefined) updates.mentionable = mentionable;
      if (permissions !== undefined) updates.permissions = permissions;
      if (position !== undefined) updates.position = position;

      const updatedRole = await role.edit(updates);
      logger.info('API', 'Role updated', { roleId: role.id });
      res.json({
        success: true,
        message: `Role "${updatedRole.name}" updated successfully`,
        role: {
          id: updatedRole.id,
          name: updatedRole.name,
          color: updatedRole.hexColor,
          position: updatedRole.position,
          hoist: updatedRole.hoist,
          mentionable: updatedRole.mentionable,
          permissions: updatedRole.permissions.toArray()
        }
      });
    } catch (error) {
      logger.error('API', 'Update role failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Delete Role
  router.delete('/roles/:roleId', async (req, res) => {
    try {
      const guild = getGuild(req);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const role = guild.roles.cache.get(req.params.roleId);
      if (!role) return res.status(404).json({ error: 'Role not found' });

      const roleName = role.name;
      await role.delete('Deleted via ARIES Web Admin');
      logger.info('API', 'Role deleted', { roleId: req.params.roleId, name: roleName });
      res.json({ success: true, message: `Role "${roleName}" deleted successfully` });
    } catch (error) {
      logger.error('API', 'Delete role failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Channels ───────────────────────────────────────────────────────────
  router.get('/channels', async (req, res) => {
    try {
      const guild = getGuild(req);

      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      const channels = guild.channels.cache.map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        parentId: channel.parentId || null,
        parent: channel.parent?.name || null,
        position: channel.position,
        topic: channel.topic || null,
        rateLimitPerUser: channel.rateLimitPerUser || 0
      }));

      res.json({
        total: channels.length,
        channels: channels.sort((a, b) => a.position - b.position)
      });
    } catch (error) {
      logger.error('API', 'Get channels failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Create Channel
  router.post('/channels', async (req, res) => {
    try {
      const guild = getGuild(req);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const { name, type = 0, parentId, topic } = req.body;
      if (!name) return res.status(400).json({ error: 'Channel name is required' });

      const newChannel = await guild.channels.create({
        name,
        type: Number(type),
        parent: parentId || undefined,
        topic: topic || undefined,
        reason: 'Created via ARIES Web Admin'
      });

      logger.info('API', 'Channel created', { channelId: newChannel.id, name: newChannel.name });
      res.json({
        success: true,
        message: `Channel "${newChannel.name}" created successfully`,
        channel: {
          id: newChannel.id,
          name: newChannel.name,
          type: newChannel.type,
          parentId: newChannel.parentId,
          parent: newChannel.parent?.name || null,
          position: newChannel.position
        }
      });
    } catch (error) {
      logger.error('API', 'Create channel failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Update Channel
  router.put('/channels/:channelId', async (req, res) => {
    try {
      const guild = getGuild(req);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const channel = guild.channels.cache.get(req.params.channelId);
      if (!channel) return res.status(404).json({ error: 'Channel not found' });

      const { name, topic, rateLimitPerUser, parentId, position } = req.body;
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (topic !== undefined) updates.topic = topic;
      if (rateLimitPerUser !== undefined) updates.rateLimitPerUser = Number(rateLimitPerUser);
      if (parentId !== undefined) updates.parent = parentId || null;
      if (position !== undefined) updates.position = position;

      const updated = await channel.edit(updates);
      logger.info('API', 'Channel updated', { channelId: channel.id });
      res.json({
        success: true,
        message: `Channel "${updated.name}" updated successfully`,
        channel: {
          id: updated.id,
          name: updated.name,
          type: updated.type,
          parentId: updated.parentId,
          parent: updated.parent?.name || null,
          position: updated.position,
          topic: updated.topic || null
        }
      });
    } catch (error) {
      logger.error('API', 'Update channel failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Delete Channel
  router.delete('/channels/:channelId', async (req, res) => {
    try {
      const guild = getGuild(req);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const channel = guild.channels.cache.get(req.params.channelId);
      if (!channel) return res.status(404).json({ error: 'Channel not found' });

      const channelName = channel.name;
      await channel.delete('Deleted via ARIES Web Admin');
      logger.info('API', 'Channel deleted', { channelId: req.params.channelId, name: channelName });
      res.json({ success: true, message: `Channel "${channelName}" deleted successfully` });
    } catch (error) {
      logger.error('API', 'Delete channel failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Channel Messages & Live Chat ─────────────────────────────────────────
  // Get recent messages
  router.get('/channels/:channelId/messages', async (req, res) => {
    try {
      const guild = getGuild(req);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const channel = guild.channels.cache.get(req.params.channelId);
      if (!channel || !channel.isTextBased()) {
        return res.status(404).json({ error: 'Text channel not found' });
      }

      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const transcriptService = require('../services/transcript');
      const messages = await transcriptService.fetchChannelMessages(channel, limit);

      res.json({
        total: messages.length,
        messages
      });
    } catch (error) {
      logger.error('API', 'Get messages failed', { channelId: req.params.channelId, error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Send message / Announcement / Embed
  router.post('/channels/:channelId/messages', async (req, res) => {
    try {
      const guild = getGuild(req);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const channel = guild.channels.cache.get(req.params.channelId);
      if (!channel || !channel.isTextBased()) {
        return res.status(404).json({ error: 'Text channel not found' });
      }

      const { content, embed } = req.body;
      if (!content && !embed) {
        return res.status(400).json({ error: 'Either content or embed is required' });
      }

      const payload = {};
      if (content) {
        payload.content = content;
      }

      if (embed) {
        const { EmbedBuilder } = require('discord.js');
        const embedBuilder = new EmbedBuilder();

        if (embed.title) embedBuilder.setTitle(embed.title);
        if (embed.description) embedBuilder.setDescription(embed.description);
        if (embed.color) embedBuilder.setColor(embed.color);
        if (embed.url) embedBuilder.setURL(embed.url);
        if (embed.image) embedBuilder.setImage(embed.image);
        if (embed.thumbnail) embedBuilder.setThumbnail(embed.thumbnail);
        if (embed.footer) embedBuilder.setFooter({ text: embed.footer });
        if (embed.fields && Array.isArray(embed.fields)) {
          embedBuilder.addFields(embed.fields);
        }
        embedBuilder.setTimestamp();
        payload.embeds = [embedBuilder];
      }

      const sent = await channel.send(payload);
      logger.info('API', 'Message sent to channel', { channelId: channel.id, messageId: sent.id });
      res.json({
        success: true,
        message: 'Message sent successfully',
        messageId: sent.id
      });
    } catch (error) {
      logger.error('API', 'Send message failed', { channelId: req.params.channelId, error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Delete message
  router.delete('/channels/:channelId/messages/:messageId', async (req, res) => {
    try {
      const guild = getGuild(req);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const channel = guild.channels.cache.get(req.params.channelId);
      if (!channel || !channel.isTextBased()) {
        return res.status(404).json({ error: 'Text channel not found' });
      }

      const message = await channel.messages.fetch(req.params.messageId);
      if (!message) return res.status(404).json({ error: 'Message not found' });

      await message.delete();
      logger.info('API', 'Message deleted', { channelId: channel.id, messageId: req.params.messageId });
      res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
      logger.error('API', 'Delete message failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk delete / purge
  router.post('/channels/:channelId/purge', async (req, res) => {
    try {
      const guild = getGuild(req);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const channel = guild.channels.cache.get(req.params.channelId);
      if (!channel || !channel.isTextBased()) {
        return res.status(404).json({ error: 'Text channel not found' });
      }

      const count = Math.min(Math.max(Number(req.body.count) || 10, 1), 100);
      const deleted = await channel.bulkDelete(count, true);

      logger.info('API', 'Messages purged', { channelId: channel.id, count: deleted.size });
      res.json({
        success: true,
        message: `Purged ${deleted.size} messages`,
        count: deleted.size
      });
    } catch (error) {
      logger.error('API', 'Purge messages failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Member Moderation Upgrades (Timeout / Nickname) ──────────────────────
  router.post('/members/:userId/timeout', async (req, res) => {
    try {
      const guild = getGuild(req);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const member = await guild.members.fetch(req.params.userId);
      if (!member) return res.status(404).json({ error: 'Member not found' });

      const durationMinutes = Number(req.body.durationMinutes) || 10;
      const durationMs = durationMinutes * 60 * 1000;
      const reason = req.body.reason || 'Timed out via ARIES Web Admin';

      await member.timeout(durationMs, reason);
      logger.info('API', 'Member timed out', { userId: member.id, minutes: durationMinutes });
      res.json({
        success: true,
        message: `${member.displayName} has been timed out for ${durationMinutes} minutes`
      });
    } catch (error) {
      logger.error('API', 'Timeout member failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/members/:userId/untimeout', async (req, res) => {
    try {
      const guild = getGuild(req);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const member = await guild.members.fetch(req.params.userId);
      if (!member) return res.status(404).json({ error: 'Member not found' });

      await member.timeout(null, 'Timeout removed via ARIES Web Admin');
      logger.info('API', 'Member untimed out', { userId: member.id });
      res.json({
        success: true,
        message: `Timeout removed for ${member.displayName}`
      });
    } catch (error) {
      logger.error('API', 'Remove timeout failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/members/:userId/nickname', async (req, res) => {
    try {
      const guild = getGuild(req);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const member = await guild.members.fetch(req.params.userId);
      if (!member) return res.status(404).json({ error: 'Member not found' });

      const { nickname } = req.body;
      await member.setNickname(nickname || null, 'Nickname updated via ARIES Web Admin');
      logger.info('API', 'Member nickname updated', { userId: member.id, nickname });
      res.json({
        success: true,
        message: `Nickname updated for ${member.user.username}`
      });
    } catch (error) {
      logger.error('API', 'Set nickname failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Server Stats ───────────────────────────────────────────────────────
  router.get('/stats', async (req, res) => {
    try {
      const guild = getGuild(req);

      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }

      const members = await guild.members.fetch();
      const onlineMembers = members.filter(m => m.presence?.status !== 'offline');
      const bots = members.filter(m => m.user.bot);
      const humans = members.filter(m => !m.user.bot);

      res.json({
        guild: {
          id: guild.id,
          name: guild.name,
          icon: guild.iconURL(),
          createdAt: guild.createdAt
        },
        members: {
          total: members.size,
          online: onlineMembers.size,
          humans: humans.size,
          bots: bots.size
        },
        channels: {
          total: guild.channels.cache.size,
          text: guild.channels.cache.filter(c => c.type === 0).size,
          voice: guild.channels.cache.filter(c => c.type === 2).size,
          categories: guild.channels.cache.filter(c => c.type === 4).size
        },
        roles: guild.roles.cache.size
      });
    } catch (error) {
      logger.error('API', 'Get stats failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Bot Status (for Bot Monitor Dashboard) ─────────────────────────────────
  router.get('/bot-status', async (req, res) => {
    try {
      const guild = getGuild(req);

      // Bot user info
      const botUser = client.user ? {
        id: client.user.id,
        username: client.user.username,
        discriminator: client.user.discriminator,
        tag: client.user.tag,
        avatar: client.user.displayAvatarURL({ size: 128 }),
        createdAt: client.user.createdAt,
      } : null;

      // Uptime
      const uptimeMs = client.uptime || 0;
      const uptimeSeconds = Math.floor(uptimeMs / 1000);
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;

      // Memory usage
      const memUsage = process.memoryUsage();

      // Guild stats
      let guildInfo = null;
      if (guild) {
        const members = await guild.members.fetch().catch(() => guild.members.cache);
        const onlineMembers = members.filter(m => m.presence?.status && m.presence.status !== 'offline');
        const bots = members.filter(m => m.user.bot);
        const humans = members.filter(m => !m.user.bot);

        guildInfo = {
          id: guild.id,
          name: guild.name,
          icon: guild.iconURL({ size: 128 }),
          memberCount: guild.memberCount,
          onlineCount: onlineMembers.size,
          humanCount: humans.size,
          botCount: bots.size,
          channelCount: guild.channels.cache.size,
          textChannels: guild.channels.cache.filter(c => c.type === 0).size,
          voiceChannels: guild.channels.cache.filter(c => c.type === 2).size,
          categories: guild.channels.cache.filter(c => c.type === 4).size,
          roleCount: guild.roles.cache.size,
          createdAt: guild.createdAt,
          ownerId: guild.ownerId,
        };
      }

      // Registered commands
      const commands = require('./commands');
      const registeredCommands = commands.commands.map(cmd => ({
        name: cmd.name,
        description: cmd.description,
      }));

      // Determine active OCR engine
      let ocrEngine = 'OCR.space';
      if (process.env.GEMINI_API_KEY) {
        ocrEngine = 'Google Gemini AI';
      } else if (process.env.GOOGLE_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        ocrEngine = 'Google Cloud Vision';
      }

      // API endpoints
      const apiEndpoints = [
        { path: '/api/discord', name: 'Discord Management', status: 'active' },
        { path: '/api/players', name: 'Player Management', status: 'active' },
        { path: '/api/teams', name: 'Team Management', status: 'active' },
        { path: '/api/wars', name: 'War Management', status: 'active' },
        { path: '/api/points', name: 'Points Management', status: 'active' },
        { path: '/api/seasons', name: 'Season Management', status: 'active' },
        { path: '/api/rbac', name: 'RBAC Management', status: 'active' },
      ];

      res.json({
        status: client.ws.status === 0 ? 'online' : 'offline',
        bot: botUser,
        uptime: {
          ms: uptimeMs,
          formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
          days, hours, minutes, seconds,
          startedAt: new Date(Date.now() - uptimeMs).toISOString(),
        },
        latency: {
          ws: client.ws.ping,
          api: Math.round(client.ws.ping * 1.2),
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid,
          memory: {
            rss: memUsage.rss,
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            rssMB: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
            heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
            heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
          },
          discordjsVersion: require('discord.js').version,
          botVersion: '2.0.0',
        },
        guild: guildInfo,
        activeTickets: activeTickets ? activeTickets.size : 0,
        commands: registeredCommands,
        ocrEngine,
        apiEndpoints,
        guildsCount: client.guilds.cache.size,
        cachedUsers: client.users.cache.size,
      });
    } catch (error) {
      logger.error('API', 'Get bot status failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Update Ticket Status ───────────────────────────────────────────────
  router.put('/tickets/:ticketId/status', async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { status } = req.body;

      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED' });
      }

      const database = require('../services/database');
      const ticket = await database.updateTicketStatus(ticketId, status);

      logger.info('API', 'Ticket status updated', { ticketId, status });
      res.json({ success: true, ticket });
    } catch (error) {
      logger.error('API', 'Update ticket status failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Ticket Transcripts & Archival ────────────────────────────────────────
  router.get('/tickets/:ticketId/transcript', async (req, res) => {
    try {
      const { ticketId } = req.params;
      const transcriptService = require('../services/transcript');
      const database = require('../services/database');

      // 1. Check existing archived transcript in database
      const archivedData = await transcriptService.getTicketTranscript(ticketId);

      // 2. Fetch ticket info
      const ticket = await database.getTicketById(ticketId).catch(() => null);
      if (!ticket && !archivedData) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      // 3. If no archived messages yet, try to read live channel from Discord
      let liveMessages = [];
      const guild = getGuild(req);
      if (guild && ticket) {
        let channelId = activeTickets ? activeTickets.get(ticket.user_id) : null;
        let channel = channelId ? guild.channels.cache.get(channelId) : null;

        // Fallback search channel by name pattern
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

      const format = req.query.format || 'json';

      if (format === 'raw' || format === 'text') {
        const text = transcriptService.generateTranscriptText(messages, ticket);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(text);
      }

      if (format === 'html') {
        const html = transcriptService.generateTranscriptHtml({ messages, ...archivedData }, ticket);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
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
        isLive: liveMessages.length > 0
      });
    } catch (error) {
      logger.error('API', 'Get ticket transcript failed', { ticketId: req.params.ticketId, error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/tickets/:ticketId/transcript/raw', async (req, res) => {
    req.query.format = 'raw';
    return router.handle(req, res);
  });

  router.get('/tickets/:ticketId/transcript/html', async (req, res) => {
    req.query.format = 'html';
    return router.handle(req, res);
  });

  router.post('/tickets/:ticketId/archive', async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { deleteChannel } = req.body;
      const transcriptService = require('../services/transcript');
      const database = require('../services/database');
      const guild = getGuild(req);

      const ticket = await database.getTicketById(ticketId);
      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

      // Find channel
      let channel = null;
      if (guild) {
        let channelId = activeTickets ? activeTickets.get(ticket.user_id) : null;
        channel = channelId ? guild.channels.cache.get(channelId) : null;

        if (!channel) {
          channel = guild.channels.cache.find(c =>
            (c.name.startsWith('open-ticket-') || c.name.startsWith('closed-ticket-')) &&
            c.permissionOverwrites.cache.has(ticket.user_id)
          );
        }
      }

      let messages = [];
      if (channel && channel.isTextBased()) {
        messages = await transcriptService.fetchChannelMessages(channel, 100);
        const transcriptText = transcriptService.generateTranscriptText(messages, ticket);
        await transcriptService.saveTicketTranscript(ticketId, messages, transcriptText);

        if (activeTickets) {
          activeTickets.delete(ticket.user_id);
        }

        if (deleteChannel) {
          await channel.delete('Ticket archived & deleted via ARIES Web Admin');
          logger.info('API', 'Ticket channel deleted on archive', { channelId: channel.id });
        } else {
          // Rename and lock
          if (!channel.name.startsWith('closed-ticket-')) {
            await channel.setName(channel.name.replace('open-ticket-', 'closed-ticket-'));
          }
        }
      }

      // Update ticket status to CLOSED if still pending
      if (ticket.ticket_status === 'PENDING') {
        await database.updateTicketStatus(ticketId, 'CLOSED');
      }

      logger.info('API', 'Ticket archived successfully', { ticketId, messageCount: messages.length });
      res.json({
        success: true,
        message: 'Ticket archived and transcript preserved successfully',
        messageCount: messages.length,
        channelDeleted: !!(channel && deleteChannel)
      });
    } catch (error) {
      logger.error('API', 'Archive ticket failed', { ticketId: req.params.ticketId, error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Rank History & Season Submissions ────────────────────────────────────
  router.get('/ranks', async (req, res) => {
    try {
      const seasonNumber = req.query.season ? Number(req.query.season) : undefined;
      const userId = req.query.user_id;
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;

      const rankHistory = require('../services/rankHistory');
      const result = await rankHistory.getAllRankSubmissions({ seasonNumber, userId, limit, offset });

      res.json({
        success: true,
        total: result.total,
        data: result.data
      });
    } catch (error) {
      logger.error('API', 'Get rank submissions failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/ranks/:userId', async (req, res) => {
    try {
      const rankHistory = require('../services/rankHistory');
      const history = await rankHistory.getUserRankHistory(req.params.userId);

      res.json({
        success: true,
        userId: req.params.userId,
        total: history.length,
        data: history
      });
    } catch (error) {
      logger.error('API', 'Get user rank history failed', { userId: req.params.userId, error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/ranks/:id', async (req, res) => {
    try {
      const rankHistory = require('../services/rankHistory');
      await rankHistory.deleteRankSubmission(req.params.id);

      res.json({
        success: true,
        message: 'Rank submission deleted successfully'
      });
    } catch (error) {
      logger.error('API', 'Delete rank submission failed', { id: req.params.id, error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Clan Battle Records & Scoreboards ────────────────────────────────────
  router.get('/records', async (req, res) => {
    try {
      const shipClass = req.query.ship_class;
      const status = req.query.status;
      const userId = req.query.user_id;
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;

      const battleRecords = require('../services/battleRecords');
      const result = await battleRecords.getAllRecords({ shipClass, status, userId, limit, offset });

      res.json({
        success: true,
        total: result.total,
        data: result.data
      });
    } catch (error) {
      logger.error('API', 'Get battle records failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/records/leaderboard/:shipClass', async (req, res) => {
    try {
      const { shipClass } = req.params;
      const battleRecords = require('../services/battleRecords');
      const leaderboard = await battleRecords.getClassLeaderboard(shipClass);

      res.json({
        success: true,
        shipClass,
        data: leaderboard
      });
    } catch (error) {
      logger.error('API', 'Get class leaderboard failed', { shipClass: req.params.shipClass, error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/records/sync-leaderboards', async (req, res) => {
    try {
      const guild = getGuild(req);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const battleRecords = require('../services/battleRecords');
      const { SHIP_CLASSES } = require('../config/ships');
      const results = [];

      for (const [classKey, classInfo] of Object.entries(SHIP_CLASSES)) {
        const channel = guild.channels.cache.find(c => c.name.toLowerCase() === classInfo.channelName.toLowerCase());
        if (channel && channel.isTextBased()) {
          const embed = await battleRecords.generateClassLeaderboardEmbed(classKey);
          await channel.send({ embeds: [embed] });
          results.push({ class: classKey, channel: channel.name, synced: true });
        } else {
          results.push({ class: classKey, synced: false, reason: 'Channel not found in guild' });
        }
      }

      res.json({
        success: true,
        message: 'Leaderboards sync completed',
        results
      });
    } catch (error) {
      logger.error('API', 'Sync leaderboards failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/records/:id', async (req, res) => {
    try {
      const battleRecords = require('../services/battleRecords');
      await battleRecords.deleteBattleRecord(req.params.id);

      res.json({
        success: true,
        message: 'Battle record deleted successfully'
      });
    } catch (error) {
      logger.error('API', 'Delete battle record failed', { id: req.params.id, error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createDiscordRouter };
