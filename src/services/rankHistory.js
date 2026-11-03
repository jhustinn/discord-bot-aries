// ─── Rank History & Season Submissions Service with Local Disk Fallback ────────
const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const LOCAL_RANKS_FILE = path.join(DATA_DIR, 'rank_history.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {}
}

function loadLocalRanks() {
  try {
    if (fs.existsSync(LOCAL_RANKS_FILE)) {
      const raw = fs.readFileSync(LOCAL_RANKS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    logger.warn('RankHistory', 'Failed reading local ranks file', { error: e.message });
  }
  return [];
}

function saveLocalRanks(ranks) {
  try {
    fs.writeFileSync(LOCAL_RANKS_FILE, JSON.stringify(ranks, null, 2), 'utf-8');
  } catch (e) {
    logger.warn('RankHistory', 'Failed writing local ranks file', { error: e.message });
  }
}

let useAuditFallback = false;

function normalizeAuditRecord(log) {
  if (!log) return null;
  const d = log.details || {};
  return {
    id: log.id,
    discord_user_id: log.user_id || d.discord_user_id,
    player_id: log.target_id || d.player_id,
    player_name: d.player_name || log.target_name || log.username || 'Unknown',
    player_level: d.player_level || null,
    season_number: Number(d.season_number) || 0,
    season_name: d.season_name || `Season ${d.season_number}`,
    current_rank: d.current_rank || 'Unranked',
    best_rank: d.best_rank || d.current_rank || 'Unranked',
    rank_points: Number(d.rank_points) || 0,
    clan_points: Number(d.clan_points) || 0,
    permanent_image_url: d.permanent_image_url || '',
    extracted_text: d.extracted_text || '',
    raw_ocr_data: d.raw_ocr_data || {},
    submitted_at: d.submitted_at || log.created_at,
    updated_at: d.updated_at || log.created_at
  };
}

/**
 * Checks if a user has already submitted rank proof for a specific season.
 */
async function getExistingRank(discordUserId, seasonNumber) {
  if (!useAuditFallback) {
    try {
      const { data, error } = await supabase
        .from('rank_history')
        .select('*')
        .eq('discord_user_id', discordUserId)
        .eq('season_number', Number(seasonNumber))
        .single();

      if (!error && data) return data;
      if (error) useAuditFallback = true;
    } catch (e) {
      useAuditFallback = true;
    }
  }

  // Fallback 1: Check in audit_logs
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'RANK_SUBMISSION')
      .eq('user_id', discordUserId);

    if (!error && logs && logs.length > 0) {
      const records = logs
        .map(normalizeAuditRecord)
        .filter(r => r.season_number === Number(seasonNumber));
      if (records.length > 0) return records[0];
    }
  } catch (err) {}

  // Fallback 2: Check local JSON file
  const localList = loadLocalRanks();
  const localFound = localList.find(
    r => r.discord_user_id === discordUserId && r.season_number === Number(seasonNumber)
  );
  return localFound || null;
}

/**
 * Saves or updates a rank submission.
 */
