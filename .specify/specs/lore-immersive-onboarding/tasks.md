# Tasks: Lore-Immersive Onboarding

## Phase 1 — Canonical Story Intro

- [ ] Create content/onboarding-story-intro.md with story-first intro copy (Conclave, heist, tone from story_context)
- [ ] Document narrative principle in spec or content

## Phase 2 — Instance + BB Nodes

- [ ] Audit Instance seed/defaults for wakeUpContent, showUpContent, storyBridgeCopy — ensure lore-rich when campaignRef=bruised-banana
- [ ] Verify BB_Intro, BB_ShowUp use Instance content; add fallback to story intro if empty
- [ ] Verify Event page Wake Up uses same content

## Phase 3 — Character Creation Story Beats

- [ ] characterCreationPacket.ts: Add story-beat text before lens hub ("What draws you most right now?" — keep or enhance)
- [ ] Nation hub: Add lore-flavored intro ("Each nation channels a different emotional energy...")
- [ ] Playbook hub: Add story framing ("How do you approach the heist?")
- [ ] Domain hub: Add contribution framing ("How do you want to contribute to the campaign?")

## Phase 4 — Chained Initiation + Moves

- [ ] seed-chained-initiation: Intro packet uses story-world copy (from content or Instance)
- [ ] movesGMPacket: Vibeulon intro in-story before sign-up

## Phase 5 — Verification

- [ ] Add cert-lore-immersive-onboarding-v1 to seed-cyoa-certification-quests.ts
- [ ] Run npm run build and npm run check — fail-fix
