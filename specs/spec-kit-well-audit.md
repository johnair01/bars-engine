# Spec Kit — Well Audit Implementation
## Six fixes named by the Challenger

> *Challenger voice: Name what's being avoided. Push into stakes. What breaks if you don't fix this?*

Status: Ready to implement (post-Hexagram 48 Sage/I Ching audit)
Branch target: `ooo/run/well-audit`

---

## The Question the Challenger Asks First

You built the Well. The rope reaches the water. But you are routing players through sessionStorage for one of the most important moments in the entire flow — when they choose to crystallize a charge into a BAR. What happens when that tab closes? What happens on mobile? The player did the shadow work. The mask has a name. The fear is named. And then the vessel fails at the last step.

Is that acceptable?

No. Fix it. Here are the six moves, ordered by blast radius.

---

## Fix 1 — SceneCard subtext: `string` → `React.ReactNode`

**What's being avoided**: Doing the one-line type change that unlocks privacy link badges, warnings, formatted hints.

**Stakes**: Right now, every privacy-adjacent `subtext` in the codebase is a plain string. When `/privacy` exists, you cannot link to it from a `string`. You will have to change `subtext` to `ReactNode` at that moment anyway, under deadline pressure, touching every usage. Do it now when there are 4 usages.

**File**: [src/components/scene-card/SceneCard.tsx](src/components/scene-card/SceneCard.tsx#L22)

**Change**:
```diff
- subtext?: string
+ subtext?: React.ReactNode
```

**Render site** (already correct — just needs type change):
```tsx
{subtext && <p className="text-zinc-600 text-xs">{subtext}</p>}
```
`ReactNode` renders a string, a JSX element, or null. This is a backwards-compatible change. All existing string usages continue to work.

**GM Face**: Systems Architect (1-line, zero migration risk)

---

## Fix 2 — Server-Persist 321 Draft (replace sessionStorage BAR handoff)

**What's being avoided**: Admitting that the sessionStorage handoff is not a feature. It is a bug with a pleasant name.

**Stakes**: Player descends 10 phases. Names the mask. Names the fear. Chooses aligned action. Taps "Create BAR." On mobile: tab refreshes. sessionStorage is gone. All of it: gone. They land on `/create-bar` with an empty form and no memory of what just happened. The well drew up an empty bucket.

**The fix**: Persist the draft server-side before routing. Read it on arrival.

### New server action — `src/actions/charge-metabolism.ts`

Add:
```typescript
export async function persist321Draft(data: {
  phase3Snapshot: string
  phase2Snapshot: string
  alignedAction: string
}): Promise<{ draftId: string }> {
  const player = await getCurrentPlayer()
  // Store in existing ShadowSession or a new Draft model (see schema note)
  // Returns opaque draftId
}

export async function get321Draft(draftId: string): Promise<{
  phase3Snapshot: string
  phase2Snapshot: string
  alignedAction: string
} | null>
```

### Schema — two options, Challenger picks the simpler one

**Option A** (preferred): Add `draft` column to `ShadowSession` for incomplete sessions.
```sql
ALTER TABLE "shadow_sessions" ADD COLUMN IF NOT EXISTS "draft" JSONB;
ALTER TABLE "shadow_sessions" ADD COLUMN IF NOT EXISTS "draftExpiresAt" TIMESTAMP;
```

**Option B**: New `Draft` model (only if `ShadowSession` lacks flexibility).

Use Option A. Do not build a second kingdom.

### Client change — `Shadow321Runner.tsx`

Replace `handleCreateBAR()`:
```typescript
async function handleCreateBAR() {
  setError(null)
  startTransition(async () => {
    const metadata = buildMetadata()
    const phase2 = { ... }
    const result = await persist321Draft({
      phase3Snapshot: JSON.stringify({ identityFreeText: ... }),
      phase2Snapshot: JSON.stringify(phase2),
      alignedAction: alignedAction || '',
    })
    if ('error' in result) { setError(result.error); return }
    router.push(`/create-bar?from321=1&draftId=${result.draftId}`)
  })
}
```

### Read site — `/create-bar` page

Read `draftId` from query params → call `get321Draft()` server-side → prefill BAR form.
Remove all `sessionStorage.getItem('shadow321_metadata')` reads.

**Expires**: drafts should auto-expire after 24h. Add a cron or set `draftExpiresAt` and filter in the read action.

**GM Face**: Systems Architect primary, Steward review (draft data contains tension vector — it is not raw journal text, but treat it with the same care)

---

## Fix 3 — Witness Note as First-Class Artifact

**What's being avoided**: Acknowledging that "save without dispatch" is not an escape hatch. It is a valid completion state.

**Stakes**: Some of the deepest 321 sessions end in stillness. The player named something real and does not yet know what to do with it. If the UI presents Witness Note as a small grey link under four primary buttons, you are telling them: "this is the lesser outcome." That is the opposite of what the Sage teaches. Holding without dispatching IS the completion. The artifact is the witnessing.

**Current state** in `Shadow321Runner.tsx` artifact phase: Witness Note rendered as secondary/escape link.

**Fix**: Elevate Witness Note to a peer dispatch card in the artifact grid.

### Artifact dispatch grid — updated layout

```
┌─────────────────┬─────────────────┐
│   Turn to Quest  │   Create BAR    │
├─────────────────┼─────────────────┤
│  Discover Daemon │  Fuel System    │
├─────────────────┴─────────────────┤
│         Witness Note              │  ← full-width card, equal weight
└───────────────────────────────────┘
```

Witness Note card copy:
- Label: `Witness Note`
- Subtext: `Hold this without dispatch. The session is complete.`
- Style: same card weight as the others, NOT smaller/greyed/secondary

**`handleSaveAndClose()`** — already calls `persist321Session()`. No server change needed. UI only.

**GM Face**: Experience Designer primary, Encounter Designer review

---

## Fix 4 — Pre-Fetch Nation Moves at Session Start

**What's being avoided**: Pretending a loading state mid-session is acceptable UX.

**Stakes**: The player has completed archetype reveal, answered community questions, and is about to enter their nation's move selection. They wait. A spinner appears inside a contemplative flow. The ritual is broken by infrastructure. This is the wrong moment to discover the rope is short.

**Current state** in `CharacterCreatorRunner.tsx`: `getNationMoves()` called lazily when transitioning to `nation_moves` phase.

**Fix**: If player has an existing `nationId` (loaded from `getCharacterCreatorData()`), pre-fetch moves server-side and pass them as props. For new sessions where nation is discovered during the flow, trigger the fetch immediately when the nation discovery score is resolved — not when the player taps "Continue" to `nation_moves`.

### Server-side (already have player nation from `getCharacterCreatorData()`)

```typescript
// In character-creator/page.tsx:
const { archetypes, playerNation, existingPlaybook } = await getCharacterCreatorData()
const nationMoves = playerNation ? await getNationMoves(playerNation.id) : null

// Pass to runner:
<CharacterCreatorRunner
  archetypes={archetypes}
  playerNation={playerNation}
  existingPlaybook={existingPlaybook}
  initialNationMoves={nationMoves}  // ← new prop, null if unknown
/>
```

### Client-side — eager fetch on nation score resolution

```typescript
// When nation discovery completes and topNationKey is determined:
useEffect(() => {
  if (topNationKey && !nationMoves) {
    getNationMoves(resolvedNationId).then(setNationMoves)
  }
}, [topNationKey])
```

This fires during the last nation discovery question or the transition pause — giving the fetch a full scene's worth of time before the player needs the moves.

**GM Face**: Experience Designer primary, Systems Architect secondary

---

## Fix 5 — Split `saveCharacterPlaybook` into Named Mutations

**What's being avoided**: Naming what `saveCharacterPlaybook` actually does.

**Stakes**: One server action doing three things — upsert player record, assign moves, assign bonds — is a debugging nightmare when one of those three fails silently. The player submits. The action "succeeds." But their moves were never written because the archetype join failed and the error was swallowed by the outer catch. They share their character URL. It renders empty moves. That is not a ritual. That is a broken artifact.

**Current state**: `src/actions/character-creator.ts` — `saveCharacterPlaybook()` does upsert + moves + bonds in one action.

**Split into**:
```typescript
// Named mutations — composable, individually testable
export async function upsertCharacterRecord(data: UpsertCharacterData): Promise<{ id: string }>
export async function assignCharacterMoves(playbookId: string, moveIds: string[]): Promise<void>
export async function assignCharacterBonds(playbookId: string, bondIds: string[]): Promise<void>

// Orchestrator — calls the three in sequence, surfaces which step failed
export async function saveCharacterPlaybook(data: SaveCharacterData): Promise<SaveResult>
```

`SaveResult`:
```typescript
type SaveResult =
  | { success: true; playbookId: string; shareToken: string }
  | { error: string; step: 'upsert' | 'moves' | 'bonds' }
```

The orchestrator surfaces which step failed. The client can show: "Your character was saved but moves failed to assign — tap to retry." Without the named steps, the error has no address.

**GM Face**: Systems Architect primary

---

## Fix 6 — Move `buildMetadata321` Derivation to Server Action

**What's being avoided**: Admitting that transform logic in a client component is transform logic that cannot be tested, logged, or audited.

**Stakes**: `buildMetadata()` in `Shadow321Runner.tsx` calls `deriveMetadata321()` with manually assembled arguments. If that derivation has a bug — wrong field mapping, missing `alignedAction`, malformed `phase3Snapshot` — there is no server log. The metadata goes to `createQuestFrom321Metadata()` pre-broken. The quest is created with bad provenance. The lineage is corrupt.

**Fix**: Move derivation to server boundary.

### New server action — `src/actions/charge-metabolism.ts`

```typescript
export async function deriveAndPersist321Metadata(
  answers: {
    chargeDescription: string
    maskShape: string
    maskName: string
    lifeState: string
    rootCause: string
    integrationShift: string
    alignedAction: string
  }
): Promise<{ metadata: Metadata321; sessionId: string }>
```

This action:
1. Calls `deriveMetadata321()` server-side
2. Persists the session (replaces `persist321Session()` in most paths)
3. Returns the derived metadata for client display (alchemy reveal needs it)
4. Logs the derivation for lineage auditing

### Client change

Call `deriveAndPersist321Metadata()` at the `alchemy` phase transition — the moment the player finishes `be_2` and the Integrator voice is about to reveal the satisfied state. At this point all answers are locked. The derivation fires once, server-side, and is stored.

All subsequent artifact dispatch actions (quest, daemon, fuel) read from the stored session by `sessionId` — not from in-memory client state.

**GM Face**: Systems Architect primary, Integrator review (lineage integrity)

---

## Execution Order

| Priority | Fix | Risk | Blast Radius |
|---|---|---|---|
| 1 | SceneCard `subtext: ReactNode` | None | 1 file, 1 type |
| 2 | Witness Note first-class | None | 1 component, UI only |
| 3 | Pre-fetch nation moves | Low | 2 files, new prop |
| 4 | Split `saveCharacterPlaybook` | Medium | 1 action, add named exports |
| 5 | Move `buildMetadata` to server | Medium | Runner + action, session shape |
| 6 | Server-persist 321 draft (BAR path) | Medium | Schema + action + handoff |

Do 1 and 2 first. They are zero-risk and fix visible player experience now.
Do 3 before the next character creator playtest.
Do 4, 5, 6 together — they share the `ShadowSession` schema change.

---

## What the Challenger Leaves You With

These six fixes are not enhancements. They are the difference between a well that holds water and a well that loses water at the moment the player tries to drink.

The mask was named. The fear was spoken. The aligned action was chosen.

Don't drop it.

---

*Spec authored: 2026-03-13*
*GM Face: Challenger primary, Systems Architect secondary, Integrator review*
*Trigger: Hexagram 48 — The Well audit (Sage)*
