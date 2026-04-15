# Backlog Analysis: Deftness Project Recommendation

## Purpose

Identify a project that combines multiple backlog items with good cross-section and dependencies to increase deftness skill: spec kit first, API-first, deterministic over AI, scaling robustness, generative dependencies, and process artifacts.

## Deftness Skill Dimensions

| Dimension | Meaning | How to Exercise |
|-----------|---------|-----------------|
| **Spec Kit First** | Implement from spec, not improvise | All items have specs at `.specify/specs/` |
| **API-First** | Contract before UI; Route vs Action | Define input/output before building |
| **Deterministic over AI** | Rules, templates, cache when possible | Template-based generation, heuristics |
| **Scaling Robustness** | Mitigate filesystem, AI, payload, env risks | Check scaling checklist |
| **Generative Dependencies** | One item unlocks or simplifies others | Merge candidates, foundation items |
| **Process Artifacts** | In-game legibility (verification quests) | Cert quests, dashboard surfaces |

## Ready Items by Theme

### Charge / Intention → Quest Pipeline

| ID | Item | Deps | Deftness Value |
|----|------|------|----------------|
| GD | Charge Capture UX | — | API-first; createChargeBar, getRecentChargeBars, run321FromCharge; minimal payload |
| GE | Charge → Quest Generator | GD | Template-based; generateQuestSuggestionsFromCharge; deterministic |
| GF | Singleplayer Charge Metabolism | CM, CN (done) | Schema design; Server Actions; verification quest; 321→quest/bar/fuel |

**Chain**: GD (foundation) → GE. GF is parallel (321 path) but shares quest-creation surface.

### Transformation Pipeline

| ID | Item | Deps | Deftness Value |
|----|------|------|----------------|
| ED | Narrative Transformation Engine | CM, BY (done) | Route Handlers; heuristic parsing; lock detection |
| EE | Transformation Move Library | ED | WCGS mapping; Nation/Archetype layers |
| FK | Transformation Move Registry | ED, EE | Canonical moves; filter, render, assembleQuestSeed |

**Chain**: ED → EE → FK. Pure Infra; less UI variety.

### BAR → Quest (Broader)

| ID | Item | Deps | Deftness Value |
|----|------|------|----------------|
| FM | BAR → Quest Generation Engine | BY, DM | Pipeline stages; admin review; emotional alchemy resolution |

### Scaling / Token Economy

| ID | Item | Deps | Deftness Value |
|----|------|------|----------------|
| DU | Prisma P6009 Response Size Fix | AZ | Over-fetch mitigation; anti-fragile |
| FQ | Book Quest Targeted Extraction | AZ, BN | Token savings; section→dimension mapping |
| DW | Quest Library Wave Routing | AZ, BN | moveType routing; auto-assign |

### API-First Foundation (RACI / Stewardship)

| ID | Item | Deps | Deftness Value |
|----|------|------|----------------|
| GA | BAR Response + Threading (RACI) | — | getBarThread, getBarRoles; max depth 2 |
| GB | Quest Stewardship + Role Resolution | GA | proposed→active→completed |
| GC | Actor Capability + Quest Eligibility | GA, GB | Matching layer; API-first |

### Admin / Agent

| ID | Item | Deps | Deftness Value |
|----|------|------|----------------|
| EJ | Admin Agent Forge | — | 321→agent; distortion gate; vibeulon routing |

---

## Recommended Project: Charge-to-Quest Pipeline

### Rationale

1. **Cross-section**: UI (capture flow, dashboard), Infra (API, schema), Economy (quest creation, vibeulons)
2. **Clear dependency chain**: GD → GE; GF shares 321/quest surface
3. **Generative potential**: GD unlocks GE; GF's Shadow321Session enables future metabolizability learning
4. **Deftness coverage**: API contracts, Route vs Action, template-based generation, verification quests
5. **All deps satisfied**: CM (321 EFA), CN (Creation Quest Bootstrap) are done

### Project Scope

**Phase 1 — Charge Capture (GD)**

- Implement createChargeBar, getRecentChargeBars, run321FromCharge
- Add charge_capture to CustomBar.type
- Charge capture UI (one screen, 3–5 taps)
- Dashboard "Recent Charge" section
- Post-capture: Reflect (321), Explore (quest suggestions), Act, Not now

**Phase 2 — Charge → Quest Generator (GE)**

- Implement generateQuestSuggestionsFromCharge(barId)
- Implement createQuestFromSuggestion(barId, suggestionIndex)
- Quest template library (template-based; deterministic where possible)
- Nation/archetype influence logic
- Integrate with Charge Capture "Explore" flow

**Phase 3 — Singleplayer Charge Metabolism (GF)**

- Post-321: Turn into Quest, Fuel System (alongside Create BAR)
- createQuestFrom321Metadata, fuelSystemFrom321, persist321Session
- Shadow321Session schema; friction subquest; tetris key-unlock
- Verification quest cert-singleplayer-charge-metabolism-v1

### Dependency Graph

```
GD (Charge Capture) ──┬──► GE (Charge → Quest)
                     │
CM (321 EFA) ────────┼──► GF (Singleplayer Charge Metabolism)
CN (Creation Quest) ─┘
```

### Deftness Checklist for This Project

- [ ] API contracts defined before UI (all three specs)
- [ ] Route vs Action: Charge Capture uses Server Actions; GE may use Route for external
- [ ] Scaling: Charge payload minimal; no filesystem; AI only in GE if template fallback
- [ ] Deterministic: GE template-based; GF uses extractCreationIntent (rules)
- [ ] Verification quests: cert-singleplayer-charge-metabolism-v1; consider cert-charge-capture-v1
- [ ] Generative: After GD+GE+GF, Charge Capture + 321 form a complete charge→quest loop

### Implementation Order

1. **GD** — Foundation; no blockers
2. **GE** — Requires GD (charge BAR exists)
3. **GF** — Can start in parallel with GE; deps (CM, CN) done

---

## Alternative Project: Transformation Foundation

**Items**: ED → EE → FK

**Pros**: Heuristic-first parsing; lock detection; Route Handlers; clear Infra chain  
**Cons**: Less UI; no verification quests in specs; more AI/heuristic design work

**Deftness value**: Deterministic parsing, API-first Route Handlers, canonical move registry.

---

## Alternative Project: Scaling + Book Quest

**Items**: DU (Prisma P6009) + FQ (Targeted Extraction) + DW (Wave Routing)

**Pros**: All scaling/token economy; touches AI, DB, payload  
**Cons**: Depends on AZ (Book-to-Quest); more niche

**Deftness value**: Scaling checklist; token efficiency; anti-fragile patterns.

---

## Generative Dependency Notes

### Charge Pipeline

- **GD + GE**: Charge Capture creates BARs; GE consumes them. GD is generative for GE.
- **GF**: 321→quest is a separate path. GF could later consume charge BARs (e.g., "Fuel from charge BAR").
- **Potential merge**: GE's createQuestFromSuggestion and GF's createQuestFrom321Metadata both create quests. Shared logic in creation-quest-bootstrap (extractCreationIntent, generateCreationQuest) — already factored.

### Supersession Check

- No items in this project supersede others. GD, GE, GF are complementary entry points.

---

## Recommendation Summary

**Primary**: Charge-to-Quest Pipeline (GD → GE → GF)

- Best cross-section of UI, Infra, Economy
- All deps satisfied
- Strong deftness coverage
- Clear generative relationship (GD unlocks GE)
- Verification quest in GF; can add for GD

**Secondary**: Transformation Foundation (ED → EE → FK) for teams wanting pure Infra/heuristic focus.
