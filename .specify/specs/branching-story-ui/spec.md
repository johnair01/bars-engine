# Spec: Branching Story UI ("Yes-And" Throughput)

## Purpose

Define the visual and interactive experience for **Collaborative Branching**. This "throughput" layer makes the underlying API visible to players, allowing them to see potential seeds, "Yes-And" them with their own BARs, and watch the story branch in real-time.

**Problem:** Players need to *feel* the "Yes-And" mechanic as a creative invitation, not just a technical feature. The UI must guide them from a default authored story into a collaborative "inner world" reflection.

**Practice:** Deftness Development — UI-to-component loops, immersive feedback, I Ching vibes.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Trigger** | Use the `COLLAB` tag in Twine text to surface the "Yes-And" affordance. |
| **Drawer** | A "Yes-And" drawer/modal that slides up when a collaborative node is reached. |
| **Seed Cards** | Visual representations of BARs in the nursery, showing title, creator, and "watering" score. |
| **Branching UI** | A distinct visual transition (e.g. glitch or glow) when moving from authored to collaborative content. |

## User Stories

### P1 — Seeing Seeds
**As a** player on a spoke adventure, **I want** to see a "Seed of Potential" when I reach a move node (e.g. Wake Up), **so** I know this is a place where I can branch the story.

### P2 — Planting a "Yes-And"
**As a** creative player, **I want** to select one of my own BARs to "Yes-And" a node, **so** I can see the story adapt to my unique perspective.

### P3 — Identifying Collaborators
**As a** collaborative player, **I want** to see who else has "Yes-Anded" this branch, **so** I feel like I'm part of a shared project.

## Components & Surfaces

### `YesAndDrawer.tsx`
- Slides up from the bottom of `PassageRenderer`.
- Displays `SeedCard` components for available kernels.
- Primary CTA: "Yes-And with your BAR."

### `SeedCard.tsx`
- Small, expressive card showing:
  - BAR Title
  - Creator Avatar/Label
  - Watering Progress (as a "Growth" indicator)
  - Element/Face icon

### `BranchingOverlay.tsx`
- A visual shroud or transition effect that triggers when a `bridgeBranchWithBar` success occurs.

## Functional Requirements

- **FR1**: Detect `COLLAB` tag in Twine passage text and toggle the "Yes-And" button visibility.
- **FR2**: Integration with the `artifactLedger` to show already-collected seeds.
- **FR3**: Support "Ghost Mode" where the player can see what *could* be there even if they don't have a BAR.

## Verification Quest

- **ID:** `cert-yes-and-ui-v1`
- **Steps:**
  1. Enter a Spoke CYOA.
  2. Reach a "Wake Up" node with a `COLLAB` tag.
  3. Verify the "Yes-And" drawer appears.
  4. Select a BAR from your vault.
  5. Watch the story branch into the new content.
  6. Verify the collaborator credit appears on the next node.
