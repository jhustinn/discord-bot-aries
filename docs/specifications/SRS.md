# SYSTEM REQUIREMENTS SPECIFICATION (SRS)
## ARIES Clan Management Platform

---

### PROJECT IDENTIFICATION
* **Project Name:** ARIES Clan Management Platform
* **Version:** 2.0.0
* **Date:** July 2026

---

### 1. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │ Discord Client   │  │ Web Browser      │  │ Mobile Browser           │  │
│  │ (Bot Commands)   │  │ (Admin Dashboard)│  │ (Admin Dashboard)        │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────────┬─────────────┘  │
│           │                     │                          │                │
└───────────┼─────────────────────┼──────────────────────────┼────────────────┘
            │                     │                          │
            ▼                     ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Discord Bot (Replit)                                                  │   │
│  │ - discord.js v14                                                      │   │
│  │ - Express API server (port 3000)                                      │   │
│  │ - OCR processing (OCR.space / Gemini)                                 │   │
│  │ - WebSocket connection to Discord Gateway                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Admin Dashboard (Vercel)                                              │   │
│  │ - React 19 + TypeScript                                               │   │
│  │ - Vite + Tailwind CSS                                                 │   │
│  │ - Supabase Client (direct DB access)                                  │   │
│  │ - Discord API Client (via bot Express API)                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Supabase                                                              │   │
│  │ - PostgreSQL Database (18 tables)                                      │   │
│  │ - Storage Bucket (verification screenshots)                           │   │
│  │ - Auth (admin dashboard authentication)                               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. DATABASE SCHEMA

#### 2.1 Entity Relationship Diagram

```
discord_users (1) ────< (N) verification_tickets
      │
      │ (1:1)
      ▼
verified_players (1) ────< (N) team_members
      │                         │
      │ (1:N)                   │ (N:1)
      ▼                         ▼
clan_points            clan_teams (1) ────< (N) clan_wars
      │                                            │
      │ (1:N)                                      │ (1:N)
      ▼                                            ▼
clan_points_history                         war_roster
      │
      │ (N:1)
      ▼
clan_season (1) ────< (N) rank_season

rbac_roles (1) ────< (N) rbac_role_permissions
      │                         │
      │ (1:N)                   │ (N:1)
      ▼                         ▼
rbac_user_roles          rbac_permissions
```

#### 2.2 Table Definitions

**Table: discord_users**
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | VARCHAR | PRIMARY KEY |
| username | VARCHAR | NOT NULL |
| joined_at | TIMESTAMPTZ | DEFAULT NOW() |

**Table: verification_tickets**
| Column | Type | Constraints |
|--------|------|-------------|
| ticket_id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| user_id | VARCHAR | FK -> discord_users(user_id) |
| in_game_name | VARCHAR | NOT NULL |
| permanent_image_url | TEXT | NOT NULL |
| ticket_status | VARCHAR | DEFAULT 'PENDING' |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| player_id | VARCHAR | Nullable (OCR) |
| player_name | VARCHAR | Nullable (OCR) |
| player_level | INTEGER | Nullable (OCR) |
| extracted_text | TEXT | Nullable (OCR) |

**Table: verified_players**
| Column | Type | Constraints |
|--------|------|-------------|
| player_id | VARCHAR | PRIMARY KEY |
| discord_user_id | VARCHAR | FK -> discord_users(user_id) |
| player_name | VARCHAR | NOT NULL |
| player_level | INTEGER | DEFAULT1 |
| clan_tag | VARCHAR | DEFAULT 'ARIES' |
| timezone | VARCHAR | DEFAULT 'UTC' |
| timezone_offset | VARCHAR | DEFAULT 'UTC+0' |
| region | VARCHAR | DEFAULT 'UNKNOWN' |
| status | VARCHAR | DEFAULT 'ACTIVE' |
| notes | TEXT | Nullable |
| verified_at | TIMESTAMPTZ | DEFAULT NOW() |
| verified_by | VARCHAR | Nullable |
| ticket_id | UUID | FK -> verification_tickets(ticket_id) |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**Table: clan_teams**
| Column | Type | Constraints |
|--------|------|-------------|
| team_id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| team_name | VARCHAR | NOT NULL |
| team_tier | VARCHAR | DEFAULT 'MAIN' |
| description | TEXT | Nullable |
| max_members | INTEGER | DEFAULT5 |
| captain_player_id | VARCHAR | FK -> verified_players(player_id) |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Table: team_members**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| team_id | UUID | FK -> clan_teams(team_id) |
| player_id | VARCHAR | FK -> verified_players(player_id) |
| role | VARCHAR | DEFAULT 'MEMBER' |
| joined_at | TIMESTAMPTZ | DEFAULT NOW() |
| | | UNIQUE(team_id, player_id) |

