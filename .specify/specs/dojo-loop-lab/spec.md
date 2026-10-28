# Spec: Dojo Loop Lab — Prove the Loop Through Play

## Purpose

Build one small, replayable, non-persistent demonstration inside the existing dojo that proves the full proposed loop through player action:

```text
player-language thought string
  → player-confirmed EA anchors
  → deterministic EA teaching triangle
  → explicit action stack
  → authored, bounded action form
  → optional BAR preview
```

The Lab is not a new interpretation engine, a spiritual assessment, or a replacement for the live Triangle Workshop. It is a playable proof that the systems already in Bars Engine can compose without collapsing their meanings into one another.

## Why a separate Lab

The live dojo now persists private work, supports 8th-Ray practice, and can create embers after settling. That is the right surface for actual player material, but it is the wrong place to discover whether this new cross-system grammar works.

The Lab is an authored scenario held entirely in client state. It must make no server action, database write, BAR mutation, ember creation, spirit change, daemon selection, or Between offer. A player can replay, abandon, or restart it freely.

## Player promise

The Lab says, in plain language:

> This is a demonstration of how the pieces can connect. Your words remain yours. The choices here are examples, not a reading of you, and nothing is saved unless you later choose to recreate it in live practice.

## Entry and placement

- Add **Try the loop lab** as a fourth explicit choice on `/dojo/triangle-workshop`, beside the existing Learning, private-seed, incipient-BAR, and BAR-linked entries.
- Render the Lab at `/dojo/triangle-workshop/loop-lab` (or an equivalent child route); it must not reuse the live `savePractice`, `exitPractice`, `createEmber`, or `returnOutcomeToBar` paths.
- The first screen contains only the authored scenario, a short privacy statement, **Begin**, **Restart**, and **Return to dojo**. It does not ask the player to disclose anything.

## Authored scenario

The scenario is a concrete rendering of the agreed first proof:

> “I feel excitement and want to get this dojo idea in front of people.”

It begins with this player-language triangle:

```text
excitement → possibility → hope
```

The player may bud a second triangle through the shared `hope` word:

```text
wonder → poignance → hope
```

`hope` remains a player concept. The Lab must never label it as a sixth EA channel or silently use it as an EA anchor.

The authored wall may begin with the words and triangles already visible so the player spends the session testing the bridge, not typing a worksheet. It should still use the same word-triangle and shared-word visual grammar as the existing board.

## Play sequence

### 1. Read, do not diagnose

The Lab asks the player to set sample reads for the three relevant words:

| Word | Demonstration read |
|---|---|
| wonder | activation 3, supportive |
| poignance | activation 2, mixed |
| joy | activation 2, supportive |

The player can alter or leave these reads. They are intentionally separate from EA anchors. The Lab should state that a read is present-time player language, not a fact the game has inferred.

The production board currently has a scalar `-3…+3` charge control. The Lab uses the target two-axis presentation—activation `0…3` and orientation `constricting`, `supportive`, `mixed`, or `unread`—in its isolated fixture state. This proves the replacement interaction before the persistent schema is migrated.

### 2. Confirm optional EA anchors

Show three *proposed* mappings one at a time. Each has **Confirm**, **Not this**, and **Leave unread** controls.

| Player word | Canonical EA state | Why this is shown |
|---|---|---|
| wonder | Fear / Metal / satisfied (`Wonder-Excitement`) | authored example proposal |
| poignance | Sadness / Water / satisfied | authored example proposal |
| joy | Joy / Wood / satisfied (`Bliss`) | authored example proposal |

- `Confirm` changes only that in-memory anchor to `confirmed`.
- `Not this` changes it to `declined`.
- `Leave unread` leaves it absent or `proposed`.
- The Lab never derives an anchor from a word, an activation read, its orientation, or an LLM.
- The player can revisit any anchor decision before advancing.

### 3. Reveal the teaching triangle only when earned

