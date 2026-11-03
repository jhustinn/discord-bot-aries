// ─── Discord API Service ──────────────────────────────────────────────────────
const BOT_API_URL = 'http://localhost:3000';
const API_KEY = 'aries-admin-2024';

export interface DiscordMember {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  joinedAt: string;
  roles: { id: string; name: string; color: string }[];
  isBot: boolean;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: string;
  position: number;
  hoist?: boolean;
  mentionable?: boolean;
  memberCount: number;
  permissions: string[];
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  parentId?: string | null;
  parent: string | null;
  position: number;
  topic?: string | null;
  rateLimitPerUser?: number;
}

export interface DiscordAttachment {
  id: string;
  name: string;
  url: string;
  contentType?: string;
  size?: number;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: string;
  url?: string;
  image?: string;
  thumbnail?: string;
  footer?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}

export interface DiscordMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    isBot: boolean;
  };
  timestamp: string;
  attachments: DiscordAttachment[];
  embeds: DiscordEmbed[];
}

export interface DiscordStats {
  guild: {
    id: string;
    name: string;
    icon: string;
    createdAt: string;
  };
  members: {
    total: number;
    online: number;
    humans: number;
    bots: number;
  };
  channels: {
    total: number;
    text: number;
    voice: number;
    categories: number;
  };
  roles: number;
}

export interface BotStatus {
  status: 'online' | 'offline';
  bot: {
    id: string;
    username: string;
    discriminator: string;
    tag: string;
    avatar: string;
    createdAt: string;
  } | null;
  uptime: {
    ms: number;
    formatted: string;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    startedAt: string;
  };
  latency: {
    ws: number;
    api: number;
  };
  system: {
    nodeVersion: string;
    platform: string;
    arch: string;
    pid: number;
    memory: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
      rssMB: number;
      heapUsedMB: number;
      heapTotalMB: number;
    };
    discordjsVersion: string;
    botVersion: string;
  };
  guild: {
    id: string;
    name: string;
    icon: string;
    memberCount: number;
    onlineCount: number;
    humanCount: number;
    botCount: number;
    channelCount: number;
    textChannels: number;
    voiceChannels: number;
    categories: number;
    roleCount: number;
    createdAt: string;
    ownerId: string;
  } | null;
  activeTickets: number;
  commands: { name: string; description: string }[];
  ocrEngine: string;
  apiEndpoints: { path: string; name: string; status: string }[];
  guildsCount: number;
  cachedUsers: number;
}

