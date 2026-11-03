import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kqpipzaqpcktuwuxfgno.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxcGlwemFxcGNrdHV3dXhmZ25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDU3NzMwNiwiZXhwIjoyMTAwMTUzMzA2fQ.qmp3wcEsFxx_JgqeObiZ9Q-qb4G79bgE_EIMpNZP_Ps';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Discord Bot API (hanya untuk Discord operations) ─────────────────────────
const BOT_API_URL = 'https://f31abf2a-3472-4eb6-ada0-131201065074-00-3ese77mjsce3q.sisko.replit.dev';
const API_KEY = 'aries-admin-2024';

export async function botApiFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${BOT_API_URL}/api/discord${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

const LARAVEL_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function laravelFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${LARAVEL_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'API request failed' }));
    throw new Error(err.error || err.message || 'API request failed');
  }
  return res.json();
}

// ─── Master Ships ───────────────────────────────────────────────────────────
export interface MasterShip {
  id: string;
  name: string;
  class: string;
  tier: number;
  category: string;
  country?: string | null;
  aliases: string[];
  image_url?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ShipClassMeta {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export async function getMasterShips(params: {
  class?: string;
  tier?: string | number;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ success: boolean; total: number; data: MasterShip[] }> {
  const searchParams = new URLSearchParams();
  if (params.class && params.class !== 'all') searchParams.append('class', params.class);
  if (params.tier && params.tier !== 'all') searchParams.append('tier', String(params.tier));
  if (params.category && params.category !== 'all') searchParams.append('category', params.category);
  if (params.search) searchParams.append('search', params.search);
  if (params.limit) searchParams.append('limit', String(params.limit));
  if (params.offset) searchParams.append('offset', String(params.offset));

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return laravelFetch(`/ships${query}`);
}

export async function getShipClasses(): Promise<{ success: boolean; data: ShipClassMeta[] }> {
  return laravelFetch('/ships/classes');
}

export async function getMasterShip(id: string): Promise<{ success: boolean; data: MasterShip }> {
  return laravelFetch(`/ships/${id}`);
}

export async function createMasterShip(shipData: Partial<MasterShip>): Promise<{ success: boolean; data: MasterShip }> {
  return laravelFetch('/ships', {
    method: 'POST',
    body: JSON.stringify(shipData),
  });
}

export async function updateMasterShip(id: string, shipData: Partial<MasterShip>): Promise<{ success: boolean; data: MasterShip }> {
  return laravelFetch(`/ships/${id}`, {
    method: 'PUT',
    body: JSON.stringify(shipData),
  });
}

export async function deleteMasterShip(id: string): Promise<{ success: boolean; message: string }> {
  return laravelFetch(`/ships/${id}`, {
    method: 'DELETE',
  });
}

// ─── Players ────────────────────────────────────────────────────────────────
export interface VerifiedPlayer {
  player_id: string;
  discord_user_id: string | null;
  player_name: string;
  player_level: number;
  clan_tag: string;
  timezone: string;
  timezone_offset: string;
  region: string;
  status: string;
  notes: string | null;
  verified_at: string;
  verified_by: string | null;
  ticket_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function getPlayers(limit = 100, offset = 0) {
  try {
    const res = await laravelFetch(`/players?limit=${limit}&offset=${offset}`);
    return { data: res.data || [], total: res.total || 0 };
  } catch (e) {
    const { data, error, count } = await supabase
      .from('verified_players')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return { data: data || [], total: count || 0 };
  }
}

export async function getPlayer(playerId: string) {
  try {
    const res = await laravelFetch(`/players/${playerId}`);
    return res.data;
  } catch (e) {
    const { data, error } = await supabase
      .from('verified_players')
      .select('*')
      .eq('player_id', playerId)
      .single();
    if (error) throw error;
    return data;
  }
}

export async function createPlayer(playerData: Partial<VerifiedPlayer>) {
  try {
    const res = await laravelFetch('/players', {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
    return res.data;
  } catch (e) {
    const { data, error } = await supabase
      .from('verified_players')
      .insert(playerData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function updatePlayer(playerId: string, updates: Partial<VerifiedPlayer>) {
  try {
    const res = await laravelFetch(`/players/${playerId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.data;
  } catch (e) {
    const { data, error } = await supabase
      .from('verified_players')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('player_id', playerId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deletePlayer(playerId: string) {
  try {
    await laravelFetch(`/players/${playerId}`, { method: 'DELETE' });
  } catch (e) {
    const { error } = await supabase
      .from('verified_players')
      .delete()
      .eq('player_id', playerId);
    if (error) throw error;
  }
}

// ─── Teams (Direct Supabase) ─────────────────────────────────────────────────
export interface ClanTeam {
  team_id: string;
  team_name: string;
  team_tier: string;
  description: string | null;
  max_members: number;
  captain_player_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  player_id: string;
  role: string;
  joined_at: string;
}

export async function getTeams(limit = 50) {
  const { data, error } = await supabase
    .from('clan_teams')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getTeam(teamId: string) {
  const { data: team, error } = await supabase
    .from('clan_teams')
    .select('*')
    .eq('team_id', teamId)
    .single();
  if (error) throw error;

  // Get team members with player details
  const { data: members } = await supabase
    .from('team_members')
    .select('*, player:player_id(player_id, player_name, player_level, timezone, region)')
    .eq('team_id', teamId);

  return { ...team, members: members || [] };
}

export async function createTeam(teamData: Partial<ClanTeam>) {
  const { data, error } = await supabase
    .from('clan_teams')
    .insert(teamData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTeam(teamId: string, updates: Partial<ClanTeam>) {
  const { data, error } = await supabase
    .from('clan_teams')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('team_id', teamId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTeam(teamId: string) {
  const { error } = await supabase
    .from('clan_teams')
    .delete()
    .eq('team_id', teamId);
  if (error) throw error;
}

export async function addTeamMember(teamId: string, playerId: string, role = 'MEMBER') {
  const { data, error } = await supabase
    .from('team_members')
    .insert({ team_id: teamId, player_id: playerId, role })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeTeamMember(teamId: string, playerId: string) {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('player_id', playerId);
  if (error) throw error;
}

// ─── Wars (Direct Supabase) ──────────────────────────────────────────────────
export interface ClanWar {
  war_id: string;
  our_team_id: string | null;
  opponent_name: string;
  opponent_team: string | null;
  war_type: string;
  team_size: number;
  scheduled_at: string | null;
  duration_minutes: number;
  timezone: string;
  status: string;
  our_score: number | null;
  their_score: number | null;
  result: string | null;
  strategy_notes: string | null;
  war_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarRoster {
  id: string;
  war_id: string;
  player_id: string;
  team_side: string;
  role: string;
  availability: string;
  score: number | null;
  kills: number | null;
  deaths: number | null;
}

export async function getWars(limit = 50, status?: string) {
  try {
    const query = status && status !== 'ALL' ? `?status=${status}` : '';
    const res = await laravelFetch(`/wars${query}`);
    return res.data || [];
  } catch (e) {
    let query = supabase
      .from('clan_wars')
      .select('*, team:our_team_id(team_id, team_name)')
      .order('scheduled_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}

export async function getWar(warId: string) {
  try {
    const res = await laravelFetch(`/wars/${warId}`);
    return { ...res.data, roster: res.roster || [] };
  } catch (e) {
    const { data: war, error } = await supabase
      .from('clan_wars')
      .select('*, team:our_team_id(team_id, team_name)')
      .eq('war_id', warId)
      .single();
    if (error) throw error;

    // Get roster
    const { data: roster } = await supabase
      .from('war_roster')
      .select('*, player:player_id(player_id, player_name, player_level, timezone)')
      .eq('war_id', warId);

    return { ...war, roster: roster || [] };
  }
}

export async function createWar(warData: Partial<ClanWar>) {
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

  return data;
}

export async function updateWar(warId: string, updates: Partial<ClanWar>) {
  const { data, error } = await supabase
    .from('clan_wars')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('war_id', warId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWar(warId: string) {
  const { error } = await supabase
    .from('clan_wars')
    .delete()
    .eq('war_id', warId);
  if (error) throw error;
}

export async function addRosterPlayer(warId: string, playerId: string, teamSide = 'OUR', role = 'MEMBER') {
  const { data, error } = await supabase
    .from('war_roster')
    .insert({ war_id: warId, player_id: playerId, team_side: teamSide, role, availability: 'PENDING' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRosterPlayer(warId: string, playerId: string, updates: Partial<WarRoster>) {
  const { data, error } = await supabase
    .from('war_roster')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('war_id', warId)
    .eq('player_id', playerId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeWar(warId: string, ourScore: number, theirScore: number, warNotes?: string) {
  const result = ourScore > theirScore ? 'WIN' : ourScore < theirScore ? 'LOSS' : 'DRAW';
  const { data, error } = await supabase
    .from('clan_wars')
    .update({
      our_score: ourScore,
      their_score: theirScore,
      result,
      war_notes: warNotes,
      status: 'COMPLETED',
      updated_at: new Date().toISOString()
    })
    .eq('war_id', warId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Points (Direct Supabase) ────────────────────────────────────────────────
export interface ClanPoint {
  id: string;
  player_id: string;
  season_id: string | null;
  total_points: number;
  lifetime_points: number;
  lifetime_spent: number;
  rank: string;
}

export async function getPoints(limit = 50, seasonId?: string) {
  let query = supabase
    .from('clan_points')
    .select('*, player:player_id(player_id, player_name, player_level, clan_tag)')
    .order('total_points', { ascending: false })
    .limit(limit);

  if (seasonId) {
    query = query.eq('season_id', seasonId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getPlayerPoints(playerId: string, seasonId?: string) {
  let query = supabase
    .from('clan_points')
    .select('*')
    .eq('player_id', playerId);

  if (seasonId) {
    query = query.eq('season_id', seasonId);
  } else {
    query = query.is('season_id', null);
  }

  const { data, error } = await query.single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || { player_id: playerId, total_points: 0, lifetime_points: 0 };
}

export async function awardPoints(playerId: string, points: number, reason: string, category = 'manual', seasonId?: string) {
  // Get or create points record
  let pointsRecord = await getPlayerPoints(playerId, seasonId);

  if (!pointsRecord.id) {
    const { data, error } = await supabase
      .from('clan_points')
      .insert({ player_id: playerId, season_id: seasonId, total_points: points, lifetime_points: points })
      .select()
      .single();
    if (error) throw error;
    pointsRecord = data;
  } else {
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
  await supabase.from('clan_points_history').insert({
    player_id: playerId,
    season_id: seasonId,
    points_change: points,
    reason,
    category
  });

  return pointsRecord;
}

export async function deductPoints(playerId: string, points: number, reason: string, category = 'manual', seasonId?: string) {
  const pointsRecord = await getPlayerPoints(playerId, seasonId);
  if (pointsRecord.total_points < points) throw new Error('Insufficient points');

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

  await supabase.from('clan_points_history').insert({
    player_id: playerId,
    season_id: seasonId,
    points_change: -points,
    reason,
    category
  });

  return data;
}

export async function getLeaderboard(seasonId?: string, limit = 10) {
  let query = supabase
    .from('clan_points')
    .select('*, player:player_id(player_id, player_name, player_level, clan_tag, region)')
    .order('total_points', { ascending: false })
    .limit(limit);

  if (seasonId) {
    query = query.eq('season_id', seasonId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getPointsHistory(limit = 50, playerId?: string, seasonId?: string) {
  let query = supabase
    .from('clan_points_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (playerId) query = query.eq('player_id', playerId);
  if (seasonId) query = query.eq('season_id', seasonId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ─── Seasons (Direct Supabase) ───────────────────────────────────────────────
export interface ClanSeason {
  season_id: string;
  season_name: string;
  season_number: number | null;
  description: string | null;
  start_date: string;
  end_date: string | null;
  duration_days: number;
  status: string;
  total_wars: number;
  wins: number;
  losses: number;
  draws: number;
  total_points_earned: number;
  total_points_spent: number;
  total_participants: number;
}

export async function getSeasons(limit = 20) {
  try {
    const res = await laravelFetch('/seasons');
    return res.data || [];
  } catch (e) {
    const { data, error } = await supabase
      .from('clan_season')
      .select('*')
      .order('start_date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }
}

export async function getSeason(seasonId: string) {
  const { data, error } = await supabase
    .from('clan_season')
    .select('*')
    .eq('season_id', seasonId)
    .single();
  if (error) throw error;
  return data;
}

export async function getActiveSeason() {
  const { data, error } = await supabase
    .from('clan_season')
    .select('*')
    .eq('status', 'ACTIVE')
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createSeason(seasonData: Partial<ClanSeason>) {
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
  return data;
}

export async function endSeason(seasonId: string) {
  // Get all players with points this season
  const { data: players } = await supabase
    .from('clan_points')
    .select('*, player:player_id(player_id, player_name)')
    .eq('season_id', seasonId);

  if (players && players.length > 0) {
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
  return data;
}

export async function getSeasonLeaderboard(seasonId: string, limit = 10) {
  const { data, error } = await supabase
    .from('clan_points')
    .select('*, player:player_id(player_id, player_name, player_level, clan_tag, region)')
    .eq('season_id', seasonId)
    .order('total_points', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ─── Audit Logs (Direct Supabase) ────────────────────────────────────────────
export async function getAuditLogs(limit = 50) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ─── Discord API (via Bot) ───────────────────────────────────────────────────
export async function getGuildInfo() { return botApiFetch('/guild'); }
export async function getDiscordMembers() { return botApiFetch('/members'); }
export async function getDiscordRoles() { return botApiFetch('/roles'); }
export async function getDiscordChannels() { return botApiFetch('/channels'); }
export async function getServerStats() { return botApiFetch('/stats'); }
export async function assignRole(userId: string, roleId: string) { return botApiFetch(`/members/${userId}/roles`, { method: 'POST', body: JSON.stringify({ roleId }) }); }
export async function removeRole(userId: string, roleId: string) { return botApiFetch(`/members/${userId}/roles/${roleId}`, { method: 'DELETE' }); }
export async function kickMember(userId: string, reason?: string) { return botApiFetch(`/members/${userId}/kick`, { method: 'POST', body: JSON.stringify({ reason }) }); }
export async function banMember(userId: string, reason?: string) { return botApiFetch(`/members/${userId}/ban`, { method: 'POST', body: JSON.stringify({ reason }) }); }
