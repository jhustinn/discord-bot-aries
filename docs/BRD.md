# BUSINESS REQUIREMENTS DOCUMENT (BRD)
## ARIES Clan Management Platform

---

### PROJECT IDENTIFICATION
* **Project Name:** ARIES Clan Management Platform
* **Target Environment:** Discord Server Integration + Web Admin Dashboard
* **Core Technology Stack:** Node.js (discord.js v14), React (Vite + Tailwind CSS), Supabase (PostgreSQL + Storage)
* **Author:** Technical Systems Architect
* **Version:** 2.0.0
* **Date:** July 2026

---

### 1. PROJECT BACKSTRORY & STRATEGIC VALUE

The ARIES clan for Modern Warships game requires a comprehensive management platform to handle:
- **Player verification** via screenshot OCR
- **Team management** for clan wars
- **Points & ranking system** for member progression
- **Season-based tracking** for performance analysis
- **Role-based access control** for secure administration

Manual management via Discord chat is error-prone, lacks audit trails, and cannot scale. This platform automates clan operations while providing a professional web dashboard for administrators.

---

### 2. BUSINESS OBJECTIVES

| Objective | Description | Success Metric |
|-----------|-------------|----------------|
| **Automated Verification** | OCR-based player verification from game screenshots | 95%+ accuracy on Player ID extraction |
| **Team Management** | Create and manage war teams with rosters | Support 5+ teams with 5+ members each |
| **Points System** | Track member contributions via points | Real-time point tracking with full audit trail |
| **Season Tracking** | Monthly seasons with leaderboards and stats | Auto-generate season reports |
| **RBAC Security** | Role-based access for different admin levels | 6+ predefined roles with custom permissions |
| **Zero Cost** | Run entirely on free-tier services | $0/month operational cost |

---

### 3. CORE BUSINESS STAKEHOLDERS

| Stakeholder | Needs |
|-------------|-------|
| **Clan Leaders** | Full control over teams, wars, points, and members |
| **War Coordinators** | Create wars, manage rosters, track results |
| **Moderators** | Verify new members, manage basic operations |
| **Members** | View their points, rank, availability, and war history |
| **New Players** | Quick verification process via Discord |

---

### 4. BUSINESS RULES

| Rule ID | Rule Description |
|---------|------------------|
| BR-001 | Each player must be verified before gaining clan access |
| BR-002 | Player ID (hex) is the unique identifier across all systems |
| BR-003 | One Discord account maps to one verified player |
| BR-004 | Teams have a maximum of5 members |
| BR-005 | Only one active season at a time |
| BR-006 | Points reset at the start of each new season |
| BR-007 | Lifetime points are never reset |
| BR-008 | War results automatically update player stats |
| BR-009 | Role permissions are configurable by Super Admin |
| BR-010 | All actions are logged in audit_logs table

---

### 5. CONSTRAINTS

| Constraint | Description |
|------------|-------------|
| **Technical** | Must run on free-tier hosting (Replit, Vercel, Supabase) |
| **Integration** | Must integrate with Discord API v10 |
| **Performance** | API responses must be under 2000ms |
| **Security** | All secrets must be in environment variables |
| **Scalability** | Must handle100+ concurrent users |

---

### 6. ASSUMPTIONS

| Assumption | Description |
|------------|-------------|
| Players have Discord accounts | All clan members must be on Discord |
| Screenshots are clear enough for OCR | OCR accuracy depends on image quality |
| Internet connectivity is available | All operations require network access |
| Supabase free tier is sufficient |500MB database, 1GB storage |

---

*Document Version: 1.0*
*Last Updated: July 2026*
