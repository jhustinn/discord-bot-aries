# 🛡️ Unified Role-Based Access Control (RBAC) System

In this platform, **Discord Server Roles and Web Application Roles are unified 1:1**. This document explains the synchronization model, permissions matrix, and multi-role assignment workflow.

---

## 🎯 Design Principle: Discord Role = Web Role

Historically, web dashboards maintain separate user roles from Discord server roles, creating desynchronization where an admin in Discord might not have permission on the web, or vice versa.

In the Aries platform:
- Every relevant Discord role is mapped directly to an RBAC role record in the database.
- A user can possess **multiple roles simultaneously** (e.g. `Super Admin` + `Clan Leader` + `Tournament Operator`).
- Modifying a role or assigning it on the Web Admin Dashboard automatically provisions or revokes the corresponding role in Discord in real-time.

---

## 🗂️ Unified 2-Tab Navigation

The Admin Panel features a streamlined 2-tab interface in `mw-verification-admin/src/pages/Roles/index.tsx`:

1. **🛡️ Roles & Permissions**:
   - Displays all server roles with their color badges and Discord sync status.
   - Allows fine-tuning which granular web permissions (`tickets.approve`, `wars.manage`, `records.delete`, etc.) each role possesses via an interactive matrix modal.
2. **👥 Member Assignments**:
   - Groups users and shows all assigned roles per user as tags.
   - Allows assigning multiple roles at once using the custom multi-select dropdown.
   - Supports inline role revocation.

---

## 🧩 Reusable Component: `CustomSelect`

Located at [`src/components/ui/select/CustomSelect.tsx`](../../mw-verification-admin/src/components/ui/select/CustomSelect.tsx):
- **Zero Heavy Dependencies**: Built purely with React and Tailwind CSS without Radix UI or HeadlessUI overhead.
- **Multi-Select**: Checkboxes on items, chip badges with remove buttons (`✕`), and "Select All" / "Clear" buttons.
- **Auto-Placement**: Automatically flips to top (`placement="top"`) when placed near the bottom of a modal to prevent clipping.
- **Searchable**: Realtime filtering of roles and users.
