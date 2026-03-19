# Carried Weight — Shadow Card Mechanic Spec

*Phase 2c of the Hearts Blazing implementation plan.*
*See: HEARTS_BLAZING_REVIEW.md for design rationale.*

---

## The Problem

BARs Engine acknowledges shadow through the Shaman face's `nameShadowBelief` action — the player names a shadow belief, and the system produces an insight BAR. But:

1. The shadow acknowledgment has **no downward pressure on current play capacity**. Naming a shadow costs nothing in the energy economy, even though carrying unresolved shadow material demonstrably reduces real-world capacity.
2. The shadow belief is **not a holdable object**. Once named, it gets "filed" as an insight BAR. The player has no ongoing relationship with it — no decision about whether to play it, hold it, or set it down.
3. Shadow work is something that **happens to the player** (encountered, processed). There is no mechanic for **choosing to pick up shadow material** because the story requires depth.

Hearts Blazing's Frailty card solves this differently: players voluntarily introduce flaws for narrative depth, and holding them unplayed at the Finale incurs a keyword penalty. The held-but-unplayed state is a meaningful game state.

---

## The Mechanic: Carried Weight

A **Carried Weight** is a named shadow belief that exists as a holdable card in the player's hand — a first-class object the player carries, decides what to do with, and is affected by whether they work with it or not.

### Creation

A Carried Weight card is created when:
1. The player completes a 321 session and a shadow belief is named (current path via Shaman face)
2. **New**: The player voluntarily names a shadow belief during play — choosing to pick up weight because the current story moment calls for depth

The second path is the new mechanic. It is not forced; it is offered. A card (or modal prompt, or face intervention) can surface the question: *"Is there something you are carrying right now that is relevant to this moment? Name it and work with it, or set it aside."*

### What the Card Contains

```typescript
interface CarriedWeight {
  id: string
  playerId: string
  // The shadow belief itself
  beliefText: string       // e.g. "I am only valuable when I am useful to others"
  shadowName?: string      // generated shadow name if available
  // How it was created
  source: 'shadow_name_session' | 'voluntary_pickup' | 'face_named'
  // Current state
  status: 'held' | 'in_play' | 'metabolized' | 'set_down'
  heldSince: DateTime
  // Cost mechanics
  loadLevel: 1 | 2 | 3    // how much capacity this weight is using
  // If played
  metabolizedAt?: DateTime
  metabolizedBarId?: string  // the BAR produced when played
}
```

### States

**Held**: The player is carrying this weight. It is visible in their hand. The system knows they have it. It may be reducing their available energy (see Load below).

**In Play**: The player has chosen to surface this weight in a current quest or session. They are actively working with it. An agent (Shaman face, or the player themselves) is facilitating the metabolization.

**Metabolized**: The weight has been worked through and produced a BAR. It is no longer in the hand — it is a completed artifact. This is the healthy resolution.

**Set Down**: The player chose to name the weight and explicitly not carry it for now. This is not avoidance — it is discernment. "I see this. I am choosing not to work with it in this session." No penalty; the weight remains available for a future session.

### Load and the Energy Economy

A Carried Weight at `loadLevel: 1` has no effect on the energy economy — it is held lightly.

A Carried Weight at `loadLevel: 2` reduces the player's available play capacity by 1 (e.g., a `grow_up` that would produce `reward: 2` produces `reward: 1` instead) until it is metabolized or set down.

A Carried Weight at `loadLevel: 3` creates a visible state in the dashboard: *"You are carrying something heavy. The system will route you toward Shaman-aligned cards until this is worked with."*

The player sets the load level when they name the weight. The Shaman face can also assign a load level after witnessing.

This gives the mechanic its structural function: **shadow that is named but not worked with has a real cost**. The system is not punishing the player — it is modeling reality.

### Voluntary Pickup

The new path (not currently in the system) is the most important addition from the Hearts Blazing analysis:

A player can **choose to pick up a Carried Weight** — not because a shadow belief was surfaced in 321, but because the current story moment calls for depth and they recognize they have something relevant to bring.

The prompt might surface during a `clean_up` card, during a face intervention, or as a regular check-in option:

> *"Is there something you are carrying that is relevant to this moment? You can name it and work with it now, or note it and set it aside."*

The player who names a weight voluntarily is not in crisis — they are choosing depth. The mechanic should honor this: voluntary pickup starts at `loadLevel: 1` and the player chooses whether to escalate.

This is the mechanic Hearts Blazing gets right and BARs currently lacks: **shadow work as a positive choice, not just an emergency processing event**.

---

## What Changes in the UI

### The Hand

The player's hand (currently showing available move cards and face cards) gets a new section: **Carried Weight**. This is a quiet, non-alarming display — a weight has a name, a load indicator, and two actions: "Work with this" and "Set it down for now."

### The Shaman Face

The Shaman face gets a new action alongside `nameShadowBelief`: **"Name and carry"** — creates a Carried Weight rather than an immediate insight BAR. This is for situations where the shadow is named but the player is not ready to metabolize it in this session.

### The Dashboard

A player carrying a `loadLevel: 3` weight sees a gentle indicator on their dashboard. Not alarming — informational. The Shaman face can be surfaced from here.

### BAR Production When Metabolized

When a Carried Weight is metabolized (worked through and resolved), it produces a special BAR type:

- `barType: 'carried_weight_metabolized'`
- The BAR title is derived from the belief text: *"Metabolized: [shadowName or brief of belief]"*
- The BAR gets `moveType: 'clean_up'` and `gameMasterFace: 'shaman'`
- The `reward` is based on the load level: `loadLevel × 2` (higher load = higher reward for working with it)

This makes the metabolization economically significant — carrying heavy weight and working through it is more rewarding than staying in the easy cards. This is the game's alignment with Integral Theory's shadow integration as growth.

---

## Schema Addition (Phase 3)

```prisma
model CarriedWeight {
  id                 String    @id @default(cuid())
  playerId           String
  beliefText         String
  shadowName         String?
  source             String    // shadow_name_session | voluntary_pickup | face_named
  status             String    @default("held")  // held | in_play | metabolized | set_down
  loadLevel          Int       @default(1)  // 1 | 2 | 3
  heldSince          DateTime  @default(now())
  metabolizedAt      DateTime?
  metabolizedBarId   String?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  player             Player    @relation(fields: [playerId], references: [id])
  metabolizedBar     CustomBar? @relation(fields: [metabolizedBarId], references: [id])

  @@map("carried_weights")
}
```

---

## What This Is Not

- **Not punishment**: Carrying weight is not a failure state. It is an honest representation of what players bring to the game.
- **Not Hearts Blazing's Frailty**: Frailty is competitive and performative — it makes characters more interesting in front of other players. Carried Weight is intimate and private — it serves the player's own developmental arc.
- **Not the 321 process**: 321 surfaces shadow in a facilitated context. Carried Weight can be created from any moment — the player brings it to the system whenever they recognize they have it.
- **Not therapy**: The system does not diagnose, interpret, or analyze the shadow belief. It holds it, tracks whether it is being worked with, and makes the metabolization economically meaningful.

---

## Priority

Depends on: dashboard and hand UI (needs sufficient UI maturity to add the new section)
Soft dependency: Phase 2 schema additions (`intensity`, `contextLines`) are complete ✓
Next step: UX design for the hand section + Shaman face action additions