async function saveRankSubmission({
  discordUserId,
  discordUsername,
  seasonNumber,
  seasonName = null,
  permanentImageUrl,
  ocrResult,
  rawText = ''
}) {
  try {
    const existing = await getExistingRank(discordUserId, seasonNumber);
    const ocrData = ocrResult?.data || ocrResult || {};

    const record = {
      id: existing ? existing.id : require('crypto').randomUUID(),
      discord_user_id: discordUserId,
      player_id: ocrData.playerId || (existing ? existing.player_id : null),
      player_name: ocrData.playerName || discordUsername,
      player_level: ocrData.playerLevel || null,
      season_number: Number(seasonNumber),
      season_name: seasonName || `Season ${seasonNumber}`,
      current_rank: ocrData.currentRank || 'Unranked',
      best_rank: ocrData.bestRank || ocrData.currentRank || 'Unranked',
      rank_points: ocrData.rankPoints || 0,
      clan_points: ocrData.clanPoints || 0,
      permanent_image_url: permanentImageUrl,
      extracted_text: rawText || '',
      raw_ocr_data: ocrData,
      submitted_at: existing ? existing.submitted_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let resultData = null;
    let isUpdate = !!existing;

    // 1. Try Supabase rank_history table
    if (!useAuditFallback) {
      try {
        if (existing) {
          const { data, error } = await supabase
            .from('rank_history')
            .update(record)
            .eq('id', existing.id)
            .select()
            .single();

          if (!error && data) resultData = data;
          else useAuditFallback = true;
        } else {
          const { data, error } = await supabase
            .from('rank_history')
            .insert(record)
            .select()
            .single();

          if (!error && data) resultData = data;
          else useAuditFallback = true;
        }
      } catch (tableErr) {
        useAuditFallback = true;
      }
    }

    // 2. Try Supabase audit_logs fallback
    if (useAuditFallback && !resultData) {
      try {
        if (existing) {
          const { data, error } = await supabase
            .from('audit_logs')
            .update({
              details: record,
              target_id: record.player_id,
              target_name: record.player_name,
              username: discordUsername,
              status: 'success'
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (!error && data) resultData = normalizeAuditRecord(data);
        } else {
          const { data, error } = await supabase
            .from('audit_logs')
            .insert({
              action: 'RANK_SUBMISSION',
              action_category: 'SEASONS',
              user_id: discordUserId,
              username: discordUsername,
              target_id: record.player_id,
              target_name: record.player_name,
              target_type: 'player',
              details: record,
              status: 'success'
            })
            .select()
            .single();

          if (!error && data) resultData = normalizeAuditRecord(data);
        }
      } catch (err) {}
    }

    // 3. Always persist to local JSON file
    const localRanks = loadLocalRanks();
    const finalData = resultData || record;
    const existingIndex = localRanks.findIndex(r => r.id === finalData.id);
    if (existingIndex >= 0) {
      localRanks[existingIndex] = finalData;
    } else {
      localRanks.unshift(finalData);
    }
    saveLocalRanks(localRanks);

    logger.info('RankHistory', isUpdate ? 'Rank updated successfully' : 'Rank recorded successfully', {
      discordUserId,
      seasonNumber,
      rank: record.current_rank,
      points: record.rank_points
    });

    return {
      isUpdate,
      previousData: existing,
      currentData: finalData
    };
  } catch (error) {
    logger.error('RankHistory', 'saveRankSubmission error', { error: error.message });
    throw error;
  }
}

/**
 * Gets all rank submissions for a specific user across all seasons.
 */
async function getUserRankHistory(discordUserId) {
  let items = [];

  if (!useAuditFallback) {
    try {
      const { data, error } = await supabase
        .from('rank_history')
        .select('*')
        .eq('discord_user_id', discordUserId)
        .order('season_number', { ascending: false });

      if (!error && data) items = data;
      if (error) useAuditFallback = true;
    } catch (e) {
      useAuditFallback = true;
    }
  }

  if (items.length === 0) {
    try {
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'RANK_SUBMISSION')
        .eq('user_id', discordUserId);

      if (logs && logs.length > 0) {
        items = logs.map(normalizeAuditRecord).sort((a, b) => b.season_number - a.season_number);
      }
    } catch (e) {}
  }

  // Merge with local JSON
  const localList = loadLocalRanks().filter(r => r.discord_user_id === discordUserId);
  for (const loc of localList) {
    if (!items.some(r => r.id === loc.id)) {
      items.push(loc);
    }
  }

  return items.sort((a, b) => b.season_number - a.season_number);
}

/**
 * Gets all rank submissions with optional pagination and filters (for Admin Panel).
 */
async function getAllRankSubmissions({ seasonNumber, userId, limit = 50, offset = 0 } = {}) {
  let items = [];

  if (!useAuditFallback) {
    try {
      let query = supabase
        .from('rank_history')
        .select('*', { count: 'exact' })
        .order('submitted_at', { ascending: false });

      if (seasonNumber) query = query.eq('season_number', Number(seasonNumber));
      if (userId) query = query.eq('discord_user_id', userId);

      const { data, error } = await query;
      if (!error && data) items = data;
      if (error) useAuditFallback = true;
    } catch (e) {
      useAuditFallback = true;
    }
  }

  if (items.length === 0) {
    let local = loadLocalRanks();
    if (seasonNumber) local = local.filter(r => r.season_number === Number(seasonNumber));
    if (userId) local = local.filter(r => r.discord_user_id === userId);
    items = local;
  }

  const paged = items.slice(offset, offset + limit);

  return {
    total: items.length,
    data: paged
  };
}

/**
 * Deletes a rank submission by ID.
 */
async function deleteRankSubmission(id) {
  const local = loadLocalRanks().filter(r => r.id !== id);
  saveLocalRanks(local);

  if (!useAuditFallback) {
    try {
      await supabase.from('rank_history').delete().eq('id', id);
    } catch (e) {}
  }

  try {
    await supabase.from('audit_logs').delete().eq('id', id);
  } catch (e) {}

  return true;
}

module.exports = {
  getExistingRank,
  saveRankSubmission,
  getUserRankHistory,
  getAllRankSubmissions,
  deleteRankSubmission
};
