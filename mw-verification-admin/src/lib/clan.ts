// ─── Clan Management API Client ──────────────────────────────────────────────
const BOT_API_URL = 'https://f31abf2a-3472-4eb6-ada0-131201065074-00-3ese77mjsce3q.sisko.replit.dev';
const API_KEY = 'aries-admin-2024';

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${BOT_API_URL}/api${endpoint}`, {
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

// ─── Players ─────────────────────────────────────────────────────────────────
export async function getPlayers(params?: { limit?: number; offset?: number; status?: string; region?: string }) {
  const query = new URLSearchParams(params as any).toString();
  return apiFetch(`/players${query ? `?${query}` : ''}`);
}

export async function getPlayer(playerId: string) {
  return apiFetch(`/players/${playerId}`);
}

export async function createPlayer(data: any) {
  return apiFetch('/players', { method: 'POST', body: JSON.stringify(data) });
}

export async function updatePlayer(playerId: string, data: any) {
  return apiFetch(`/players/${playerId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deletePlayer(playerId: string) {
  return apiFetch(`/players/${playerId}`, { method: 'DELETE' });
}

export async function getPlayerAvailability(playerId: string) {
  return apiFetch(`/players/${playerId}/availability`);
}

export async function setPlayerAvailability(playerId: string, data: any[]) {
  return apiFetch(`/players/${playerId}/availability`, { method: 'PUT', body: JSON.stringify(data) });
}

// ─── Teams ───────────────────────────────────────────────────────────────────
export async function getTeams(params?: { limit?: number; offset?: number; tier?: string }) {
  const query = new URLSearchParams(params as any).toString();
  return apiFetch(`/teams${query ? `?${query}` : ''}`);
}

export async function getTeam(teamId: string) {
  return apiFetch(`/teams/${teamId}`);
}

export async function createTeam(data: any) {
  return apiFetch('/teams', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTeam(teamId: string, data: any) {
  return apiFetch(`/teams/${teamId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteTeam(teamId: string) {
  return apiFetch(`/teams/${teamId}`, { method: 'DELETE' });
}

export async function addTeamMember(teamId: string, playerId: string, role?: string) {
  return apiFetch(`/teams/${teamId}/members`, { method: 'POST', body: JSON.stringify({ player_id: playerId, role }) });
}

export async function removeTeamMember(teamId: string, playerId: string) {
  return apiFetch(`/teams/${teamId}/members/${playerId}`, { method: 'DELETE' });
}

// ─── Wars ────────────────────────────────────────────────────────────────────
export async function getWars(params?: { limit?: number; offset?: number; status?: string; war_type?: string }) {
  const query = new URLSearchParams(params as any).toString();
  return apiFetch(`/wars${query ? `?${query}` : ''}`);
}

export async function getWar(warId: string) {
  return apiFetch(`/wars/${warId}`);
}

export async function createWar(data: any) {
  return apiFetch('/wars', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateWar(warId: string, data: any) {
  return apiFetch(`/wars/${warId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteWar(warId: string) {
  return apiFetch(`/wars/${warId}`, { method: 'DELETE' });
}

export async function addRosterPlayer(warId: string, playerId: string, teamSide?: string, role?: string) {
  return apiFetch(`/wars/${warId}/roster`, { method: 'POST', body: JSON.stringify({ player_id: playerId, team_side: teamSide, role }) });
}

export async function updateRosterPlayer(warId: string, playerId: string, data: any) {
  return apiFetch(`/wars/${warId}/roster/${playerId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function completeWar(warId: string, data: { our_score: number; their_score: number; war_notes?: string }) {
  return apiFetch(`/wars/${warId}/complete`, { method: 'POST', body: JSON.stringify(data) });
}

// ─── Points ──────────────────────────────────────────────────────────────────
export async function getPoints(params?: { limit?: number; offset?: number; season_id?: string }) {
  const query = new URLSearchParams(params as any).toString();
  return apiFetch(`/points${query ? `?${query}` : ''}`);
}

export async function getPlayerPoints(playerId: string, seasonId?: string) {
  const query = seasonId ? `?season_id=${seasonId}` : '';
  return apiFetch(`/points/${playerId}${query}`);
}

export async function awardPoints(playerId: string, data: { points: number; reason: string; category?: string; season_id?: string }) {
  return apiFetch(`/points/${playerId}/award`, { method: 'POST', body: JSON.stringify(data) });
}

export async function deductPoints(playerId: string, data: { points: number; reason: string; category?: string; season_id?: string }) {
  return apiFetch(`/points/${playerId}/deduct`, { method: 'POST', body: JSON.stringify(data) });
}

export async function getLeaderboard(seasonId?: string, limit?: number) {
  const params = new URLSearchParams();
  if (seasonId) params.set('season_id', seasonId);
  if (limit) params.set('limit', limit.toString());
  const query = params.toString();
  return apiFetch(`/points/leaderboard${query ? `?${query}` : ''}`);
}

export async function getPointsHistory(params?: { limit?: number; offset?: number; player_id?: string; category?: string; season_id?: string }) {
  const query = new URLSearchParams(params as any).toString();
  return apiFetch(`/points/history${query ? `?${query}` : ''}`);
}

// ─── Seasons ─────────────────────────────────────────────────────────────────
export async function getSeasons(params?: { limit?: number; offset?: number; status?: string }) {
  const query = new URLSearchParams(params as any).toString();
  return apiFetch(`/seasons${query ? `?${query}` : ''}`);
}

export async function getSeason(seasonId: string) {
  return apiFetch(`/seasons/${seasonId}`);
}

export async function getActiveSeason() {
  return apiFetch('/seasons/active');
}

export async function createSeason(data: any) {
  return apiFetch('/seasons', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateSeason(seasonId: string, data: any) {
  return apiFetch(`/seasons/${seasonId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function endSeason(seasonId: string) {
  return apiFetch(`/seasons/${seasonId}/end`, { method: 'POST' });
}

export async function getSeasonLeaderboard(seasonId: string, limit?: number) {
  const query = limit ? `?limit=${limit}` : '';
  return apiFetch(`/seasons/${seasonId}/leaderboard${query}`);
}

export async function getSeasonRanks(seasonId: string, limit?: number) {
  const query = limit ? `?limit=${limit}` : '';
  return apiFetch(`/seasons/${seasonId}/ranks${query}`);
}

// ─── RBAC ────────────────────────────────────────────────────────────────────
export async function getRoles(params?: { limit?: number; offset?: number }) {
  const query = new URLSearchParams(params as any).toString();
  return apiFetch(`/rbac/roles${query ? `?${query}` : ''}`);
}

export async function getRole(roleId: string) {
  return apiFetch(`/rbac/roles/${roleId}`);
}

export async function createRole(data: any) {
  return apiFetch('/rbac/roles', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateRole(roleId: string, data: any) {
  return apiFetch(`/rbac/roles/${roleId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteRole(roleId: string) {
  return apiFetch(`/rbac/roles/${roleId}`, { method: 'DELETE' });
}

export async function getPermissions() {
  return apiFetch('/rbac/permissions');
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  return apiFetch(`/rbac/roles/${roleId}/permissions`, { method: 'PUT', body: JSON.stringify({ permission_ids: permissionIds }) });
}

export async function getUserRoles(userId: string) {
  return apiFetch(`/rbac/users/${userId}/roles`);
}

export async function assignUserRole(userId: string, roleId: string, assignedBy?: string) {
  return apiFetch(`/rbac/users/${userId}/roles`, { method: 'POST', body: JSON.stringify({ role_id: roleId, assigned_by: assignedBy }) });
}

export async function removeUserRole(userId: string, roleId: string) {
  return apiFetch(`/rbac/users/${userId}/roles/${roleId}`, { method: 'DELETE' });
}
