// ─── Players Service ──────────────────────────────────────────────────────────
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

async function getPlayers({ limit = 50, offset = 0, status, region, timezone } = {}) {
  try {
    let query = supabase
      .from('verified_players')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (region) query = query.eq('region', region);
    if (timezone) query = query.eq('timezone', timezone);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data || [], total: count || 0 };
  } catch (err) {
    logger.error('Players', 'Get players failed', { error: err.message });
    throw err;
  }
}

async function getPlayer(playerId) {
  try {
    const { data, error } = await supabase
      .from('verified_players')
      .select('*')
      .eq('player_id', playerId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    logger.error('Players', 'Get player failed', { playerId, error: err.message });
    throw err;
  }
}

async function createPlayer(playerData) {
  try {
    const { data, error } = await supabase
      .from('verified_players')
      .insert(playerData)
      .select()
      .single();

    if (error) throw error;
    logger.info('Players', 'Player created', { playerId: data.player_id });
    return data;
  } catch (err) {
    logger.error('Players', 'Create player failed', { error: err.message });
    throw err;
  }
}

async function updatePlayer(playerId, updates) {
  try {
    const { data, error } = await supabase
      .from('verified_players')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('player_id', playerId)
      .select()
      .single();

    if (error) throw error;
    logger.info('Players', 'Player updated', { playerId });
    return data;
  } catch (err) {
    logger.error('Players', 'Update player failed', { playerId, error: err.message });
    throw err;
  }
}

async function deletePlayer(playerId) {
  try {
    const { error } = await supabase
      .from('verified_players')
      .delete()
      .eq('player_id', playerId);

    if (error) throw error;
    logger.info('Players', 'Player deleted', { playerId });
  } catch (err) {
    logger.error('Players', 'Delete player failed', { playerId, error: err.message });
    throw err;
  }
}

async function getPlayerAvailability(playerId) {
  try {
    const { data, error } = await supabase
      .from('player_availability')
      .select('*')
      .eq('player_id', playerId)
      .order('day_of_week');

    if (error) throw error;
    return data || [];
  } catch (err) {
    logger.error('Players', 'Get availability failed', { playerId, error: err.message });
    throw err;
  }
}

async function setPlayerAvailability(playerId, availability) {
  try {
    // Delete existing availability
    await supabase
      .from('player_availability')
      .delete()
      .eq('player_id', playerId);

    // Insert new availability
    const records = availability.map(a => ({
      player_id: playerId,
      day_of_week: a.day_of_week,
      start_time: a.start_time,
      end_time: a.end_time,
      is_available: a.is_available !== false,
      notes: a.notes
    }));

    const { data, error } = await supabase
      .from('player_availability')
      .insert(records)
      .select();

    if (error) throw error;
    logger.info('Players', 'Availability set', { playerId });
    return data;
  } catch (err) {
    logger.error('Players', 'Set availability failed', { playerId, error: err.message });
    throw err;
  }
}

module.exports = {
  getPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,
  getPlayerAvailability,
  setPlayerAvailability
};
