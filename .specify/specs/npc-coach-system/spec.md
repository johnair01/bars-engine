# Spec: NPC Coach System (API-First)

## Purpose

Add an **NPC Coach** layer so library-derived content surfaces as **in-world mentors** (nation + archetype + Game Master Face) while **real-world sources remain provenance**, revealed only after success conditions. This spec is the **single implementation artifact**: contracts and data model first; UI consumes the same APIs as admin tooling.

**Depends on**: [.specify/specs/book-to-quest-library/spec.md](../book-to-quest-library/spec.md) (Book → `QuestThread` + `CustomBar`). Coaches attach to threads/quests that already exist or are created from books.

**Canonical game terms**: Six GM Faces only — Shaman, Challenger, Regent, Architect, Diplomat, Sage (see `.agent/context/game-master-sects.md`, `CustomBar.gameMasterFace`).

**API-first rule**: No feature work without these contracts implemented (or stubbed with typed errors) and consumed by one caller (e.g. a thin `/library` or admin page). Prefer **Server Actions** for mutations and reads that power the app; add **Route Handlers** only if a non-browser client needs the same contract (document the path + JSON shape here when added).

---

## NPC Codex (authoring source)

**Location**: [.specify/specs/npc-coach-system/codex/](codex/)

| File | Role |
|------|------|
| [codex/npc_codex_workflow_spec.md](codex/npc_codex_workflow_spec.md) | Phases: seed → review → canon; clustering 30 → 6–12 NPCs; status lifecycle. |
| [codex/npc_codex_seed.json](codex/npc_codex_seed.json) | Machine-readable creator rows + classification fields (import → `SourceCoachRecord` / admin). |
| [codex/npc_codex_review.md](codex/npc_codex_review.md) | Human table; **keep in sync** with seed when classifying. |

The codex is the **classification engine**, not player-facing content. After compression (workflow Phase 6–7), each cluster gets **assigned character names** and becomes `NPCCoach` rows. Real-world names never appear as NPC display names.

---

## Character names (in-world)

- Every surfaced coach **must** have a **world-native character name** on `NPCCoach.displayName` (and optional `title`). These are **authored**, not copied from `sourceName`.
- Codex uses `npcNamePlaceholder` during review; **canonical** names are chosen at NPC generation time and stored in DB. **Uniqueness** and tone are editorial requirements (no trademarked or real author names as NPC names).
- Pipeline: **codex cluster approved** → **character name + title approved** → `adminUpsertNPCCoach` with `displayName` / `title` → player sees only these strings until provenance unlock.

---

## Home availability & membership (out of the gate)

Coaches are **at home** in the fiction: they are **not** globally listed for every player. Access is **membership-based**:

- **Nation gate**: Coach is available **from the start** to players whose **nation** matches the coach’s home nation (emotional-alchemy nation key aligned with `Player` / `Nation`).
- **Archetype gate**: Coach is available **from the start** to players whose **archetype** matches the coach’s home archetype.
- A coach may require **nation only**, **archetype only**, **either** (player matches nation **or** archetype), or **both**, depending on design. Store explicitly (see `homeAccessRule` below).

**Out of the gate** means: no extra unlock grind to *see* the coach in your roster for that membership — routing still applies (2–4 visible, daemon gates on quests). Provenance remains post-success.

Players **outside** those memberships do not get that coach in their default “home” list unless another path applies (e.g. **BAR share** — see below).

---

## Share unlock vs mastery (D&D spell metaphor)

Think **knowing a spell vs being able to cast it**:

| Layer | Meaning |
|-------|--------|
| **Introduced / unlocked via share** | When someone shares a private campaign with you (**BAR invitation / share**), you **meet** that coach in context — the content is **no longer invisible** because a friend brought you in. |
| **Basic mastery (nation or archetype)** | To **fully use** the coach — full quests, full coaching loop, rewards tied to that lineage — you must **demonstrate basic mastery** in the **nation or archetype** the coach is rooted in. |

So: **sharing unlocks introduction**; **mastery unlocks “casting”** (deep play). Product defines what counts as “basic mastery” (e.g. a short cert quest, move unlocks, threshold on that nation’s track — store as flags or a small `PlayerCoachMastery` record later).

**API / UX implication**: Responses should distinguish **preview / shared introduction** from **full access** (e.g. `accessTier: 'full' | 'shared_intro' | 'locked'`) so UI can show “you’ve been introduced; complete [nation/archetype] basics to unlock the full path.”

---

## Developmental lens & Game Master Face gating

