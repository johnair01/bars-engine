# Spec: Emotional Alchemy Composer

## Purpose

The deterministic recommendation composer: `recommendPractice(card, diagnostic) → Recommendation`. A pure function that reads the drawn card's submove and the diagnostic's vector + context, applies the Practice Atlas §4.1 scored selection algorithm and the seven hard guards, and renders a composer-ready practice (tool + timebox + protocol steps + spirit step + Show Up options + inspectable reasoning).

**Problem**: Practice Atlas §10 target 3. Targets 1 (registry) and 2 (vector/diagnostic) exist but nothing selects a tool. The Atlas matrices, guards, and 16 golden scenarios are inert until a function encodes them.

**Practice**: Deftness Development — deterministic over AI. Pure logic, no UI, no DB, no network. AI tailoring is a strictly-later, additive layer; this composer is the always-on baseline.

**Canon sources**: [`docs/MTGOA_PRACTICE_ATLAS.md`](../../../docs/MTGOA_PRACTICE_ATLAS.md) v3 — §1.2 (rolePath), §1.4 (fuel/time gating), §4 (guards), §4.1 (algorithm), §5.1–5.3 (rendering), §6 S1–S16 (fixtures), §8.5/§8.6 (external gating, harm branches). Depends on targets 1 + 2 in [`src/lib/emotional-alchemy/`](../../../src/lib/emotional-alchemy).

## Design Decisions

| Topic | Decision |
|-------|----------|
| Module home | `src/lib/emotional-alchemy/composer.ts`; re-exported from the index |
| Second arg | The whole `DiagnosticResult` (target 2) — it already carries `vector + time + temporal + fuel + shape + thread + harmRelation + flags`. The card supplies only the submove + stance framing |
| Card input | A narrow `ComposerCard { submove, stanceQuestion?, domainLabel?, cardId? }` — decoupled from the full `MoveCard`; an adapter can map a real card later |
| Rating scale | `strong=3, medium=2, weak=1, not_recommended=0`. A tool is excluded when its **channel** fit is `not_recommended` (0). Submove fit is a score term, not a hard gate (a shape bonus can lift a submove-medium tool — this is how S3/S7 pick T01) |
| Score | `channelFit×2 + submoveFit + (3 if tool.shapeBonusKeys ∋ shape)` (Atlas §4.1 step 5). Tiebreak: aim-fit (moveRole for the needed role) → shortest timebox that fits budget → registry order |
| Guards | Enforced as data-driven blocks (Atlas §4). `hot_charge` prepends T07; `frozen_suspected` pins T02; joy/grief/action-on-grief/gamified-risk remove tools; `clean_line_readiness` + `external_gate` shape output/notes. Every guard that fires is recorded in `guardsApplied` |
| Physical-risk gap | The diagnostic captures power-over safety, not "physical risk" directly. `no_gamified_risk` uses `safety_power_over` as its proxy and the limitation is documented (new gap G11) |
| Show Up (§8.5/8.6) | External gated when intensity ≥ 4 (UI later asks the hot-action override); `harmRelation==='received'` → **no default external** (support/boundary only); `safety_power_over` → external present but gated with stakes noted |
| Rendering | `protocol = (time===2 ? miniSteps : steps) + [SPIRIT_STEPS[target]]`; stance question returned separately; Show Up templates returned verbatim (their `[slots]` are fill-ins the player completes when running the tool) |
| Inspectability (§8) | `Recommendation` carries `candidatesConsidered` (top scored) + `notes` (guard explanations) so the reasoning is surfaceable |
| No schema change | Pure TS; Prisma N/A |

## Conceptual Model

- **WHAT**: the composer — the deterministic bridge from *diagnosis* (vector) to *practice* (tool). It is the always-on baseline the whole engine rests on.
- **Personal throughput**: card fixes the WAVE submove; diagnostic fixes the vector; composer binds them into one playable rep.

## API Contracts

