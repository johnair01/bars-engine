# Spec: Player Handbook & Orientation System (PHOS)

**Sage-named problem:** Ontology Dislocation  
**Intervention type:** Ontology Bridge Layer  
**See:** [SAGE_CONSULT.md](./SAGE_CONSULT.md) for full synthesis.

---

## Problem statement (precise)

The BARS Engine has a rich, coherent **production-side ontology** — moves, quests, nations, archetypes, books, 321 sessions, charge captures, campaigns, threads. Operators understand it. The code implements it. But the **player-side** has no connective tissue that:

1. Orients a player **inside the game's own logic** ("here is where you are, here is why it matters")
2. Answers "what does success look like?" in player language — not feature names
3. Surfaces the library's accumulated knowledge (quests, moves, books) as **doing**, not **reading**
4. Trains the **felt-sense prerequisite** (Focusing / 321) so lower-skill players can participate meaningfully

The result is four hydra heads from one root:

| Symptom | Root cause |
|---------|------------|
| Navigation confusing | No mental model → tabs feel arbitrary |
| Orientation unclear | No "you are here + next best move" guidance |
| No player's handbook | Knowledge lives admin-side and in wiki; not in the game's flow |
| No library → player pathway | Quest/move/book knowledge is production-only |

**This is one spec, not four.** Fixing navigation without the handbook still leaves players lost. Shipping the library pipeline without the felt-sense scaffold overwhelms. The intervention must be integrated.

---

## Design principles (from the three foundational pillars)

| Pillar | Application |
|--------|-------------|
| **Antifragile** | The handbook **grows from player struggle** — friction and stuck moments are inputs, not failures; compost into better guidance |
| **Wealth of Networks** | Knowledge surfaces as **networked artifacts** (shared BARs, campaign threads, quest history) not a static manual page |
| **Felt Sense / Focusing** | The handbook **scaffolds** felt-sense contact at every step; 321/charge are the primary teacher; no gatekeeping |

---

## The Ontology Bridge Layer — what it is

A **Player Handbook & Orientation System** is not a new page. It is a **layer** — a set of connective tissue artifacts and affordances that make the existing system legible to a player from the inside. Concretely:

1. **A living "what success looks like" document** — defines player success in game terms (moves completed, felt sense contacted, quests placed, threads grown) not metrics.
2. **A handbook entry point** — `/wiki/handbook` or `/handbook` (linked from nav or dashboard): the four moves as **compass + action**, not wiki entries.
3. **A move-oriented orientation flow** — the NOW tab shows players their **current move context** and one concrete next action per move quadrant.
4. **A library → player pipeline** — admin-tagged quests and move content from the book library become **surfaceable** in the right move context via player-facing discovery (not a data dump).
5. **Felt-sense scaffolding** — gentle copy and optional micro-prompts woven into 321, charge capture, and quest unpack flows so players practice the skill while playing.

---

## Functional requirements

### FR1 — What success looks like (handbook foundation)

- A canonical `docs/PLAYER_SUCCESS.md` defining what it means to be a **successful BARS player** in game-native terms: emotional contact, move completion, quest throughput, network building, developmental growth.
- This doc becomes the **source of truth** for player-facing copy and orientation messaging.

### FR2 — Handbook entry point

- `/wiki/handbook` page (or promoted section of `/wiki/player-guides`) structured around the **four moves**, not feature categories.
- Each move section: one-sentence meaning, one **"you can do this"** action verb, a link to the relevant NOW / VAULT / PLAY surface.
- Dual-track: readable without logging in; actionable when logged in (links deeplink into game flow).

### FR3 — Orientation compass on NOW

- NOW (`/`) surfaces a **"where are you in your journey?"** orientation strip or card — not a checklist, but a **compass**: which move is most alive for this player right now (last charge/quest/BAR context).
- If player has no history: **onboarding first-time welcome** path → "start with Wake Up → capture a charge".
- Hexagram 39 constraint: **do not replace the existing dashboard**; add the compass as a non-intrusive orientation layer above or between existing sections.

### FR4 — Library → player pipeline (discovery surface)

