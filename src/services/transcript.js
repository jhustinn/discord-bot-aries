// ─── Ticket Transcript Service ───────────────────────────────────────────────
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Fetches all messages from a Discord channel and parses them into structured transcript format.
 * @param {import('discord.js').TextChannel} channel
 * @param {number} limit
 */
async function fetchChannelMessages(channel, limit = 100) {
  try {
    const rawMessages = await channel.messages.fetch({ limit });
    // Sort chronologically (oldest first)
    const sorted = Array.from(rawMessages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    return sorted.map(msg => ({
      id: msg.id,
      content: msg.content || '',
      author: {
        id: msg.author.id,
        username: msg.author.username,
        displayName: msg.member?.displayName || msg.author.username,
        avatar: msg.author.displayAvatarURL({ size: 64 }),
        isBot: msg.author.bot
      },
      timestamp: msg.createdAt.toISOString(),
      attachments: msg.attachments.map(att => ({
        id: att.id,
        name: att.name,
        url: att.url,
        contentType: att.contentType,
        size: att.size
      })),
      embeds: msg.embeds.map(e => ({
        title: e.title,
        description: e.description,
        color: e.hexColor,
        fields: e.fields,
        footer: e.footer?.text,
        image: e.image?.url
      }))
    }));
  } catch (error) {
    logger.error('Transcript', 'Failed to fetch channel messages', { channelId: channel.id, error: error.message });
    throw error;
  }
}

/**
 * Formats structured messages into a clean plain-text / markdown transcript.
 */
function generateTranscriptText(messages, ticketInfo = {}) {
  let text = `====================================================\n`;
  text += `ARIES CLAN VERIFICATION TICKET TRANSCRIPT\n`;
  text += `Ticket ID: ${ticketInfo.ticket_id || 'N/A'}\n`;
  text += `User: ${ticketInfo.in_game_name || 'N/A'} (ID: ${ticketInfo.user_id || 'N/A'})\n`;
  text += `Generated At: ${new Date().toISOString()}\n`;
  text += `Total Messages: ${messages.length}\n`;
  text += `====================================================\n\n`;

  for (const msg of messages) {
    const time = new Date(msg.timestamp).toLocaleString();
    const tag = msg.author.isBot ? '[BOT]' : '[USER]';
    text += `[${time}] ${tag} ${msg.author.displayName} (@${msg.author.username}):\n`;
    if (msg.content) {
      text += `  ${msg.content}\n`;
    }
    if (msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        text += `  [Attachment: ${att.name} -> ${att.url}]\n`;
      }
    }
    if (msg.embeds.length > 0) {
      for (const emb of msg.embeds) {
        text += `  [Embed: ${emb.title || 'Untitled'} - ${emb.description || ''}]\n`;
      }
    }
    text += `\n`;
  }

  return text;
}

/**
 * Saves transcript to Supabase database (in audit_logs and verification_tickets).
 */
async function saveTicketTranscript(ticketId, transcriptMessages, transcriptText) {
  try {
    // 1. Try to update verification_tickets if columns exist
    const { error: updateError } = await supabase
      .from('verification_tickets')
      .update({
        extracted_text: transcriptText
      })
      .eq('ticket_id', ticketId);

    if (updateError) {
      logger.warn('Transcript', 'Could not update verification_tickets extracted_text', { error: updateError.message });
    }

    // 2. Save full JSON record to audit_logs
    const auditService = require('./auditLog');
    await auditService.log({
      action: 'TICKET_ARCHIVED',
      action_category: 'TICKETS',
      targetId: ticketId,
      targetType: 'ticket',
      details: {
        ticketId,
        messageCount: transcriptMessages.length,
        transcript: transcriptMessages
      },
      status: 'success'
    });

    logger.info('Transcript', 'Ticket transcript archived successfully', { ticketId, count: transcriptMessages.length });
    return true;
  } catch (error) {
    logger.error('Transcript', 'Failed to save ticket transcript', { ticketId, error: error.message });
    return false;
  }
}

/**
 * Retrieves ticket transcript from audit_logs or verification_tickets.
 */
async function getTicketTranscript(ticketId) {
  try {
    // Check audit_logs first for complete structured JSON
    const { data: auditRows } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('target_id', ticketId)
      .eq('action', 'TICKET_ARCHIVED')
      .order('created_at', { ascending: false })
      .limit(1);

    if (auditRows && auditRows.length > 0 && auditRows[0].details?.transcript) {
      return {
        messages: auditRows[0].details.transcript,
        archivedAt: auditRows[0].created_at
      };
    }

    // Fallback to verification_tickets
    const { data: ticket } = await supabase
      .from('verification_tickets')
      .select('*')
      .eq('ticket_id', ticketId)
      .single();

    if (ticket) {
      return {
        messages: [],
        ticket,
        text: ticket.extracted_text || null,
        screenshotUrl: ticket.permanent_image_url
      };
    }

    return null;
  } catch (error) {
    logger.error('Transcript', 'Get transcript error', { ticketId, error: error.message });
    return null;
  }
}

