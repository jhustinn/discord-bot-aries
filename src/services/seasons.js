// ─── Seasons Service ──────────────────────────────────────────────────────────
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

async function getSeasons({ limit = 50, offset = 0, status } = {}) {
  try {
    let query = supabase
      .from('clan_season')
      .select('*', { count: 'exact' })
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data || [], total: count || 0 };
  } catch (err) {
    logger.error('Seasons', 'Get seasons failed', { error: err.message });
    throw err;
  }
}

async function getSeason(seasonId) {
  try {
    const { data, error } = await supabase
      .from('clan_season')
      .select('*')
      .eq('season_id', seasonId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    logger.error('Seasons', 'Get season failed', { seasonId, error: err.message });
    throw err;
  }
}

async function getActiveSeason() {
  try {
    const { data, error } = await supabase
      .from('clan_season')
      .select('*')
      .eq('status', 'ACTIVE')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (err) {
    logger.error('Seasons', 'Get active season failed', { error: err.message });
    throw err;
  }
}

async function createSeason(seasonData) {
  try {
    // Get next season number
    const { count } = await supabase
      .from('clan_season')
      .select('*', { count: 'exact', head: true });

    const seasonNumber = (count || 0) + 1;

    const { data, error } = await supabase
      .from('clan_season')
      .insert({
        ...seasonData,
        season_number: seasonNumber,
        season_name: seasonData.season_name || `Season ${seasonNumber}`
      })
      .select()
      .single();

    if (error) throw error;
    logger.info('Seasons', 'Season created', { seasonId: data.season_id, name: data.season_name });
    return data;
  } catch (err) {
    logger.error('Seasons', 'Create season failed', { error: err.message });
    throw err;
  }
}

async function updateSeason(seasonId, updates) {
  try {
    const { data, error } = await supabase
      .from('clan_season')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('season_id', seasonId)
      .select()
      .single();

    if (error) throw error;
    logger.info('Seasons', 'Season updated', { seasonId });
    return data;
  } catch (err) {
    logger.error('Seasons', 'Update season failed', { seasonId, error: err.message });
    throw err;
  }
}

async function endSeason(seasonId) {
  try {
    // Get all players with points this season
    const { data: players } = await supabase
      .from('clan_points')
      .select('*, player:player_id(player_id, player_name)')
      .eq('season_id', seasonId);

    if (players && players.length > 0) {
      // Snapshot each player's rank
      const rankEntries = players.map(p => ({
        season_id: seasonId,
        player_id: p.player_id,
        rank_name: p.rank || 'Member',
        rank_points: p.total_points,
        total_points_earned: p.lifetime_points || 0,
        total_points_spent: p.lifetime_spent || 0
      }));

      await supabase.from('rank_season').insert(rankEntries);
    }

    // Mark season as completed
    const { data, error } = await supabase
      .from('clan_season')
      .update({
        status: 'COMPLETED',
        end_date: new Date().toISOString(),
        total_participants: players?.length || 0,
        updated_at: new Date().toISOString()
      })
      .eq('season_id', seasonId)
      .select()
      .single();

    if (error) throw error;
    logger.info('Seasons', 'Season ended', { seasonId, participants: players?.length });
    return data;
  } catch (err) {
    logger.error('Seasons', 'End season failed', { seasonId, error: err.message });
    throw err;
  }
}

async function getSeasonLeaderboard(seasonId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('clan_points')
      .select('*, player:player_id(player_id, player_name, player_level, clan_tag, region)')
      .eq('season_id', seasonId)
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    logger.error('Seasons', 'Get leaderboard failed', { seasonId, error: err.message });
    throw err;
  }
}

async function getSeasonRanks(seasonId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('rank_season')
      .select('*, player:player_id(player_id, player_name, player_level, clan_tag)')
      .eq('season_id', seasonId)
      .order('rank_points', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    logger.error('Seasons', 'Get ranks failed', { seasonId, error: err.message });
    throw err;
  }
}

module.exports = {
  getSeasons,
  getSeason,
  getActiveSeason,
  createSeason,
  updateSeason,
  endSeason,
  getSeasonLeaderboard,
  getSeasonRanks
};
