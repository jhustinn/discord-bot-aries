-- ============================================
-- ARIES Clan Management Platform - Master Schema
-- Version: 2.0.0
-- Date: July 2026
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. discord_users (Discord Accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS discord_users (
    user_id VARCHAR PRIMARY KEY,
    username VARCHAR NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. verification_tickets (Verification Log)
-- ============================================
CREATE TABLE IF NOT EXISTS verification_tickets (
    ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR REFERENCES discord_users(user_id) ON DELETE CASCADE,
    in_game_name VARCHAR NOT NULL,
    permanent_image_url TEXT NOT NULL,
    ticket_status VARCHAR DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    player_id VARCHAR,
    player_name VARCHAR,
    player_level INTEGER,
    extracted_text TEXT
);

-- ============================================
-- 3. verified_players (Player Registry)
-- ============================================
CREATE TABLE IF NOT EXISTS verified_players (
    player_id VARCHAR PRIMARY KEY,
    discord_user_id VARCHAR REFERENCES discord_users(user_id) ON DELETE SET NULL,
    player_name VARCHAR NOT NULL,
    player_level INTEGER DEFAULT 1,
    clan_tag VARCHAR DEFAULT 'ARIES',
    timezone VARCHAR DEFAULT 'UTC',
    timezone_offset VARCHAR DEFAULT 'UTC+0',
    region VARCHAR DEFAULT 'UNKNOWN',
    status VARCHAR DEFAULT 'ACTIVE',
    notes TEXT,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by VARCHAR,
    ticket_id UUID REFERENCES verification_tickets(ticket_id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. clan_teams (Team Definitions)
-- ============================================
CREATE TABLE IF NOT EXISTS clan_teams (
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name VARCHAR NOT NULL,
    team_tier VARCHAR DEFAULT 'MAIN',
    description TEXT,
    max_members INTEGER DEFAULT 5,
    captain_player_id VARCHAR REFERENCES verified_players(player_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. team_members (Players in Each Team)
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES clan_teams(team_id) ON DELETE CASCADE,
    player_id VARCHAR NOT NULL REFERENCES verified_players(player_id) ON DELETE CASCADE,
    role VARCHAR DEFAULT 'MEMBER',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, player_id)
);

-- ============================================
-- 6. clan_wars (War Schedule & Results)
-- ============================================
CREATE TABLE IF NOT EXISTS clan_wars (
    war_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    our_team_id UUID REFERENCES clan_teams(team_id) ON DELETE SET NULL,
    opponent_name VARCHAR NOT NULL,
    opponent_team VARCHAR,
    war_type VARCHAR DEFAULT 'REGULAR',
    team_size INTEGER DEFAULT 5,
    scheduled_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 30,
    timezone VARCHAR DEFAULT 'UTC',
    status VARCHAR DEFAULT 'SCHEDULED',
    our_score INTEGER,
    their_score INTEGER,
    result VARCHAR,
    strategy_notes TEXT,
    war_notes TEXT,
    created_by VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. war_roster (Players per War)
-- ============================================
CREATE TABLE IF NOT EXISTS war_roster (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    war_id UUID NOT NULL REFERENCES clan_wars(war_id) ON DELETE CASCADE,
    player_id VARCHAR NOT NULL REFERENCES verified_players(player_id) ON DELETE CASCADE,
    team_side VARCHAR DEFAULT 'OUR',
    role VARCHAR DEFAULT 'MEMBER',
    availability VARCHAR DEFAULT 'PENDING',
    availability_notes TEXT,
    ship_loadout TEXT,
    score INTEGER,
    kills INTEGER,
    deaths INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(war_id, player_id)
);

-- ============================================
-- 8. player_availability (Weekly Availability)
-- ============================================
CREATE TABLE IF NOT EXISTS player_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id VARCHAR NOT NULL REFERENCES verified_players(player_id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, day_of_week)
);

-- ============================================
-- 9. clan_season (Season Definitions + Stats)
-- ============================================
CREATE TABLE IF NOT EXISTS clan_season (
    season_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_name VARCHAR NOT NULL,
    season_number INTEGER,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    duration_days INTEGER DEFAULT 30,
    status VARCHAR DEFAULT 'ACTIVE',
    total_wars INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    total_points_spent INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. rank_season (Player Rank per Season)
-- ============================================
CREATE TABLE IF NOT EXISTS rank_season (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES clan_season(season_id) ON DELETE CASCADE,
    player_id VARCHAR NOT NULL REFERENCES verified_players(player_id) ON DELETE CASCADE,
    rank_name VARCHAR NOT NULL,
    rank_tier VARCHAR,
    rank_points INTEGER DEFAULT 0,
    total_wars INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    total_points_spent INTEGER DEFAULT 0,
    contribution_score INTEGER DEFAULT 0,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(season_id, player_id)
);

-- ============================================
-- 11. clan_points (Current Points per Season)
-- ============================================
CREATE TABLE IF NOT EXISTS clan_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id VARCHAR NOT NULL REFERENCES verified_players(player_id) ON DELETE CASCADE,
    season_id UUID REFERENCES clan_season(season_id) ON DELETE SET NULL,
    total_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    lifetime_spent INTEGER DEFAULT 0,
    rank VARCHAR DEFAULT 'Member',
    rank_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, season_id)
);

-- ============================================
-- 12. clan_points_history (Points Transaction Log)
-- ============================================
CREATE TABLE IF NOT EXISTS clan_points_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id VARCHAR NOT NULL REFERENCES verified_players(player_id) ON DELETE CASCADE,
    season_id UUID REFERENCES clan_season(season_id) ON DELETE SET NULL,
    points_change INTEGER NOT NULL,
    reason TEXT NOT NULL,
    category VARCHAR DEFAULT 'manual',
    admin_id VARCHAR,
    admin_username VARCHAR,
    bot_source VARCHAR DEFAULT 'admin',
    reference_id VARCHAR,
    reference_type VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 13. clan_ranks (Rank Definitions)
-- ============================================
CREATE TABLE IF NOT EXISTS clan_ranks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rank_name VARCHAR NOT NULL UNIQUE,
    min_points INTEGER NOT NULL,
    emoji VARCHAR,
    color VARCHAR,
    role_id VARCHAR,
    permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default Ranks
INSERT INTO clan_ranks (rank_name, min_points, emoji, color) VALUES
('Newcomer', 0, '🆕', '#9CA3AF'),
('Member', 100, '👤', '#3B82F6'),
('Veteran', 500, '⭐', '#F59E0B'),
('Elite', 1000, '💎', '#8B5CF6'),
('Champion', 2500, '🏆', '#EF4444'),
('Legend', 5000, '👑', '#F59E0B'),
('Master', 10000, '🔥', '#DC2626')
ON CONFLICT (rank_name) DO NOTHING;

-- ============================================
-- 14. audit_logs (Activity Logging)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR NOT NULL,
    action_category VARCHAR DEFAULT 'OTHER',
    user_id VARCHAR,
    username VARCHAR,
    target_id VARCHAR,
    target_type VARCHAR,
    target_name VARCHAR,
    details JSONB,
    old_value TEXT,
    new_value TEXT,
    status VARCHAR DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 15. rbac_roles (Role Definitions)
-- ============================================
CREATE TABLE IF NOT EXISTS rbac_roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR NOT NULL UNIQUE,
    role_slug VARCHAR NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default RBAC Roles
INSERT INTO rbac_roles (role_name, role_slug, description, is_system) VALUES
('Super Admin', 'super_admin', 'Full system access', true),
('Admin', 'admin', 'Administrative access', true),
('Leader', 'leader', 'Clan leader with war management', true),
('Moderator', 'moderator', 'Moderation access', true),
('Member', 'member', 'Basic member access', true),
('Viewer', 'viewer', 'Read-only access', true)
ON CONFLICT (role_slug) DO NOTHING;

-- ============================================
-- 16. rbac_permissions (Permission Definitions)
-- ============================================
CREATE TABLE IF NOT EXISTS rbac_permissions (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_name VARCHAR NOT NULL UNIQUE,
    permission_slug VARCHAR NOT NULL UNIQUE,
    category VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default Permissions
INSERT INTO rbac_permissions (permission_name, permission_slug, category) VALUES
('View Dashboard', 'dashboard.view', 'Dashboard'),
('View Statistics', 'dashboard.stats', 'Dashboard'),
('View Members', 'members.view', 'Members'),
('Manage Members', 'members.manage', 'Members'),
('Kick Members', 'members.kick', 'Members'),
('Ban Members', 'members.ban', 'Members'),
('Assign Roles', 'members.assign_role', 'Members'),
('View Players', 'players.view', 'Players'),
('Manage Players', 'players.manage', 'Players'),
('Edit Player Info', 'players.edit', 'Players'),
('View Teams', 'teams.view', 'Teams'),
('Manage Teams', 'teams.manage', 'Teams'),
('Create Teams', 'teams.create', 'Teams'),
('Delete Teams', 'teams.delete', 'Teams'),
('View Wars', 'wars.view', 'Wars'),
('Create Wars', 'wars.create', 'Wars'),
('Manage Wars', 'wars.manage', 'Wars'),
('Delete Wars', 'wars.delete', 'Wars'),
('View Points', 'points.view', 'Points'),
('Award Points', 'points.award', 'Points'),
('Deduct Points', 'points.deduct', 'Points'),
('Manage Points', 'points.manage', 'Points'),
('View Seasons', 'seasons.view', 'Seasons'),
('Create Seasons', 'seasons.create', 'Seasons'),
('Manage Seasons', 'seasons.manage', 'Seasons'),
('View Roles', 'roles.view', 'Roles'),
('Manage Roles', 'roles.manage', 'Roles'),
('Create Roles', 'roles.create', 'Roles'),
('Delete Roles', 'roles.delete', 'Roles'),
('View Channels', 'channels.view', 'Channels'),
('Manage Channels', 'channels.manage', 'Channels'),
('View Audit Logs', 'audit.view', 'Audit'),
('Export Audit Logs', 'audit.export', 'Audit'),
('View Settings', 'settings.view', 'Settings'),
('Manage Settings', 'settings.manage', 'Settings')
ON CONFLICT (permission_slug) DO NOTHING;

-- ============================================
-- 17. rbac_role_permissions (Role-Permission Mapping)
-- ============================================
CREATE TABLE IF NOT EXISTS rbac_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES rbac_roles(role_id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES rbac_permissions(permission_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- ============================================
-- 18. rbac_user_roles (User-Role Mapping)
-- ============================================
CREATE TABLE IF NOT EXISTS rbac_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES discord_users(user_id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES rbac_roles(role_id) ON DELETE CASCADE,
    assigned_by VARCHAR,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_verified_players_discord ON verified_players(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_verified_players_status ON verified_players(status);
CREATE INDEX IF NOT EXISTS idx_verified_players_region ON verified_players(region);
CREATE INDEX IF NOT EXISTS idx_verified_players_timezone ON verified_players(timezone);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_player ON team_members(player_id);
CREATE INDEX IF NOT EXISTS idx_clan_wars_status ON clan_wars(status);
CREATE INDEX IF NOT EXISTS idx_clan_wars_scheduled ON clan_wars(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_clan_wars_team ON clan_wars(our_team_id);
CREATE INDEX IF NOT EXISTS idx_war_roster_war ON war_roster(war_id);
CREATE INDEX IF NOT EXISTS idx_war_roster_player ON war_roster(player_id);
CREATE INDEX IF NOT EXISTS idx_player_availability_player ON player_availability(player_id);
CREATE INDEX IF NOT EXISTS idx_clan_season_status ON clan_season(status);
CREATE INDEX IF NOT EXISTS idx_clan_season_dates ON clan_season(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rank_season_season ON rank_season(season_id);
CREATE INDEX IF NOT EXISTS idx_rank_season_player ON rank_season(player_id);
CREATE INDEX IF NOT EXISTS idx_rank_season_rank ON rank_season(rank_name);
CREATE INDEX IF NOT EXISTS idx_clan_points_player ON clan_points(player_id);
CREATE INDEX IF NOT EXISTS idx_clan_points_season ON clan_points(season_id);
CREATE INDEX IF NOT EXISTS idx_clan_points_total ON clan_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_clan_points_history_player ON clan_points_history(player_id);
CREATE INDEX IF NOT EXISTS idx_clan_points_history_category ON clan_points_history(category);
CREATE INDEX IF NOT EXISTS idx_clan_points_history_created ON clan_points_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rbac_role_permissions_role ON rbac_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_rbac_role_permissions_permission ON rbac_role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_rbac_user_roles_user ON rbac_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_user_roles_role ON rbac_user_roles(role_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE discord_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_wars ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_season ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_season ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_user_roles ENABLE ROW LEVEL SECURITY;

-- Service role policies (full access)
CREATE POLICY "Service role full access" ON discord_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON verification_tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON verified_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON clan_teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON clan_wars FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON war_roster FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON player_availability FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON clan_season FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON rank_season FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON clan_points FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON clan_points_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON clan_ranks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON rbac_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON rbac_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON rbac_role_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON rbac_user_roles FOR ALL USING (true) WITH CHECK (true);

-- Anon read policies (for frontend)
CREATE POLICY "Anon read access" ON discord_users FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON verification_tickets FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON verified_players FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON clan_teams FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON team_members FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON clan_wars FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON war_roster FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON player_availability FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON clan_season FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON rank_season FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON clan_points FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON clan_points_history FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON clan_ranks FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON rbac_roles FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON rbac_permissions FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON rbac_role_permissions FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON rbac_user_roles FOR SELECT USING (true);

-- ============================================
-- SCHEMA COMPLETE
-- ============================================
