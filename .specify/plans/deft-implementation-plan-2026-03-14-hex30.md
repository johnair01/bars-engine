# Deft Implementation Plan — Hexagram 30: Hexagram 30

**Cast**: Saturday, March 14, 2026

## Hexagram Reading

**Hexagram 30** — Mysterious, Obscure, Unwritten

**Structure**: Water over Wind

**Meaning**: The Oracle's whisper fades. The deeper meaning of this hexagram must be deciphered through personal reflection.

## Sage Guidance

The hexagram suggests: *ground your next moves in the quality of the moment*. Prioritize items that build on what is solid (lower trigram) and move toward what is emerging (upper trigram).

## Implementation Order

### Shaman

- [ ] **PF** — Daemons Inner Work Collectibles (inner work → unlock talismans; Reliquary; use-in-quests Phase 2) (deps: RB, CM, ER)

### Challenger

- [ ] **DW** — Quest Library Wave Routing (route book quests by moveType: EFA pool, Dojo, Discovery, Gameboard; auto-assign on approve; model quest training) (deps: AZ, BN)
- [ ] **DL** — Campaign Map Phase 1 (Opening Momentum; Layer 1 Phase Header, Layer 2 Domain Regions, Layer 3 Field Activity; extends gameboard) (deps: CY, DG)
- [ ] **EE** — Transformation Move Library v1 (WCGS + Nation + Archetype layers; Nation Move Profiles; quest seed wake/cleanup/grow/show/bar) (deps: ED)
- [ ] **EF** — Nation Move Profiles v0 (Emotional Alchemy integration; emotion channel, developmental emphasis, move style per nation) (deps: EE)

### Regent

- [ ] **DS** — Dev Setup Anti-Fragile (loop:ready remediation hints, INCIDENTS.md, DB_STRATEGY, bootstrap script; learn from schema/migration/seed issues)
- [ ] **DT** — Flow Simulator CLI + Bounded Simulated Actor Roles (quest + onboarding flow simulation; Bruised Banana fixtures; Librarian/Collaborator/Witness scaffold; folded former **DQ**)
- [x] **PU** — Prisma P6009 Response Size Fix (archived; was duplicate **DU** id in BACKLOG) (deps: AZ)
- [ ] **EG** — Archetype Move Styles v0 (8 trigram-linked Playbooks; agency style, prompt modifiers, quest style; archetypeKey = playbook slug) (deps: EE)
- [ ] **EI** — Archetype Key Resolution (ARCHETYPE_KEYS → playbook slug mapping; resolveArchetypeKeyForTransformation; transformation/avatar use playbook slugs) (deps: EG)

### Architect

- [ ] **AVS** — Avatar System Strategy (bundle AW/AX/AY/BG/BH; deftness + agent-implementability; future: agent-built assets) (deps: AV, BB)
- [ ] **Y** — Bruised Banana House Instance (instance, recurring quests, house state) (deps: S, T)
- [ ] **AZ** — Book-to-Quest Library (PDF ingestion, Quest Library, Grow Up)
- [ ] **DJ** — Onboarding Quest Generation Unblock (I Ching step; feedback field; grammatical example; skeleton-first; lens as first choice; CYOA process) (deps: CX, CD, CR)
- [ ] **ED** — Narrative Transformation Engine v0 (parse stuck narrative → lock detection → transformation moves → Emotional Alchemy / 3-2-1 link → quest seed) (deps: CM, BY)
- [ ] **EZ** — Archetype Influence Overlay v1 (canonical trigram archetypes; agency overlay; Experiment/Integrate expression; superpowers separate) (deps: EG, EE)
- [ ] **EJ** — Admin Agent Forge (admin-only 3-2-1 Forge; distortion gate; friction mint; AgentSpec/AgentPatch; vibeulon routing)

### Diplomat

- [ ] **DK** — Cert Onboarding Quest Generation Unblock (verification quest cert-onboarding-quest-generation-unblock-v1; I Ching, feedback, skeleton, publish) (deps: DJ)
- [ ] **EH** — Superpower Move Extensions v0 (Allyship prestige; Connector, Storyteller, etc.; extends base archetypes for domain quests) (deps: EG)

## Convergence Groups

These items share dependencies; consider sequencing or parallel work:

- PF, ED: Share dependencies; consider sequencing or parallel work
- DW, DU: Share dependencies; consider sequencing or parallel work
- EF, EG, EZ: Share dependencies; consider sequencing or parallel work
- EZ, EH, EI: Share dependencies; consider sequencing or parallel work

## Do Next

1. Pick the highest-priority item from the top of the list that has unblocked dependencies.
2. Run `npm run build` and `npm run db:sync` before starting.
3. Create a spec/plan from the backlog item if one does not exist.
4. Implement API-first, then UI.