- **GM Face**: Coach has a canonical `gmFace`. Players (or onboarding) have a **developmental lens** / preferred face alignment. The coach list **filters** or **ranks** so coaches match or complement the active lens per product rules (e.g. only show coaches where `gmFace` is in the allowed set for the player’s current lens, or weight primary vs contrast path).
- Implement as part of `listNPCCoachesForPlayer` inputs (`developmentalLens` or `allowedGmFaces`) and server-side evaluation — **do not** rely on client-only filtering for gating.

---

## Private campaigns & BAR invitations

- Players run **private campaigns** (existing campaign / thread / gameboard flows as applicable).
- **Sharing**: Use **BAR invitation / share** (`BarShare` and related actions) so another player can join the shared campaign.
- **Unlock for invitee**: Accepting a share **unlocks** the relevant coach(es) for that player in that campaign context — they are **not** blocked by the “home nation/archetype only” roster rule *for introduction*. The invitee **sees** the coach and can participate in the **shared** thread at the level the product allows.
- **Mastery still required for “full” use**: Full coach progression (all quests, full rewards, full provenance path as designed) requires **basic mastery** in the coach’s **home nation or archetype** (see [Share unlock vs mastery](#share-unlock-vs-mastery-dd-spell-metaphor)). Implement server-side; do not fake mastery client-side.

---

## Authoring parity: adults, agents, and assets

**Rule**: How **humans** (designers, admins) are told to build NPC coaches — codex → classify → cluster → assign character names → bind threads → provenance — is the **same story** **in-game agents** (AI/system agents that author or extend content) should follow when they **create this class of asset**.

- Same **steps**: source classification, no real names on NPCs, cluster before sprawl, `NPCCoach.displayName` as world-native, `QuestThread.npcCoachId`, provenance after success.
- Same **gates**: membership, share + mastery, developmental lens / GM Face.
- **Agents** should read **[codex/npc_codex_workflow_spec.md](codex/npc_codex_workflow_spec.md)** and this spec as the procedural template; output should be **importable** via the same `adminUpsert*` / seed shapes — not ad-hoc prose in the DB.

This keeps tooling, live ops, and automated generation **one pipeline**.

---

## Conceptual Model

| Layer | Role |
|-------|------|
| **SourceCoachRecord** | Hidden lineage: real name, chapter, citation, inference scores, notes. Never player-facing until unlock. |
| **NPCCoach** | Player-facing mentor: display name, nation, archetype, GM Face, copy, optional portrait; links to `SourceCoachRecord`. |
| **QuestThread / CustomBar** | Existing quest graph; coach binds via `npcCoachId` on thread (and optionally on root quest metadata). |
| **PlayerCoachProvenance** | Per-player unlock state: which coaches have provenance revealed, when, and by which trigger. |

Routing narrows **many source rows → few visible coaches** using nation, archetype, face, allyship domain, daemon/charge signals — **not** by exposing 30 parallel experts in UI.

---

## Data Model (Prisma — target)

Implement after this spec is reviewed. Run `npm run db:sync` when `schema.prisma` changes.

### SourceCoachRecord

| Field | Type | Notes |
|-------|------|--------|
| id | String @id @default(cuid()) | |
| bookId | String | FK → `Book` |
| sourceName | String | Real-world creator (admin-only default) |
| sourceChapterTitle | String? | |
| sourceSummary | String? @db.Text | |
| sourceMethodNotes | String? @db.Text | |
| provenanceCitation | String? | Short citation string |
| gmFaceInference | String? | shaman \| challenger \| regent \| architect \| diplomat \| sage |
| nationInference | String? | Align to emotional-alchemy nation keys used in product |
| archetypeIdInference | String? | FK → `Archetype` optional |
| confidenceScore | Float? | 0–1 |
| notesJson | String? | Rationale, batch-run id, model version |
| campaignDomain | String? | e.g. save_yourself, recovery — template key |
| classificationStatus | String @default("draft") | draft \| reviewed \| published |
| codexSourceId | String? | Optional id from `npc_codex_seed.json` `sourceId` for traceability |
| createdAt / updatedAt | DateTime | |

Relations: `book Book`, `npcCoaches NPCCoach[]` (one source row can back one surfaced coach in v1; enforce uniqueness if one-to-one is required).

### NPCCoach

| Field | Type | Notes |
|-------|------|--------|
| id | String @id @default(cuid()) | |
| sourceCoachRecordId | String | FK → `SourceCoachRecord` (cluster may aggregate multiple sources in future; v1: 1:1 or 1:cluster) |
| displayName | String | **Assigned in-world character name** (required for player-facing) |
| title | String? | Epithet / role |
| nationKey | String? | Thematic / copy alignment (nation flavor for card UI) |
| archetypeId | String? | FK → `Archetype` |
| gmFace | String | One of six canonical faces |
| temperament | String? | Free text or enum string |
| portraitAssetId | String? | Future: media id |
| introCopy | String? @db.Text | |
| teachingStyle | String? | |
| moveProfileId | String? | Optional FK to a profile/registry row if added later |
| homeAccessRule | String | `nation_only` \| `archetype_only` \| `nation_or_archetype` \| `nation_and_archetype` — who gets coach **out of the gate** |
| homeNationKey | String? | Required when rule uses nation; must match player nation for access |
| homeArchetypeId | String? | Required when rule uses archetype; must match player archetype for access |
| allowedDevelopmentalLenses | String? | Optional JSON string[] — if set, player lens must be in list for listing (or use for ranking only; **decide in implementation and test**) |
| isUnlockedByDefault | Boolean @default(false) | Discovery gating *within* membership |
| visibilityRuleJson | String? | JSON: daemon types, min charge, extra routing predicates |
| createdAt / updatedAt | DateTime | |

**`homeAccessRule` evaluation** (server-side, `listNPCCoachesForPlayer`):

- `nation_only`: player’s nation matches `homeNationKey`.
- `archetype_only`: player’s archetype matches `homeArchetypeId`.
- `nation_or_archetype`: match nation **or** archetype (use when coach serves either group).
- `nation_and_archetype`: both must match.

If a row cannot satisfy the rule (missing keys), treat as **invalid for listing** and log in admin QA.

Relations: `sourceCoachRecord SourceCoachRecord`, `questThreads QuestThread[]` (optional back-relation).

### QuestThread (additive)

| Field | Type | Notes |
|-------|------|--------|
| npcCoachId | String? | FK → `NPCCoach` — primary bind for library threads that follow a coach |

When set, library UIs should prefer coach metadata over raw book author for titles and cards.

### PlayerCoachProvenance

| Field | Type | Notes |
|-------|------|--------|
| id | String @id @default(cuid()) | |
| playerId | String | FK → `Player` |
| npcCoachId | String | FK → `NPCCoach` |
| provenanceRevealedAt | DateTime? | null = not yet revealed |
| revealTrigger | String? | e.g. first_quest_complete \| thread_complete \| daemon_gate \| vibeulon_mint |
| triggerRefId | String? | Optional quest/thread progress id for audit |
| createdAt / updatedAt | DateTime | |

Unique constraint: `@@unique([playerId, npcCoachId])`.

### Indexes (minimum)

- `SourceCoachRecord(bookId, classificationStatus)`
- `NPCCoach(nationKey, archetypeId, gmFace)`
- `PlayerCoachProvenance(playerId)`

---

## API Contracts (API-First)

> All shapes are **TypeScript types** for server actions; export from `src/lib/npc-coach/types.ts` (or equivalent). Errors: `{ error: string; code?: string }`.

### listNPCCoachesForPlayer

**Purpose**: Return a **short list** (e.g. 2–4 + optional contrast) of coaches relevant to the player — not all sources.

**Input**

```ts
{
  playerId: string
  /** Resolved from Player profile + session */
  playerNationKey?: string | null
  playerArchetypeId?: string | null
  /** Developmental lens / GM alignment — used to filter or rank coaches */
  developmentalLens?: string | null
  /** If set, only coaches whose gmFace is in this list are eligible (or use for primary vs contrast) */
  allowedGmFaces?: string[] | null
  /** Optional overrides for routing simulation (admin QA) */
  signals?: {
    nationKey?: string
    archetypeId?: string
    allyshipDomain?: string
    activeDaemonHint?: string
    campaignDomain?: string
    developmentalLens?: string
  }
  limit?: number // default 4
  /** When listing coaches for a BAR-shared campaign view, pass so invitees qualify for introduction */
  sharedCampaignContext?: { barShareId?: string; threadId?: string } | null
}
```

**Gating order** (apply before returning):

1. **Eligibility** — Player matches **home** (`homeAccessRule` + nation/archetype) **or** has a valid **BAR share** into the current campaign that references this coach/thread.
2. **Access tier** — If only the share path applies and **basic mastery** (coach’s nation or archetype) is not met → `accessTier: 'shared_intro'`. If home member **or** share + mastery → `accessTier: 'full'`. (Resolve mastery server-side from player progress / certs / move unlocks — product-defined.)
3. **Developmental lens / GM Face** — `allowedDevelopmentalLenses` on coach and/or `allowedGmFaces` in input.
4. **Routing** — narrow to ≤ `limit`, primary + contrast + optional surprise per product rules.

**Output**

```ts
Promise<{
  coaches: Array<{
    id: string
    displayName: string
    title: string | null
    nationKey: string | null
    archetypeName: string | null
    gmFace: string
    introExcerpt: string | null
    /** Why surfaced (debug copy or player-facing line) */
    routingReason: string | null
    threadIds: string[] // library threads tied to this coach
    provenanceLocked: true // always true here; no source names
    /** full = home member or shared+mastery; shared_intro = saw via BAR share, mastery incomplete */
    accessTier: 'full' | 'shared_intro'
  }>
  contrastCoach?: { id: string; displayName: string; gmFace: string }
}>
```

- **Server Action** — `/library`, home, campaign pickers. Pass **`sharedCampaignContext`** when resolving coaches inside a shared BAR campaign so invitees are **introduced**; **`accessTier`** reflects mastery.

---

### getNPCCoachDetail

**Purpose**: Coach detail for a single coach; **never** includes `SourceCoachRecord` fields.

**Input**

```ts
{ playerId: string; npcCoachId: string }
```

**Output**

```ts
Promise<{
  coach: {
    id: string
    displayName: string
    title: string | null
    nationKey: string | null
    archetypeName: string | null
    gmFace: string
    introCopy: string | null
    teachingStyle: string | null
    threads: Array<{ id: string; title: string; bookTitle: string | null }>
  }
  provenanceStatus: 'locked' | 'unlocked'
}>
```

- **Server Action** — coach detail page.

---

### getProvenancePayload

**Purpose**: Return **post-unlock** lineage payload only if unlocked; otherwise structured denial.

**Input**

```ts
{ playerId: string; npcCoachId: string }
```

**Output**

```ts
Promise<
  | {
      status: 'unlocked'
      sourceName: string
      sourceChapterTitle: string | null
      provenanceCitation: string | null
      sourceSummary: string | null
      book: { id: string; title: string; slug: string } | null
    }
  | { status: 'locked'; message: string }
>
```

- **Server Action** — provenance panel after success.

---

### recordProvenanceUnlock

**Purpose**: Idempotent mark when a trigger fires (quest complete, daemon gate, etc.).

**Input**

```ts
{
  playerId: string
  npcCoachId: string
  trigger: 'first_quest_complete' | 'thread_complete' | 'daemon_gate' | 'vibeulon_mint' | 'admin_grant'
  triggerRefId?: string
}
```

**Output**

```ts
Promise<{ success: true } | { error: string }>
```

- **Server Action** — called from quest completion hooks / daemon flows (single internal choke point).

---

### adminListSourceCoachRecords

**Purpose**: Batch review table for classification pass.

**Input**

```ts
{ bookId?: string; classificationStatus?: string; limit?: number; cursor?: string }
```

**Output**

```ts
Promise<{
  rows: Array<{
    id: string
    bookId: string
    sourceName: string
    sourceChapterTitle: string | null
    gmFaceInference: string | null
    nationInference: string | null
    archetypeIdInference: string | null
    confidenceScore: number | null
    classificationStatus: string
  }>
  nextCursor: string | null
}>
```

- **Server Action** — admin only (`requireAdmin`).

---

### adminUpsertSourceCoachRecord

**Purpose**: Create/update hidden lineage + inferences (including batch import from JSON).

**Input**

```ts
{
  id?: string
  bookId: string
  sourceName: string
  sourceChapterTitle?: string
  sourceSummary?: string
  sourceMethodNotes?: string
  provenanceCitation?: string
  gmFaceInference?: string
  nationInference?: string
  archetypeIdInference?: string
  confidenceScore?: number
  notesJson?: string
  campaignDomain?: string
  classificationStatus?: string
}
```

**Output**

```ts
Promise<{ success: true; id: string } | { error: string }>
```

---

### adminUpsertNPCCoach

**Purpose**: Create/update surfaced mentor and bind to `SourceCoachRecord`.

**Input**

```ts
{
  id?: string
  sourceCoachRecordId: string
  displayName: string // In-world character name (required)
  title?: string
  nationKey?: string
  archetypeId?: string
  gmFace: string
  temperament?: string
  introCopy?: string
  teachingStyle?: string
  homeAccessRule: 'nation_only' | 'archetype_only' | 'nation_or_archetype' | 'nation_and_archetype'
  homeNationKey?: string | null
  homeArchetypeId?: string | null
  allowedDevelopmentalLenses?: string | null // JSON string[] or null
  isUnlockedByDefault?: boolean
  visibilityRuleJson?: string
}
```

**Output**

```ts
Promise<{ success: true; id: string } | { error: string }>
```

---

### adminBindCoachToQuestThread

**Purpose**: Attach coach to library thread.

**Input**

```ts
{ threadId: string; npcCoachId: string | null }
```

**Output**

```ts
Promise<{ success: true } | { error: string }>
```

- **Server Action** — sets `QuestThread.npcCoachId`.

---

### adminBatchClassifySourceCreators (optional v1)

**Purpose**: Run or enqueue batch classification; persists to `SourceCoachRecord` rows.

**Input**

```ts
{
  bookId: string
  /** When true, replace inferences on existing rows for that book */
  overwrite?: boolean
}
```

**Output**

```ts
Promise<
  | { success: true; jobId: string; created: number; updated: number }
  | { error: string }
>
```

- **Server Action** — may delegate to background job; API shape is stable even if implementation is async.

---

### simulateCoachRouting (admin / dev)

**Purpose**: Same inputs as `listNPCCoachesForPlayer` for authoring QA.

**Input**: Same as `listNPCCoachesForPlayer`.

**Output**: Same as `listNPCCoachesForPlayer` plus optional `debugScores` for tuning.

---

## Integration Points (non-API)

- **Quest completion**: After library quest/thread completion, call `recordProvenanceUnlock` when product rules match (configurable per `NPCCoach` or `QuestThread`).
- **Daemon / charge**: Existing `DaemonSeed`, `BarChargeCapture`, EFA flows may emit `recordProvenanceUnlock` with `daemon_gate` when spec’d.
- **Book pipeline**: On `createThreadFromBook`, admin or automation sets `npcCoachId` if the thread maps to a single coach row.
- **Save Yourself campaigns**: Use `campaignDomain` on `SourceCoachRecord` + thread metadata; no separate engine required in v1 beyond filtering and copy.

---

## Acceptance Criteria (API-level)

1. `listNPCCoachesForPlayer` never returns real-world `sourceName`.
2. `listNPCCoachesForPlayer` **enforces** home membership **or** valid **share-intro** path, **lens/face rules**, and sets **`accessTier`** (full vs shared intro until mastery). Never returns real `sourceName`.
3. `getProvenancePayload` returns `unlocked` only when `PlayerCoachProvenance` has `provenanceRevealedAt` set.
4. `adminUpsertNPCCoach` rejects `gmFace` not in the canonical six (validate server-side); requires non-empty `displayName` (character name).
5. `adminBindCoachToQuestThread` updates `QuestThread.npcCoachId` and is idempotent.
6. **BAR share** unlocks coach **introduction** for the invitee; **basic mastery** (nation or archetype) is still required for **full** coach use (`accessTier`), per [Share unlock vs mastery](#share-unlock-vs-mastery-dd-spell-metaphor).
7. All public contracts above have typed implementations and are importable from a single `types` module for UI and tests.

---

## Non-Goals (v1)

- Real-time conversational AI for each coach.
- Automatic perfect classification without admin review.
- Route Handlers for third parties (unless explicitly added later with OpenAPI snippet in this spec).

---

## Seed Deliverable

**Canonical seed files**: [.specify/specs/npc-coach-system/codex/npc_codex_seed.json](codex/npc_codex_seed.json) (v0.1+). Import via `adminUpsertSourceCoachRecord` + `adminUpsertNPCCoach` in batch; stored fields match API input shapes. Version the JSON with `schemaVersion` in a wrapper object when the codex schema grows (confidence, rationales — see [codex/npc_codex_workflow_spec.md](codex/npc_codex_workflow_spec.md) Phase 5).

---

## File Placement (implementation hint)

| Area | Suggested path |
|------|----------------|
| Types + Zod | `src/lib/npc-coach/types.ts`, `schemas.ts` |
| Server actions | `src/actions/npc-coach.ts` |
| Routing engine | `src/lib/npc-coach/routing.ts` |
| Tests | `src/lib/npc-coach/__tests__/routing.test.ts`, action tests with mocked Prisma |

---

## Revision

| Date | Change |
|------|--------|
| 2026-03-28 | Initial API-first spec |
| 2026-03-29 | Codex folder (`codex/`), workflow + seed + review; character names; home membership; lens/face gating; BAR share note |
| 2026-03-29 | BAR share unlocks intro; mastery gate for full use (D&D metaphor); human/agent authoring parity |
