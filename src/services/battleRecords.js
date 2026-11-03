// ─── Clan Battle Records Service with Local Disk Cache Fallback ───────────────
const supabase = require('../config/supabase');
const { SHIP_CLASSES, getShipsByClass, findShip } = require('../config/ships');
const logger = require('../utils/logger');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const LOCAL_RECORDS_FILE = path.join(DATA_DIR, 'battle_records.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {}
}

function loadLocalRecords() {
  try {
    if (fs.existsSync(LOCAL_RECORDS_FILE)) {
      const raw = fs.readFileSync(LOCAL_RECORDS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    logger.warn('BattleRecords', 'Failed reading local records file', { error: e.message });
  }
  return [];
}

function saveLocalRecords(records) {
  try {
    fs.writeFileSync(LOCAL_RECORDS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (e) {
    logger.warn('BattleRecords', 'Failed writing local records file', { error: e.message });
  }
}

let useAuditFallback = false;

function normalizeAuditBattleRecord(log) {
  if (!log) return null;
  const d = log.details || {};
  return {
    id: log.id,
    discord_user_id: log.user_id || d.discord_user_id,
    player_id: log.target_id || d.player_id,
    player_name: d.player_name || log.target_name || log.username || 'Unknown',
    ship_name: d.ship_name || 'Unknown Ship',
    ship_class: d.ship_class || 'frigates',
    damage: Number(d.damage) || 0,
    kills: Number(d.kills) || 0,
    assists: Number(d.assists) || 0,
    map_name: d.map_name || 'Unknown Map',
    game_mode: d.game_mode || 'Random Battle',
    screenshot_url: d.screenshot_url || '',
    rewards_screenshot_url: d.rewards_screenshot_url || null,
    extracted_ocr_text: d.extracted_ocr_text || '',
    raw_ocr_data: d.raw_ocr_data || {},
    status: d.status || 'APPROVED',
    is_ship_record: !!d.is_ship_record,
    submitted_at: d.submitted_at || log.created_at,
    updated_at: d.updated_at || log.created_at
  };
}

/**
 * Gets the current highest approved clan record for a specific ship.
 * @param {string} shipName
 * @returns {Promise<object|null>}
 */
async function getCurrentShipRecord(shipName) {
  if (!useAuditFallback) {
    try {
      const { data, error } = await supabase
        .from('battle_records')
        .select('*')
        .eq('ship_name', shipName)
        .eq('status', 'APPROVED')
        .order('damage', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) return data[0];
      if (error) {
        useAuditFallback = true;
      }
    } catch (e) {
      useAuditFallback = true;
    }
  }

  // Fallback 1: Read from audit_logs
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'BATTLE_RECORD_SUBMITTED')
      .order('created_at', { ascending: false });

    if (!error && logs && logs.length > 0) {
      const matching = logs
        .map(normalizeAuditBattleRecord)
        .filter(r => r.ship_name.toLowerCase() === shipName.toLowerCase() && r.status === 'APPROVED')
        .sort((a, b) => b.damage - a.damage);

      if (matching.length > 0) return matching[0];
    }
  } catch (err) {}

  // Fallback 2: Read from local JSON
  const localList = loadLocalRecords();
  const matched = localList
    .filter(r => r.ship_name.toLowerCase() === shipName.toLowerCase() && r.status === 'APPROVED')
    .sort((a, b) => b.damage - a.damage);

  return matched[0] || null;
}

/**
 * Saves a new battle record submission and calculates if it breaks records.
 */
async function saveBattleRecord({
  discordUserId,
  discordUsername,
  playerId,
  playerName,
  shipName,
  shipClass,
  damage,
  kills = 0,
  assists = 0,
  mapName = 'Unknown Map',
  gameMode = 'Random Battle',
  screenshotUrl,
  rewardsScreenshotUrl = null,
  extractedOcrText = '',
  rawOcrData = {}
}) {
  try {
    const numDamage = Number(damage);
    const resolvedShip = findShip(shipName);
    const canonicalShipName = resolvedShip ? resolvedShip.name : shipName;
    const canonicalClass = resolvedShip ? resolvedShip.class : (shipClass || 'frigates');

    // 1. Check current top clan record for this ship
    const previousRecord = await getCurrentShipRecord(canonicalShipName);
    const isNewClanRecord = !previousRecord || numDamage > previousRecord.damage;

    // 2. Prepare record payload
    const recordPayload = {
      id: require('crypto').randomUUID(),
      discord_user_id: discordUserId,
      player_id: playerId || null,
      player_name: playerName || discordUsername || 'Unknown Sailor',
      ship_name: canonicalShipName,
      ship_class: canonicalClass,
      damage: numDamage,
      kills: Number(kills) || 0,
      assists: Number(assists) || 0,
      map_name: mapName,
      game_mode: gameMode,
      screenshot_url: screenshotUrl,
      rewards_screenshot_url: rewardsScreenshotUrl,
      extracted_ocr_text: extractedOcrText,
      raw_ocr_data: rawOcrData,
      status: 'APPROVED',
      is_ship_record: isNewClanRecord,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let savedRecord = null;

    // 3. Try saving to Supabase table
    if (!useAuditFallback) {
      try {
        const { data, error } = await supabase
          .from('battle_records')
          .insert(recordPayload)
          .select()
          .single();

        if (!error && data) {
          savedRecord = data;
        } else {
          useAuditFallback = true;
        }
      } catch (tableErr) {
        useAuditFallback = true;
      }
    }

    // 4. Try Supabase audit_logs fallback
    if (useAuditFallback && !savedRecord) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .insert({
            action: 'BATTLE_RECORD_SUBMITTED',
            action_category: 'RECORDS',
            user_id: discordUserId,
            username: discordUsername,
            target_id: playerId || canonicalShipName,
            target_name: canonicalShipName,
            target_type: 'ship_record',
            details: recordPayload,
            status: 'success'
          })
          .select()
          .single();

        if (!error && data) {
          savedRecord = normalizeAuditBattleRecord(data);
        }
      } catch (e) {}
    }

    // 5. Always persist to local JSON database for resilience
    const localRecords = loadLocalRecords();
    const finalRecord = savedRecord || recordPayload;
    // Replace if exists, or append
    const existingIndex = localRecords.findIndex(r => r.id === finalRecord.id);
    if (existingIndex >= 0) {
      localRecords[existingIndex] = finalRecord;
    } else {
      localRecords.unshift(finalRecord);
    }
    saveLocalRecords(localRecords);

    logger.info('BattleRecords', 'Battle record saved successfully', {
      discordUserId,
      ship: canonicalShipName,
      damage: numDamage,
      isNewClanRecord
    });

    return {
      success: true,
      record: finalRecord,
      isNewClanRecord,
      previousRecord
    };
  } catch (error) {
    logger.error('BattleRecords', 'saveBattleRecord error', { error: error.message });
    throw error;
  }
}

/**
 * Gets the current #1 record for every ship in a specific ship class.
 * @param {string} shipClass
 * @returns {Promise<Array>}
 */
async function getClassLeaderboard(shipClass) {
  const normClass = (shipClass || 'frigates').toLowerCase().trim();
  const shipsInClass = getShipsByClass(normClass);
  const records = [];

  let allClassRecords = [];
  if (!useAuditFallback) {
    try {
      const { data, error } = await supabase
        .from('battle_records')
        .select('*')
        .eq('ship_class', normClass)
        .eq('status', 'APPROVED')
        .order('damage', { ascending: false });

      if (!error && data) allClassRecords = data;
      if (error) useAuditFallback = true;
    } catch (e) {
      useAuditFallback = true;
    }
  }

  if (useAuditFallback || allClassRecords.length === 0) {
    try {
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'BATTLE_RECORD_SUBMITTED');

      if (logs && logs.length > 0) {
        allClassRecords = logs
          .map(normalizeAuditBattleRecord)
          .filter(r => r.ship_class === normClass && r.status === 'APPROVED')
          .sort((a, b) => b.damage - a.damage);
      }
    } catch (e) {}
  }

  // Merge with local JSON records
  const localList = loadLocalRecords()
    .filter(r => r.ship_class === normClass && r.status === 'APPROVED')
    .sort((a, b) => b.damage - a.damage);

  for (const loc of localList) {
    if (!allClassRecords.some(r => r.id === loc.id)) {
      allClassRecords.push(loc);
    }
  }

  // Map each registered ship to its top record
  for (const ship of shipsInClass) {
    const topRecord = allClassRecords
      .filter(r => r.ship_name.toLowerCase() === ship.name.toLowerCase())
      .sort((a, b) => b.damage - a.damage)[0];

    records.push({
      ship,
      record: topRecord || null
    });
  }

  return records;
}

