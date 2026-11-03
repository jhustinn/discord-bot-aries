# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## ARIES Clan Management Platform

---

### PROJECT IDENTIFICATION
* **Project Name:** ARIES Clan Management Platform
* **Version:** 2.0.0
* **Date:** July 2026

---

### 1. SCOPE OF FUNCTIONALITY

The platform coordinates structural processing across a 5-phase lifecycle:

1. **Player Verification (OCR):** Capture game profile screenshots and extract Player ID, Name, Level via OCR
2. **Team Management:** Create teams, assign players, manage rosters for clan wars
3. **War Scheduling:** Schedule wars, assign players, track results and scores
4. **Points & Ranking:** Award/deduct points, track rankings, manage seasons
5. **Administration:** RBAC-controlled web dashboard for all operations

---

### 2. FUNCTIONAL FEATURE MAP

#### FEAT-01: Player Verification System
* **Description:** Automated verification via screenshot OCR
* **User Flow:**
  1. User clicks "Open Ticket" in Discord
  2. Private channel created
  3. User sends screenshot + timezone selection
  4. OCR extracts Player ID, Name, Level
  5. Data stored in Supabase
  6. Admin approves/rejects
* **Acceptance Criteria:**
  - OCR extracts hex Player ID (8-16 chars)
  - Supports Unicode characters (Ψ, Ω, Σ)
  - Timezone selection via Discord dropdown
  - Auto-detect region from timezone

#### FEAT-02: Team Management
* **Description:** Create and manage war teams
* **User Flow:**
  1. Admin creates team (name, tier, max members)
  2. Admin assigns players to team
  3. Admin designates captain
  4. Team available for war assignment
* **Acceptance Criteria:**
  - Support unlimited teams
  - Max5 members per team (configurable)
  - Captain designation
  - Team tiers: MAIN, SECONDARY, ACADEMY, RESERVE

#### FEAT-03: Clan Wars
* **Description:** Schedule and track clan wars
* **User Flow:**
  1. Admin creates war (opponent, type, schedule)
  2. System auto-adds team members to roster
  3. Players confirm availability
  4. War happens
  5. Admin records results (scores, kills, deaths)
* **Acceptance Criteria:**
  - War types: REGULAR, TOURNAMENT, SCRIMMAGE, PRACTICE
  - Team size:5v5 (configurable)
  - Track individual player performance
  - Auto-update season stats

#### FEAT-04: Points & Ranking System
* **Description:** Track member contributions via points
* **User Flow:**
  1. Admin awards/deducts points with reason
  2. System tracks points per season
  3. System calculates rank based on thresholds
  4. Leaderboard shows top contributors
* **Acceptance Criteria:**
  - Points categories: manual, war, event, penalty, reward
  - Rank thresholds: Newcomer(0), Member(100), Veteran(500), Elite(1000), Champion(2500), Legend(5000), Master(10000)
  - Season-based points (reset per season)
  - Lifetime points (never reset)

#### FEAT-05: Season Management
* **Description:** Monthly seasons with stats and leaderboards
* **User Flow:**
  1. Admin creates season (name, duration)
  2. Season tracks all clan activities
  3. At season end, system snapshots player stats
  4. New season starts with fresh points
* **Acceptance Criteria:**
  - Custom duration (default30 days)
  - Auto-calculate clan stats (wars, wins, points)
  - Season leaderboard
  - Player rank history per season

#### FEAT-06: RBAC (Role-Based Access Control)
* **Description:** Configurable roles and permissions
* **User Flow:**
  1. Super Admin creates roles
  2. Assigns permissions to roles
  3. Assigns roles to users
  4. Users only see permitted features
* **Acceptance Criteria:**
  - Default roles: Super Admin, Admin, Leader, Moderator, Member, Viewer
  - Custom role creation
  -28 granular permissions
  - Permission matrix UI

---

### 3. NON-FUNCTIONAL REQUIREMENTS (NFR)

| NFR ID | Requirement | Target |
|--------|-------------|--------|
| NFR-001 | API response time | < 2000ms |
| NFR-002 | OCR processing time | < 5000ms |
| NFR-003 | Uptime | 99%+ (via UptimeRobot) |
| NFR-004 | Security | All secrets in env vars |
| NFR-005 | Scalability |100+ concurrent users |
| NFR-006 | Data integrity | Foreign keys + cascade delete |
| NFR-007 | Audit trail | All actions logged |
| NFR-008 | Mobile responsive | Admin dashboard works on mobile |

---

### 4. USER INTERFACE REQUIREMENTS

#### Discord Bot:
- Verification panel with button
- Timezone selection dropdown
- Points/war commands (future)
- Admin slash commands

#### Web Admin Dashboard:
- Dashboard overview with charts
- Players management (list, search, filter)
- Teams management (CRUD)
- Wars management (CRUD, roster)
- Points management (award, deduct, history)
- Seasons management (create, leaderboard)
- Roles & Permissions management
- Audit log viewer
- Settings

---

### 5. DATA REQUIREMENTS

| Entity | Key Fields | Volume |
|--------|------------|--------|
| verified_players | player_id, name, level, timezone |100+ |
| clan_teams | team_id, name, tier, max_members |10+ |
| clan_wars | war_id, opponent, schedule, results |50+/month |
| clan_points | player_id, points, rank |100+ |
| clan_season | season_id, dates, stats |12/year |
| rbac_roles | role_id, name, permissions |10+ |

---

*Document Version: 1.0*
*Last Updated: July 2026*
