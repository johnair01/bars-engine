# Spec: Triangle Workbench and Projection Room

> **Amended 2026-10-28 (council position `dr-line-is-concept`, pass dojo-retro1).** Wendell: "extending a triangle means that it shares a line. Each segment is one of the concepts... we should be able to build these up line by line and extend them not unlike how one would do it with pen and paper but optimized for touch screen". Each line of a triangle is one concept, and extending shares a line. Earlier wording in this spec put words at corners and shared a word; where any remains, the line model governs. Built in `src/lib/dojo-practice/geometry.ts` and `draft.ts`.

## Purpose

Make Triangle Workshop a place for sustained play with many related triangles, rather than a one-off form. A private whiteboard holds a player’s evolving pattern-map. The dojo projects one selected triangle into embodied space for exploration and then returns it to the board.

## Core loop

1. **Notice** — create words and assemble one word-triangle.
2. **Arrange** — grow a thought string by adding triangles that share a line with an existing triangle; strings can branch from any line that has a free side.
3. **Select** — tap a triangle to focus it; the selected triangle becomes the candidate for the dojo.
4. **Project** — send one focused word-triangle from the active thought string into the room.
5. **Read charge** — mark each word's **activation** (0–3) and present orientation (**constricting, supportive, mixed, or unread**). A triangle can show these player-owned reads without claiming that intensity and goodness are the same thing.
6. **Work** — make a bounded move on the selected triangle or word: name it, distinguish a value from a harmful form, shift a polarity, introduce a WOCGS / Emotional Alchemy move, or use an appropriately-scoped Mastering Alchemy preparation.
7. **Return** — bring the edited triangle back to the workbench as the same object, with its history and status visible.
8. **Settle** — leave it fluid for further play, archive it, or lock it in place as a current working insight. Locking is reversible.

Before a triangle is assembled, the player can use a **word harvest**: an unstructured, revisitable group of words that arise around a charged pattern, resistance, question, or desired creation. A triangle is always a selected temporary slice of this wider material, never a claim that the whole pattern is only three things.

## Product decisions

### One dojo, two stances: orientation and live practice

The dojo teaches the grammar of Thought Strings and also hosts a player's real work. These must be visibly distinct so a player never mistakes a tutorial demonstration for a change to their BAR, private constellation, spirit progression, or Between.

| Stance | Purpose | Material | What can change | Exit |
|---|---|---|---|---|
| **Orientation: Learn the grammar** | Learn word harvest, charge, word-triangle, shared-word extension, positive continuation, bridge, projection, and return. | Authored, safe practice constellation; no personal BAR required. | Tutorial state only. No BAR provenance, ember, spirit, daemon, or Between effect. | Restart, leave, or begin live practice at any point. |
| **Live practice: Work a real BAR** | Create or revise a private constellation in service of a real BAR/intention. | Player-created words and optional BAR context. | Only player-confirmed private constellation, BAR outcome, and later explicitly chosen craft ingredients. | Settle for now, return to BAR/Nook, or discard uncommitted draft. |

- Orientation is replayable and never graded. It teaches through one small move at a time, not a worksheet that must be completed correctly.
- The first live-practice screen is an **orientation moment**, not another tutorial: name an intention or choose a BAR, optionally choose a three-word platform, and decide whether to invite a spirit witness. All are optional except choosing where the work belongs (a BAR or private unlinked practice).
- 8th-Ray and craft-affecting actions belong only to live practice, after a selected target and explicit pause/orientation confirmation.
- The physical dojo communicates the stance: the wall carries a softly labeled demonstration constellation in Orientation; in Live practice it carries the active private constellation. The bowl/stools remain the same embodied focus place in both.
- The player may copy a tutorial word into live harvest, but never carries tutorial charge, history, or outcomes as if they were personal data.

### Source audit: why the split matters

The following Mastering Alchemy playbooks were reviewed on 2026-10-27: **Session 12: The Triads**, **Session 16: Success Strings**, **Session 17: Eighth and Ninth Rays**, and **Session 18: A Beach in the Cube and the 8th Ray**.

- They distinguish building familiarity with a geometry/tool from later using it for creation. Session 17 says the mechanics have been built and it is time to "drive" rather than continually inspect them; the product equivalent is orientation before live creation.
- They frame learning as playful, curious, unhurried, and non-punitive. Orientation cannot score spiritual correctness, require disclosure, or gate access behind a perfect run.
- They consistently place intention, present-time orientation, and a word platform before a creation exercise. Live practice needs a brief voluntary arrival ritual before a consequential operation.
- They distinguish clearing/rearranging from creating/weaving a desired pattern. The workshop must preserve the sequence: observe/materialize → select a target → pause → choose an operation → optionally build/extend a positive continuation → return and integrate.
- These are tradition-specific practice claims. The game may faithfully model their interaction grammar, but must describe effects as player-chosen reflective practice rather than assert that software has literally altered energy, matter, or another person.

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
- **Stable layout:** existing triangles do not automatically rearrange when new triangles are added. New material grows outward from the selected shared line. Any reflow is explicit and previewable.
- **Pinned placement:** a player may pin a triangle arrangement. Pins resist any later optional reflow.

