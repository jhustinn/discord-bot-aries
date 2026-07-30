// ─── Teams Service ────────────────────────────────────────────────────────────
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

async function getTeams({ limit = 50, offset = 0, tier, is_active } = {}) {
  try {
    let query = supabase
      .from('clan_teams')
      .select('*, captain:captain_player_id(player_id, player_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (tier) query = query.eq('team_tier', tier);
    if (is_active !== undefined) query = query.eq('is_active', is_active);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data || [], total: count || 0 };
  } catch (err) {
    logger.error('Teams', 'Get teams failed', { error: err.message });
    throw err;
  }
}

async function getTeam(teamId) {
  try {
    const { data, error } = await supabase
      .from('clan_teams')
      .select('*, captain:captain_player_id(player_id, player_name)')
      .eq('team_id', teamId)
      .single();

    if (error) throw error;

    // Get team members
    const { data: members } = await supabase
      .from('team_members')
      .select('*, player:player_id(player_id, player_name, player_level, timezone, region)')
      .eq('team_id', teamId);

    return { ...data, members: members || [] };
  } catch (err) {
    logger.error('Teams', 'Get team failed', { teamId, error: err.message });
    throw err;
  }
}

async function createTeam(teamData) {
  try {
    const { data, error } = await supabase
      .from('clan_teams')
      .insert(teamData)
      .select()
      .single();

    if (error) throw error;
    logger.info('Teams', 'Team created', { teamId: data.team_id, name: data.team_name });
    return data;
  } catch (err) {
    logger.error('Teams', 'Create team failed', { error: err.message });
    throw err;
  }
}

async function updateTeam(teamId, updates) {
  try {
    const { data, error } = await supabase
      .from('clan_teams')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('team_id', teamId)
      .select()
      .single();

    if (error) throw error;
    logger.info('Teams', 'Team updated', { teamId });
    return data;
  } catch (err) {
    logger.error('Teams', 'Update team failed', { teamId, error: err.message });
    throw err;
  }
}

async function deleteTeam(teamId) {
  try {
    const { error } = await supabase
      .from('clan_teams')
      .delete()
      .eq('team_id', teamId);

    if (error) throw error;
    logger.info('Teams', 'Team deleted', { teamId });
  } catch (err) {
    logger.error('Teams', 'Delete team failed', { teamId, error: err.message });
    throw err;
  }
}

async function addTeamMember(teamId, playerId, role = 'MEMBER') {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .insert({ team_id: teamId, player_id: playerId, role })
      .select()
      .single();

    if (error) throw error;
    logger.info('Teams', 'Member added', { teamId, playerId });
    return data;
  } catch (err) {
    logger.error('Teams', 'Add member failed', { teamId, playerId, error: err.message });
    throw err;
  }
}

async function removeTeamMember(teamId, playerId) {
  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('player_id', playerId);

    if (error) throw error;
    logger.info('Teams', 'Member removed', { teamId, playerId });
  } catch (err) {
    logger.error('Teams', 'Remove member failed', { teamId, playerId, error: err.message });
    throw err;
  }
}

module.exports = {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember
};
