# Phase 6 — Design Handoff: Warm Roster & Lead Workspace

Design handoff for **campaign-lead-forge Phase 6** (FR15–FR19). Build target: the campaign owner's
roster + per-lead workspace + collective directory.

- **Phase 6 handoff**: [`phase6-handoff.html`](phase6-handoff.html) — roster + lead workspace + collective.
- **Phase 7 handoff**: [`phase7-handoff.html`](phase7-handoff.html) — the AI Quest Studio (compose a
  quest from a myth × superpower × GM face, deterministic seed → AI draft → save to the campaign pool).
- **Spec**: [`../spec.md`](../spec.md) · **Tasks**: [`../tasks.md`](../tasks.md)

## Surfaces
| Route | What | Status |
|-------|------|--------|
| `/campaign/[ref]/leads` | The Roster — your list; quick-add; status + collective filters | reframe shipped board |
| `/campaign/[ref]/leads/[leadId]` | Lead Workspace — goals, matched quests (add/reorder/remove), warm link, publish | **new** |
| `/campaign/[ref]/leads/collective` | Collective directory — published leads other stewards can adopt | **new** |

## Schema delta (one additive migration)
- `CampaignLead.goals String?` — the owner's goals for the lead
- `CampaignLead.collective Boolean @default(false)` — published to the collective

## New server actions (steward-gated)
`quickAddLead` · `getLead` · `setLeadGoals` · `addLeadQuest` · `reorderLeadQuests` ·
`removeLeadQuest` · `publishLeadToCollective` / `unpublishLead` · `adoptCollectiveLead`

## Two design calls to confirm before build
- **A** — Add-a-lead: lightweight 4-field quick-add → Workspace (lean: yes), vs. keep the full forge form.
- **B** — Adopt from collective: clone into the adopter's own copy (lean: yes), vs. shared reference.

## Build order
1. Schema + actions → 2. Roster (+ quick-add, collective filter) → 3. Workspace → 4. Collective →
5. Verify (tsc/eslint/routes; end-to-end claim still assigns quests).
