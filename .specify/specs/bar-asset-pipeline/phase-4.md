# Phase 4 — Feedback Loop: Play Data → BarSeed

**Owner:** wendellbritt | **Sprint:** sprint/bar-asset-pipeline-001 | **Date:** 2026-04-20  
**Parent spec:** `.specify/specs/bar-asset-pipeline/spec.md` (Phases 1–3)

---

## Problem Statement

The forward pipeline (Phases 1–3) is complete: author → BarSeed → BarAsset → CustomBar → render. Phase 4 closes the loop: player choices and outcomes become new BarSeed inputs that feed back into the pipeline.

This is the step that makes the content generative — not a one-shot pipeline but a flywheel.

---

## The Loop Architecture

```
Constructor A: NL Author
    ↓ (BarSeed, maturity = shared_or_acted)
Constructor B: Translation Layer (Phase 2)
    ↓ (BarAsset, maturity = integrated)
Constructor C: Game Render (CustomBar → Twine/UI)
    ↓ (play data: choices, outcomes, completion)
Constructor A feedback: Play data → BarSeed (new cycle)
```

**Critically:** The same structured id convention (`{barType}_{creator}_{sequence}`) applies to feedback-generated BARs. The `creator` field tracks provenance — `{barType}_playtest_{N}` for AI-generated-from-play, `{barType}_author_{N}` for human-authored.

---

## What's New in Phase 4

### 1. PlayData type

Raw player interaction data captured at game events:

```typescript
interface PlayData {
  sourceBarId: string         // BarAsset that was played
  playerId: string            // player UUID
  eventType: 'choice' | 'outcome' | 'completion' | 'abandon'
  payload: {
    selectedOption?: number   // choice index
    outcome?: string          // outcome key
    timeToComplete?: number   // ms
    emotionalResponse?: string // optional player annotation
  }
  playedAt: string            // ISO timestamp
}
```

### 2. PlayDataToBarSeed transformer

Converts raw play events into BarSeed-compatible inputs:

```typescript
function playDataToBarSeed(
  playData: PlayData,
  creator: string = 'playtest'
): { content: string; metadata: Partial<SeedMetabolizationState> }
```

**Rule:** Play data with eventType `outcome` or `completion` on a BAR with type `story` becomes a new BarSeed of type `story` with content = `{outcome_description} — player resolved in {timeToComplete}ms`. Mapped into the `blessed` namespace.

### 3. Metabolization gate

New BarSeeds from play data enter at `maturity = 'captured'` (not `shared_or_acted`). They must go through the full maturity machine before they can be translated to BarAsset.

This prevents feedback loops from short-circuiting quality control.

### 4. Feedback guard (kill-switch pattern)

Apply the same pattern from `run-state-machine.ts`: invalid play data is rejected at the translation layer.

```
playDataToBarSeed():
  if eventType === 'abandon': return null  // no feedback from abandoned runs
  if !sourceBarId: return null
  if timeToComplete > 5 minutes: flag as 'slow_completion' (still valid, but tracked)
```

---

## Key Differences from Phase 2

| Aspect | Phase 2 (Forward) | Phase 4 (Feedback) |
|---|---|---|
| Source | Human-authored prose | Play event data |
| Creator field | Author's name | `'playtest'` |
| Starting maturity | `shared_or_acted` | `captured` (full cycle required) |
| Translation urgency | Immediate | Queued, batch-friendly |
| Quality gate | None (already matured) | Full maturity machine |

---

## Implementation

### Files to create

| File | Purpose |
|---|---|
| `src/lib/bar-asset/play-data.ts` | `PlayData` type + `playDataToBarSeed()` |
| `src/lib/bar-asset/feedback-loop.ts` | `createFeedbackLoop()` — wires play data → BarSeed → persist → re-translate |
| `src/app/api/bar-asset/play-event/route.ts` | POST endpoint — ingests play events, triggers feedback cycle |

### Files to update

| File | Change |
|---|---|
| `src/lib/bar-asset/types.ts` | Add `PlayData` type + `PlayEventType` enum |
| `src/lib/bar-asset/persistence.ts` | Add `updateBarAssetFromPlayData()` — increments `playCount`, updates `lastPlayedAt` |

### Tests

- `play-data.test.ts`: `playDataToBarSeed()` — choice/outcome/completion/abandon paths
- `feedback-loop.test.ts`: full cycle — play event → BarSeed created → BarAsset updated
- `play-event.route.test.ts`: endpoint — rejects invalid payloads, accepts valid ones

---

## Off-Limits

- Do not auto-translate play-derived BarSeeds without going through maturity
- Do not accept `abandon` events as feedback (they distort quality signals)
- Do not close the loop without the maturity gate — feedback must earn integration

---

## Exit Criteria

1. `POST /api/bar-asset/play-event` accepts valid play data, returns created BarSeed
2. `playDataToBarSeed()` correctly categorizes choice/outcome/completion/abandon
3. New BarSeed from play data enters at `maturity = 'captured'`
4. Play count on CustomBar increments on each valid event
5. `abandon` events are rejected with 400
6. All 52 existing tests + Phase 4 tests pass
