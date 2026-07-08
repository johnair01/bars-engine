# Spec: Emotional Alchemy as a Service (design only — not yet built)

## Purpose

Turn Emotional Alchemy from a standalone route into a **shared charge→practice service** that many bars-engine surfaces call, and make **charge capture** its first trigger — logging each practice as an **extension of BARs logging** (a session that hangs off the charge BAR, mirroring `Shadow321Session`).

**Status**: DESIGN ONLY. This spec defines the API-first contract and the integration architecture; **no code is built in this pass** (per product decision). `tasks.md` is the phased build plan for later.

**Problem**: `/practice/diagnose` is an island. The repo already has three charge-processing front doors doing overlapping, ad-hoc work — `/capture` (charge → quest suggestions), `/emotional-first-aid` (Vibes tag → `recommendFirstAidToolKey`), and quest/roadblock blockers. The principled engine we built (`recommendPractice`) should serve all three, and the practice should be logged where charges already live (the BAR).

**Practice**: Deftness Development — **API-first** (define the service seam + log contract before any UI rewiring), deterministic over AI, one source of truth. The engine (`src/lib/emotional-alchemy/`) is already pure; this adds the *invocation* and *logging* seams.

## Conceptual Model (WHO / WHAT / WHERE / Energy / Throughput)

- **WHO**: any player (or NPC flow) holding a live charge.
- **WHAT**: the Emotional Alchemy service — one seam that takes a **seed** (a partially-known charge) → runs the diagnostic + composer → returns a **practice** and logs a **session**.
- **WHERE**: invoked from many surfaces (capture, EFA, quest/roadblock, deck, daemon); the practice runs at `/practice/diagnose` (route) or inline (sheet).
- **Energy**: the charge is the fuel; the logged `AlchemySession` + the Show Up commitment are the artifacts (extends the BAR's lineage — the same shape as 321).
- **Personal throughput**: the drawn card fixes the WAVE move; the composer fixes the tool; the session logs the rep.

## The merge — one service, three (or more) front doors

Every trigger becomes a thin caller that builds an `AlchemySeed` and hands it to the service. The diagnostic **skips the questions the seed already answers** (it already computes remaining steps via `planSteps`).

| Front door | What it already knows → seed | What the player still answers |
|---|---|---|
| **Charge capture** (`/capture`) | `channel` (`emotion_channel`), `altitude` (`satisfaction`), `intensity` (1–5→0–10), blocker text, `barId` | time, temporal, fuel, forks, then draw + practice |
| **Emotional First Aid** (`/emotional-first-aid`) | `vibeTag` → channel/shape hint (e.g. `numb`→flat fork, `boundary-leak`→anger/T06) | channel confirm, intensity, the rest |
| **Quest / roadblock** | blocker text (the stuck point), maybe `channel` | full diagnostic |
| **Deck** | `drawnCardId` (card already chosen) → skips the draw | the diagnostic, then straight to the practice card |
| **Daemon** | `threadLabel` (the recurring pattern) | full diagnostic on this thread |

The service normalizes all of these into the same `DiagnosticAnswers` prefill. **Raw blocker/story text never leaves the client (§1.6)** — the seed passes a *reference* (the BAR id for provenance, or a client-held key), not persisted text.

## API Contracts (API-First) — the seam to build later

### 1. The invocation seam (pure lib) — `src/lib/emotional-alchemy/service.ts`

```ts
export type AlchemySource = 'capture' | 'efa' | 'roadblock' | 'deck' | 'daemon' | 'manual'

export interface AlchemySeed {
  source: AlchemySource
  channel?: EmotionChannel
  intensity?: number          // 0–10 (normalized; capture's 1–5 scaled on ingest)
  altitude?: Altitude
  threadLabel?: string
  drawnCardId?: string        // deck source: pre-drawn Allyship card → skip the draw
  vibeTag?: string            // EFA source → channel/shape hint
  barId?: string              // the charge BAR this extends (BARs logging + provenance)
  returnTo?: string           // where to send the player after the practice
  // NB: no raw blocker/story text — carried in client state only (§1.6)
}

/** Build the diagnostic prefill from a seed (skips seeded steps). */
export function seedToAnswers(seed: AlchemySeed): Partial<DiagnosticAnswers>
/** Map an EFA Vibes-Emergency tag to seed hints. */
export function seedFromVibeTag(tag: string): Pick<AlchemySeed, 'channel' | 'vibeTag'>
/** Canonical entry URL (mirrors 321's ?chargeBarId=/?returnTo=). */
export function alchemyHref(seed: AlchemySeed): string   // /practice/diagnose?src=&bar=&ch=&i=&thread=&card=&return=
/** Parse the URL back into a seed (route entry). */
export function seedFromParams(params: URLSearchParams): AlchemySeed
```

### 2. The logging seam (Server Action) — `src/actions/alchemy-session.ts` (`'use server'`)

Structured-only (§1.6). Mirrors `persist321Session`; unifies Practice Atlas targets 4 (Show Up artifact) + 5 (session log) as an **extension of BAR logging**.

```ts
export interface AlchemySessionInput {
  chargeSourceBarId?: string          // the charge BAR this extends (FK, like Shadow321Session)
  source: AlchemySource
  vectorBefore: EmotionalVector
  drawnCardId?: string
  toolId: string
  rolePath: MoveRole[]
  showUp?: { kind: 'internal' | 'external' | 'declined'; recipient?: string; date?: string; doneCheck?: boolean }
  vectorAfterIntensity?: number       // re-rate (§1.5)
  timeboxKept?: boolean
  exitedGracefully?: boolean
  threadLabel?: string
  flags: DiagnosticFlag[]
  // NB: NO raw blocker/story text (§1.6)
}
export async function logAlchemySession(
  input: AlchemySessionInput
): Promise<{ success: true; sessionId: string } | { error: string }>
```

- **Route vs Action**: **Server Action** (form/React, returns `{success}|{error}`) — not a route handler. No external consumer. Deterministic; AI never on this path.
- **Provenance**: on success, optionally set `CustomBar.sourceAlchemySessionId` (new field) so the charge BAR links back to the practice — exactly how `source321SessionId` works today.

### 3. The diagnostic becomes seedable + returns (small change to existing components)

- `DiagnoseClient` accepts an optional `seed` (from `seedFromParams` at the route, or a prop for the inline sheet) and a `returnTo`.
- On practice completion / Show Up choice, it calls `logAlchemySession` (when a `barId` is present) and, if `returnTo` is set, offers "← back to <caller>".

## Persisted data & Prisma (design — build later)

New model, mirroring `Shadow321Session`:

```prisma
model AlchemySession {
  id                 String   @id @default(cuid())
  playerId           String
  chargeSourceBarId  String?  // extends BAR logging (like Shadow321Session.chargeSourceBarId)
  source             String
  channel            String
  intensityBefore    Int
  altitude           String
  target             String
  drawnCardId        String?
  toolId             String
  rolePath           String   // json
  showUpKind         String?
  showUpRecipient    String?
  showUpDate         DateTime?
  showUpDoneCheck    Boolean?
  intensityAfter     Int?
  timeboxKept        Boolean?
  exitedGracefully   Boolean  @default(false)
  threadLabel        String?
  flags              String   // json
  createdAt          DateTime @default(now())
  // relations: player, chargeSourceBar (CustomBar)
}
// + CustomBar.sourceAlchemySessionId String? (provenance back-link)
```

Migration + `migrate deploy` + committed SQL are **tasks.md items** (not this pass). No raw text columns (§1.6).

## Consolidation (the G4 story — later phases)

Emotional Alchemy becomes the **single charge→practice brain**:
- `/emotional-first-aid` routes its Vibes tags through `recommendPractice` (retire `recommendFirstAidToolKey` / `DEFAULT_FIRST_AID_TOOLS` as the recommender; keep the tools as registry entries — that's registry gap G4).
- `/capture`'s ad-hoc quest suggestion stays, but "metabolize" becomes the primary charge outlet.
- One tool registry (G4) backs all recommendations.

## User Stories (for the build phases)

- **P1 (capture)**: As a player who just captured a charge, I want "Metabolize it now →" that opens the practice pre-filled from my charge, and logs the result on that charge. (Trigger 1 + logging.)
- **P2 (EFA)**: As an activated player, I want the Vibes-Emergency to hand me a real practice (composer-driven), not just a tool name.
- **P3 (roadblock)**: As a player stuck in a quest, I want to metabolize the blocker without leaving the quest, then return.
- **P4 (service)**: As a bars-engine surface, I want one `alchemyHref(seed)` / inline entry so I never reimplement charge→practice.

## Verification Quest (when built)
`cert-emotional-alchemy-service-v1` — capture a charge → "Metabolize it now" → the diagnostic opens pre-filled (channel/altitude skipped) → practice → the session is logged on that charge (visible in the vault) → confirm no raw text persisted; then repeat entry from the EFA tag. (Framed toward the Bruised Banana Fundraiser.)

## Dependencies
- targets 1–3 + deck draw (`src/lib/emotional-alchemy/`) — the engine (built).
- `src/actions/charge-capture.ts` (`CreateChargeBarPayload`, the charge BAR), `src/actions/charge-metabolism.ts` (`persist321Session` — the logging precedent), `prisma/schema.prisma` (`Shadow321Session`, `CustomBar`).
- `src/lib/emotional-first-aid.ts` (`VIBES_EMERGENCY_OPTIONS` — the vibe→seed map).

## References
- `.specify/specs/321-shadow-process/spec.md` (session-against-charge precedent, `?chargeBarId=`/`?returnTo=`)
- `docs/MTGOA_PRACTICE_ATLAS.md` §1.6 (privacy), targets 4–5 (Show Up artifact + session log — realized here as BAR-logging extension)
- `docs/CARD_SYSTEM_ALIGNMENT.md`, `prisma-migration-discipline` skill (for the migration task)
