# Move Card Practice Copy Contract

Date: 2026-07-05

Status: MVP contract for sample generation and hostile review. Not yet permission to mass-generate full deck copy.

## Purpose

The recommendation API can choose a tool, but the player still needs playable language. This contract defines the shape of copy that turns a recommendation into an executable practice.

Rule:

```text
The copy may be beautiful, but it must first be executable.
```

## Source Inputs

A composed practice copy object is generated from:

- card: WAVE move, operation, domain, output BAR, title, questions
- practice mode: quick or deep
- orientation: internal or external
- subject: self, other, collective
- emotional vector: present charge to desired satisfaction, when supplied
- blocker/story: optional player context
- recommendation: selected tool, ranked tools, practice lens, protocol, expected output kinds, completion criteria
- satisfaction spirit: inferred from desired satisfied channel or supplied explicitly

## Satisfaction Spirit

Default inference:

| Desired satisfied channel | Satisfaction spirit |
|---|---|
| neutrality | peace |
| anger | triumph |
| sadness | poignance |
| joy | bliss |
| fear | wonder |

This is copy-level metadata. It should shape tone and completion language, but it should not override the recommendation engine.

## Contract Shape

Implemented in `src/lib/allyship-deck/practice-copy.ts`.

```ts
type DeckPracticeCopy = {
  version: 'deck-practice-copy-v0'
  cardId: string
  mode: 'quick' | 'deep'
  orientation: 'internal' | 'external'
  subject: 'self' | 'other' | 'collective'
  satisfactionSpirit: 'peace' | 'triumph' | 'poignance' | 'bliss' | 'wonder' | null
  playerSituationSummary: string
  emotionalVector: string | null
  whyThisTool: string
  protocolIntro: string
  stepCopy: Array<{
    n: number
    instruction: string
    expectedOutput: string
  }>
  expectedOutputKinds: ToolOutputKind[]
  expectedOutput: string
  completionCriteria: string[]
  saveOrShareSummary: string
  reviewFlags: PracticeCopyReviewFlag[]
}
```

## Field Standards

### `playerSituationSummary`

Names the card lens and the player context. It may include the blocker/story, but should not infer diagnosis or intent beyond what the player supplied.

Good:

```text
The Ask You're Avoiding asks for Open Up through Challenger in Gather Resources. The named blocker is "I need to ask for help without overexplaining."
```

Bad:

```text
You are afraid of intimacy because you do not trust support.
```

### `emotionalVector`

Shows the route when supplied.

Good:

```text
sadness:dissatisfied -> sadness:satisfied
```

If the player chose quick mode without vector intake, this is `null` and `reviewFlags` includes `missing_vector`.

### `whyThisTool`

Explains why the selected tool fits the move. It should reference the selected tool and one actual scoring reason or output capability.

It must not say the system knows the player's hidden motive.

### `protocolIntro`

Frames how to use the tool for this rep.

Quick mode:

```text
Use this as a show up rep: complete the tool far enough to create the output, then stop.
```

Deep mode:

```text
Use this as the first clean up rep in the spirit of poignance: work the charge until the output exists, then decide whether another card or tool is needed.
```

### `stepCopy`

Every step must include:

- a concrete instruction
- an inspectable expected output

Scoped reflective prompts are allowed.

Good:

```text
Pause for twenty to thirty seconds before writing.
Expected output: A marked pause.
```

Good:

```text
Sit with the feeling for three minutes and record the first image, phrase, body sensation, or memory that emerges.
Expected output: One image, phrase, sensation, or memory.
```

Bad:

```text
Sit with the feeling.
Expected output: Insight.
```

### `expectedOutput`

Names what the player should have when the rep is complete:

- clean ask / boundary / offer / repair line
- next action
- field map
- felt handle
- part dialogue
- belief reframe
- BAR-ready reflection
- ritual artifact
- appreciation scan
- internal commitment
- quest seed
- regulation signal

### `completionCriteria`

Copied from the tool registry. These are the stop conditions. The player should know when the rep is done.

### `saveOrShareSummary`

Creates public-safe practice summary language. It should exclude private reflection by default.

Good:

```text
I worked OPEN-GR-CHALLENGER with Clean Line and produced: A clean ask, boundary, offer, repair line, or internal line.
```

### `reviewFlags`

Flags help reviewers and later UI know what needs care:

| Flag | Meaning |
|---|---|
| `missing_vector` | Quick/no-vector practice; copy must avoid pretending route certainty. |
| `missing_blocker_context` | No blocker/story supplied; copy should stay generic. |
| `next_tier_tool` | Selected tool is not MVP; review for readiness before scaling. |
| `internal_show_up` | Show Up is internal commitment/artifact. |
| `external_show_up` | Show Up is external action or message. |

## Hostile Acceptance Criteria

A generated composed practice copy passes only if:

- every step produces an inspectable output
- the selected tool is named
- the card lens is named
- the emotional vector is named or honestly absent
- satisfaction spirit is named when desired satisfaction is known
- completion criteria are present
- public summary excludes private reflection
- no sentence claims diagnosis, clinical safety, or hidden motive
- no vague prompt appears without a timebox or output
- quick mode produces action/commitment-shaped output
- deep mode can start with charge-processing without pretending that is the whole move

## Parallel Work Rule

API product work and copy-readiness work may proceed in parallel if:

1. API work keeps returning structured recommendations.
2. Copy work consumes the recommendation contract instead of inventing its own routing.
3. Sample generation remains small and hostile until the contract is proven.

Do not mass-generate all 120 card practice copies yet.