**Table: clan_wars**
| Column | Type | Constraints |
|--------|------|-------------|
| war_id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| our_team_id | UUID | FK -> clan_teams(team_id) |
| opponent_name | VARCHAR | NOT NULL |
| opponent_team | VARCHAR | Nullable |
| war_type | VARCHAR | DEFAULT 'REGULAR' |
| team_size | INTEGER | DEFAULT5 |
| scheduled_at | TIMESTAMPTZ | Nullable |
| duration_minutes | INTEGER | DEFAULT30 |
| timezone | VARCHAR | DEFAULT 'UTC' |
| status | VARCHAR | DEFAULT 'SCHEDULED' |
| our_score | INTEGER | Nullable |
| their_score | INTEGER | Nullable |
| result | VARCHAR | Nullable |
| strategy_notes | TEXT | Nullable |
| war_notes | TEXT | Nullable |
| created_by | VARCHAR | Nullable |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Table: war_roster**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| war_id | UUID | FK -> clan_wars(war_id) |
| player_id | VARCHAR | FK -> verified_players(player_id) |
| team_side | VARCHAR | DEFAULT 'OUR' |
| role | VARCHAR | DEFAULT 'MEMBER' |
| availability | VARCHAR | DEFAULT 'PENDING' |
| availability_notes | TEXT | Nullable |
| ship_loadout | TEXT | Nullable |
| score | INTEGER | Nullable |
| kills | INTEGER | Nullable |
| deaths | INTEGER | Nullable |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| | | UNIQUE(war_id, player_id) |

**Table: player_availability**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| player_id | VARCHAR | FK -> verified_players(player_id) |
| day_of_week | INTEGER | NOT NULL (0-6) |
| start_time | TIME | NOT NULL |
| end_time | TIME | NOT NULL |
| is_available | BOOLEAN | DEFAULT true |
| notes | TEXT | Nullable |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| | | UNIQUE(player_id, day_of_week) |

**Table: clan_season**
| Column | Type | Constraints |
|--------|------|-------------|
| season_id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| season_name | VARCHAR | NOT NULL |
| season_number | INTEGER | Nullable |
| description | TEXT | Nullable |
| start_date | TIMESTAMPTZ | NOT NULL |
| end_date | TIMESTAMPTZ | Nullable |
| duration_days | INTEGER | DEFAULT30 |
| status | VARCHAR | DEFAULT 'ACTIVE' |
| total_wars | INTEGER | DEFAULT0 |
| wins | INTEGER | DEFAULT0 |
| losses | INTEGER | DEFAULT0 |
| draws | INTEGER | DEFAULT0 |
| total_points_earned | INTEGER | DEFAULT0 |
| total_points_spent | INTEGER | DEFAULT0 |
| total_participants | INTEGER | DEFAULT0 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Table: rank_season**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| season_id | UUID | FK -> clan_season(season_id) |
| player_id | VARCHAR | FK -> verified_players(player_id) |
| rank_name | VARCHAR | NOT NULL |
| rank_tier | VARCHAR | Nullable |
| rank_points | INTEGER | DEFAULT0 |
| total_wars | INTEGER | DEFAULT0 |
| wins | INTEGER | DEFAULT0 |
| losses | INTEGER | DEFAULT0 |
| draws | INTEGER | DEFAULT0 |
| total_points_earned | INTEGER | DEFAULT0 |
| total_points_spent | INTEGER | DEFAULT0 |
| contribution_score | INTEGER | DEFAULT0 |
| recorded_at | TIMESTAMPTZ | DEFAULT NOW() |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| | | UNIQUE(season_id, player_id) |

