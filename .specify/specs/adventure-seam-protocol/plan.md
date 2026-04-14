# Plan: Adventure Seam Protocol

## Approach: Concrete Case → General Pattern

Build the 321 seam for Ignis's trial. One Twee, two segments, one seam. Then generalize.

## Phase 1: The Ignis Split

### 1.1 Add seam tags to Pyrakanth Twee
- Edit `docs/examples/cyoa-flow-pyrakanth-clean-up.twee`
- Add `[seam:321_reflection npc:ignis next:ignis-trial-harvest]` to Epiphany passages
- Add `[seam:bar_create move:fire_clean-up next:ignis-trial-ceremony]` to GenerateBAR
- Add `[seam:carry_and_return]` to CompleteReflection

### 1.2 Update import script with seam splitting
- Detect `[seam:...]` tags during parsing
- When a seam tag is found: that passage becomes terminal for current segment
- All subsequent passages become a new segment (new Adventure row)
- Terminal passage gets `metadata.actionType: 'adventure_seam'` with parsed config
- Link segments via `nextAdventureSlug` in metadata

### 1.3 Import and verify segments
- Run import → creates 2-3 Adventure rows
- Segment 1 (`ignis-trial-descent`): Start → Epiphany passages (terminal)
- Segment 2 (`ignis-trial-harvest`): GenerateBAR → CompleteReflection (terminal)
- Verify each segment plays independently

### 1.4 Build SeamReflection321 component
- Full-screen component, not embedded in a passage
- Receives: NPC id, passage context (epiphany text), returnTo, nextAdventureSlug
- Renders: passage text as context at top, then ThreeTwoOneDialogue below (NPC-voiced)
- On completion: store responses in sessionStorage, redirect to next segment

### 1.5 Build SeamBarCreate component
- Receives: move key, 321 responses from sessionStorage, NPC id
- Renders: structured reflection form (bar_prompt_template + 4 fields), pre-filled with 321 context
- On submit: creates BAR via enriched emitBarFromPassage (vibeulons, hub receipt)
- Stores barId in sessionStorage, advances to next passage or redirects

### 1.6 Build SeamCarryReturn component
- Simplest seam — reads barId from sessionStorage
- Renders: ceremony text from passage + "Return to the clearing" button
- On click: redirects to `returnTo?carrying=barId`
- Clears sessionStorage seam keys

### 1.7 Wire adventure_seam handler in AdventurePlayer
- When `currentNode.metadata.actionType === 'adventure_seam'`:
  - Render passage text (narrative context)
  - Below text: render seam component based on `seamType`
  - Hide normal choice buttons
  - Seam component handles its own completion + navigation

### 1.8 Test: Full Ignis trial
- Start at segment 1 (from NPC encounter or direct URL)
- Play through 16 narrative passages with choices
- Reach Epiphany → 321 seam opens (Ignis-voiced)
- Complete 321 → auto-navigate to segment 2
- GenerateBAR → BAR creation seam (pre-filled from 321)
- CompleteReflection → carry_and_return → back to spatial room with BAR

## Phase 2: Generalize

### 2.1 Seam component registry
- `src/components/adventure/seams/` directory
  - `SeamReflection321.tsx`
  - `SeamBarCreate.tsx`
  - `SeamCarryReturn.tsx`
  - `index.ts` — registry mapping seamType → component

### 2.2 Seam state protocol
- All seam data in sessionStorage under `seam_` prefix
- `seam_321_responses`: { it, you, i }
- `seam_bar_id`: barId
- `seam_npc_id`: current NPC
- `seam_chain_returnTo`: original returnTo for the full chain
- Cleared on chain completion (carry_and_return)

### 2.3 Multi-seam import
- Import script handles N seams per Twee → N+1 segments
- Segments auto-numbered if explicit next slug not provided
- Validates seam tag syntax, errors on malformed

### 2.4 Document authoring convention
- Twee seam tag reference for content authors
- Template Twee showing the pattern
- Guidelines: "What the passage text should set up for each seam type"

## Phase 3: Second NPC (validates the pattern)

### 3.1 Author Kaelen's Twee
- Virelune/wood/shaman aesthetic
- Same structural spine (intake → descent → release → witness → epiphany)
- Different voice, different landscape, different choices
- Same seam points: epiphany → 321 → bar → ceremony

### 3.2 Import Kaelen → verify seam protocol works for a second NPC
- Different NPC id, different adventure slugs, same seam types
- 321 uses Kaelen-voiced questions (already authored)
- Proves the protocol generalizes

## Risk Register

| Risk | Mitigation |
|------|-----------|
| Splitting Twee at seams may create awkward segment boundaries | Author controls where seams go — test with Ignis first |
| sessionStorage lost if player opens in new tab | Accept for MVP — add server-side seam state if needed later |
| Multiple Epiphany passages (4 in Pyrakanth) all have seam tags | All point to same next segment — first one reached triggers the seam |
| AdventurePlayer is complex (700+ lines) — adding seam handling | Seam handler is isolated — detect actionType, delegate to component, done |