- Admin-tagged quests (from book extraction, from move tagging) become **discoverable** in the move's section on NOW or in `/wiki/handbook` under the relevant move.
- Phase 1: manual admin tag on quest records (move + library source); surface in a "Discover" section on NOW.
- Phase 2: automated suggestion from book analysis pipeline (depends on AZ / book-to-quest).
- Principle: **humane surfacing** — one or two suggested quests at a time, contextual to current player move, not a library dump.

### FR5 — Felt-sense scaffolding (copy layer)

- Identify **three in-flow touchpoints** where felt sense is already exercised: (a) 321 / charge capture opening, (b) quest unpack, (c) quest completion reflection.
- At each: add **one gentle line** of copy (configurable or static) that names the skill being practiced: "Notice what's physically present right now" or equivalent original language.
- No medical or clinical framing. Opt-out preserved (user can skip the line).
- Link to felt-sense primer (`docs/FELT_SENSE_321_PRAXIS.md` from LPP spec) from the handbook only.

### FR6 — Navigation legibility (coordinates with PMI)

- After PMI (1.34) ships `SIX_FACE_ANALYSIS.md`, use its synthesis table to update at least **one navigation affordance** so that "what can I do here?" is answerable from the page without leaving the page.
- In the interim: add subtitle copy under NOW / VAULT / PLAY in the navbar tooltip or page headers so the intent is readable on arrival.

---

## User stories

**New player** (first session)  
As a new player arriving at NOW, I want to immediately understand **what I am invited to do** and have one clear starting action, so I don't leave confused.

**Developing player** (3–10 sessions)  
As a player who has captured charges but isn't sure what to do with them, I want the game to show me **where I am in the four moves** and what my next meaningful action is.

**Struggling player** (stuck, low felt sense)  
As a player who finds it hard to identify what I'm feeling, I want the game's flows to **gently practice that skill** without making me feel broken or blocked from play.

**Curious player** (wants to understand the system)  
As a player who wants to understand BARS more deeply, I want a **handbook** that explains success in game terms and links to the actual flows — not just a glossary.

---

## Out of scope (this spec)

- Replacing the transformation registry or WCGS structure (those are canonical)
- Building a full in-app tutorial (a separate spec when player research supports it)
- Collapsing nav tabs (requires PMI analysis to complete first)
- Clinical felt-sense training or Focusing certification

---

## Acceptance criteria

1. `docs/PLAYER_SUCCESS.md` exists and is linked from the wiki handbook page.
2. `/wiki/handbook` (or promoted player-guides section) is structured by the four moves, with one action verb + deep link each.
3. NOW page has an orientation affordance visible on first visit and contextual on repeat visit.
4. At least two felt-sense copy touchpoints implemented in 321/charge/quest flows.
5. At least one library-sourced quest is discoverable in the player-facing move context (Phase 1: manual tag path).
6. `npm run build` and `npm run check` pass.

---

## Dependencies

| Spec | Role |
|------|------|
| [PMI — Player Main Tabs](../player-main-tabs-move-oriented-ia/spec.md) | Navigation IA analysis; feeds FR6 |
| [LPP — Library Praxis](../library-praxis-three-pillars/spec.md) | Felt sense + commons + antifragile pillars; feeds FR5 |
| [AZ — Book-to-Quest Library](../book-to-quest-library/spec.md) | Library pipeline; feeds FR4 Phase 2 |
| [GD — Charge Capture UX](../charge-capture-ux-micro-interaction/spec.md) | Felt-sense touchpoint #1 |
| [GF — Singleplayer Charge Metabolism](../singleplayer-charge-metabolism/spec.md) | 321 / charge metabolize; felt-sense touchpoint #2 |

## References

- [SAGE_CONSULT.md](./SAGE_CONSULT.md)
- [ANALYSIS.md](../library-praxis-three-pillars/ANALYSIS.md)
- [NavBar.tsx](../../../src/components/NavBar.tsx)
- [wiki/player-guides/page.tsx](../../../src/app/wiki/player-guides/page.tsx)
- [hand/moves/page.tsx](../../../src/app/hand/moves/page.tsx)
