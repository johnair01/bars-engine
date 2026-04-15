# BAR Polarity Extraction + Library Spec (Full)

## 1. Purpose

The BARs engine requires a systematic method for transforming raw BARs into structured, reusable polarity constructs.

A BAR is typically:
- fragmentary
- poetic
- memetic
- relational
- culturally encoded
- emotionally charged

From each BAR, the system should derive:
- an underlying polarity
- an optional axis name
- a polarity type
- a rationale
- optional quest hooks, emotional alchemy hooks, and tags

The goal is to build a library of emergent polarities that powers:
- quest generation
- onboarding & intake
- emotional alchemy loops
- social mechanics
- archetype mapping
- recommendation systems

---

## 2. Core Principle

A BAR is a compression artifact of tension.

Polarity extraction answers:

What tension, gradient, or transformation is this BAR carrying?

Not all BARs yield binaries. Supported forms:
- binary opposition
- developmental gradient
- transformation pathway
- threshold / conversion point
- multi-axis tension

---

## 3. Core Data Structures

### BAR

```yaml
BAR:
  id: string
  raw_text: string
  image_refs: []
  context: {}
```

### PolarityExtraction

```yaml
PolarityExtraction:
  id: string
  bar_id: string

  primary_axis:
    left: string
    right: string
    axis_name: string

  type: string
  confidence: float

  rationale: string

  secondary_axes: []
  developmental_gradient: []
  tags: []
  emotional_alchemy_hooks: []
  quest_hooks: []
```

### PolarityLibraryEntry

```yaml
PolarityLibraryEntry:
  id: string

  canonical_axis:
    left: string
    right: string
    axis_name: string

  type: string

  description: string

  example_bars: []
  related_axes: []
  tags: []
```

---

## 4. Polarity Types

- binary_axis
- developmental_axis
- operational_axis
- relational_axis
- identity_axis
- cultural_axis
- epistemic_axis
- threshold_axis
- multi_axis

---

## 5. Extraction Workflow

### Step 1: Parse
Identify structure:
- phrase
- joke
- metaphor
- question
- list

### Step 2: Detect Tension
Ask:
- what is contrasted?
- what is implied?
- what is transforming?

### Step 3: Generate Axes
Create:
- literal axis
- deeper axis
- system-native axis

### Step 4: Normalize
Translate into reusable language

### Step 5: Classify
Assign polarity type

### Step 6: Store
Match existing library or create new entry

---

## 6. Heuristics

- Interpret before compressing
- Preserve humor
- Avoid moralizing
- Distinguish gradient vs binary
- Allow ambiguity

---

## 7. Library Construction

- Cluster recurring axes
- Preserve original BARs
- Expand synonyms
- Link related axes

---

## 8. Canonical Seeds

- Caring About ↔ Caring For
- Being Moved ↔ Moving the Field
- Private Meaning ↔ Shared Meaning
- Naming ↔ Seeing Through
- Potential Love ↔ Active Love
- Known ↔ Unknown

---

## 9. Quest Hooks

Each polarity can generate:
- reflection
- translation
- recognition
- metabolization
- artifact creation

---

## 10. Emotional Alchemy Hooks

Optional mapping to:
- anger (fire)
- joy (wood)
- sadness (water)
- neutrality (earth)
- fear (metal)

---

## 11. Anti-Patterns

Avoid:
- flattening meaning
- generic language
- forced binaries
- removing humor

---

## 12. Prompt Template

You are extracting a polarity from a BAR.

1. Interpret the BAR
2. Generate axes
3. Select primary axis
4. Classify type
5. Explain rationale
6. Add hooks if useful

---

## 13. Example

```yaml
bar: "Shared Journaling"

axis:
  left: Private Meaning
  right: Shared Meaning

type: relational_axis
```

---

## 14. Design Thesis

BARs are artifacts.
Polarities are structure.

The polarity library is the atlas of recurring tensions that give BARs meaning.