```ts
// src/lib/emotional-alchemy/composer.ts
export interface ComposerCard { submove: WaveLens; stanceQuestion?: string; domainLabel?: string; cardId?: string }

export interface PracticeRecommendation {
  kind: 'practice'
  prepend: 'T07' | null            // §4.1 step 1 hot-charge grounding
  primaryToolId: string
  bridged: boolean                 // §4.1 step 1b (hot Show/Grow card → clean-up bridge)
  bankedCardAim: boolean           // the card's practice scheduled for later
  effectiveSubmove: WaveLens
  rolePath: MoveRole[]             // §1.2 derived annotation
  timeboxMinutes: number
  stanceQuestion: string | null
  protocol: string[]               // tool steps (mini when time=2) + spirit step
  spiritStep: string
  showUp: { internal: string; external: string | null; externalGated: boolean }
  output: { kind: string; fields: string[] }
  guardsApplied: HardGuardId[]
  candidatesConsidered: { toolId: string; score: number }[]
  notes: string[]
}
export type Recommendation =
  | PracticeRecommendation
  | { kind: 'crisis'; notes: string[] }
  | { kind: 'capture_only'; notes: string[] }

export function recommendPractice(card: ComposerCard, d: DiagnosticResult): Recommendation
```

## User Stories

### P1: One deterministic recommendation
**As** the practice surface, I want `recommendPractice(card, diagnostic)` to return exactly one tool + rendered protocol + Show Up options, **so** a player gets a playable rep with no AI.
**Acceptance**: the 16 golden scenarios each map to their Atlas-named primary tool; hot charges prepend T07; guards block what they must.

### P2: The reasoning is inspectable (§8)
**As** a player, I want to see why this tool, **so** the recommendation isn't a black box.
**Acceptance**: `candidatesConsidered` lists the top tools with scores; `guardsApplied` + `notes` explain every block and gate.

### P3: Guards are hard, not advisory (§9.2)
**As** the system, I must never route a Joy tool onto hot anger/grief, inquiry onto fresh grief, or games onto risk.
**Acceptance**: unit tests assert T09/T11 blocked at anger/sadness ≥ 5; T04 blocked on fresh sadness; T08 blocked on early sadness; received-harm yields no default external.

## Functional Requirements

- **FR1**: `composer.ts` implements `recommendPractice` per §4.1: crisis/capture short-circuits → hot-charge prepend → bridge (hot Show/Grow card) → frozen-suspected pin → fuel/time gating → channel-exclusion + guard removal → score → tiebreak → render.
- **FR2**: Scoring and tiebreak exactly as Design Decisions; `candidatesConsidered` = top 4 by score.
- **FR3**: `rolePath` derived (§1.2): `metabolize` when the tool is a metabolizer (T01/T02/T04), then `transcend` (same-channel target) or `translate` (cross-channel).
- **FR4**: Show Up gating per §8.5/§8.6; `external_gate` and `clean_line_readiness` surfaced in notes.
- **FR5**: `guardsApplied` records every guard that fired (including `hot_charge`, `external_gate`).
- **FR6**: Rendering per §5.1–5.3; mini steps when `time===2` and available; `timeboxMinutes ≤ min(timeBudget, fuel cap)`.
- **FR7**: The **16 golden scenarios** are the test fixtures — each an input (`ComposerCard` + `DiagnosticResult`) → expected `{primaryToolId, prepend, key guards/notes}` pair. Plus unit tests for each guard in isolation and the crisis/capture short-circuits.
- **FR8**: test file added to `vitest.config.ts`.

## Non-Functional Requirements

- Pure, deterministic, allocation-light; additive only (new exports from the index).
- `npm run check` + vitest green.

## Persisted data & Prisma
N/A — pure function, no schema change.

## Verification Quest
N/A in this slice — no UX surface. The practice-card **render** (design-gated, per `DESIGN_HANDOFF.md`) is the UX follow-up and carries the Verification Quest; this composer is its dependency.

## Dependencies
- `src/lib/emotional-alchemy/` (targets 1 + 2: registry, guards, spirit steps, `EmotionalVector`, `DiagnosticResult`)
- `docs/MTGOA_PRACTICE_ATLAS.md` v3 (§4.1 algorithm, §6 fixtures)

## References
- `docs/MTGOA_PRACTICE_ATLAS_GAP_ANALYSIS.md` (M1–M3, D6)
- `.specify/specs/emotional-alchemy-diagnostic/DESIGN_HANDOFF.md` (post-card render contract for the UX follow-up)
