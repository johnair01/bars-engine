# Spec: Daemon Move System

## Purpose

Implement the Daemon Move System — a witnessed, tiered move taxonomy that binds daemons to Wuxing elements, enables player-authored moves to grow into canonical status through community witnessing, and unifies daemon discovery with `Shadow321Runner` at `/shadow/321`. Closes the loop between shadow work and gameplay obstacle clearing.

**Problem**: Daemons lack intrinsic elemental channels, so move injection routes incorrectly (defaults to Metal regardless of the daemon's nature). Player-authored moves have no governance ladder. The shadow work loop (`/shadow/321` → daemon discovery → summon → apply → BAR) is broken by missing fields and the absence of somatic gating and vow mechanics.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Move quality axis | Witnessed vs. unwitnessed — not AI vs. human. A witnessed player move outranks an AI-proposed canonical. |
| Daemon as witness | Move = vow, not instrument. The daemon witnesses the player's commitment, not just receives a label. |
| Daemon channel | Required at discovery, not retrofittable. Channel = WuxingElement; altitude = AlchemyAltitude. |
| Move tier ladder | `EPHEMERAL → CUSTOM → CANDIDATE → CANONICAL` — promotion requires witnessing + Regent gate |
| AI provenance | `AI_PROPOSED` is always visually distinct; player must confirm (witnessing declaration) before move is active |
| Canonical moves | Versioned and deprecated with forward pointers, never deleted |
| Daemon level | Computed from weighted `QuestMoveLog.outcome` entries, not stored as a counter |
| Shadow 321 flow | `Face / Talk / Be` steps are prerequisites to daemon summon — somatic gate appears before summon UI |
| Collective daemon | Community tide → GM-named collective daemon → collective moves (not yet MVP) |
| Dissolution | High-level daemon becomes unnecessary when integrated — system reflects dissolution, not power accumulation |

## Conceptual Model

| Dimension | Value |
|-----------|-------|
| **WHO** | Player (shadow work, custom move naming); GM (canonical move authorship, Regent review) |
| **WHAT** | `NationMove` with tier/origin/channel; `DaemonMoveCreation` lineage record; `QuestMoveLog.outcome` |
| **WHERE** | `/shadow/321` → daemon discovery → summon → apply move → BAR completion → Vow |
| **Energy** | Emotional charge enters via 321 shadow work; daemon metabolizes it; move application closes the loop |
| **Personal throughput** | Clean Up (summon) → Show Up (apply + BAR) → Grow Up (vow witnesses the daemon) |

## API Contracts (API-First)

### `awakenDaemonFrom321` (Server Action)

**Input**: `{ shadow321SessionId: string; channel: WuxingElement; altitude: AlchemyAltitude; name: string }`
**Output**: `{ daemon: Daemon }`

```ts
function awakenDaemonFrom321(input: {
  shadow321SessionId: string
  channel: WuxingElement        // WOOD | FIRE | EARTH | METAL | WATER
  altitude: AlchemyAltitude     // DISSATISFIED | NEUTRAL | SATISFIED
  name: string
}): Promise<{ daemon: Daemon }>
```

### `createCustomMove` (Server Action)

**Input**: `{ daemonId: string; rawEmbodyText: string; rawWitnessText: string; rawActionText: string; channel: WuxingElement }`
**Output**: `{ moveCreation: DaemonMoveCreation }`

```ts
function createCustomMove(input: {
  daemonId: string
  rawEmbodyText: string
  rawWitnessText: string
  rawActionText: string
  channel: WuxingElement
}): Promise<{ moveCreation: DaemonMoveCreation }>
```

### `nominateMove` (Server Action, player)

**Input**: `{ moveCreationId: string; nominationStatement: string }`
**Output**: `{ nationMove: NationMove }` — move promoted to `CANDIDATE` tier pending Regent review

### `reviewMoveNomination` (Server Action, admin/Regent)

**Input**: `{ nationMoveId: string; decision: 'approve' | 'reject'; rationale?: string }`
**Output**: `{ nationMove: NationMove }`

### `recordQuestMoveOutcome` (Server Action)

**Input**: `{ questMoveLogId: string; outcome: QuestMoveOutcome }`
**Output**: `{ level: number }` — recomputed daemon level

```ts
type QuestMoveOutcome = 'ABANDONED' | 'COMPLETED' | 'BAR_WRITTEN' | 'TAUGHT_BACK'
// Weights: ABANDONED=0.25, COMPLETED=1.0, BAR_WRITTEN=1.5, BAR+vow=2.0, nominated_to_canonical=5.0
```

### `declareMoveVow` (Server Action)

**Input**: `{ daemonId: string; barId: string; vowText: string }`
**Output**: `{ vowRecord: DaemonMoveCreation }` — links BAR completion to vow declaration

## User Stories

### P1: Player discovers daemon with correct channel at 321

**As a player**, I want to name and channel my daemon during 321 shadow work, so the move injection routes correctly to channel-appropriate moves instead of always defaulting to Metal.

**Acceptance**: `awakenDaemonFrom321` creates `Daemon` with `channel` + `altitude` set. Move injection in `selectScene` routes by `daemon.channel`.

### P1: Somatic gate before daemon summon

**As a player**, I want a somatic gate (body location / felt-sense question) before I summon my daemon, so I connect to the physical reality of the shadow pattern before naming it.

**Acceptance**: `/shadow/321` somatic gate prompt appears before daemon summon UI. Gate is not bypassable.

### P2: Player creates a custom move from 321 raw text

**As a player**, I want to name a move from my Embody/Witness/Action answers, so my lived insight becomes a playable move.

**Acceptance**: `DaemonMoveCreation` record created with `rawEmbodyText`, `rawWitnessText`, `rawActionText`, `channel`, nullable `moveId`. Move enters as `CUSTOM` tier.

### P2: Player vows to daemon after BAR completion

**As a player**, I want to declare a Vow to my daemon after completing a BAR, so the daemon witnesses my commitment and the relationship deepens.

**Acceptance**: "Vow to [daemon]" flow appears after BAR completion. Written witness declaration stored. Daemon level recalculated.

### P3: GM promotes move to CANONICAL

**As a GM (Regent)**, I want to review nominated moves and promote the most resonant ones, so the canonical namespace grows from community witnessing rather than GM fiat.

**Acceptance**: Admin interface shows `CANDIDATE` moves with nomination statements. `reviewMoveNomination` promotes to `CANONICAL` or rejects. Semantic fingerprint check surfaces near-matches before creation.

## Functional Requirements

### Phase 1: Shadow321Runner + Somatic Gate

- **FR1**: `/shadow/321` carries `Face / Talk / Be` steps per scene-card grammar before daemon awakening
- **FR2**: Somatic gate prompt (body location + felt-sense question) appears as a step before daemon summon UI
- **FR3**: `awakenDaemonFrom321` creates `Daemon` with required `channel` + `altitude` fields

### Phase 2: Schema — Daemon + NationMove + DaemonMoveCreation

- **FR4**: `Daemon` model gains: `channel` (`WuxingElement`), `altitude` (`AlchemyAltitude`), `collective` (Bool), `communityScope` (String?)
- **FR5**: `NationMove` gains: `tier` (`EPHEMERAL|CUSTOM|CANDIDATE|CANONICAL`), `origin` (`GM_AUTHORED|PLAYER_NAMED|AI_PROPOSED`), `channel` (`WuxingElement`), `moveFamilyId` (String?), `parentMoveId` (String?), `deprecatedAt` (DateTime?), `supersededById` (String?)
- **FR6**: New `DaemonMoveCreation` model: `id`, `daemonId`, `rawEmbodyText`, `rawWitnessText`, `rawActionText`, `channel`, `moveId` (nullable, set after incubation), timestamps
- **FR7**: `QuestMoveLog` gains: `outcome` (`ABANDONED|COMPLETED|BAR_WRITTEN|TAUGHT_BACK`)

### Phase 3: Daemon Level Computation

- **FR8**: `computeDaemonLevel(daemonId): number` — reads `QuestMoveLog` entries for this daemon's moves, applies outcome weights, returns float level
- **FR9**: Level is computed on-read, not stored as a counter on `Daemon`

### Phase 4: Move Injection Routing

- **FR10**: `selectScene` routes move injection by `daemon.channel` to channel-appropriate canonical moves — not always Metal defaults
- **FR11**: Canonical moves exist for all 5 Wuxing elements with all 4 move classes (Descent, Witness, Containment, Discharge)

### Phase 5: Governance + Nomination

- **FR12**: `nominateMove` promotes `CUSTOM` to `CANDIDATE`; semantic fingerprint check surfaces near-matches
- **FR13**: Admin `/admin/daemon-moves` queue shows `CANDIDATE` moves; `reviewMoveNomination` promotes to `CANONICAL` or rejects
- **FR14**: `AI_PROPOSED` provenance is visually distinct in move panel; requires player witnessing declaration before becoming active

### Phase 6: Vow Mechanic

- **FR15**: "Vow to [daemon]" UI appears after BAR completion when player has an active daemon
- **FR16**: `declareMoveVow` stores written witness declaration; recalculates daemon level with `BAR+vow` weight (2.0)

## Non-Functional Requirements

- AI provenance is NEVER interchangeable with human authorship in the move panel
- Custom moves are daemon-scoped with tier `CUSTOM` and never enter `CANONICAL` without Regent nomination
- Non-AI path is first-class — all moves can be created without AI classification
- Canonical moves are versioned with `deprecatedAt` + `supersededById`; never deleted

## Persisted data & Prisma

| Check | Done |
|-------|------|
| All model changes named in Design Decisions + API Contracts | |
| `tasks.md` includes migration for `DaemonMoveCreation` + Daemon/NationMove/QuestMoveLog field additions | |
| `npm run db:sync` after schema edit | |
| Human reviews migration SQL — ensure new fields are nullable or have defaults | |

**New model** `DaemonMoveCreation`:
```prisma
model DaemonMoveCreation {
  id              String   @id @default(cuid())
  daemonId        String
  rawEmbodyText   String
  rawWitnessText  String
  rawActionText   String
  channel         String   // WuxingElement
  moveId          String?  // set after incubation/nomination
  createdAt       DateTime @default(now())

  @@map("daemon_move_creations")
}
```

**Migration name**: `add_daemon_move_system`

## Verification Quest

- **ID**: `cert-daemon-move-system-v1`
- **Steps**:
  1. Navigate to `/shadow/321` — verify somatic gate appears before daemon summon
  2. Complete 321 → awaken daemon with channel WOOD + altitude DISSATISFIED
  3. Apply a channel-appropriate move (not Metal default) — verify routing
  4. Complete a BAR — verify "Vow to [daemon]" prompt appears
  5. Write vow declaration — verify daemon level updates
  6. Nominate a custom move in admin — verify CANDIDATE status + semantic near-match check
- **Narrative**: "Validate the daemon move system so shadow work at the residency produces canonical moves the community can witness."

## Dependencies

- `1.23 DU` — Deftness Uplevel: Character, Daemons, Agents (daemons discovery base)
- `src/lib/quest-grammar/` — `MoveFamily`, `EmotionalVector`, `getMoveFamily`
- `src/lib/alchemy/wuxing.ts` — Wuxing elements, channel routing
- `src/actions/daemons.ts` — existing daemon CRUD
- `/shadow/321` — `Shadow321Runner`

## References

- Seed: [seed-daemon-move-system.yaml](../../../seed-daemon-move-system.yaml)
- Key decisions: witnessed_vs_unwitnessed; daemon_as_witness; sheng_vs_ke; dissolution_not_accumulation
- Source: 6 GM Sect critique (Architect, Challenger, Shaman, Regent, Diplomat, Sage)
