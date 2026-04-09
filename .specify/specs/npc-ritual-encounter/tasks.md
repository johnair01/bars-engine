# Tasks: NPC Ritual Encounter

## Phase 1: Import Twee + Play CYOA + 321 Integration

- [ ] 1.1: Write `scripts/import-npc-twee.ts` (Twee → Adventure + Passage rows)
- [ ] 1.2: Import Pyrakanth Clean-Up Twee, tag Epiphany passages with `ritual_321`, GenerateBAR with `bar_emit`
- [ ] 1.3: Test: play CYOA portion (Start → Witness → Epiphany) at `/adventure/pyrakanth-clean-up/play`
- [ ] 1.4: Build `ritual_321` passage handler in AdventurePlayer (embeds 321 dialogue after Epiphany)
- [ ] 1.5: NPC-voiced 321 questions for Ignis (fire-specific: "What does your anger want you to DO?")
- [ ] 1.6: Wire 321 completion → bar_emit at GenerateBAR (pre-fill from reflection, move library metadata)
- [ ] 1.7: Enrich bar_emit with vibeulons + hub receipt
- [ ] 1.8: Test: full flow — CYOA (20 nodes) → 321 reflection (Ignis-voiced) → BAR created → ceremony

## Phase 2: NPC Encounter Wiring

- [ ] 2.1: Extract named NPCs to `src/lib/npc/named-guides.ts`
- [ ] 2.2: Create NpcEncounterModal (named NPC identity + "Enter trial" CTA)
- [ ] 2.3: Update intro room anchors with npcId config + reseed
- [ ] 2.4: Wire NPC → adventure route with returnTo
- [ ] 2.5: Unavailable NPCs show "trial not yet available"
- [ ] 2.6: Test: Ignis anchor → modal → adventure plays → 321 → BAR → returns to room

## Phase 3: Carry + Plant

- [ ] 3.1: Adventure completion redirects with `?carrying=[barId]`
- [ ] 3.2: "Carrying BAR" HUD indicator in RoomCanvas
- [ ] 3.3: Update NurseryActivityModal — plant mode / redirect mode
- [ ] 3.4: Create `plantBarOnSpoke()` standalone server action
- [ ] 3.5: Test: complete trial → carry BAR → walk to Clean Up → plant → spoke bed anchored
- [ ] 3.6: Test: enter nursery without BAR → "Visit an NPC first"
