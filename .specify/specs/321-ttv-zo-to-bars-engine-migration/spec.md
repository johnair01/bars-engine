---
type: spec
spec_kit_id: 321-ttv-zo-to-bars-engine
title: "321 + TTV — Zo.space to Bars-engine Migration (Option C)"
created: 2026-05-25
last_reviewed: 2026-05-25
status: Phase 1 — infrastructure design
tags:
  - migration
  - zo-space
  - 321-shadow
  - tap-the-vein
  - bars-engine
  - vercel
owner: wendellbritt
problem: "zo.space is a managed hosting dead-end. 321 and TTV need to live on bars-engine (Vercel) long-term. Current data lives on zo.space filesystem; bars-engine has Shadow321Session Prisma model but no TTV model."

---

## Context

**What we're migrating:**

| Flow | zo.space route | bars-engine target |
|------|---------------|-------------------|
| 321 shadow work | `/shadow/321` + `/api/321/save` | `Shadow321Session` model (exists) + new API routes |
| Tap the Vein | `/tap-the-vein` + `/api/tap-the-vein/entry` | New `TapTheVeinEntry` model needed |

**Why Option C (hybrid):**
- zo.space filesystem is the current source of truth — shifting data requires a migration script
- bars-engine already has `/api/321/ingest` that reads the workspace 321 JSON files directly — partial pattern exists
- Frontend pages are nearly deployment-agnostic (they use `window.location.origin` to self-locate their API host)
- Transition window lets us verify routes work before cutting over the data layer

**What exists already:**
- `Shadow321Session` Prisma model — partial schema, maps to 321 session fields
- `/api/321/ingest/route.ts` — reads sandbox filesystem, converts 321 to `CustomBar` via `map321ToBarDraft`
- bars-engine uses `createCustomBar` action for bar creation
- No TTV entry model in Prisma schema

---

## Migration Phases

### Phase 1 — Infrastructure design (THIS SPEC)

**Done:**
- [x] Audit bars-engine Prisma schema
- [x] Audit existing 321 ingest route
- [x] Map zo.space data structures to target Prisma types
- [x] Confirm frontend deployment-agnosticism

**To confirm:**
- [ ] Does `Shadow321Session` cover all 321 fields? (missing: `belief`, `secondPersonDialogue`, `synthesis`, `eqScore`, `aqScore`, `tags`)
- [ ] Is TTV entry write flow push-based (from TTV page) or pull-based (from bars-engine)?

---

### Phase 2 — Prisma schema extension + auth

**2a — Shadow321Session: no schema change needed**

`phase3Snapshot` captures the full 321 JSON (belief, secondPersonDialogue, synthesis, eqScore, aqScore, tags). Migration reads sub-fields from snapshot; bars-engine API reads from Prisma.

**2b — Add TapTheVeinEntry model**

```prisma
model TapTheVeinEntry {
  id            String   @id @default(cuid())
  playerId      String
  createdAt     DateTime @default(now())
  rawText       String
  wordCount     Int
  eaChannel     String   // Metal|Fire|Water|Wood|Earth
  chargeStrength String  // high|medium|low
  sectionText   String?
  eqScore       Int?
  barPhrases    String   // JSON: { text: string, isBar: boolean }[]
  autoSummary   String?
  derived321Id  String?  // links to Shadow321Session.id if derived
  derivedFromTtvEntryId String? // reverse link
}
```

**2c — Player-scoped access**

Both models require `playerId` on every record. API routes must:
1. Validate session (get `playerId` from session)
2. Enforce `WHERE playerId = ?` on every read/write
3. Return 401 if no valid session

**No Prisma changes for auth model** — use existing bars-engine session mechanism.

---

### Phase 3 — bars-engine API routes

**3a — New `/api/shadow-321/save` route**

Reads from zo.space filesystem during transition, writes to `Shadow321Session`.

Path mapping:
```
zo.space: /home/workspace/The Library/The Library/03 BARs/321/{timestamp}_{chapter}.json
bars-engine read: same path (via sandbox filesystem access or migration script)
bars-engine write: Shadow321Session via Prisma
```

**3b — New `/api/tap-the-vein/entry` route**

Reads request body from TTV page:
```typescript
{
  rawText: string       // 750+ word entry text
  wordCount: number
  eaChannel: string
  chargeStrength: string
  sectionText?: string
  eqScore?: number
  barPhrases: { text: string, isBar: boolean }[]
  autoSummary?: string
}
```

**3c — Migration: JSON vault → Prisma**

Run once (after Phase 2 schema is live and migrated):

```bash
# Pseudocode
for each {id}.json in /home/workspace/The Library/03 BARs/321/:
  record = JSON.parse(readFile(id))
  await prisma.shadow321Record.create({ data: record })

for each {id}.json in /home/workspace/The Library/03 BARs/tap-the-vein/:
  record = JSON.parse(readFile(id))
  await prisma.tapTheVeinEntry.create({ data: record })
```

**Pre-migration rollback:** Snapshot JSON vault directory before running.

---

### Phase 4 — Frontend cutover

Both `/shadow/321` and `/tap-the-vein` already use `window.location.origin` for API calls — the pages self-detect their host.

The cutover is a path/URL swap in each page's `API_ORIGIN` constant (or dynamic detection):

| Flow | Current target | New target |
|------|---------------|-----------|
| 321 save | `https://wendellbritt.zo.space/api/321/save` | `https://bars-engine.vercel.app/api/shadow-321/save` |
| TTV entry | `https://wendellbritt.zo.space/api/tap-the-vein/entry` | `https://barsengine.vercel.app/api/tap-the-vein/entry` |

After cutover verification: update `window.location.origin` logic in both pages once bars-engine routes are confirmed green.

---

### Phase 5 — Decommission zo.space

- Stop writing to zo.space filesystem
- Archive or delete zo.space routes for 321 and TTV (keep Oracle for now, it's a separate project)
- Downgrade Zo Computer plan

---

## Open Questions

1. **Shadow321Session field coverage** — confirmed: `phase3Snapshot` captures full 321 JSON (belief, secondPersonDialogue, synthesis, eqScore, aqScore, tags). No schema change needed for read. Migration script reads snapshot sub-fields when writing.
2. **TTV analysis pipeline** — confirmed: client-side logic (EA channel, chargeStrength computed in-browser). No bars-engine AI endpoint needed. Migration maps existing client-computed fields.
3. **Data volume** — confirmed: manageable batch (dozens of records, not thousands). One-shot migration is safe.
4. **Authentication** — CONFIRMED REQUIRED. Both flows must be gated to authenticated Player sessions. Privacy requirement: a player's 321 sessions and TTV entries must not be visible to other players. This adds middleware and session-check logic to Phase 2.

---

## References

- `Shadow321Session` Prisma model: `bars-engine/prisma/schema.prisma` line 504
- zo.space `/api/321/save`: source in zo.space routes (not in workspace)
- `map321ToBarDraft`: `bars-engine/src/lib/quest-grammar/map321ToBarDraft.ts`
- Phase 3 ingest route: `bars-engine/src/app/api/321/ingest/route.ts`
- TTV page: `wendellbritt.zo.space/tap-the-vein`
- shadow/321 page: `wendellbritt.zo.space/shadow/321`