**Table: clan_points**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| player_id | VARCHAR | FK -> verified_players(player_id) |
| season_id | UUID | FK -> clan_season(season_id) |
| total_points | INTEGER | DEFAULT0 |
| lifetime_points | INTEGER | DEFAULT0 |
| lifetime_spent | INTEGER | DEFAULT0 |
| rank | VARCHAR | DEFAULT 'Member' |
| rank_updated_at | TIMESTAMPTZ | Nullable |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |
| | | UNIQUE(player_id, season_id) |

**Table: clan_points_history**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| player_id | VARCHAR | FK -> verified_players(player_id) |
| season_id | UUID | FK -> clan_season(season_id) |
| points_change | INTEGER | NOT NULL |
| reason | TEXT | NOT NULL |
| category | VARCHAR | DEFAULT 'manual' |
| admin_id | VARCHAR | Nullable |
| admin_username | VARCHAR | Nullable |
| bot_source | VARCHAR | DEFAULT 'admin' |
| reference_id | VARCHAR | Nullable |
| reference_type | VARCHAR | Nullable |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**Table: clan_ranks**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| rank_name | VARCHAR | UNIQUE NOT NULL |
| min_points | INTEGER | NOT NULL |
| emoji | VARCHAR | Nullable |
| color | VARCHAR | Nullable |
| role_id | VARCHAR | Nullable |
| permissions | JSONB | Nullable |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Table: audit_logs**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| action | VARCHAR | NOT NULL |
| action_category | VARCHAR | DEFAULT 'OTHER' |
| user_id | VARCHAR | Nullable |
| username | VARCHAR | Nullable |
| target_id | VARCHAR | Nullable |
| target_type | VARCHAR | Nullable |
| target_name | VARCHAR | Nullable |
| details | JSONB | Nullable |
| old_value | TEXT | Nullable |
| new_value | TEXT | Nullable |
| status | VARCHAR | DEFAULT 'success' |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**Table: rbac_roles**
| Column | Type | Constraints |
|--------|------|-------------|
| role_id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| role_name | VARCHAR | UNIQUE NOT NULL |
| role_slug | VARCHAR | UNIQUE NOT NULL |
| description | TEXT | Nullable |
| is_system | BOOLEAN | DEFAULT false |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Table: rbac_permissions**
| Column | Type | Constraints |
|--------|------|-------------|
| permission_id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| permission_name | VARCHAR | UNIQUE NOT NULL |
| permission_slug | VARCHAR | UNIQUE NOT NULL |
| category | VARCHAR | NOT NULL |
| description | TEXT | Nullable |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**Table: rbac_role_permissions**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| role_id | UUID | FK -> rbac_roles(role_id) |
| permission_id | UUID | FK -> rbac_permissions(permission_id) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| | | UNIQUE(role_id, permission_id) |

**Table: rbac_user_roles**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| user_id | VARCHAR | FK -> discord_users(user_id) |
| role_id | UUID | FK -> rbac_roles(role_id) |
| assigned_by | VARCHAR | Nullable |
| assigned_at | TIMESTAMPTZ | DEFAULT NOW() |
| | | UNIQUE(user_id, role_id) |

---

### 3. API ENDPOINTS

#### 3.1 Player Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/players | List all verified players |
| GET | /api/players/:playerId | Player detail |
| POST | /api/players | Add new player |
| PUT | /api/players/:playerId | Update player info |
| DELETE | /api/players/:playerId | Remove player |
| GET | /api/players/:playerId/availability | Get player availability |
| PUT | /api/players/:playerId/availability | Set player availability |

#### 3.2 Team Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/teams | List all teams |
| GET | /api/teams/:teamId | Team detail with members |
| POST | /api/teams | Create new team |
| PUT | /api/teams/:teamId | Update team |
| DELETE | /api/teams/:teamId | Delete team |
| POST | /api/teams/:teamId/members | Add player to team |
| DELETE | /api/teams/:teamId/members/:playerId | Remove player from team |