export interface TicketTranscriptResponse {
  success: boolean;
  ticketId: string;
  ticket?: any;
  messageCount: number;
  messages: DiscordMessage[];
  screenshotUrl?: string | null;
  ocrText?: string | null;
  archivedAt?: string | null;
  isLive?: boolean;
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
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

// ─── Guild & Server ───────────────────────────────────────────────────────────
export async function getGuildInfo() {
  return apiFetch('/guild');
}

export async function getServerStats(): Promise<DiscordStats> {
  return apiFetch('/stats');
}

export async function getBotStatus(): Promise<BotStatus> {
  return apiFetch('/bot-status');
}

// ─── Members & Moderation ─────────────────────────────────────────────────────
export async function getMembers(): Promise<{ total: number; members: DiscordMember[] }> {
  return apiFetch('/members');
}

export async function getMember(userId: string): Promise<DiscordMember> {
  return apiFetch(`/members/${userId}`);
}

export async function assignRole(userId: string, roleId: string) {
  return apiFetch(`/members/${userId}/roles`, {
    method: 'POST',
    body: JSON.stringify({ roleId }),
  });
}

export async function removeRole(userId: string, roleId: string) {
  return apiFetch(`/members/${userId}/roles/${roleId}`, {
    method: 'DELETE',
  });
}

export async function kickMember(userId: string, reason?: string) {
  return apiFetch(`/members/${userId}/kick`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function banMember(userId: string, reason?: string) {
  return apiFetch(`/members/${userId}/ban`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function unbanMember(userId: string) {
  return apiFetch(`/members/${userId}/unban`, {
    method: 'POST',
  });
}

export async function timeoutMember(userId: string, durationMinutes: number, reason?: string) {
  return apiFetch(`/members/${userId}/timeout`, {
    method: 'POST',
    body: JSON.stringify({ durationMinutes, reason }),
  });
}

export async function untimeoutMember(userId: string) {
  return apiFetch(`/members/${userId}/untimeout`, {
    method: 'POST',
  });
}

export async function setMemberNickname(userId: string, nickname: string) {
  return apiFetch(`/members/${userId}/nickname`, {
    method: 'PUT',
    body: JSON.stringify({ nickname }),
  });
}

// ─── Roles ────────────────────────────────────────────────────────────────────
export async function getRoles(): Promise<{ total: number; roles: DiscordRole[] }> {
  return apiFetch('/roles');
}

export async function createRole(data: {
  name: string;
  color?: string;
  hoist?: boolean;
  mentionable?: boolean;
  permissions?: string[];
}): Promise<{ success: boolean; message: string; role: DiscordRole }> {
  return apiFetch('/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRole(
  roleId: string,
  data: {
    name?: string;
    color?: string;
    hoist?: boolean;
    mentionable?: boolean;
    permissions?: string[];
    position?: number;
  }
): Promise<{ success: boolean; message: string; role: DiscordRole }> {
  return apiFetch(`/roles/${roleId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRole(roleId: string): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/roles/${roleId}`, {
    method: 'DELETE',
  });
}

// ─── Channels ─────────────────────────────────────────────────────────────────
export async function getChannels(): Promise<{ total: number; channels: DiscordChannel[] }> {
  return apiFetch('/channels');
}

export async function createChannel(data: {
  name: string;
  type?: number;
  parentId?: string;
  topic?: string;
}): Promise<{ success: boolean; message: string; channel: DiscordChannel }> {
  return apiFetch('/channels', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateChannel(
  channelId: string,
  data: {
    name?: string;
    topic?: string;
    rateLimitPerUser?: number;
    parentId?: string;
    position?: number;
  }
): Promise<{ success: boolean; message: string; channel: DiscordChannel }> {
  return apiFetch(`/channels/${channelId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteChannel(channelId: string): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/channels/${channelId}`, {
    method: 'DELETE',
  });
}

// ─── Live Chat & Messages ─────────────────────────────────────────────────────
export async function getChannelMessages(
  channelId: string,
  limit = 50
): Promise<{ total: number; messages: DiscordMessage[] }> {
  return apiFetch(`/channels/${channelId}/messages?limit=${limit}`);
}

export async function sendChannelMessage(
  channelId: string,
  data: {
    content?: string;
    embed?: DiscordEmbed;
  }
): Promise<{ success: boolean; message: string; messageId: string }> {
  return apiFetch(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteChannelMessage(
  channelId: string,
  messageId: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/channels/${channelId}/messages/${messageId}`, {
    method: 'DELETE',
  });
}

export async function purgeChannelMessages(
  channelId: string,
  count = 10
): Promise<{ success: boolean; message: string; count: number }> {
  return apiFetch(`/channels/${channelId}/purge`, {
    method: 'POST',
    body: JSON.stringify({ count }),
  });
}

// ─── Tickets & Transcripts ────────────────────────────────────────────────────
export async function getTicketTranscript(ticketId: string): Promise<TicketTranscriptResponse> {
  return apiFetch(`/tickets/${ticketId}/transcript`);
}

export async function archiveTicket(
  ticketId: string,
  deleteChannel = false
): Promise<{ success: boolean; message: string; messageCount: number; channelDeleted: boolean }> {
  return apiFetch(`/tickets/${ticketId}/archive`, {
    method: 'POST',
    body: JSON.stringify({ deleteChannel }),
  });
}

// ─── Rank History & Season Submissions ──────────────────────────────────────
export interface RankSubmission {
  id: string;
  discord_user_id: string;
  player_id: string;
  player_name: string;
  player_level?: number;
  season_number: number;
  season_name?: string;
  current_rank: string;
  best_rank: string;
  rank_points: number;
  clan_points: number;
  permanent_image_url: string;
  extracted_text?: string;
  raw_ocr_data?: any;
  submitted_at: string;
  updated_at: string;
}

export async function getRankSubmissions(params: {
  season?: number;
  user_id?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ success: boolean; total: number; data: RankSubmission[] }> {
  const searchParams = new URLSearchParams();
  if (params.season) searchParams.append('season', String(params.season));
  if (params.user_id) searchParams.append('user_id', params.user_id);
  if (params.limit) searchParams.append('limit', String(params.limit));
  if (params.offset) searchParams.append('offset', String(params.offset));

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return apiFetch(`/ranks${query}`);
}

export async function getUserRankHistory(
  userId: string
): Promise<{ success: boolean; total: number; data: RankSubmission[] }> {
  return apiFetch(`/ranks/${userId}`);
}

export async function deleteRankSubmission(
  id: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/ranks/${id}`, {
    method: 'DELETE',
  });
}

// ─── Clan Battle Records & Scoreboards ──────────────────────────────────────
export interface BattleRecord {
  id: string;
  discord_user_id: string;
  player_id?: string;
  player_name: string;
  ship_name: string;
  ship_class: string;
  damage: number;
  kills?: number;
  assists?: number;
  map_name?: string;
  game_mode?: string;
  screenshot_url: string;
  rewards_screenshot_url?: string;
  extracted_ocr_text?: string;
  raw_ocr_data?: any;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  is_ship_record?: boolean;
  submitted_at: string;
  updated_at: string;
}

export interface ClassLeaderboardEntry {
  ship: {
    name: string;
    class: string;
    tier: number;
    category: string;
    aliases: string[];
  };
  record: BattleRecord | null;
}

export async function getBattleRecords(params: {
  ship_class?: string;
  status?: string;
  user_id?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ success: boolean; total: number; data: BattleRecord[] }> {
  const searchParams = new URLSearchParams();
  if (params.ship_class) searchParams.append('ship_class', params.ship_class);
  if (params.status) searchParams.append('status', params.status);
  if (params.user_id) searchParams.append('user_id', params.user_id);
  if (params.limit) searchParams.append('limit', String(params.limit));
  if (params.offset) searchParams.append('offset', String(params.offset));

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return apiFetch(`/records${query}`);
}

export async function getClassLeaderboard(
  shipClass: string
): Promise<{ success: boolean; shipClass: string; data: ClassLeaderboardEntry[] }> {
  return apiFetch(`/records/leaderboard/${shipClass}`);
}

export async function syncLeaderboardsToDiscord(): Promise<{
  success: boolean;
  message: string;
  results: Array<{ class: string; channel?: string; synced: boolean; reason?: string }>;
}> {
  return apiFetch('/records/sync-leaderboards', {
    method: 'POST',
  });
}

export async function deleteBattleRecord(
  id: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/records/${id}`, {
    method: 'DELETE',
  });
}