/**
 * Generates a standalone, beautiful Discord-styled HTML transcript view page.
 */
function generateTranscriptHtml(transcriptData, ticket) {
  const t = ticket || transcriptData?.ticket || {};
  const messages = transcriptData?.messages || [];
  const statusColor = t.ticket_status === 'APPROVED' ? '#23A55A' : t.ticket_status === 'REJECTED' ? '#F23F43' : '#FEE75C';
  const statusTextColor = t.ticket_status === 'PENDING' ? '#000000' : '#FFFFFF';

  let messagesHtml = '';
  if (messages.length === 0) {
    messagesHtml = `
      <div style="padding: 40px; text-align: center; color: #949BA4; background: #2B2D31; border-radius: 12px;">
        <p style="margin: 0; font-size: 16px;">No live chat messages found in transcript record.</p>
        <p style="margin: 6px 0 0 0; font-size: 12px; color: #80848E;">(Verification screenshot & OCR data are preserved above)</p>
      </div>
    `;
  } else {
    for (const msg of messages) {
      const timeStr = new Date(msg.timestamp).toLocaleString();
      const botBadge = msg.author.isBot ? `<span style="background: #5865F2; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 2px 5px; border-radius: 4px; margin-left: 6px;">BOT</span>` : '';

      let attachmentsHtml = '';
      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          if (att.contentType && att.contentType.startsWith('image/')) {
            attachmentsHtml += `
              <div style="margin-top: 8px;">
                <a href="${att.url}" target="_blank" rel="noopener">
                  <img src="${att.url}" alt="${att.name || 'Attachment'}" style="max-width: 100%; max-height: 320px; border-radius: 8px; border: 1px solid #3F4147;" />
                </a>
              </div>
            `;
          } else {
            attachmentsHtml += `
              <div style="margin-top: 6px;">
                <a href="${att.url}" target="_blank" rel="noopener" style="color: #00A8FC; text-decoration: none; font-size: 13px;">
                  📎 ${att.name || 'Download Attachment'}
                </a>
              </div>
            `;
          }
        }
      }

      let embedsHtml = '';
      if (msg.embeds && msg.embeds.length > 0) {
        for (const emb of msg.embeds) {
          embedsHtml += `
            <div style="margin-top: 8px; background: #2B2D31; border-left: 4px solid ${emb.color || '#5865F2'}; border-radius: 4px; padding: 12px 14px; max-width: 520px;">
              ${emb.title ? `<div style="font-weight: 700; color: #FFFFFF; font-size: 14px; margin-bottom: 4px;">${emb.title}</div>` : ''}
              ${emb.description ? `<div style="color: #DBDEE1; font-size: 13px; white-space: pre-wrap; line-height: 1.4;">${emb.description}</div>` : ''}
              ${emb.image ? `<img src="${emb.image}" alt="Embed Image" style="margin-top: 8px; max-width: 100%; border-radius: 6px;" />` : ''}
              ${emb.footer ? `<div style="color: #949BA4; font-size: 11px; margin-top: 8px;">${emb.footer}</div>` : ''}
            </div>
          `;
        }
      }

      messagesHtml += `
        <div style="display: flex; gap: 14px; padding: 10px 14px; border-radius: 8px; transition: background 0.15s; margin-bottom: 2px;" class="chat-msg">
          <img src="${msg.author.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="${msg.author.username}" style="width: 40px; height: 40px; border-radius: 50%; background: #1E1F22; flex-shrink: 0;" />
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 2px;">
              <span style="font-weight: 600; font-size: 14px; color: ${msg.author.isBot ? '#5865F2' : '#FFFFFF'};">${msg.author.displayName || msg.author.username}</span>
              ${botBadge}
              <span style="font-size: 11px; color: #949BA4; margin-left: 4px;">${timeStr}</span>
            </div>
            ${msg.content ? `<div style="color: #DBDEE1; font-size: 14px; line-height: 1.45; word-break: break-word; white-space: pre-wrap;">${escapeHtml(msg.content)}</div>` : ''}
            ${attachmentsHtml}
            ${embedsHtml}
          </div>
        </div>
      `;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Ticket Transcript - ${t.in_game_name || t.ticket_id}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=gg+sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #313338;
      color: #DBDEE1;
      font-family: 'gg sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      padding: 24px 16px;
    }
    .container { max-width: 900px; margin: 0 auto; }
    .card {
      background-color: #2B2D31;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 18px;
      border: 1px solid #383A40;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-top: 14px; }
    .stat-label { font-size: 11px; color: #949BA4; text-transform: uppercase; font-weight: 600; }
    .stat-value { font-size: 14px; color: #FFFFFF; font-weight: 600; margin-top: 2px; }
    .chat-msg:hover { background-color: #2E3035; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #5865F2;
      color: #FFFFFF;
      text-decoration: none;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn:hover { background: #4752C4; }
    .btn-secondary { background: #383A40; color: #DBDEE1; }
    .btn-secondary:hover { background: #43444B; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header Banner -->
    <div class="card" style="border-top: 4px solid ${statusColor};">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; border-bottom: 1px solid #383A40; padding-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 32px;">🎫</div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h1 style="font-size: 20px; font-weight: 700; color: #FFFFFF;">${t.in_game_name || 'Verification Ticket'}</h1>
              <span class="badge" style="background: ${statusColor}; color: ${statusTextColor};">${t.ticket_status || 'CLOSED'}</span>
            </div>
            <p style="font-size: 12px; color: #949BA4; font-family: monospace; margin-top: 2px;">Ticket ID: ${t.ticket_id || 'N/A'}</p>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="/api/discord/tickets/${t.ticket_id}/transcript?format=raw" class="btn btn-secondary" target="_blank">📥 Raw Text (.txt)</a>
          <a href="/api/discord/tickets/${t.ticket_id}/transcript" class="btn btn-secondary" target="_blank">🔗 JSON API</a>
        </div>
      </div>

      <!-- Ticket Meta Grid -->
      <div class="grid">
        <div>
          <div class="stat-label">Discord User ID</div>
          <div class="stat-value" style="font-family: monospace;">${t.user_id || 'N/A'}</div>
        </div>
        <div>
          <div class="stat-label">In-Game Player ID</div>
          <div class="stat-value" style="font-family: monospace; color: #5865F2;">${t.player_id || 'Not Detected'}</div>
        </div>
        <div>
          <div class="stat-label">Player Level</div>
          <div class="stat-value">Level ${t.player_level || '1'}</div>
        </div>
        <div>
          <div class="stat-label">Submitted At</div>
          <div class="stat-value">${t.created_at ? new Date(t.created_at).toLocaleString() : 'N/A'}</div>
        </div>
      </div>

      ${(t.permanent_image_url || transcriptData?.screenshotUrl) ? `
        <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #383A40;">
          <div class="stat-label" style="margin-bottom: 8px;">📷 Uploaded Verification Screenshot (Permanent Storage):</div>
          <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: center;">
            <a href="${t.permanent_image_url || transcriptData?.screenshotUrl}" target="_blank" rel="noopener">
              <img src="${t.permanent_image_url || transcriptData?.screenshotUrl}" alt="Proof" style="max-height: 180px; max-width: 100%; border-radius: 8px; border: 1px solid #3F4147;" />
            </a>
            <a href="${t.permanent_image_url || transcriptData?.screenshotUrl}" target="_blank" rel="noopener" class="btn btn-secondary" style="font-size: 12px;">
              Open Full Screenshot ↗
            </a>
          </div>
        </div>
      ` : ''}

      ${(t.extracted_text || transcriptData?.ocrText) ? `
        <div style="margin-top: 14px; padding: 12px; background: #1E1F22; border-radius: 8px; border: 1px solid #383A40;">
          <div class="stat-label" style="margin-bottom: 4px;">🔍 Extracted OCR Text:</div>
          <pre style="font-size: 11px; color: #DBDEE1; white-space: pre-wrap; font-family: monospace; max-height: 120px; overflow-y: auto;">${escapeHtml(t.extracted_text || transcriptData?.ocrText)}</pre>
        </div>
      ` : ''}
    </div>

    <!-- Chat Messages Stream -->
    <div class="card" style="padding: 16px 12px;">
      <div style="padding: 4px 12px 14px 12px; border-bottom: 1px solid #383A40; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <h2 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #949BA4;">
          💬 Chat History (${messages.length} messages)
        </h2>
        <span style="font-size: 11px; color: #80848E;">Archived on ARIES Platform</span>
      </div>

      <div>
        ${messagesHtml}
      </div>
    </div>

    <div style="text-align: center; color: #80848E; font-size: 12px; margin-top: 20px;">
      ARIES Verification & Clan Management Platform • Generated ${new Date().toUTCString()}
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  fetchChannelMessages,
  generateTranscriptText,
  generateTranscriptHtml,
  saveTicketTranscript,
  getTicketTranscript
};

