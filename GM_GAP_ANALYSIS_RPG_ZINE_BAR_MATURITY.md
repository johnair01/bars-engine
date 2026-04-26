# 6-Face GM Gap Analysis: bars-engine vs. RPG Design Zine BAR Maturity

**Date:** 2026-04-25
**Analyst:** Council of Game Faces
**Source A:** 28 testable design BARs from *RPG Design Zine* (Nathan D. Paoletta, ndpdesign.com/zines)
**Source B:** bars-engine codebase maturity (bar-seed-metabolization, bar-asset pipeline, BAR system types, alchemy-engine, GM face infrastructure)

---

## CAST

| Face | Role in this analysis |
|------|-----------------------|
| 🧠 Architect | Structural coherence: where is the system architecture aligned with the zine's design philosophy? |
| 🏛 Regent | Lifecycle stewardship: how does bars-engine manage the full lifecycle of a BAR from capture to integration? |
| ⚔️ Challenger | Critical transpersonal: what is the system NOT doing that the zine says is essential? |
| 🎭 Diplomat | Relational patterns: where does the system fail to bridge player-to-player or player-to-system? |
| 🌊 Shaman | Felt-reality ground: what emotional shadow is the system avoiding or mishandling? |
| 📖 Sage | Principled synthesis: what is the integral design thesis that ties all gaps together? |

---

## THE MATURITY PHASE MAP

First, a grounding. bars-engine has a 5-phase BSM maturity model:

```
captured → context_named → elaborated → shared_or_acted → integrated
```

The RPG Design Zine maps to a different maturity curve — one centered on **design authority** and **conversation structure** rather than metabolic progress. The gap analysis maps each zine BAR against bars-engine's current implementation state.

---

## 🧠 ARCHITECT: Structural Coherence

**Frame:** Does the bars-engine architecture support all three resolution registers (Fortune, Drama, Karma) and explicit authority naming?

### GAP A-1: Fortune Register Exists — But Is Not Named as a Resolution Register
The zine names three registers: **Fortune** (random real-world element shapes fictional outcomes), **Drama** (fiction shapes outcome), **Karma** (tracked past behavior shapes outcome). bars-engine has all three. The I Ching casting system (`src/actions/cast-iching.ts`, `CastingRitual.tsx`) is a Fortune register — it uses physical randomization (coin flips / yarrow stalks) to generate a hexagram ID that then shapes what quests, face moves, and narrative paths become available. The prompt deck (`prompt-deck-play.ts`) shuffles and draws cards, introducing non-deterministic sequence into play. These are Fortune mechanics.

**The gap is not presence but naming.** The codebase does not document Fortune as a first-class resolution register. A developer reading `bar-asset/types.ts` or `bar-seed-metabolization/types.ts` would find no `resolutionRegister` field, no register taxonomy, and no architectural statement that I Ching and card draws are the system's Fortune layer. The I Ching is treated as a feature; it is not described as one-third of a resolution architecture.

**What this means:** Future feature work can accidentally collapse the Fortune register into the Karma register (deterministic quest assignment via I Ching context rather than actual random draw). The `cast-iching.ts` action itself is fully random in its current form — but callers could route around the randomness by passing pre-selected hexagramIds. Without explicit naming, that regression is invisible.

**Fix:** Name the Fortune register explicitly. Add `resolutionRegister: 'fortune' | 'drama' | 'karma'` to `BarAsset` type. Document in `bar-asset/PROTOCOL.md` that the I Ching casting system and prompt deck are the system's two Fortune paths. Add a register field to `BarDef` so that future BAR types can self-declare which register they operate in.

### GAP A-2: Authority Is Named in RACI But Not in BAR Invocation
The `bar-raci.ts` file has explicit intent vocabulary (`take_quest`, `witness`, `consult`, etc.) — this is strong authority naming. But it applies only to BarResponse threading, not to BAR invocation itself. Who calls a BAR? Who narrates the outcome? Who tracks the emotional state? These are not codified in any BAR type definition.

**What this means:** The zine's most critical design principle — "who has the final yes/no" — is implemented inconsistently. The RACI model works for quest response but not for the BAR mechanic itself.

**Fix:** Extend `BarDef` in `bars.ts` to include an `authority` field: `{ invoker: 'player' | 'gm' | 'either', narrator: 'player' | 'gm' | 'collaborative', tracker: 'system' | 'player' }`.

### GAP A-3: Drama Register Lives in Twine But is Not Named as a Resolution Mode
The `twine-engine.ts` and `twee-parser.ts` files implement fiction-first resolution — narrative state drives outcomes, not mechanical rolls. This is the Drama register. But it is not identified as such. A developer reading the codebase would not know that Drama-mode resolution is a first-class design choice, not a fallback.

**What this means:** The system has Drama capability but no documentation that names it. Future feature work could accidentally collapse it into Karma or Fortune without anyone noticing.

**Fix:** Document the Drama register explicitly in `bar-asset/PROTOCOL.md`. Add a `resolutionRegister: 'fortune' | 'drama' | 'karma'` field to `BarAsset` type.

---

## 🏛 REGENT: Lifecycle Stewardship

**Frame:** Does bars-engine govern the full BAR lifecycle from "designer has an itch" through actual playtest and integration?

