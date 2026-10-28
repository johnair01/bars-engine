# Spec: Triangle Workbench and Projection Room

## Purpose

Make Triangle Workshop a place for sustained play with many related triangles, rather than a one-off form. A private whiteboard holds a player’s evolving pattern-map. The dojo projects one selected triangle into embodied space for exploration and then returns it to the board.

## Core loop

1. **Notice** — create words and assemble one word-triangle.
2. **Arrange** — grow a thought string by adding triangles that share a word with an existing triangle; strings can branch from any shared word.
3. **Select** — tap a triangle to focus it; the selected triangle becomes the candidate for the dojo.
4. **Project** — send one focused word-triangle from the active thought string into the room.
5. **Work** — make a bounded move on the selected triangle or word: name it, distinguish a value from a harmful form, shift a polarity, introduce a WOCGS / Emotional Alchemy move, or use an appropriately-scoped Mastering Alchemy preparation.
6. **Return** — bring the edited triangle back to the workbench as the same object, with its history and status visible.
7. **Settle** — leave it fluid for further play, archive it, or lock it in place as a current working insight. Locking is reversible.

Before a triangle is assembled, the player can use a **word harvest**: an unstructured, revisitable group of words that arise around a charged pattern, resistance, question, or desired creation. A triangle is always a selected temporary slice of this wider material, never a claim that the whole pattern is only three things.

## Product decisions

### Two surfaces, one model

- **Workbench** is a calm, pannable/zoomable 2D graph board. It is for breadth, comparison, and long strings of related triangles.
- **Projection room** is the spatial dojo. It is for depth: one triangle at a time, embodied at the stools and bowl.
- The room never owns a duplicate. It edits the selected workbench triangle directly and returns it to its prior location on the board.

### Constellations, not one infinite board

- A player begins with a **series of named private constellations**. A constellation is a bounded inquiry field, such as a relationship, recurring fear, project tension, or decision.
- Each constellation owns its own words, word-triangles, thought strings, clusters, history, and locks.
- The player works in one active constellation at a time. The workbench opens directly into that bounded field; the dojo can project only from the active constellation.
- Cross-constellation reuse and a lifetime meta-map are explicitly deferred. A future version may allow a player to copy or reference a word or string into another constellation, but M1 never silently entangles contexts.
- Creating a constellation asks only for a title and an optional intention. It does not require a problem statement or an outcome commitment.

### The Constellation Wall is a living atlas, not an infinite graph

The 3D wall is the spatial view of the active constellation, not a literal one-to-one rendering of every triangle forever. It shows a readable **focus region** and preserves a sense of the wider string without turning the room into a tax return with lanterns.

- **Focus region:** up to 9 active word-triangles are rendered at full scale on the wall. The player selects which string segment or branch is in focus.
- **Settled regions:** completed/older segments remain as dim, compact strand-glyphs at the edge of the wall. Tapping one brings that segment into focus; it does not vanish or get deleted.
- **Unseen remainder:** the wall gives a small count and direction cue for further branches beyond the visible region, while the full 2D workbench remains the authoritative overview.
- **One active projection:** exactly one word-triangle can extend from the wall to the floor stools at a time.
- **Stable layout:** existing word-points do not automatically rearrange when new triangles are added. New material grows outward from the selected shared word. Any reflow is explicit and previewable.
- **Pinned placement:** a player may pin a word-point or triangle arrangement. Pins resist any later optional reflow.

### Whiteboard primitives

| Primitive | Meaning | State |
|---|---|---|
| Word | A word or short phrase used as the active material of construction | label, optional note, board position, status |
| Word-triangle | Three word references arranged as one triangle | title, source/intent, projection history |
| Thought string | An ordered or branching construction of word-triangles connected through shared words | title, intention, triangle order/branches, move history |
| Cluster | A visual grouping / territory on the board | title, color, collapsed state |

Words are reusable: several word-triangles can reference the same word. Editing its wording propagates intentionally; triangle-specific interpretations are stored as annotations, not copied words.

### Construction constraints

These constraints preserve the recognizable Thought String grammar while keeping the wall playable on a phone.

- A word-triangle always has exactly three word-points.
- To extend a thought string, the player selects exactly one existing word as the shared word and adds exactly two words. This makes the continuation legible.
- To branch, the player selects an existing word and begins another triangle from it; branches never appear through automatic inference.
- A new word can be introduced freely, but reuse selects the existing word object rather than making a duplicate. The interface must show when a word already participates elsewhere in the active constellation.
- The 3D wall shows at most three direct continuations from one visible word-point. More continuations collapse into a small branch bud which opens in the 2D workbench/focus lens.
- There is no hard lifetime limit on a thought string. Density is handled by focus, settled regions, and the authoritative 2D overview rather than forced deletion.
- A player must explicitly select an operation and its target word, triangle, or later-specialized component. The system never mutates a string merely because it is visually near another string.

