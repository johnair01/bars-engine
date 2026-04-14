# Tasks: Adventure Seam Protocol

## Phase 1: The Ignis Split (concrete case)

- [ ] 1.1: Add [seam:...] tags to Pyrakanth Twee (Epiphany, GenerateBAR, CompleteReflection)
- [ ] 1.2: Update import-npc-twee.ts to detect seam tags and split into segments
- [ ] 1.3: Import Twee → verify 2-3 Adventure segments created
- [ ] 1.4: Build SeamReflection321 component (NPC-voiced, full-screen after passage text)
- [ ] 1.5: Build SeamBarCreate component (structured reflection, pre-filled from 321 data)
- [ ] 1.6: Build SeamCarryReturn component (ceremony + redirect with ?carrying=barId)
- [ ] 1.7: Wire adventure_seam handler in AdventurePlayer (detect + delegate to seam component)
- [ ] 1.8: Test: full Ignis trial — 16 narrative nodes → 321 seam → BAR seam → carry + return

## Phase 2: Generalize

- [ ] 2.1: Create seam component registry (src/components/adventure/seams/)
- [ ] 2.2: Define seam state protocol (sessionStorage keys, clearing, cross-segment data)
- [ ] 2.3: Update import script for multi-seam Twee (N seams → N+1 segments)
- [ ] 2.4: Document Twee seam tag convention for content authors

## Phase 3: Second NPC (validates pattern)

- [ ] 3.1: Author Kaelen's Twee (Virelune/wood/shaman — different voice, same seam points)
- [ ] 3.2: Import Kaelen → verify seam protocol generalizes
- [ ] 3.3: Test: Kaelen trial with Kaelen-voiced 321 → BAR → carry → plant
