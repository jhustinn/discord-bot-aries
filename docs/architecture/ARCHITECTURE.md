# 🏛️ System Architecture

This document outlines the high-level architecture, design patterns, and cross-service communication flows of the Aries Modern Warships Platform.

---

## 📐 Tri-tier Monorepo Design

The ecosystem is structured as a cohesive monorepo composed of three core tiers:

```mermaid
flowchart TD
    subgraph Discord["Discord Ecosystem"]
        DU["Discord Users"]
        DC["Verification Channels"]
        DG["Guild Server"]
    end

    subgraph BotEngine["Bot Service (Node.js) :3000"]
        DH["Interaction Handlers (Slash & Buttons)"]
        OCR["Dual OCR Engine (Gemini / Cloud Vision)"]
        BApi["Bot Internal REST API"]
    end

    subgraph LaravelBackend["Backend API (Laravel 11) :8000"]
        Auth["Sanctum Auth"]
        RbacCtrl["RBAC Controller (Syncs Roles)"]
        TicketCtrl["Ticket Controller"]
        WarCtrl["Clan War Controller"]
        DB[(Database: SQLite / PG)]
    end

    subgraph AdminDashboard["Admin Frontend (React 18)"]
        UI["Tailwind CSS UI / Dark Mode"]
        CS["CustomSelect Multi-Role Picker"]
        Tabs["Unified Roles & Member Matrix"]
    end

    DU -->|Clicks Verifikasi| DC
    DC -->|Events| DH
    DH -->|Sends Screenshot| OCR
    OCR -->|Extracted Name & ID| DH
    DH -->|Saves Verification Ticket| LaravelBackend
    
    AdminDashboard -->|HTTP REST Requests| LaravelBackend
    LaravelBackend -->|Eloquent ORM| DB
    LaravelBackend -->|Provisions Discord Roles via API| BApi
    BApi -->|Assigns Roles to Members| DG
```

---

## 🔄 Verification & Auto-OCR Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Discord Member
    participant Bot as Discord Bot
    participant OCR as Gemini Vision OCR
    participant API as Laravel Backend
    actor Staff as Admin / Clan Staff

    User->>Bot: Clicks 'Verifikasi Akun' in #welcome
    Bot->>User: Spawns private channel open-ticket-XX
    User->>Bot: Uploads in-game profile screenshot
    Bot->>OCR: Sends image buffer for analysis
    OCR-->>Bot: Returns { player_name, player_id, player_level }
    Bot->>API: POST /api/tickets (stores ticket & OCR metadata)
    Bot->>User: Confirms extracted data & notifies staff
    Staff->>API: Approves ticket via Admin Dashboard
    API->>Bot: POST /api/discord/members/:id/roles (grant Verified Role)
    Bot->>User: Grants Discord role & announces welcome message
    Bot->>Bot: Archives channel to closed-ticket-XX
```

---

## ⚡ Internal API Bridge Authentication

The Discord Bot exposes a local REST API on `http://localhost:3000/api/discord/*` allowing Laravel to inspect guild channels, read live server roles, fetch server members, and modify member roles.

All requests between Laravel and the Bot require an authentication header:
```http
x-api-key: aries-admin-2024
```
If the header is missing or does not match `API_SECRET_KEY`, the request is rejected with `401 Unauthorized`.
