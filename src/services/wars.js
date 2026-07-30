// ─── Wars Service ─────────────────────────────────────────────────────────────
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

async function getWars({ limit = 50, offset = 0, status, war_type, team_id } = {}) {
  try {
    let query = supabase
      .from('clan_wars')
      .select('*, team:our_team_id(team_id, team_name)', { count: 'exact' })
      .order('scheduled_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (war_type) query = query.eq('war_type', war_type);
    if (team_id) query = query.eq('our_team_id', team_id);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data || [], total: count || 0 };
  } catch (err) {
    logger.error('Wars', 'Get wars failed', { error: err.message });
    throw err;
  }
}

async function getWar(warId) {
  try {
    const { data, error } = await supabase
      .from('clan_wars')
      .select('*, team:our_team_id(team_id, team_name)')
      .eq('war_id', warId)
      .single();

    if (error) throw error;

    // Get roster
    const { data: roster } = await supabase
      .from('war_roster')
      .select('*, player:player_id(player_id, player_name, player_level, timezone)')
      .eq('war_id', warId)
      .order('team_side');

    return { ...data, roster: roster || [] };
  } catch (err) {
    logger.error('Wars', 'Get war failed', { warId, error: err.message });
    throw err;
  }
}

async function createWar(warData) {
  try {
    const { data, error } = await supabase
      .from('clan_wars')
      .insert(warData)
      .select()
      .single();

    if (error) throw error;

    // If team specified, auto-add team members to roster
    if (warData.our_team_id) {
      const { data: members } = await supabase
        .from('team_members')
        .select('player_id')
        .eq('team_id', warData.our_team_id);

      if (members && members.length > 0) {
        const rosterEntries = members.map(m => ({
          war_id: data.war_id,
          player_id: m.player_id,
          team_side: 'OUR',
          role: 'MEMBER',
          availability: 'PENDING'
        }));

        await supabase.from('war_roster').insert(rosterEntries);
      }
    }

    logger.info('Wars', 'War created', { warId: data.war_id, opponent: data.opponent_name });
    return data;
  } catch (err) {
    logger.error('Wars', 'Create war failed', { error: err.message });
    throw err;
  }
}

async function updateWar(warId, updates) {
  try {
    const { data, error } = await supabase
      .from('clan_wars')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('war_id', warId)
      .select()
      .single();

    if (error) throw error;
    logger.info('Wars', 'War updated', { warId });
    return data;
  } catch (err) {
    logger.error('Wars', 'Update war failed', { warId, error: err.message });
    throw err;
  }
}

async function deleteWar(warId) {
  try {
    const { error } = await supabase
      .from('clan_wars')
      .delete()
      .eq('war_id', warId);

    if (error) throw error;
    logger.info('Wars', 'War deleted', { warId });
  } catch (err) {
    logger.error('Wars', 'Delete war failed', { warId, error: err.message });
    throw err;
  }
}

async function addRosterPlayer(warId, playerId, teamSide = 'OUR', role = 'MEMBER') {
  try {
    const { data, error } = await supabase
      .from('war_roster')
      .insert({
        war_id: warId,
        player_id: playerId,
        team_side: teamSide,
        role,
        availability: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;
    logger.info('Wars', 'Player added to roster', { warId, playerId });
    return data;
  } catch (err) {
    logger.error('Wars', 'Add roster player failed', { warId, playerId, error: err.message });
    throw err;
  }
}

async function updateRosterPlayer(warId, playerId, updates) {
  try {
    const { data, error } = await supabase
      .from('war_roster')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('war_id', warId)
      .eq('player_id', playerId)
      .select()
      .single();

    if (error) throw error;
    logger.info('Wars', 'Roster player updated', { warId, playerId });
    return data;
  } catch (err) {
    logger.error('Wars', 'Update roster player failed', { warId, playerId, error: err.message });
    throw err;
  }
}

async function completeWar(warId, results) {
  try {
    const { our_score, their_score, war_notes } = results;
    
    let result = 'DRAW';
    if (our_score > their_score) result = 'WIN';
    else if (our_score < their_score) result = 'LOSS';

    const { data, error } = await supabase
      .from('clan_wars')
      .update({
        our_score,
        their_score,
        result,
        war_notes,
        status: 'COMPLETED',
        updated_at: new Date().toISOString()
      })
      .eq('war_id', warId)
      .select()
      .single();

    if (error) throw error;
    logger.info('Wars', 'War completed', { warId, result });
    return data;
  } catch (err) {
    logger.error('Wars', 'Complete war failed', { warId, error: err.message });
    throw err;
  }
}

module.exports = {
  getWars,
  getWar,
  createWar,
  updateWar,
  deleteWar,
  addRosterPlayer,
  updateRosterPlayer,
  completeWar
};