### GAP R-1: No Design-Itch-to-BAR Pipeline
The zine says: "I wrote this for myself — to role-play in the near-future worlds of William Gibson. It's my tool-kit." bars-engine has no equivalent. There is no path from "I have a specific emotional/cultural itch I want to explore" to "there is a BAR that serves that itch." The BAR system starts at capture, not at inspiration.

**What this means:** The system serves players who already have BARs (or want to receive quests) but not designers who want to build new emotional game mechanics. The creator side is missing entirely.

**Fix:** Add a `BAR_DESIGN_ITCH` pipeline phase — a creative prompt system that helps a designer-artist translate their itch into a BAR specification before it enters the metabolization pipeline.

### GAP R-2: Iteration Is Not Narrowing — It Is Repeating
The zine's iteration diamond model: each pass narrows the design space. bars-engine's `bar-seed-metabolization` has no equivalent concept. Captured seeds can be elaborated, but the elaboration never narrows — it only grows. There is no concept of a validation point that either promotes or rejects a BAR design.

**What this means:** The backlog grows indefinitely. Every captured BAR that gets named soil remains in the pipeline forever unless composted. The zine's key insight — "you don't need to go as wide once you know what the game demands" — is architecturally absent.

**Fix:** Add a `validation_threshold` field to `SeedMetabolizationState`. After N elaboration cycles without a quest linkage, the seed auto-prompts for either graduation or composting. The diamond narrows.

### GAP R-3: No Playtest Feedback Loop for BAR Mechanics
The zine's validation points include: solo play, trusted friends playtest, peer PDF critique, stranger demo. bars-engine has no playtest feedback loop for BAR mechanics. The `feedback-loop.ts` file exists but handles campaign-level feedback, not BAR mechanic feedback.

**What this means:** New BAR types (e.g., allyship domain bars, shadow-name bars, transformation bars) are shipped without playtesting. The design space does not narrow because there is no test infrastructure.

**Fix:** Architect a BAR playtest loop — an opt-in "design camp" mode where new BAR types can be tried in isolation with structured feedback capture before entering the main campaign ecosystem.

---

## ⚔️ CHALLENGER: Critical Transpersonal

**Frame:** What is the system NOT doing that the zine says is essential — the uncomfortable gaps?

### GAP C-1: "A Game About Something Must Have Rules for That Something" — Integral Theory Is Referenced But Not Alive in Play
The zine: "If you have rules for it, your game is about it." bars-engine references integral theory everywhere (6 GM faces, altitude map, stage names, shadow mechanics). But the integral theory is **narrative dressing**, not **game mechanics**. There are no rules that make altitude *happen* in play. The 6 faces are cosmetic in most BAR interactions — they appear in copy, not in mechanical resolution.

**What this means:** The game claims to be about integral theory but is not. It is a narrative engine with integral aesthetics. The Challenger principle is violated: you cannot check in with yourself about how close or far you are from your inspiration because the inspiration (integral theory as lived experience) is not implemented.

**Fix:** Implement altitude-as-mechanic. At least one BAR type should mechanically resolve based on which altitude the player is operating from. The WAVE spiral should produce different outcome ranges depending on the player's current altitude. Without this, the system is in breach of its own thesis.

### GAP C-2: Conflict Is Complication — But Bars-Engine Has No Non-Combat Conflict Resolution
The zine: "Challenge does not need to mean conflict or fighting or drama. The softest term is complication." The bars-engine has combat resolution (`elemental-moves.ts`, `threshold-encounter/templates.ts`), allyship domains, transformation encounters. But it has no general **complication resolver** — a mechanic for resolving emotional complications that are not combat, not quests, not threshold crossings. The emotional algebra and shadow mechanics exist but have no "something introduced difficulty, raised questions, created obstacles" resolution path.

**What this means:** The system's emotional depth is constrained to whatever fits into existing BAR types. Novel emotional complications (the ones the zine wants you to find in personal cultural triggers) have no mechanical home.

**Fix:** Design a `COMPLICATION_BAR` type — a lightweight resolution mechanic for emotional obstacles that don't fit quest or combat frames. Think: the GM raises a tension, the player responds with an emotional alchemy move, the system narrates the outcome.

### GAP C-3: Social Dynamics Are Designed — But Bars-Engine's Social Layer Is Implicit
The zine: "Social Dynamics are the ways in which conversations are shaped by the relationships of the people at the table. Your game changes these dynamics." bars-engine's collaboration features (RACI, BAR response threads, campaign sharing) are present but not designed. There is no explicit statement of what social dynamic each BAR type reinforces or disrupts.

