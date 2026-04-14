# BARS Engine Spec: `humanoid_v1`
### Base Body, Anchor, and Layer Alignment Contract for Pixel Identity System

---

## Purpose

`humanoid_v1` is the canonical base-body specification for all composable player-facing character sprites in the BARS Engine.

Its job is simple and severe:

- keep every visual layer aligned
- keep nation/archetype/equipment assets interoperable
- keep runtime composition deterministic
- prevent style drift from turning into geometry drift

This is not an art style guide in full.
It is the **structural contract** that all layered sprite assets must obey.

---

## Core Principle

Every renderable character layer in the system must be authored as if it is dressing or modifying the same invisible body.

If two assets require custom nudging to line up, one of them is wrong.

---

## Scope

This spec applies to:

- base body
- skin / body tone
- hair
- nation overlays
- archetype outfits
- equipment
- emotional effects that attach to the body
- BAR-driven visual modifiers
- exported walkable spritesheets built from these layers

This spec does **not** yet define:

- portraits / bust art
- non-humanoid bodies
- large monsters
- vehicles / constructs
- UI iconography

---

## Canonical Runtime Assumptions

### World Tile Size
- Runtime tile size: `32x32`

### Authoring Frame Size
- Authoring frame size: `64x64`

### Runtime Render Scale
- Default runtime render size: `32x32`
- Author at `64x64`, render down or scale consistently in-engine

### Character Footprint
- Logical collision footprint should assume a grounded humanoid standing within one tile
- Visual sprite may exceed the logical footprint vertically, but feet must land consistently

---

## Frame Layout Contract

All walkable spritesheets for `humanoid_v1` must use the same directional frame layout.

### Minimum layout
One row, 8 frames:

1. north_idle
2. north_walk
3. south_idle
4. south_walk
5. east_idle
6. east_walk
7. west_idle
8. west_walk

### Sheet dimensions
- `512x64` total
- `8` frames
- each frame `64x64`

### Direction semantics
- north = facing away/up
- south = facing toward/down
- east = facing right
- west = facing left

If additional animation states are added later, they must be versioned separately and not silently replace this contract.

---

## Anchor Contract

### Primary anchor
Every frame uses the same canonical body anchor:

- `anchor_x = 32`
- `anchor_y = 56`

This anchor represents the **body root / foot plant centerline**.

Interpretation:
- X center of the frame
- Y near the bottom of the standing body, where the character contacts the ground

### Why this matters
All layers must line up relative to the same foot plant, not relative to their own local image bounds.

That means:
- hats do not float because their canvas is trimmed differently
- coats do not shift because they were drawn lower
- nation overlays do not wobble between directions

### Rule
No asset may redefine the anchor ad hoc.

If an asset cannot align at this anchor, the asset must be corrected.

---

## Body Bounding Box

Inside each `64x64` frame, the body should occupy a stable design region.

### Recommended body region
- width: approximately `22–28 px`
- height: approximately `38–46 px`
- feet should land around y = `56`
- head top generally between y = `10–16`

This leaves room for:
- hats / horns / hair volume
- cloaks
- shoulder silhouettes
- aura overlays
- status effects

### Centerline
The humanoid body should be centered around x = `32`

Slight asymmetry for stance is allowed.
Center drift is not.

---

## Silhouette Contract

`humanoid_v1` is a readable, grounded, game-legible top-down / 3-quarter-adjacent RPG body.

### Must preserve
- clear head region
- readable torso block
- readable leg/foot grounding
- direction legibility at a glance
- one-tile social readability in crowds

### Must avoid
- oversized decorative details that obscure facing
- silhouettes so broad they spill into adjacent players visually
- tiny noodle limbs that vanish at runtime scale
- nation/archetype layers that destroy the core body read

### Design target
A player in a crowded room should still be able to read:
- facing
- broad role / archetype class
- broad nation palette family
- major equipment silhouette

without zooming in.

---

## Layer Categories and Allowed Coverage

### 1. Base Body
Contains:
- nude or undergarment body base
- canonical anatomy block-in
- no nation or archetype styling

Must define the underlying form for every other layer.

### 2. Skin / Body Tone
May modify:
- exposed skin regions only

Must not alter outline geometry.

### 3. Hair / Head Adornment
May extend above the head silhouette.
Must remain attached to the same skull position across all directions.

### 4. Nation Layer
Should express:
- palette family
- symbolic motif
- material language

Should not fundamentally replace the body silhouette.
Nation is identity flavor, not a new skeleton.

### 5. Archetype Layer
Should express:
- stance language
- class silhouette
- role signal

Archetype may alter the outer silhouette more strongly than nation, but still must respect the anchor and body root.

### 6. Equipment Layer
Must be slot-based when possible:
- head
- chest
- legs
- back
- hand/offhand
- accessory