Call `deriveSupportedElementalTriads` from `src/lib/alchemy/thought-string-triad.ts` with the current confirmed anchors.

When and only when the Metal/satisfied, Water/satisfied, and Wood/satisfied anchors are all confirmed, render this overlay beside—not instead of—the player-language constellation:

```text
Wonder-Excitement / Metal
  -- Deepen Value --> Poignance / Water
  -- Renew Vitality --> Bliss / Wood
  -- Activate Hope --------------------------------> Bliss / Wood
```

The overlay exposes the three exact move IDs/names from the canonical EA move table:

- `metal_water` — **Deepen Value**
- `water_wood` — **Renew Vitality**
- `metal_wood` — **Activate Hope**

If any confirmation is removed, the EA overlay disappears immediately and the player-language wall remains unchanged. The UI explains *which confirmation is missing or mismatched*; it does not call the attempt wrong.

### 4. Choose an explicit action stack

Once the teaching triangle is visible, present a compact, editable stack. The Lab’s initial selection is deliberately narrow:

| Layer | Initial value | Job in the grammar |
|---|---|---|
| Life lens | Career | The initiative serves practice, offering, or event-production learning. |
| Container | Small dojo gathering | The thing being created. |
| EA move | Activate Hope | The selected available practice frame. |
| Current work | Skillful Organizing | The kind of work being done now. |
| Personal move | Grow Up | The mode of skill-building. |

The player can switch the **current work** tab among the four authored gathering phases below. Switching the phase changes only the action grammar result; it does not rewrite the thought string, anchors, EA move, or initiative identity.

The Lab must name the layers separately. In particular:

- Life lenses are `relationships`, `career`, `money`, `health`, and `allyship`.
- Allyship domains describe the current work, not the player or project’s permanent identity.
- Personal moves are WAVE moves.
- Game Master faces are optional style/agency overlays and are out of scope for the first Lab interaction. They must not be called lenses.

### 5. Resolve a deterministic action form

The Lab uses a local, versioned action registry—not prose inference and not an LLM. Its resolver receives explicit IDs and returns authored action forms in stable order.

```ts
type DojoActionGrammar = {
  version: 'v1'
  lifeLens: 'career'
  container: 'gathering'
  allyshipDomain: 'GATHERING_RESOURCES' | 'SKILLFUL_ORGANIZING' | 'RAISE_AWARENESS' | 'DIRECT_ACTION'
  personalMove: 'wake_up' | 'open_up' | 'grow_up' | 'show_up'
  eaMoveId: 'metal_wood'
  actionForms: Array<{
    id: string
    title: string
    prompt: string
    requiredSlots: string[]
    playerControlCondition: string
  }>
}
```

The first registry contains exactly these forms:

| Current work + personal move | Form ID | Authored action | Player-controlled completion condition |
|---|---|---|---|
| Skillful Organizing + Grow Up | `bounded_pilot_design` | Draft a 45-minute pilot: capacity, roles, one exercise, and one feedback question. | A bounded run-of-show exists. |
| Gathering Resources + Open Up | `witness_invitation` | Choose and invite three suitable witnesses. | Three invitations are sent—not accepted. |
| Raise Awareness + Wake Up | `pilot_invitation_copy` | Write one paragraph explaining what it is, who it is for, and an easy no. | The invitation copy exists. |
| Direct Action + Show Up | `host_pilot` | Host the scheduled pilot. | The player offers and hosts the room—not that anyone attends or approves. |

Action forms are examples of a grammatical output, not imperatives. The player may select a form, edit its short next-step sentence, return to the stack, or discard it.

### 6. Preview an optional BAR, then end cleanly

After a player selects an action form, show a read-only preview:

```ts
{
  title: 'Run a three-person dojo test',
  lifeLens: 'career',
  container: 'gathering',
  actionPhase: 'SKILLFUL_ORGANIZING',
  personalMove: 'grow_up',
  eaMoveId: 'metal_wood',
  actionForm: 'bounded_pilot_design',
  successCondition: 'A 45-minute pilot plan exists',
}
```