#### 3.3 War Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/wars | List all wars |
| GET | /api/wars/:warId | War detail with roster |
| POST | /api/wars | Create new war |
| PUT | /api/wars/:warId | Update war |
| DELETE | /api/wars/:warId | Cancel war |
| POST | /api/wars/:warId/roster | Add player to roster |
| PUT | /api/wars/:warId/roster/:playerId | Update player status |
| POST | /api/wars/:warId/complete | Mark war complete |

#### 3.4 Points Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/points | List all player points |
| GET | /api/points/:playerId | Player points detail |
| POST | /api/points/:playerId/award | Award points |
| POST | /api/points/:playerId/deduct | Deduct points |
| GET | /api/points/leaderboard | Season leaderboard |
| GET | /api/points/history | Points transaction history |

#### 3.5 Season Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/seasons | List all seasons |
| GET | /api/seasons/:seasonId | Season detail |
| POST | /api/seasons | Create new season |
| PUT | /api/seasons/:seasonId | Update season |
| POST | /api/seasons/:seasonId/end | End season |
| GET | /api/seasons/:seasonId/leaderboard | Season leaderboard |
| GET | /api/seasons/:seasonId/ranks | Player ranks in season |

#### 3.6 RBAC Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/rbac/roles | List all roles |
| POST | /api/rbac/roles | Create new role |
| PUT | /api/rbac/roles/:roleId | Update role |
| DELETE | /api/rbac/roles/:roleId | Delete role |
| GET | /api/rbac/permissions | List all permissions |
| PUT | /api/rbac/roles/:roleId/permissions | Update role permissions |
| GET | /api/rbac/users/:userId/roles | Get user roles |
| POST | /api/rbac/users/:userId/roles | Assign role to user |

#### 3.7 Discord Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/discord/guild | Guild info |
| GET | /api/discord/members | List members |
| GET | /api/discord/roles | List roles |
| GET | /api/discord/channels | List channels |
| GET | /api/discord/stats | Server statistics |

#### 3.8 Audit Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/audit-logs | List audit logs |
| GET | /api/audit-logs/stats | Log statistics |

---

### 4. FRONTEND PAGES

| Route | Page | Description |
|-------|------|-------------|
| / | Dashboard | Overview stats, charts, recent activity |
| /tickets | Tickets | Verification ticket management |
| /users | Users | Verified Discord users |
| /players | Players | Verified players list |
| /players/:id | Player Detail | Player info, history, availability |
| /teams | Teams | Team management |
| /teams/:id | Team Detail | Team info, members, war history |
| /wars | Wars | War management |
| /wars/:id | War Detail | War info, roster, results |
| /points | Points | Points management |
| /points/leaderboard | Leaderboard | Season leaderboard |
| /seasons | Seasons | Season management |
| /seasons/:id | Season Detail | Season stats, leaderboard |
| /rbac/roles | Roles | Role management |
| /rbac/permissions | Permissions | Permission matrix |
| /audit-logs | Audit Logs | Activity log viewer |
| /settings | Settings | Bot configuration |
| /signin | Sign In | Authentication |

---

### 5. SECURITY REQUIREMENTS

| Requirement | Implementation |
|-------------|----------------|
| Authentication | Supabase Auth (email/password) |
| Authorization | RBAC with28 granular permissions |
| API Security | API key header (x-api-key) |
| Data Protection | Environment variables for secrets |
| Input Validation | Sanitization on all inputs |
| Audit Trail | All actions logged to audit_logs |
| File Validation | Type + size checks on uploads |

---

### 6. PERFORMANCE REQUIREMENTS

| Metric | Target |
|--------|--------|
| API Response Time | < 2000ms |
| OCR Processing | < 5000ms |
| Page Load Time | < 3000ms |
| Database Query | < 500ms |
| Uptime | 99%+ |

---

*Document Version: 1.0*
*Last Updated: July 2026*
