// ─── Points Service ───────────────────────────────────────────────────────────
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

async function getPoints({ limit = 50, offset = 0, season_id } = {}) {
  try {
    let query = supabase
      .from('clan_points')
      .select('*, player:player_id(player_id, player_name, player_level, clan_tag)', { count: 'exact' })
      .order('total_points', { ascending: false })
      .range(offset, offset + limit - 1);

    if (season_id) query = query.eq('season_id', season_id);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data || [], total: count || 0 };
  } catch (err) {
    logger.error('Points', 'Get points failed', { error: err.message });
    throw err;
  }
}

async function getPlayerPoints(playerId, seasonId = null) {
  try {
    let query = supabase
      .from('clan_points')
      .select('*')
      .eq('player_id', playerId);

    if (seasonId) query = query.eq('season_id', seasonId);
    else query = query.is('season_id', null);

    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw error;

    return data || { player_id: playerId, total_points: 0, lifetime_points: 0 };
  } catch (err) {
    logger.error('Points', 'Get player points failed', { playerId, error: err.message });
    throw err;
  }
}

async function awardPoints(playerId, points, reason, category = 'manual', adminId = null, adminUsername = null, seasonId = null, referenceId = null, referenceType = null) {
  try {
    // Get or create points record
    let pointsRecord = await getPlayerPoints(playerId, seasonId);
    
    if (!pointsRecord.id) {
      // Create new record
      const { data, error } = await supabase
        .from('clan_points')
        .insert({
          player_id: playerId,
          season_id: seasonId,
          total_points: points,
          lifetime_points: points
        })
        .select()
        .single();

      if (error) throw error;
      pointsRecord = data;
    } else {
      // Update existing record
      const { data, error } = await supabase
        .from('clan_points')
        .update({
          total_points: pointsRecord.total_points + points,
          lifetime_points: pointsRecord.lifetime_points + points,
          updated_at: new Date().toISOString()
        })
        .eq('id', pointsRecord.id)
        .select()
        .single();

      if (error) throw error;
      pointsRecord = data;
    }

    // Log history
    await supabase
      .from('clan_points_history')
      .insert({
        player_id: playerId,
        season_id: seasonId,
        points_change: points,
        reason,
        category,
        admin_id: adminId,
        admin_username: adminUsername,
        reference_id: referenceId,
        reference_type: referenceType
      });

    logger.info('Points', 'Points awarded', { playerId, points, reason });
    return pointsRecord;
  } catch (err) {
    logger.error('Points', 'Award points failed', { playerId, error: err.message });
    throw err;
  }
}

async function deductPoints(playerId, points, reason, category = 'manual', adminId = null, adminUsername = null, seasonId = null) {
  try {
    const pointsRecord = await getPlayerPoints(playerId, seasonId);
    
    if (pointsRecord.total_points < points) {
      throw new Error('Insufficient points');
    }

    const { data, error } = await supabase
      .from('clan_points')
      .update({
        total_points: pointsRecord.total_points - points,
        lifetime_spent: (pointsRecord.lifetime_spent || 0) + points,
        updated_at: new Date().toISOString()
      })
      .eq('id', pointsRecord.id)
      .select()
      .single();

    if (error) throw error;

    // Log history
    await supabase
      .from('clan_points_history')
      .insert({
        player_id: playerId,
        season_id: seasonId,
        points_change: -points,
        reason,
        category,
        admin_id: adminId,
        admin_username: adminUsername
      });

    logger.info('Points', 'Points deducted', { playerId, points, reason });
    return data;
  } catch (err) {
    logger.error('Points', 'Deduct points failed', { playerId, error: err.message });
    throw err;
  }
}

async function getLeaderboard(seasonId, limit = 10) {
  try {
    let query = supabase
      .from('clan_points')
      .select('*, player:player_id(player_id, player_name, player_level, clan_tag, region)')
      .order('total_points', { ascending: false })
      .limit(limit);

    if (seasonId) query = query.eq('season_id', seasonId);
    else query = query.is('season_id', null);

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (err) {
    logger.error('Points', 'Get leaderboard failed', { error: err.message });
    throw err;
  }
}

async function getPointsHistory({ limit = 50, offset = 0, player_id, category, season_id } = {}) {
  try {
    let query = supabase
      .from('clan_points_history')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (player_id) query = query.eq('player_id', player_id);
    if (category) query = query.eq('category', category);
    if (season_id) query = query.eq('season_id', season_id);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data || [], total: count || 0 };
  } catch (err) {
    logger.error('Points', 'Get history failed', { error: err.message });
    throw err;
  }
}

module.exports = {
  getPoints,
  getPlayerPoints,
  awardPoints,
  deductPoints,
  getLeaderboard,
  getPointsHistory
};