This is a **preview only**. The Lab ends with:

- **Try another phase** — returns to the action stack.
- **Restart Lab** — restores the authored initial state.
- **Return to dojo** — exits with no side effect.
- **Take this to live practice** — returns to the normal dojo arrival flow with no payload copied automatically. This is intentionally a handoff, not a hidden persistence path.

`Plant BAR` belongs to the later live-practice implementation, where the player may deliberately recreate/select the material and approve persistence. It is displayed in the Lab only as a future contract, never as an enabled write action.

## State and boundary contract

The Lab’s state is ephemeral and owns only:

```ts
type LoopLabState = {
  wordReads: Record<string, { activation: 0 | 1 | 2 | 3; orientation: 'constricting' | 'supportive' | 'mixed' | 'unread' }>
  anchors: Array<{ wordId: string; state: AlchemyState; status: 'proposed' | 'confirmed' | 'declined' }>
  selectedEaMoveId?: string
  actionStack?: {
    lifeLens: 'career'
    container: 'gathering'
    allyshipDomain: 'GATHERING_RESOURCES' | 'SKILLFUL_ORGANIZING' | 'RAISE_AWARENESS' | 'DIRECT_ACTION'
    personalMove: 'wake_up' | 'open_up' | 'grow_up' | 'show_up'
  }
  selectedActionFormId?: string
  editedNextStep?: string
}
```

It must not contain raw 3-2-1 material, player identity, BAR IDs, spirit IDs, daemon IDs, ember IDs, or Between IDs.

## Acceptance criteria

### Deterministic grammar

- Given the same three confirmed same-altitude anchors, the Lab renders the same ordered Metal → Water → Wood teaching triangle and three canonical moves.
- A proposed or declined anchor has no effect on the triad or move cards.
- Removing a confirmed anchor removes the overlay without removing player-language words or triangles.
- `hope` never becomes an EA state merely because the text contains “hope.”
- The action resolver returns the same stable form(s) for the same explicit action stack and never receives player prose as an inference input.

### Playability and comprehension

- A phone player can complete the happy path in under five minutes using taps and the existing accessible list conventions.
- At every stage, a player can go back and revise a prior selection without losing their authored wall.
- The Lab visibly distinguishes player words, player reads, proposed/confirmed EA anchors, canonical EA moves, and action forms.
- Each action card states a completion condition controlled by the player.

### Privacy and non-effects

- Instrumented test: visiting, completing, restarting, or abandoning the Lab makes zero calls to dojo server actions and zero database writes.
- Instrumented test: no ember, spirit, daemon, Between, BAR, or practice-seed record is created or updated.
- No disclosure, intensity, or difficult pattern is rewarded or scored.
- The Lab makes no claim that it clears energy, diagnoses a person, or predicts an outcome.

## Out of scope

- General-purpose EA anchor search or natural-language classification.
- Persisting the two-axis word-read model in the current dojo schema.
- A live BAR plant flow, spirits/daemons, ember feeding, Between effects, multiplayer, AI coaching, or Blender-room rendering.
- Completing every lens/container/domain combination. The Lab proves one bounded Career + gathering slice first.

## Source anchors

- Existing dojo shell and private/live boundaries: `src/app/dojo/triangle-workshop/dojo-shell.tsx`
- Existing word/triangle grammar: `src/app/dojo/triangle-workshop/thought-string-board.tsx`
- Existing tutorial non-persistence model: `src/lib/dojo-practice/tutorial.ts`
- Canonical EA move graph: `src/lib/alchemy/alchemy-graph.ts` and `src/lib/quest-grammar/move-table.json`
- Deterministic teaching-triad helper: `src/lib/alchemy/thought-string-triad.ts`
- Product rationale and ontology distinctions: `../triangle-workbench/dojo-loop-library.md`
