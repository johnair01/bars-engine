# Plan: NPC Ritual Encounter

## Key Insight

Two-stage ritual: **adventure then reflection.** The adventure runner plays the Twee CYOA (immersive world, choices, emotional arc). At the reflection seam — after the Witness/Epiphany passages — a 321 dialogue phase opens for NPC-voiced integration work. The BAR emerges from the 321, not from a form field. Then the player carries the BAR to a nursery to plant it.

The Pyrakanth Clean-Up Twee has 20 nodes. Nodes 1-16 are the adventure (Start → Epiphany). The seam is at the Epiphany nodes. After the player chooses their epiphany type, the 321 reflection opens (NPC-voiced, contextualized by the epiphany). Then GenerateBAR creates the BAR from the reflection. Then CompleteReflection closes the ceremony.

## What Exists vs What We Build

| Exists | Build |
|--------|-------|
| Adventure runner (plays CYOA) | Import script for Twee → Adventure |
| twee-to-flow pipeline | Tag GenerateBAR with bar_emit metadata |
| Pyrakanth Twee (20 nodes) | NpcEncounterModal (named NPC → adventure route) |
| Named NPCs (in Shadow321) | Shared NPC constant file |
| Spatial rooms + nurseries | Carry-and-plant flow (URL params + planting UI) |
| bar_emit in adventure runner | Enrich with move library metadata |
| SpokeMoveBed planting logic | Extract into standalone plantBarOnSpoke() |

## Phase 1: Import + Play (the vertical slice)

### 1.1 Write Twee import script
- `scripts/import-npc-twee.ts`
- Reads Twee file → parses passages (title, text, links)
- Creates Adventure row (slug, title, startNodeId, status: ACTIVE, campaignRef)
- Creates Passage rows for each node (nodeId, text, choices JSON, metadata)
- Tags Epiphany passages with `metadata: { actionType: 'ritual_321', npcId: 'ignis' }`
- Tags GenerateBAR passage with `metadata: { actionType: 'bar_emit' }`
- Idempotent: check for existing adventure by slug before creating

### 1.2 Import Pyrakanth Clean-Up Twee
- Run: `npx tsx scripts/import-npc-twee.ts`
- Verify: navigate to `/adventure/pyrakanth-clean-up/play` → plays 20 nodes

### 1.3 Verify CYOA portion plays
- Walk through: Start → ChooseMove → ChooseGM → IntroMove → RevealRoot → paths → Offering → release methods → AfterRelease → Witness → Epiphany choices
- Confirm: authored prose renders, choices branch correctly, all paths converge

### 1.4 Build ritual_321 passage handler
- When AdventurePlayer hits a passage with `actionType: 'ritual_321'`:
  - Render passage text (the Epiphany prose) as context
  - Below it, open the ThreeTwoOneDialogue component (NPC-voiced)
  - NPC questions loaded from the NPC's question config (Ignis = fire-voiced)
  - On 321 completion: store responses, advance to GenerateBAR passage
- The 321 is embedded WITHIN the adventure flow, not a separate page

### 1.5 Enrich bar_emit with 321 reflection data
- When bar_emit fires at GenerateBAR:
  - Pre-fill with 321 reflection context
  - Use move library bar_prompt_template
  - After BAR created: attach move library metadata, award vibeulons, write hub receipt
  - Advance to CompleteReflection passage (ceremony text)

## Phase 2: NPC Encounter Wiring

### 2.1 Extract named NPCs to shared constant
- `src/lib/npc/named-guides.ts`
- 6 NPCs with: id, name, face, tagline, description, color, nationKey, adventureSlug (nullable)
- Import in both Shadow321Runner and NpcEncounterModal

### 2.2 Create NpcEncounterModal
- Replace FaceNpcModal with richer NPC identity display
- Shows: name, tagline, description, nation flavor
- "Enter [NPC name]'s Trial" button → routes to `/adventure/[slug]/play?returnTo=...`
- If NPC has no adventureSlug: "This guide's trial is not yet available"

### 2.3 Update intro room NPC anchors
- Face NPC config carries `npcId` (not just `face`)
- NpcEncounterModal looks up NPC by id
- Reseed intro room with updated anchor configs

### 2.4 Wire adventure return path
- Adventure launch URL: `/adventure/pyrakanth-clean-up/play?returnTo=/world/bb-bday-001/spoke-0-intro&npc=ignis`
- On completion/exit: redirect to returnTo

## Phase 3: Carry + Plant

### 3.1 Adventure completion → carrying state
- When adventure completes (terminal passage), redirect to: `returnTo?carrying=[barId]`
- RoomCanvas reads `carrying` from URL params
- Shows floating HUD: "Carrying: [BAR title]"

### 3.2 Nursery plant mode
- NurseryActivityModal checks `carrying` param
- If carrying + matching moveType: "Plant [BAR title] here" → calls plantBarOnSpoke()
- If carrying + wrong moveType: "This BAR belongs in the [correct] nursery"
- If not carrying: "Visit an NPC in the clearing to begin"
- If already planted: existing completion state display

### 3.3 plantBarOnSpoke() extraction
- Extract planting logic from completeNurseryRitual() into standalone action
- Input: barId, instanceSlug, spokeIndex, nurseryType
- Upserts SpokeMoveBed, writes hub receipt, awards vibeulons

### 3.4 Enrich bar_emit with ritual metadata
- When bar_emit fires at GenerateBAR passage, detect ritual context from URL params or passage metadata
- Call enrichment: attach move library data (vibeulon_rules), NPC metadata, face

## Implementation Order

1. **1.1-1.3**: Import Twee + verify playback (gets the story playing ASAP)
2. **2.1-2.2**: NPC identity + encounter modal (names the characters)
3. **2.3-2.4**: Wire NPC → adventure route + return (connects the dots)
4. **3.1-3.2**: Carry + plant (closes the game loop)
5. **3.3-3.4**: Enrichment (vibeulons, receipts)

Phase 1 is the smallest and most impactful — it gets the authored story playable.

## Risk Register

| Risk | Mitigation |
|------|-----------|
| twee-to-flow may not handle all Twine syntax in the Twee file | Test import early; hand-fix any parsing issues |
| bar_emit passage needs specific metadata format | Check AdventurePlayer's bar_emit handling; adapt Twee or metadata |
| returnTo + carrying params across adventure → room navigation | URL params survive navigation; test the chain |
| Only 1 NPC has authored content | MVP with Ignis; other 5 show "not available" — acceptable |
