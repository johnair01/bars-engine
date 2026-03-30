# 🜂 Spec Kit Feature — BAR → Quest Router (Chapter 1 Engine)

## Overview

This feature defines a lightweight system for mapping player-generated BARs (Blank Actionable Records) to existing quests from *Mastering the Game of Allyship*.

The goal is to enable a **playable Chapter 1 experience** where players:
1. Generate or encounter a BAR
2. Are routed to the most relevant quest(s)
3. Take action using WAVE (Wake Up, Clean Up, Grow Up, Show Up)
4. Produce outputs (new BARs, vibeulons, state changes)

This is a **routing system**, not a generation system.

---

## Core Principle

> BAR → Quest Affinity Mapping  
> Not: BAR → Story Generation

BARs are treated as **compressed tension objects**.  
Quests are **structured moves that metabolize that tension**.

---

## Data Model

### BAR Object

```json
{
  "bar_text": "Romance Fog",
  "type": "perception | identity | relational | systemic",
  "sidedness": "single | double",
  "polarity": {
    "pole_a": "Idealization",
    "pole_b": "Clarity"
  },
  "dominant_phase": "wake_up | clean_up | grow_up | show_up",
  "emotional_charge": "fear | anger | sadness | joy | neutrality"
}
```

---

### Quest Object (Minimal Tagging)

```json
{
  "quest_id": "ask_direct_question",
  "title": "Ask One Direct Question",
  "phase": "wake_up",
  "type": "perception",
  "description": "Clarify reality through direct inquiry"
}
```

---

## Matching Algorithm

Each BAR is matched to quests using 3 axes:

### 1. Type Match
- perception
- identity
- relational
- systemic

### 2. Phase Match
- Wake Up
- Clean Up
- Grow Up
- Show Up

### 3. Emotional Charge (optional weighting)
- fear
- anger
- sadness
- joy
- neutrality

---

### Scoring Logic (Pseudo)

```python
score = 0

if bar.type == quest.type:
    score += 2

if bar.dominant_phase == quest.phase:
    score += 3

if bar.emotional_charge aligns with quest intent:
    score += 1
```

Return:
- Top 1 → Primary Quest
- Next 2 → Secondary Options

---

## Player Flow (Chapter 1 Loop)

### Step 1 — Input
Player:
- writes BAR
- draws BAR
- or selects from deck

---

### Step 2 — Classification
System (or facilitator) extracts:
- type
- dominant phase
- emotional charge

---

### Step 3 — Quest Offering

Example:

```
This feels like a clarity moment.

Choose a move:

1. Ask a direct question  
2. Notice what doesn’t match  
3. Name what you want  
```

---

### Step 4 — Action (Show Up)
Player:
- performs action in real world OR roleplay

---

### Step 5 — Output

System records:
- new BAR
- vibeulon minted
- quest completion
- optional unlock

---

## WAVE Integration

Each quest maps to one primary WAVE phase:

| Phase    | Function                  |
|----------|---------------------------|
| Wake Up  | See clearly               |
| Clean Up | Feel and regulate         |
| Grow Up  | Update perspective        |
| Show Up  | Take action               |

---

## Minimal Quest Structure

Each quest should be runnable as:

- 1 setup (Wake Up)
- 2–4 choices
- 1 resolution (Show Up)

---

## Example Mapping

### BAR
Romance Fog

### Extracted
- Type: perception
- Phase: wake_up
- Emotion: joy/fear

### Matched Quests
- Ask One Direct Question (Primary)
- Notice What Doesn’t Match
- Name What You Want

---

## Implementation Phases

### Phase 1 — Human-in-the-loop
- Manual BAR classification
- Manual quest selection
- Observe player behavior

---

### Phase 2 — Assisted Matching
- System suggests top 3 quests
- Facilitator confirms

---

### Phase 3 — Automated Routing
- Fully automatic matching
- Continuous refinement via player data

---

## Outputs (Critical)

Each completed loop should yield:

- New BAR (refined or evolved)
- Vibeulon (energy unit)
- Quest completion state
- Optional unlocks

---

## Design Constraints

- Do NOT generate full stories
- Keep interactions short (1–3 minutes)
- Use real-world actions as resolution when possible
- Prioritize clarity over cleverness

---

## Success Criteria

System is working if:

- Players say: “That was exactly the right move”
- BAR → Quest mapping feels intuitive
- Players generate new BARs naturally
- Social energy increases, not decreases

---

## Summary

This system creates:

> A real-time developmental feedback loop

Where:
- BARs diagnose tension
- Quests provide moves
- Players evolve through action

---

## Next Steps

- Tag existing quests with (type, phase)
- Seed 20–30 BAR → Quest mappings
- Test live at party
- Capture data → refine system