/**
 * Formats a Discord Embed leaderboard for a specific ship class channel.
 * @param {string} shipClass
 * @returns {EmbedBuilder}
 */
async function generateClassLeaderboardEmbed(shipClass) {
  const normClass = (shipClass || 'frigates').toLowerCase().trim();
  const classMeta = SHIP_CLASSES[normClass] || { name: normClass, icon: '🏆' };
  const entries = await getClassLeaderboard(normClass);

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`${classMeta.icon} --- ${classMeta.name.toUpperCase()} RECORDS --- ${classMeta.icon}`)
    .setDescription(
      `Official Clan Damage Leaderboard for **${classMeta.name}**.\n` +
      `Submit your battle scoreboards in <#submissions> or via \`/record-submit\`!`
    )
    .setFooter({ text: `ARIES Clan Records • Updated ${new Date().toLocaleDateString()}` })
    .setTimestamp();

  // Group by acquisition category (Market, Gacha, Shop, Battle Pass)
  const categories = ['Market', 'Gacha', 'Shop', 'Battle Pass'];
  
  for (const cat of categories) {
    const catEntries = entries.filter(e => e.ship.category === cat);
    if (catEntries.length === 0) continue;

    const lines = [];
    for (const { ship, record } of catEntries) {
      if (record) {
        lines.push(`**${ship.name}**\n👑 **Holder:** <@${record.discord_user_id}> (${record.player_name})\n💥 **Damage:** \`${record.damage.toLocaleString('en-US')}\` • [📸 Proof](${record.screenshot_url})\n`);
      } else {
        lines.push(`**${ship.name}**\n👑 **Holder:** *None*\n💥 **Damage:** *Unclaimed*\n`);
      }
    }

    embed.addFields({
      name: `🏷️ _${cat}_`,
      value: lines.join('\n') || 'No ships listed.',
      inline: false
    });
  }

  return embed;
}

