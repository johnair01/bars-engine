# Admin Controls Audit — Phase 2 T6.1

**Spec**: [game-loop-tighten-admin-player](spec.md)

## Gameboard (`/campaign/board`)

| Control | Location | Gated? | Notes |
|---------|----------|---------|-------|
| Quick generate (one-click) | GameboardClient Add Quest modal | Yes (`isAdmin`) | Calls `generateQuestFromContext` |
| Generate grammatical quest (preview) | GameboardClient Add Quest modal | Yes (`isAdmin`) | Calls `previewGameboardAlignedQuest` |
| Full quest wizard link | Add Quest modal | No | Links to `/quest/create` — player can use |
| Add quest slot (admin create) | GameboardClient | Yes (`isAdmin`) | Link to add-quest flow |

**Verdict**: Admin generation controls are gated by `isAdmin`. Non-admins do not see Quick generate or Generate grammatical quest buttons.

## Dashboard

| Control | Location | Gated? | Notes |
|---------|----------|---------|-------|
| DashboardCaster (I Ching generate) | Dashboard | No | Player-facing — `generateQuestFromReading` for hexagram. Not admin content creation. |
| DailyCheckInQuest | Dashboard | No | Player flow — no admin generation |

**Verdict**: No admin-only generation on dashboard. DashboardCaster is player I Ching flow.

## Hand (`/hand`)

| Control | Location | Gated? | Notes |
|---------|----------|---------|-------|
| (none) | Hand page | — | No admin generation controls |

**Verdict**: Hand is clean — no admin controls.

## Admin Panel (`/admin/*`)

| Control | Location | Gated? | Notes |
|---------|----------|---------|-------|
| Quest from Context | /admin/quest-from-context | Yes (route) | Admin route; `generateQuestFromContext` has `checkAdmin()` |
| Quest Grammar | /admin/quest-grammar | Yes (route) | Admin route |
| Quest Proposals | /admin/quest-proposals | Yes (route) | Admin route |

**Verdict**: Admin panel routes are admin-only.

## Summary

- Gameboard: Admin controls gated by `isAdmin`. Player flows (slot view, accept aid, etc.) remain separate.
- Dashboard: No admin generation; DashboardCaster is player I Ching.
- Hand: No admin controls.
- Admin panel: All generation tools behind `/admin/*`.