### Whiteboard primitives

| Primitive | Meaning | State |
|---|---|---|
| Word | A word or short phrase used as the active material of construction | label, optional note, board position, status |
| Word-triangle | Three lines, each carrying one word, closed as one triangle | title, source/intent, projection history |
| Thought string | An ordered or branching construction of word-triangles connected through shared lines | title, intention, triangle order/branches, move history |
| Cluster | A visual grouping / territory on the board | title, color, collapsed state |

Words are reusable: several word-triangles can reference the same word. Editing its wording propagates intentionally; triangle-specific interpretations are stored as annotations, not copied words.

### Charge grammar

- Every word has a player-owned read with **activation** (0–3) and **orientation** (`constricting`, `supportive`, `mixed`, or `unread`). This is a present-time self-report, not an objective diagnosis or a measure of another person.
- Activation and orientation must remain distinct: excitement can be high-activation and supportive; grief can be high-activation and mixed. The game never assigns either value from the word itself.
- A triangle displays its three reads; it does not collapse them into a misleading summed moral score. Shared words visibly carry their player-owned read wherever they occur.
- A string can be extended from any selected triangle. The player may optionally label an extension as a supportive continuation; the system never infers a solution from a positive score.
- An 8th-Ray representation targets a player-selected constricting or mixed triangle only after explicit pause/orientation confirmation. M1 records a chosen operation and later player revision; it does not change a word's read automatically or claim that the product cleared an energy field.

### Emotional Alchemy crosswalk

Thought-string words and Emotional Alchemy primitives are related but never identical types of material.

- A **word** is player language: it may be a concept, image, feeling, phrase, action, or question.
- An **EA anchor** is a player-confirmed canonical state: channel, element, altitude, and move-table version. Proposed and declined anchors are visible only to the player and cannot drive mechanics.
- An **EA teaching triangle** is deterministically derived only when the active constellation contains player-confirmed anchors for a same-altitude root, its Sheng successor, and that successor's Sheng successor. The root's Ke edge closes the triangle.
- An **EA move** is an available named practice frame from the versioned move table, not an automatic instruction or interpretation.
- A **BAR outcome** is player-authored. It may reference selected word IDs, confirmed anchor IDs, and selected move IDs, but never imports raw harvest, private notes, or charge history by default.

The first falsification fixture is `elemental-triad-fixture.md`: Metal/satisfied → Water/satisfied → Wood/satisfied derives **Deepen Value**, **Renew Vitality**, and the Ke closing move **Activate Hope**. It exists as an authored lesson and test harness, not as a claim that “hope” is a sixth canonical emotion.

### Construction constraints

These constraints preserve the recognizable Thought String grammar while keeping the wall playable on a phone.

- A word-triangle always has exactly three lines, each carrying one word.
- To extend a thought string, the player selects exactly one existing line as the shared line and names exactly two new lines. This makes the continuation legible.
- To branch, the player selects an existing word and begins another triangle from it; branches never appear through automatic inference.
- A new word can be introduced freely, but reuse selects the existing word object rather than making a duplicate. The interface must show when a word already participates elsewhere in the active constellation.
- The 3D wall shows at most three direct continuations from one visible triangle. More continuations collapse into a small branch bud which opens in the 2D workbench/focus lens.
- There is no hard lifetime limit on a thought string. Density is handled by focus, settled regions, and the authoritative 2D overview rather than forced deletion.
- A player must explicitly select an operation and its target word, triangle, or later-specialized component. The system never mutates a string merely because it is visually near another string.

### Touch-first interface

| Player action | 3D room behavior | Focus-lens behavior |
|---|---|---|
| Approach/tap a line | It brightens and shows its immediate triangles | Inspect wording, notes, linked occurrences, pin or rename |
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

- A player can enter a replayable orientation constellation that teaches construction grammar without mutating personal game state.
- A player can explicitly enter live practice from a BAR, the Nook, or a private practice start; the UI makes the difference from Orientation unambiguous.
- A player can leave either stance at any time without a failure state or forced completion.
- A player can create and label words, word-triangles, and thought strings on a private workbench.
- A player can harvest words before, during, and after triangle construction, then return later without losing incomplete material.
- A player can add their own words and draw from an optional starter vocabulary before or after triangle construction.
- A player can mark a word's charge and intensity (−3 through +3) without being required to explain its origin, project it, or change it.
- A player can use an explicit, reversible 8th-Ray move on a negatively charged triangle only after an intentional pause/orientation moment; the changed word propagates through its shared thought string.
- A player can extend a positively charged triangle into a new positive continuation through a shared line.
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