### Touch-first interface

| Player action | 3D room behavior | Focus-lens behavior |
|---|---|---|
| Approach/tap a word-point | It brightens and shows its immediate triangles | Inspect wording, notes, linked occurrences, pin or rename |
| Tap a triangle | Its three lines glow; its relation to the wider string stays visible | Project, edit words, add a continuation, or branch |
| Tap a branch bud / settled glyph | Camera attention shifts toward that region | Open the focused slice without rearranging the rest |
| Long-press a word or triangle | Opens a small radial action ring | Pin, move, archive, or view history |
| Drag in 3D | Not used for structural editing; avoids accidental topology edits | Drag/reposition only in the 2D focus lens |

The **focus lens** is a full-screen, touch-first 2D view opened from the wall. It is not a separate product surface: it is the close-reading tool for the same constellation. It supplies pan, zoom, search, deliberate drag placement, and an accessible list view. The room remains the place for orientation, selection, and embodied projection.

### Triangle lifecycle

`draft → active → projected → revised → locked`.

- **Draft:** incomplete or exploratory; never judged for being messy.
- **Active:** available for projection.
- **Projected:** currently in the dojo; one per player at a time.
- **Revised:** changed in the room; returns to its board position with a small visible revision marker.
- **Locked:** a deliberately held working map. It is read-only until explicitly unlocked; it is not “final truth.”

### Word and string states

- **Harvested:** noticed and held without requiring interpretation or action.
- **Charged:** the player has marked a word as carrying energy/resistance; this is information, not an error state.
- **Salient:** the player has marked a word as repeating, important, or worth revisiting.
- **Held / revisitable:** an arrangement the player is keeping in view.
- **Settled for now:** a player-chosen pause point; it may be reopened without loss of history.

### Moves

M1 supports small authored moves; it does not infer, diagnose, or autonomously clear a player’s material.

- **Name** — give a word or word-triangle precise language.
- **Separate** — distinguish a person, role, value, or condition from its fused form.
- **Keep the value** — record what the selected construction protects.
- **Soften / mobilize** — record one variation that makes a construction less compulsory.
- **Boundary / support** — change a stabilizing condition around a selected construction.
- **Alchemical move** — attach an Emotional Alchemy/WOCGS practice chosen by the player.
- **Mastering Alchemy preparation** — identify the obstruction, the valued component, and the condition holding it stable. The first transcript does not warrant a self-guided claim of a full 8th-Ray clearing method.

Every move creates a small, reversible history record: what changed, who made it, when, and whether it was applied on the board or in the room.

## Requirements

- A player can create and label words, word-triangles, and thought strings on a private workbench.
- A player can harvest words before, during, and after triangle construction, then return later without losing incomplete material.
- A player can mark a word as charged or salient without being required to explain its origin, project it, or change it.
- The workbench accommodates branching thought strings without a fixed maximum triangle count.
- A player can select exactly one word-triangle from an active thought string and project it to the dojo.
- The projection room displays the selected three words and their triangle without claiming it is a fear-clearing configuration.
- A move applied in the room updates the same word-triangle and returns it to the board without losing its place in the string.
- A player can lock and unlock a triangle intentionally. Locking never prevents viewing or exports, and does not imply clinical resolution.
- An operation is available only after the player intentionally selects a target and confirms a pause/orientation moment; the product never presents an operation as automatic clearing.
- Board state is private by default, persisted per player, and exportable by the player before any future collaboration is introduced.
- The UI supplies a gentle pause/orientation exit for emotionally activating material; it must not present the system as therapy or make metaphysical efficacy claims.
- Phone interaction works with tap, drag, pinch/zoom alternatives, and a non-canvas accessible list view.

## Out of scope for M1

- Multiplayer co-editing, public/shared boards, AI interpretation, automatic triangle generation, social scoring, or irreversible clearing claims.
- Full 3D Blender dojo integration; M1 can use a stylized 2D/isometric projection surface while the modeled room is produced.

## Open design questions

1. Is a locked triangle a snapshot that can branch, or a live object that must be unlocked to edit?
2. Which first-class tags matter most on words and thought strings: emotional element, game-ontology type, relationship context, or all of the above?
3. Do we begin with touch-first free layout, or an assisted layout that can be manually adjusted?