**What this means:** The system could be inadvertently reinforcing emotional dominance patterns (one player's BAR drives the session) without anyone noticing. The Challenger's job is to name this.

**Fix:** Every BAR type spec should include a `socialDynamics` field: what relationship pattern does this BAR reinforce? What does it disrupt? The design is not complete without this.

---

## 🎭 DIPLOMAT: Relational Patterns

**Frame:** Where does bars-engine fail to bridge player-to-player and player-to-system relationships?

### GAP D-1: The "Collaboration Rule" Is Not Mechanically Enforced
The zine: "No single person's ideas, desires, or goals should take precedence over anyone (or everyone) else's." The `bar-raci.ts` model gives multiple intent options including `witness` and `observe` — but these are opt-in response types, not mechanical constraints. A single player can take multiple quests, drive multiple threads, and monopolize the narrative. There is no mechanical ceiling.

**What this means:** The system nominally supports collaboration but architecturally permits dominance. The Diplomat principle is violated: you cannot check in with yourself about how close or far you are from your inspiration because the inspiration (integral theory as lived experience) is not implemented.

**Fix:** Add a `collaborative_cap` to the campaign model — a mechanic that limits how many BARs a single player can have as `responsible` or `accountable` in a given session. Balance across players becomes a first-class design constraint.

### GAP D-2: The Magic Circle Is Not Explicitly Drawn or Dissolved
The zine: "Starting and ending specifies how to draw the circle, and then when to dissolve it." bars-engine has onboarding flows and session entry points, but no explicit magic circle ritual. The transition between "ordinary world" and "BAR frame" is implicit. There is no named transition with integration instructions.

**What this means:** Players may be in the BAR frame without knowing it. Emotional material that enters play may not have the proper "we are in a bounded space now" container. The Diplomat bridges worlds — and that bridge is missing.

**Fix:** Design a `magic_circle` ritual BAR — a short opening invocation and closing dissolution that explicitly marks entry to and exit from the integral theory frame. Minimum: 3-step open, 2-step close.

### GAP D-3: Situation Precedes Mechanics — But Mechanics Arrive Before Situation
The zine: "Situation is the context for action. You have colorful, coherent characters in a setting that shapes what is and isn't appropriate." bars-engine's quest generation (`quest-seed-composer.ts`, `charge-quest-generator.ts`) generates mechanics-first. Quests arrive with mechanical structure; the situation is filled in afterward. The character and setting are secondary.

**What this means:** BARs get generated that have no situation to live in. The emotional truth is mechanized but not dramatized. A Drama register BAR requires situation before it can be resolved — and situation is not always present.

**Fix:** In the BAR generation pipeline, require a `situation_context` field before mechanical resolution is offered. The order should be: situation → emotional complication → BAR invocation → resolution. Not: BAR type → resolution → situation.

---

## 🌊 SHAMAN: Felt-Reality Ground

**Frame:** What emotional shadow is the system avoiding? Where does the felt-reality of emotional alchemy not match the system design?

### GAP S-1: Personal Social Problems Are Not the Source Material
The zine: "Base the game's problems on social problems in our world — but not the big ones like unemployment or terrorism. Find ones that are more personal to you." bars-engine's source material is predominantly archetypal (archetype overlays, GM face modifiers, narrative OS templates). The personal cultural trigger — the thing that actually got stuck in your body — has no dedicated intake path. The `book-chunker.ts` and source genre profiles pull from published content, not from the player's lived experience.

**What this means:** The system's emotional source material is second-hand. Players are working with pre-packaged metaphors instead of their own cultural triggers. The felt-reality is diluted by proxy.

**Fix:** Add a `PERSONAL_TRIGGER_INTAKE` mechanism — a guided process for players to identify and name the specific personal cultural or social problem that brought them to the BAR. This becomes the soil for all subsequent metabolization. Not therapy. Not journaling. A game-design intake that treats the player's itch as first-class source material.

### GAP S-2: Dissatisfaction → Satisfaction Is Named But Not Felt
The zine's emotional alchemy is implicit in the BAR resolution mechanics — accumulated dissatisfaction shapes present options. But bars-engine's `emotional-first-aid.ts`, `alchemy-engine/template-bank-data.ts` treat emotional moves as **template applications**, not **felt transformations**. The WAVE spiral exists but is not experienced as a somatic or emotional event — it is processed as a form.

**What this means:** The system can describe what emotional alchemy is happening, but it does not create the felt sense of transformation. Players fill out forms and get quest recommendations. The Shaman's territory — the body's actual experience of a pattern breaking open — is not targeted by any BAR mechanic.

**Fix:** Add a `felt_sense` dimension to at least one BAR type — a prompt or interaction designed to produce a somatic or emotional felt event before the intellectual resolution. This is the shamanic register: not explaining the alchemy, but facilitating the experience of it.

### GAP S-3: Winner of Emotional Conflict Sole-Narrates
The zine's critical rule: "The last person in the conflict gets to say what happens with what's at stake — but the loser still has narrative authority." bars-engine's resolution paths are predominantly winner-narrates. The `face-move-bar.ts`, `gm-face-stage-moves.ts` give narrative authority to whoever invokes the move or completes the quest. There is no mechanism for the contested party to maintain outcome authority over the stakes.

**What this means:** The system perpetuates a specific emotional shadow: whoever has the most mechanical advantage also gets to define what the outcome means. This mirrors the exact power dynamics the zine warns against.

**Fix:** Design a `contested_resolution` path for emotionally charged BARs. When a BAR is contested (two players have opposing emotional interests), neither party sole-narrates. The system generates a third-person outcome that neither party would have chosen alone. This is the Drama register in its purest form.

---

## 📖 SAGE: Principled Synthesis

**Frame:** What is the single integrative thesis that ties all gaps together?

---

### THE SIX-FACE VERDICT

**ARCHITECT (structural):** The bars-engine has strong Karma infrastructure (maturity phases, soil tracking, RACI intent vocabulary). Fortune and Drama registers ARE present — the I Ching casting system and Twine fiction-first engine are both live mechanics. The gap is naming: neither is documented as a first-class resolution register, and the register taxonomy is absent from the type system. Future regression risk is real.

**REGENT (lifecycle):** Capture-to-metabolization is well-governed. But design-itch-to-BAR origin is absent. Iteration does not narrow. Playtest feedback is absent. The system governs maintenance but not creation.

**CHALLENGER (critical):** The most serious gap: integral theory is aesthetic, not mechanical. "A game about something must have rules for that something" is violated daily. Altitude has no mechanical consequence. Conflict resolution defaults to combat. Social dynamics are not designed.

**DIPLOMAT (relational):** Collaboration is nominal but not mechanical. Magic circle is implicit. Situation arrives after mechanics. The relational infrastructure is present but not deliberate.

**SHAMAN (felt-reality):** Source material is second-hand. Emotional felt-sense is not targeted. Winner of conflict sole-narrates. The shadow is real: the system replicates the power dynamics it claims to transform.

**SAGE (synthesis):** The integrative thesis: **bars-engine is a strong Karma-mechanic system with live but unnamed Fortune and Drama registers, operating in a domain (integral theory + emotional alchemy) it describes but does not mechanically enact.** The gaps are not absence-of-implementation gaps — they are naming and documentation gaps layered over a deeper design philosophy gap. The system was built to track and metabolize emotional content. It was not built to explicitly name the three registers that govern how that content resolves. The naming is the next layer of architecture.

---

## THE BAR MATURITY MATRIX

| Dimension | Zine Standard | bars-engine State | Gap |
|-----------|--------------|------------------|-----|
| Resolution registers | Fortune + Drama + Karma | Fortune present but unnamed; Drama present but unnamed | Moderate |
| Authority naming | Explicit per BAR type | RACI on responses only | Moderate |
| Drama register | Fiction-first resolution | Twine engine (unnamed) | Moderate |
| Design itch pipeline | Origin → capture | Capture only | Critical |
| Iteration narrowing | Validation narrows design space | Elaboration grows indefinitely | Critical |
| Playtest feedback | Named loop per BAR type | Absent | Critical |
| Altitude as mechanic | Altitude affects resolution | Aesthetic only | Critical |
| Complication resolver | Non-combat emotional complication | Absent | Moderate |
| Social dynamics designed | Named per BAR type | Implicit | Moderate |
| Collaborative cap | Mechanical ceiling on dominance | Absent | Moderate |
| Magic circle | Explicit entry/exit ritual | Implicit onboarding | Moderate |
| Situation before mechanics | Required before resolution | Mechanics-first | Moderate |
| Personal cultural triggers | First-class source material | Second-hand only | Moderate |
| Felt-sense targeting | Somatic/emotional event | Form-filling | Moderate |
| Contested resolution | Loser retains stakes authority | Winner narrates | Moderate |

---

## RECOMMENDED PRIORITY ORDER

### Tier 1 (Critical — must fix before claiming "integral theory game")
1. **Altitude as mechanic** — implement at least one BAR type where altitude determines outcome range
2. **Design itch pipeline** — add origin path from personal itch to BAR specification
3. **Iteration narrowing** — add validation thresholds that auto-promote or compost stale seeds
4. **Playtest feedback loop** — architect a BAR mechanic playtest mode

### Tier 2 (High — essential for narrative engine claims)
5. **Fortune register** — name and architect at least one random-invocation BAR mode
6. **Drama register** — name Twine fiction-first resolution as a first-class register
7. **Non-combat complication resolver** — design COMPLICATION_BAR type
8. **Magic circle ritual** — explicit entry/exit with integration instructions

### Tier 3 (Medium — fills relational gaps)
9. **Authority in BarDef** — extend with invoker/narrator/tracker fields
10. **Collaborative cap** — mechanical ceiling on single-player dominance
11. **Contested resolution path** — third-person outcome for contested BARs
12. **Personal trigger intake** — first-class source material from player's lived experience

### Tier 4 (Lower — felt-reality and polish)
13. **Felt-sense dimension** — add somatic/emotional targeting to at least one BAR type
14. **Social dynamics field** — name per BAR type
15. **Situation context required** — enforce before mechanical resolution

---

## WHAT THE ZINE TEACHES US

The RPG Design Zine is a gold-star BAR source not because it has the right answers but because it models the right question set. Every one of its 28 BARs can be answered with: "Yes, and here is the specific design decision that proves it" or "No, and here is the specific gap this creates."

bars-engine is a strong system with significant design philosophy gaps. The gaps are not failures of engineering — they are failures of design ambition. The zine's challenge to bars-engine is the same challenge it makes to every RPG designer:

**"I'm not here to tell you which ones to make, but I do want you to know why you're making them."**

The bars-engine team knows why they're making it. The question is whether the system architecture proves it.

---

## OCTALYSIS FRAMEWORK INTEGRATION

The Octalysis framework (Yu-kai Chou) describes 8 core drives that govern motivation in gameful systems. bars-engine is a gamified system for emotional and cultural development — mapping its 15 gaps against all 8 drives surfaces where motivation collapses, where it is latent but untapped, and where fixing one drive has ripple effects on others.

### THE 8 CORE DRIVES — BRIEF REFERENCE

| # | Core Drive | Core Question | bars-engine Manifestation |
|---|-----------|---------------|--------------------------|
| **D1** | Epic Meaning & Calling | "Am I doing something that matters beyond myself?" | I Ching casting ritual; 6 GM faces as integral theory embodiment |
| **D2** | Development & Accomplishment | "Am I making visible progress and mastering something?" | BSM maturity phases; WAVE spiral |
| **D3** | Empowerment of Creativity & Feedback | "Can I act creatively and see the effects?" | Emotional alchemy; face move invocations |
| **D4** | Ownership & Possession | "Do I feel I own something worth protecting?" | BAR seeds; campaign state; I Ching cast artifacts |
| **D5** | Social Influence & Relatedness | "Do I belong and do my contributions matter to others?" | RACI threading; collaborative questing; campaign sharing |
| **D6** | Scarcity & Impatience | "Do I want something I cannot have right now?" | Contested BAR stakes; I Ching hexagram scarcity (64 possibilities) |
| **D7** | Unpredictability & Curiosity | "What happens next?" | I Ching cast randomness; prompt deck draw |
| **D8** | Loss & Avoidance | "Will I lose what I have if I fail?" | Emotional pattern avoidance; integration failure as drift |

---

## MAPPING ALL 15 GAPS TO OCTALYSIS DRIVES

Each gap is mapped to its primary Octalysis drive. For each gap: (1) what problem it solves, (2) what drive it activates or repairs, (3) what it risks breaking if deferred.

---

### 🔴 D1 — EPIC MEANING & CALLING
*"Why does my participation matter beyond myself?"*

**GAP C-1: Integral Theory Is Aesthetic, Not Mechanical**
The system claims to be about integral theory. The I Ching casting ritual is literally a Fortune-mechanism ritual that draws from the same source material as the 6 GM faces. But altitude has no mechanical consequence. The 6 faces are cosmetic. You cast the hexagram and get a quest — not a judgment about what altitude you are operating from.

**Solved by:** Altitude-as-mechanic. When a cast hexagram resolves into a quest, the player's current altitude modifies the outcome range. The I Ching becomes a mirror for developmental stage, not just a random oracle.

**Risks breaking if deferred:** D1 collapses. Players engaged in emotional alchemy work are doing meaningful developmental labor but have no way to know if it maps to integral theory progression. The system's highest purpose becomes unverifiable. Players who need epic meaning will seek it elsewhere.

---

### 🟠 D2 — DEVELOPMENT & ACCOMPLISHMENT
*"Am I visibly mastering something?"*

**GAP R-2: Iteration Is Not Narrowing — It Is Repeating**
Every seed elaboration grows the design space, never contracts it. A player cannot look at their BAR seed and see evidence of progress toward a goal. The zine's diamond model: "each pass narrows what you need to explore." bars-engine has no equivalent. Validation is invisible.

**Solved by:** Validation threshold in `SeedMetabolizationState`. After N cycles without a quest linkage, the seed gets promoted, composted, or needs a decision. Progress becomes visible and measurable. The player sees the diamond shrink.

**GAP A-2: Authority Is Named in RACI But Not in BAR Invocation**
The `bar-raci.ts` intent vocabulary (`take_quest`, `witness`, `consult`, etc.) gives players a language for how they are growing as participants. But this language applies only to response threading. The player does not have a codified vocabulary for "I am developing mastery in the invoker role" versus "I am developing mastery in the collaborative narrator role."

**Solved by:** Authority field in `BarDef` with named roles. Players can see which authority modes they have exercised, track growth in specific roles, and set development goals: "I want to get better at collaborative narration."

**Risks breaking if deferred:** D2 collapses. Progress is unverifiable. Growth is felt but not named. The system rewards engagement but cannot tell a player what they are getting better at.

---

### 🟡 D3 — EMPOWERMENT OF CREATIVITY & FEEDBACK
*"Can I act creatively and see immediate consequences?"*

**GAP C-3: Social Dynamics Are Implicit, Not Designed**
The system gives players tools to act. But it never tells a player how their action will reshape the social field. A BAR invocation doesn't state: "This BAR reinforces X social dynamic. It may shift Y." Players act creatively but without feedback about the social consequence of their creativity.

**Solved by:** `socialDynamics` field per BAR type. When a player invokes a BAR, they get explicit framing: "This BAR reinforces X social dynamic. It may shift Y." Feedback is immediate and relevant to the creative act.

**GAP S-2: Dissatisfaction → Satisfaction Is Named But Not Felt**
Emotional alchemy moves are described and templated. But there is no mechanic that produces a somatic or emotional felt event before intellectual resolution. A player applying a transformation move reads the form and gets the outcome. The creative act of transforming a felt pattern is not facilitated — it is explained.

**Solved by:** `felt_sense` dimension in at least one BAR type. A prompt that creates a bodily felt event (not a journaling question, not a form field) before the intellectual resolution. The Shaman's register: not explaining the transformation, but creating the conditions for it to be experienced.

**Risks breaking if deferred:** D3 weakens. The system's creativity is constrained to pre-approved templates. Players who need creative agency feel managed rather than empowered. The emotional alchemy becomes a form to fill, not a transformation to enact.

---

### 🟢 D4 — OWNERSHIP & POSSESSION
*"Do I own something worth protecting and developing?"*

**GAP A-1: Fortune Register Is Present But Unnamed**
The I Ching is a physical possession artifact (the cast result, the hexagram interpretation, the session record). The prompt deck draw creates a uniquely owned moment. But the system treats these as system features, not owned objects. A player has no sense that they possess a unique I Ching reading that is *theirs* — it is an output from a feature.

**Solved by:** `resolutionRegister` field in `BarAsset`. When a BAR is resolved via the I Ching Fortune path, it is explicitly labeled as a *Fortune-register outcome*. The player sees the register, understands the ownership structure, and knows their BAR was resolved through a mechanism that is uniquely theirs (64^6 possibilities, non-repeatable). Ownership is named.

**Scarcity sub-issue (D6):** The I Ching produces genuinely scarce outcomes — 64 hexagrams, each with 4096 line combinations. The full space is genuinely uncountable. bars-engine has not leveraged this scarcity as a D6 driver. The cast result should feel like a *rarity* — a uniquely generated artifact — not a random number that happens to index a lookup table.

**Solved by:** Hexagram results displayed with visual scarcity framing. "This is your 11th unique hexagram across all sessions." The collection dimension of D4 is activated by making I Ching history visible and collectible.

**Risks breaking if deferred:** D4 weakens. Players treat I Ching casts as inputs to a feature, not as owned artifacts of personal significance. The Fortune mechanic loses its felt-reality weight. The system produces outcomes but does not create possessions.

---

### 🔵 D5 — SOCIAL INFLUENCE & RELATEDNESS
*"Do I belong, and do my contributions matter to others?"*

**GAP D-1: The "Collaboration Rule" Is Not Mechanically Enforced**
The zine: "No single person's ideas should take precedence over anyone else's." bars-engine's `witness` and `observe` intents are opt-in. A player can take multiple quests, drive multiple threads, and no mechanical constraint stops them. Collaborative participation is nominal, not structural.

**Solved by:** `collaborative_cap` in the campaign model. A mechanical ceiling: no player can have more than X BARs as `responsible` in a given session. Balance across participants becomes a first-class design constraint. D5 becomes structural, not aspirational.

**GAP D-2: The Magic Circle Is Not Explicitly Drawn or Dissolved**
The zine's "starting and ending specifies how to draw the circle, and then when to dissolve it." bars-engine has onboarding flows and session entry points, but no explicit magic circle ritual. The transition between "ordinary world" and "BAR frame" is implicit. There is no named transition with integration instructions.

**Solved by:** `magic_circle` ritual BAR — 3-step open (name the frame, acknowledge ordinary world, set intention), 2-step close (integrate learnings, return to ordinary world). The ritual is the social container. It says: "What happens in this circle matters because we drew it together."

**Risks breaking if deferred:** D5 is decorative. The system nominally supports collaboration but structurally permits dominance. Players who need relatedness feel connected but not bound to each other. The group does not co-own the experience.

---

### 🟣 D6 — SCARCITY & IMPATIENCE
*"Do I want something I cannot have right now?"*

**GAP S-3: Winner of Emotional Conflict Sole-Narrates**
The contested BAR stakes — the most emotionally charged moments in the system — resolve via winner-narrates. The losing party receives an outcome they did not choose, narrated by the party with mechanical advantage. Scarcity here means: there is only one winner, and everyone else loses their narrative authority.

**Solved by:** `contested_resolution` path. Neither party sole-narrates. The system generates a third-person outcome that neither party would have chosen alone. Scarcity is preserved (not everyone gets what they want) but ownership of stakes is maintained (everyone retains outcome authority). D6 activated without D8 damage.

**Gap A-1 (Scarcity sub-note):** The I Ching produces genuinely scarce outcomes — 64 hexagrams, each interpretable in 4096 line combinations. bars-engine has not made this scarcity visible to players. "You have drawn your 3rd unique hexagram this month" would activate D6 strongly. Currently it is invisible.

**Risks breaking if deferred:** D6 is latent. The system has the scarcest possible mechanic (I Ching full space) but does not surface it. Players do not feel the weight of what they drew. Scarcity is architecturally present but phenomenologically absent.

---

### 🟤 D7 — UNPREDICTABILITY & CURIOSITY
*"What happens next?"*

**GAP A-1: Fortune Register Is Present But Unnamed**
The I Ching cast and prompt deck draw are D7 machines — genuine randomness that creates unpredictability. bars-engine uses them but does not name them. A player cannot say "I am engaging the Fortune register" and understand that they have invoked a specific, named resolution path that is different from a Karma-mechanic resolution.

**Solved by:** Register naming. When a player draws an I Ching cast, the system says: "You are resolving via the Fortune register. The outcome is genuinely undetermined." When a player completes a quest via accumulated Karma, the system says: "You are resolving via the Karma register. Your tracked history shapes the outcome." D7 is named and therefore meaningful.

**GAP C-2: No Non-Combat Complication Resolver**
The system's unpredictability lives in quests and combat. Emotional complications — the things that create genuine narrative uncertainty — have no mechanical home. A player facing an emotional obstacle does not know how it will resolve, but the system also doesn't know. There is no BAR type that carries the uncertainty forward in a structured way.

**Solved by:** `COMPLICATION_BAR` type. A mechanical path for "something introduced difficulty, raised questions, created obstacles" that lives between quest and combat. The complication is named, the resolution uncertainty is explicit, and the outcome is determined by the appropriate register.

**Risks breaking if deferred:** D7 is real but not named. Players experience the I Ching cast randomness but do not have a vocabulary for it. The system's capacity for genuine surprise is underused because surprise is not architecturally integrated — it is an accident of implementation.

---

### ⚫ D8 — LOSS & AVOIDANCE
*"Will I lose what I have if I fail?"*

**GAP S-1: Personal Cultural Triggers Are Not Source Material**
The system helps players avoid emotional shadow patterns — but it does so through pre-packaged archetypal content. A player's personal cultural trigger (the thing that actually got stuck in their body) has no dedicated intake path. The system gives you someone else's metaphor to work with, not your own.

**What this means:** If you engage the system, you can avoid the patterns you came to avoid — but you do so by inhabiting someone else's story. The loss you avoid is generic loss. The patterns you transform are template patterns. D8 is activated but shallow.

**Solved by:** `PERSONAL_TRIGGER_INTAKE` — a game-design intake mechanism (not therapy, not journaling) that lets a player name their specific personal cultural trigger as the soil for subsequent BAR work. The loss you avoid is *your* loss. The pattern you transform is *your* pattern. D8 becomes deep.

**GAP D-3: Situation Precedes Mechanics — But Mechanics Arrive First**
The zine's sequence: situation → emotional complication → BAR invocation → resolution. bars-engine's sequence: BAR type → resolution → situation fills in afterward. When situation arrives after mechanics, the player is not protected from emotional exposure during the resolution. The system generates emotional mechanics that have no situation container — meaning the player encounters them raw, without a fictional frame to hold the emotional weight.

**What this means:** A player could resolve a deeply emotional transformation BAR and have no situation context to metabolize it in. The loss that could have been avoided (by having situation first) is instead experienced unprotected.

**Solved by:** `situation_context` required field before mechanical resolution is offered. The order is enforced: situation → complication → invocation → resolution. The player encounters emotional content within a narrative container that allows integration.

**Risks breaking if deferred:** D8 becomes a blunt instrument. The system warns about loss but does not protect against the loss of psychological safety. Players who need the system most (those with the most charged emotional triggers) are the ones most exposed to uncontained emotional resolution mechanics.

---

## COMPOUND DRIVE INTERACTIONS

The Octalysis framework's power is in the interaction effects — when two drives combine, they create motivational dynamics that neither drive produces alone.

### D1 (Epic Meaning) + D5 (Social Relatedness) = CO-PRODUCER COMPOUND ⚠️

**Current state: broken in both directions.**

The system promises epic meaning through integral theory and the I Ching casting ritual. But the social infrastructure to make that meaning *shared* is absent. You are doing meaningful work in isolation. The I Ching is cast alone. The emotional alchemy is performed alone.

**What this compounds into:** D1 collapses faster because there is no one to witness the meaningful work. Epic meaning requires witnessing — you need someone to see you doing the thing that matters. Without D5 support, D1 is a solo claim, not a shared reality.

**Fix requires both:** D1 fix (altitude-as-mechanic) activates D5 only if the magic circle ritual (D-2 fix) is also in place. The altitude mechanic needs social witnessing to become epic.

---

### D2 (Development) + D4 (Ownership) = PROGRESS COMPOUND ✅ (latent)

**Current state: partially present, underused.**

BSM maturity phases track progress. I Ching casts create owned artifacts. But the two are not connected. A player advances through maturity phases but does not feel they *own* the progression because the ownership artifacts (hexagrams drawn, BARs resolved) are not visibly linked to their developmental trajectory.

**What this compounds into:** When a player can say "My I Ching history shows I have drawn 7 hexagrams from the lower half and 14 from the upper half — my development is trending upward," D2 and D4 create a self-reinforcing loop. Ownership motivates continued development. Development makes the ownership more valuable.

**Fix activates it:** Iteration narrowing (R-2) + Fortune register naming (A-1) + hexagram history visibility (D4 scarcity note). The player sees their diamond narrowing, owns the outcome, and tracks the progression in the same interface.

---

### D3 (Empowerment) + D7 (Unpredictability) = CREATIVE AGENCY COMPOUND ✅ (present, unnamed)

**Current state: live but not named.**

Emotional alchemy gives players creative agency (D3). The I Ching cast creates genuine unpredictability (D7). Combined, they produce the rarest game design outcome: **emergent creativity** — the player acts creatively and the system responds in a way neither could have predicted. This is the core magic of the bars-engine's best moments.

**What this compounds into:** This is where the "magic" happens. Players feel genuinely creative AND genuinely surprised. The system is not explaining what will happen — it is creating conditions where something novel occurs. bars-engine has this compound live in the I Ching cast + emotional alchemy interaction.

**Risk:** Without naming (A-1 fix), the player does not know they are in a D3+D7 compound moment. The experience happens to them rather than with them. Naming the Fortune register tells the player: "You are in a moment of creative emergence. Act accordingly." The experience becomes intentional rather than accidental.

---

### D5 (Social Relatedness) + D8 (Loss & Avoidance) = VULNERABILITY COMPOUND ⚠️

**Current state: dangerous in current form.**

bars-engine works on emotional material — the things that got stuck, the patterns that need to transform, the shadow that needs to be witnessed. D8 is always live because the stakes are personal. D5 (social) is present but not protective. The system says "share with your group" but does not structurally guarantee the group will hold it with appropriate weight.

**What this compounds into:** When social dynamics are implicit (C-3 gap), a player who shares their emotional BAR with a group has no guarantee that the group will hold it with appropriate weight. The vulnerability that D8 tries to protect against (loss of emotional safety) is actually increased by the social layer if D5 is not fixed first. The system can replicate the exact power dynamics it claims to transform.

**Fix requires both:** Collaborative cap (D-1 fix) before personal trigger intake (S-1 fix) can be safe. Social safety (D5) must be structurally guaranteed before the system asks players to expose their personal cultural triggers (D8). This is an ordering constraint, not a scheduling preference.

---

### D2 (Development) + D8 (Loss & Avoidance) = GROWTH COMPOUND ✅ (latent)

**Current state: theoretical, not implemented.**

The zine's "If you have rules for it, your game is about it" maps to a D2+D8 compound: if my development (D2) has explicit rules, then my failure to develop (D8) is visible and addressable. The system should be able to say: "You have been in the `context_named` phase for 6 sessions without progressing. This is a development stall. Here is what it costs you (D8) and what you can do about it (D2 path)."

**What this compounds into:** Growth becomes safe because loss is visible and reversible. You see exactly what you are not developing into, and the path back to growth is explicit. bars-engine does not have this compound — the loss (stall) is invisible, so D8 is latent anxiety rather than a motivating signal.

**Fix activates it:** Iteration narrowing (R-2) with explicit stall flagging. The validation threshold says: "Your seed has been elaborated N times without graduating. This is a stall. Decision required: compost or invest." D8 becomes a feature, not a bug — the system uses loss-signal to drive development.

---

## DRIVE-BY-DRIVE PRIORITY MATRIX

| Drive | Gap(s) | Build/Integrate/Defer | Priority |
|-------|--------|----------------------|---------|
| **D1** Epic Meaning | C-1 (altitude as mechanic) | Build | Tier 1 |
| **D2** Development | R-2 (iteration narrowing), A-2 (authority in BarDef) | Build | Tier 1 |
| **D3** Empowerment | C-3 (social dynamics field), S-2 (felt-sense dimension) | Build | Tier 3 (felt-sense), Tier 2 (social dynamics) |
| **D4** Ownership | A-1 (Fortune naming + hexagram history) | Integrate | Tier 2 |
| **D5** Social | D-1 (collaborative cap), D-2 (magic circle ritual) | Build | Tier 2 |
| **D6** Scarcity | A-1 (hexagram history visibility), S-3 (contested resolution) | Integrate (D6/A-1), Build (D6/S-3) | Tier 2 |
| **D7** Unpredictability | A-1 (Fortune naming), C-2 (complication BAR) | Integrate (D7/A-1), Build (D7/C-2) | Tier 2 |
| **D8** Loss & Avoidance | S-1 (personal trigger intake), D-3 (situation before mechanics) | Build | Tier 2 (situation), Tier 3 (trigger intake) |

**Critical sequencing constraint:** D5 (Social) fixes must precede D8 (Loss) fixes. Collaborative cap → magic circle → then personal trigger intake. The social safety infrastructure must be structurally in place before players are asked to expose personal cultural triggers.

---

## THE OCTALYSIS VERDICT

**D1 (Epic Meaning):** Latent and strong. The I Ching casting ritual combined with 6 GM faces is one of the most structurally powerful D1 mechanisms in any gamified system. But it is unmechanized — altitude has no consequence, so the epic meaning cannot be verified or enacted. Highest leverage fix in the entire system.

**D2 (Development):** Present but invisible. BSM maturity phases track progress but no one can see the diamond narrowing. The player cannot answer "what am I getting better at?" with evidence from the system. Progress is felt but not named.

**D3 (Empowerment):** Strong in templates (emotional alchemy) but weak in felt-reality. Players apply creative transformations but do not experience them somatically. The creativity is form-level, not body-level.

**D4 (Ownership):** Present in artifacts (I Ching cast results, BAR seeds, campaign state) but not named. Players do not know they own their Fortune register outcomes. The system's most novel feature (genuinely non-repeating I Ching full space) is invisible as an ownership mechanism.

**D5 (Social):** Nominal and decorative. The infrastructure exists (RACI, threading, campaign sharing) but there is no mechanical ceiling on dominance and no explicit magic circle ritual. Social relatedness is aspirational, not structural.

**D6 (Scarcity):** Architecturally present (I Ching 64 hexagrams × 4096 line combinations is genuinely uncountable) but phenomenologically absent. Players do not see their hexagram history, do not know their draw rarity, and do not feel the scarcity weight of their outcomes.

**D7 (Unpredictability):** Live in the I Ching cast and prompt deck draw. Real but unnamed. The system's best emergent creative moments happen here but are accidental rather than intentional. Players do not know they are in a D7 moment.

**D8 (Loss & Avoidance):** Active but uncontained. The system asks players to work on personal emotional patterns but does not protect the psychological safety of that work. Situation arrives after mechanics, exposing players to uncontained emotional content. Personal cultural triggers are not first-class source material, so the loss being avoided is generic, not personal.

---

*Analysis produced: 2026-04-25*
*Source: RPG_DESIGN_ZINE_BAR_SOURCE.md (manuscripts/sources/rpg-design-zine/)*
*Companion: bars-engine/src/lib/bar-seed-metabolization/types.ts, bars.ts, bar-raci.ts, bar-asset/types.ts*
*Octalysis framework: Yu-kai Chou, octalysisframework.com*