Equipment should attach to existing body zones, not redraw the body from scratch.

### 7. Effects Layer
Used for:
- emotional alchemy effects
- BAR modifiers
- status glows
- temporary visual states

Effects may exceed the core silhouette, but must remain centered on the body anchor.

---

## Palette Discipline

`humanoid_v1` does not force a single universal palette, but it does require palette governance.

### Rules
- every asset must declare its palette family
- nation layers should derive from nation palette sets
- archetype layers should use constrained accent ranges
- AI-generated assets must be quantized into approved palette families before approval

### Why
Most consistency failures that look like “style drift” are actually:
- uncontrolled saturation
- uncontrolled hue temperature
- uncontrolled contrast ladders

Palette discipline does more work than people want to admit.

---

## Pixel Rules

### Required
- crisp pixel edges
- no accidental blur
- no subpixel positioning
- no antialiasing unless explicitly part of style system
- transparent background

### Forbidden
- semitransparent stray pixels
- export scaling artifacts
- inconsistent line weight within the same layer family
- canvas trimming that changes anchor meaning

### AI-specific correction rule
Any AI-generated source must be:
1. resized/cleaned to the exact grid
2. palette-normalized
3. manually or programmatically checked for fuzzy edge contamination

AI is welcome to hallucinate motifs.
It is not welcome to hallucinate alignment.

---

## Direction Consistency Rules

Each directional frame must preserve body identity.

### Must remain stable across directions
- head size
- torso mass
- leg length
- hand placement logic
- key symbolic motifs
- anchor position

### Can change by direction
- visible accessory side
- cape overlap
- asymmetrical shoulder or weapon presentation
- back-facing motifs for north view
- facial emphasis for south view

### Failure case
If east/west look like different species, the sheet fails.

---

## Mirroring Policy

Do not assume horizontal mirroring is always acceptable.

### Allowed
- temporary prototyping
- low-priority NPCs
- internal tests

### Preferred for shipping
Author true east and west frames when silhouette matters.

Why:
- asymmetrical equipment
- handedness
- archetype stance language
- nation motifs
- symbolic shoulder/weapon placement

Mirroring is a convenience, not a doctrine.

---

## Animation Rules

`humanoid_v1` v1 only requires:
- idle frame
- walk frame

### Idle
The body is stable, grounded, readable.

### Walk
The body has visible directional movement, but should not dramatically change height or width.

### Constraint
The body root must not appear to slide around inside the frame.
Motion should feel like a walk cycle, not like the paper doll itself drifting.

---

## Export Contract

Any composed `humanoid_v1` sheet exported for runtime must include:

- exact frame size
- exact frame order
- anchor metadata
- identity metadata
- source layer metadata
- palette family
- provenance status

### Recommended metadata shape
```json
{
  "model": "humanoid_v1",
  "frameWidth": 64,
  "frameHeight": 64,
  "anchor": { "x": 32, "y": 56 },
  "layout": [
    "north_idle",
    "north_walk",
    "south_idle",
    "south_walk",
    "east_idle",
    "east_walk",
    "west_idle",
    "west_walk"
  ],
  "identity": {
    "nation": "argyra",
    "archetype": "bold-heart"
  },
  "palette": "argyra_core_v1"
}
```

---

## Validation Checklist

Before an asset or composed export is approved, verify:

- [ ] frame size is exactly `64x64`
- [ ] sheet size is exactly `512x64` for v1 walkable export
- [ ] anchor is `32,56`
- [ ] feet land consistently
- [ ] silhouette reads at `32x32`
- [ ] no blur / fuzzy edge contamination
- [ ] palette matches approved family
- [ ] direction frames preserve identity
- [ ] layer aligns without nudging
- [ ] metadata is complete

If any layer requires manual positional compensation in code, fail validation.

---

## GM Face Read on This Spec

### Shaman
This preserves the ritual body—the stable vessel through which symbolic layers can actually mean something.

### Challenger
This gives players expressive range without letting that range turn into unreadable chaos.

### Regent
This is the law. Without this, contributors will unknowingly fork reality.

### Architect
This creates a scalable, cacheable, testable contract for runtime composition and export.

### Diplomat
This makes contribution possible because people know what “correct” looks like.

### Sage
This lets the visual system evolve without severing identity, performance, and symbolic coherence from one another.

---

## Follow-Up Specs

After `humanoid_v1`, the next recommended specs are:

1. `visual-token-system.md`
2. `palette-families-v0.md`
3. `walkable-spritesheet-export-pipeline.md`
4. `asset-registry-schema-v0.md`

---

## Final Principle

The body must become boring enough to be trustworthy.

That is not an insult.

That is how the strange, beautiful, symbolic layers above it get to be alive without falling off.