/**
 * Gets all battle records with optional filters (for Admin API & Dashboard).
 */
async function getAllRecords({ shipClass, status, userId, limit = 50, offset = 0 } = {}) {
  let items = [];

  if (!useAuditFallback) {
    try {
      let query = supabase
        .from('battle_records')
        .select('*', { count: 'exact' })
        .order('submitted_at', { ascending: false });

      if (shipClass && shipClass !== 'all') query = query.eq('ship_class', shipClass);
      if (status) query = query.eq('status', status);
      if (userId) query = query.eq('discord_user_id', userId);

      const { data, error } = await query;
      if (!error && data) items = data;
      if (error) useAuditFallback = true;
    } catch (e) {
      useAuditFallback = true;
    }
  }

  // Fallback / Merge with local
  if (items.length === 0) {
    let local = loadLocalRecords();
    if (shipClass && shipClass !== 'all') {
      local = local.filter(r => r.ship_class === shipClass);
    }
    if (status) {
      local = local.filter(r => r.status === status);
    }
    if (userId) {
      local = local.filter(r => r.discord_user_id === userId);
    }
    items = local;
  }

  const paged = items.slice(offset, offset + limit);

  return {
    total: items.length,
    data: paged
  };
}

/**
 * Deletes a battle record.
 */
async function deleteBattleRecord(id) {
  // 1. Delete from local JSON
  const local = loadLocalRecords().filter(r => r.id !== id);
  saveLocalRecords(local);

  // 2. Try Supabase delete
  if (!useAuditFallback) {
    try {
      await supabase.from('battle_records').delete().eq('id', id);
    } catch (e) {}
  }

  try {
    await supabase.from('audit_logs').delete().eq('id', id);
  } catch (e) {}

  return true;
}

module.exports = {
  saveBattleRecord,
  getCurrentShipRecord,
  getClassLeaderboard,
  generateClassLeaderboardEmbed,
  getAllRecords,
  deleteBattleRecord
};
