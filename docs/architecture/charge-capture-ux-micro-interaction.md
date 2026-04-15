# Charge Capture UX + Micro-Interaction v0

## Overview

Charge Capture is the fastest interface for converting a moment of felt charge into a BAR artifact. It is the primary entry point between real-life events and the Bars-engine system.

**Design goal**: A charged moment becomes a BAR faster than someone can open Instagram — **under 10 seconds, 3–5 taps**.

**Core principle**: Capture first, structure later. The interface prioritizes `felt sense → capture → structure later`, not `analysis → classification → submission`.

---

## UX Goals

1. Capture **raw narrative signal**
2. Record **emotional energy (charge)**
3. Generate a **BAR artifact**
4. Optionally offer **next moves**

The interface must remain usable during: walking, emotional activation, short attention windows, social contexts.

---

## Entry Points

| Trigger | Description |
|---------|-------------|
| Manual entry | User opens app and taps "Capture Charge" |
| Quick capture widget | Mobile widget / shortcut (future) |
| Notification response | "Feeling something about today? Capture a BAR" |
| Quest follow-up | After completing quests |
| Agent prompt | Agents may invite reflection after events |

---

## Capture Flow

**One screen if possible.** Total taps: 3–5.

```
1. What feels charged?
2. Emotional intensity
3. Optional note
4. Create BAR
```

### Screen 1: Charge Prompt

**Primary prompt**: "What feels charged right now?"

**Input types**:
- Short text (required)
- Voice note (future)
- Quick tags (optional)

**Example entries**:
- "The housing situation in my city"
- "Feeling inspired to host a gathering"
- "Frustration about my work situation"
- "Excitement about community organizing"

**Rule**: Do not force categorization here.

### Emotional Channel Selection (Optional)

Channels correspond to Emotional Alchemy (elements.ts):

| Channel | Element | UI |
|---------|---------|-----|
| Anger | Fire | Icon / color |
| Joy | Wood | Icon / color |
| Sadness | Water | Icon / color |
| Fear | Metal | Icon / color |
| Neutrality | Earth | Icon / color |

Selection is optional. If skipped, the system may infer later.

### Charge Intensity

**Prompt**: "How strong does this feel?"

**Input**: Simple slider or 5-step scale.

| Level | Label |
|-------|-------|
| 1 | faint |
| 2 | noticeable |
| 3 | present |
| 4 | strong |
| 5 | intense |

Used for: quest prioritization, support prompts, momentum tracking.

### Optional Reflection Field

**Prompt**: "Anything you want to add?"

Short text. Not required. Supports narrative context, quick thoughts, links, notes.

---

## BAR Creation

When user taps **Create BAR**, system creates a CustomBar with:

- **type**: `charge_capture`
- **title**: Summary text (truncated if needed)
- **description**: Full summary + optional context note
- **visibility**: `private` (default)
- **inputs**: JSON payload (see schema below)

User may later choose to share. No raw emotional data exposed publicly without confirmation.

---

## Charge Capture BAR Schema

**CustomBar mapping**:

| Spec field | CustomBar field |
|------------|-----------------|
| bar_type | type = `charge_capture` |
| summary_text | title |
| summary + context_note | description |
| emotion_channel | inputs JSON |
| intensity | inputs JSON |
| context_note | inputs JSON or description |
| visibility | visibility |
| created_at | createdAt |

**inputs JSON**:
```json
{
  "emotion_channel": "anger" | "joy" | "sadness" | "fear" | "neutrality" | null,
  "intensity": 1 | 2 | 3 | 4 | 5,
  "context_note": "optional string"
}
```

---

## Post-Capture Micro-Reframe

Immediately after capture:

**Message**: "Charge captured. What would you like to do with it?"

**Options** (3):

| Option | Action |
|--------|--------|
| Reflect | Run a 3-2-1 reflection |
| Explore | Turn this into a Wake Up quest |
| Act | Create a quest invitation |

**Fourth option**: "Not now" — flow ends. BAR exists as captured narrative signal. No forced additional steps.

---

## Fast Exit Principle

If user selects "Not now", the flow ends. The BAR exists. Do not force additional steps.

---

## Later Processing (Asynchronous)

Captured charge BARs may later trigger:
- Reflection prompts
- Quest generation suggestions (Charge → Quest Generator v0)
- Agent assistance
- Clustering into campaign topics

These processes occur asynchronously. Not part of capture flow.

---

## Habit Loop Design

```
feel charge
↓
capture BAR
↓
optionally reflect
↓
discover next move
```

**Key metric**: Capture frequency, not completion.

**Feedback**: "Charge captured. You're paying attention to what matters."

Avoid gamification noise. Moment should feel respectful and grounded.

---

## Micro-Interaction Rules

| Rule | Constraint |
|------|------------|
| 1. No mandatory categories | Categorization happens later |
| 2. No quest generation required | Capture first |
| 3. No long text requirement | One sentence is enough |
| 4. No friction | Max fields: summary, emotion (optional), intensity |
| 5. Interruptible | User must be able to exit quickly |

---

## Dashboard Integration

**Section**: "Recent Charge"

**Actions**:
- Reflect
- Turn into quest
- Share as signal
- Archive

---

## Agent Interaction

Agents may assist with captured charge:
- Suggest Wake Up quests
- Suggest related research
- Suggest allies
- Suggest reflection

**Agents must not auto-generate quests without user consent.** They offer suggestions.

---

## Privacy Rules

- Charge capture is **private by default**
- Users must explicitly choose to share
- Possible future transitions: `private → campaign visible`, `private → public signal`, `private → quest invitation`
- No raw emotional data exposed publicly without confirmation

---

## Interface Metaphor

A **field notebook for meaningful moments** — not a productivity tool. Users should feel the system respects their experience and helps transform it into action **when they are ready**.

---

## Dependencies

- CustomBar (prisma/schema.prisma)
- system-bar-interaction-layer.md (BAR type taxonomy)
- Emotional Alchemy (elements.ts, emotion channels)
- 3-2-1 reflection (existing flow)
- Quest generation (Charge → Quest Generator v0, future)
