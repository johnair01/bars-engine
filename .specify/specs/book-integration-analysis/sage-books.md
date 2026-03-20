# Sage Books — Integration Analysis

**Books**: Emergent Strategy (adrienne maree brown), Wikipedia: The Missing Manual (John Broughton, O'Reilly 2008)
**Date**: 2026-03-19
**Analyst context**: Mapping book concepts to Sage altitude (pattern recognition across scale, long-view synthesis, meta-strategy, organizational fractals)

---

## Emergent Strategy

**Full title**: *Emergent Strategy: Shaping Change, Changing Worlds* by adrienne maree brown (2017)

### Core concepts

1. **Emergence**: "The way complex systems and patterns arise out of a multiplicity of relatively simple interactions." The whole is a mirror of the parts. Existence is fractal.

2. **Fractal awareness**: Small is good, small is all. The health of the cell is the health of the species. What happens at the interpersonal level is a way to understand the whole of society.

3. **Critical connections over critical mass**: "Move at the speed of trust." Depth of relationship determines resilience, not breadth of reach. "Inch wide mile deep" over "mile wide inch deep."

4. **Adaptation and nonlinear/iterative change**: Leaders are adaptive — "riding change like dolphins ride the ocean." Nothing is wasted or a failure. Emergence is a system that makes use of everything in the iterative process. It's all data.

5. **Interdependence and decentralization**: Solutions come from decentralization. Resilience emerges because no single person holds all the power. Leaderfull, not leaderless.

6. **Creating more possibilities**: Not one perfect path forward, but an abundance of futures. Octavia Butler's protagonists created more and more possibilities rather than narrowing to one path.

7. **Biomimicry archetypes**:
   - **Mycelium**: Underground connection, remediation, toxin-transformation. Largest organism on earth.
   - **Starlings (murmuration)**: Simple rules, no central leader, any part can transform the whole.
   - **Dandelions**: Decentralization, resilience, the long taproot survives removal. Each seed creates a field.
   - **Ants**: Cooperative work via local information — no ant knows the whole plan.
   - **Ferns**: Self-similar fractal form at every scale.

8. **Principles of Emergent Strategy** (direct list from the text):
   - Small is good, small is all. (The large is a reflection of the small.)
   - Change is constant. (Be like water.)
   - There is always enough time for the right work.
   - There is a conversation in the room that only these people at this moment can have. Find it.
   - Never a failure, always a lesson.
   - Trust the People. (If you trust the people, they become trustworthy.)
   - Move at the speed of trust.
   - Focus on critical connections more than critical mass — build resilience by building relationships.
   - Less prep, more presence.
   - What you pay attention to grows.

9. **Pleasure activism**: Facts, guilt, and shame are limited motivations for change. Justice must become one of the most pleasurable experiences we can have. Shame freezes; pleasure invites movement, openness, growth.

10. **Dialectical humanism**: The cycle of collective transformation of beliefs as we gather new information and experiences. Positions held to be wrong can be understood differently over time.

11. **Science fictional behavior**: Being concerned with how our actions and beliefs *today* will shape future generations. Radical imagination as a political act.

12. **Facilitation**: "The art of making things easy." Rooted in grand love for life. Making it easier for humans to work together and get things done. Distinct from "simple" — simple = relative simplicity of interactions; easy = reduced friction.

### Existing system mappings

| Emergent Strategy concept | bars-engine mechanic | Code location |
|---|---|---|
| Fractal awareness ("small is all, the large is a reflection of the small") | `kotterStage` as a period scalar on the Instance, replicated down into `CustomBar.kotterStage` and gameboard slots | `prisma/schema.prisma` lines 231, 1265; `src/lib/gameboard.ts` |
| Critical connections over critical mass | Quest Threads and BARs as relational artifacts linking players to each other's creative output (`parentId`, `appendedBars` creator mint) | `src/actions/quest-engine.ts` lines 290–318 |
| Emergence via simple interactions | WAVE move discernment (Wake/Clean/Grow/Show) routing to specialist agents | `backend/app/agents/sage.py` SYSTEM_PROMPT |
| Decentralization + leaderfull | Six GM Faces (Shaman, Challenger, Diplomat, Regent, Architect, Sage) — no single face holds the whole | `backend/app/agents/sage.py`; `src/lib/template-library/index.ts` FACE_PLACEHOLDER |
| Biomimicry: murmuration (any part transforms the whole) | `fireTrigger()` — any quest input event can cascade completion through the whole thread | `src/actions/quest-engine.ts` lines 856–927 |
| Iteration as data / never a failure | `bonusMultiplier`, `isRepeat` handling — repeat completions don't error, they're processed differently | `src/actions/quest-engine.ts` lines 187–219 |
| "What you pay attention to grows" | `advanceCampaignWatering` effect — explicit face-watering metaphor | `src/actions/quest-engine.ts` lines 815–825 |
| Pleasure activism | Vibulon economy: completing quests mints tokens, creator economy, bounty staking — joy over shame | `src/actions/quest-engine.ts` lines 244–318 |
| Fractal (fern self-similarity) | Template system — same slot grammar at every campaign scale | `src/lib/template-library/index.ts` FACE_PLACEHOLDER |
| Decentralized resilience (dandelion taproot) | `rootId` / `isKeyUnblocker` tetris cascade — system finds new growth paths after unblocker completes | `src/actions/quest-engine.ts` lines 456–465 |

### Missing mechanics

**1. Fractal reflection score**
The system has `kotterStage` alignment and `emotionalAlchemyTag` filters but no mechanism for the *Sage to detect whether micro-patterns at the player level reflect macro-patterns at the campaign level*. Emergent Strategy's core insight is that the health of the cell = health of the species. A `fractaResonanceScore` on campaign completion events — comparing individual quest completion velocity to campaign-level throughput — would give the Sage a genuine fractal signal to route on.

**2. Mycelium quest network**
Currently BARs chain via `parentId` (vertical forking) and `appendedBars` (horizontal appending). The mycelium model suggests a *horizontal underground connection layer*: quests that share emotional territory (same `emotionalAlchemyTag`, same `storyPath`) should be detectable as a cluster. There is no query that finds "the mycelium" — which nodes are feeding which others across players, not just within a single player's thread.

**3. Speed of trust metric**
"Move at the speed of trust" has no implementation. The system tracks quest completions but not *relationship depth between players*. A simple `InstanceMembership`-level trust score (derived from: co-completed quests, BAR creator-completions of each other's work, invitation chains) would let the Sage route differently for players who have high vs. low relational depth.

**4. Leaderfull (not leaderless) campaign design**
The current `kotterStage` system is admin-advanced. This is a single-leader, top-down advancement model. Emergent Strategy calls for "leaderfull" systems where any node can shift the whole. Missing: a *distributed advancement signal* — when enough players in an Instance complete `kotterStage = N` quests, the stage can auto-advance (or flag for admin confirmation), making advancement emergent from collective player activity, not purely GM decree.

**5. Pleasure as routing signal**
The `emotionalAlchemyTag` (aligned / curious / skeptical) is a routing filter but it's a static label set at onboarding. Emergent Strategy argues pleasure evokes movement while shame freezes. Missing: a *live pleasure/friction signal* on quest completion — a lightweight 1-tap "did this feel good / draining?" that feeds the Sage's routing without adding friction. The `Share Your Signal` feedback quest is close but it's a separate quest, not embedded in the completion flow.

**6. "Inch wide mile deep" depth indicator**
The system measures breadth (how many quests completed) but not depth (how transformative any single quest thread has been). Missing: a `depthScore` on ThreadProgress, computable from: time spent in thread, reflection inputs length, repeat engagement, BAR artifacts created from completions. Sage should preferentially route players toward depth-building when they have wide-but-shallow profiles.

**7. Generative dependency resolution (composting)**
The Sage already has `generative_deps` in its output schema (`backend/app/agents/sage.py` lines 71–74) — a list of items this synthesis obsoletes. But nothing in the system actually *acts* on those IDs. Missing: a `markObsolete(barIds)` action that archives or composts BAR/quest items the Sage has judged redundant, so the ecosystem doesn't accumulate dead wood.

### NPC constitution language

The following are direct quotes and paraphrases from the book, reformatted as voice/values/function/limits patches for the Sage NPC constitution:

**Voice patches**:
- "Emergence is not a plan, it is what happens between the plans." (Sage should frame synthesis as noticing pattern, not issuing orders.)
- "What you pay attention to grows." (Sage's attention focus statements should be short, present-tense, declarative.)
- "Move at the speed of trust." (When proposing a path, Sage names what trust condition must be met first.)
- "There is a conversation in the room that only these people at this moment can have." (Each Sage session open with naming the uniqueness of the present moment / present player state.)
- "Never a failure, always a lesson." (Sage never uses the word 'mistake' for player actions — always 'data.')

**Values patches**:
- *Pleasure before shame*: Sage routes toward the path that feels most alive, not the most efficient or correct path. If two routes are similar in quality, prefer the one that will feel better.
- *Trust as foundation*: Sage checks relational depth before recommending high-vulnerability moves. Does not push a player toward exposure they haven't earned the container for.
- *Fractal integrity*: Sage names when a player's micro-pattern diverges from the campaign macro-pattern. ("Your arc is moving toward X; the campaign is moving toward Y. What does that tension want to tell us?")

**Function patches**:
- Before synthesizing, Sage asks: "What is the conversation that only this player, at this moment, can have?" — and names it explicitly in `legibility_note`.
- Sage treats `generative_deps` seriously: for every synthesis, it must name at least one thing that can be composted.
- When `discerned_move` is Wake Up, Sage names the *fractal scale* at which the waking needs to happen (self / relationship / campaign / movement).

**Limits patches**:
- Sage does not prescribe a single path. It maps the possibility space. "There are a million paths into the future, and many of them can be transformative."
- Sage does not compress timelines. "There is always enough time for the right work." When players report urgency, Sage names urgency as a potential blocker, not a motivator.

### Quest grammar / campaign architecture extensions

**Sage-altitude quests feel different because they operate at the pattern level, not the task level.**

Current grammar: quests have `type` (quest / bar / insight / vibe / doc / onboarding), `storyPath`, `kotterStage`, `campaignRef`. These are structural tags that route where a quest lives. They don't describe *what altitude of awareness the quest requires*.

Proposed extensions:

1. **`altitudeTag: 'fractal' | 'mycelium' | 'murmuration' | 'adaptation'`** on `CustomBar` — matching the ES biomimicry archetypes. A fractal quest asks the player to notice a small pattern that mirrors a large one. A mycelium quest asks the player to make a connection between two nodes that currently have no visible relationship. A murmuration quest asks the player to make a small move that is designed to ripple. An adaptation quest asks the player to consciously revise a strategy in light of new data.

2. **Fractal quest narrative template**: "You've been noticing [small pattern]. Across the campaign, [large pattern] is also in motion. Where do these touch?" — replaces the standard quest description grammar for Sage-altitude quests.

3. **Murmuration campaign mechanic**: A quest that becomes available to the whole Instance simultaneously when a threshold of players completes a precursor. Any player's completion propagates a ripple to others (notification, shared BAR artifact). Maps directly to the starling murmuration model — any part of the flock can transform the whole.

4. **Leaderfull stage advancement**: Replace admin-only `kotterStage` advance with a dual-path: admin advance OR emergent advance (triggered when N% of instance membership completes current-stage quests). The Sage monitors the emergent signal and surfaces it to the GM as a recommendation.

5. **Pleasure signal on quest completion**: Add optional `feelSignal: 'alive' | 'neutral' | 'draining'` 1-tap input (not required, never blocks reward) to `PlayerQuest`. Sage uses `feelSignal` distribution to assess campaign health — a campaign where completions trend draining has a systemic friction problem.

---

## Wikipedia: The Missing Manual

**Actual content**: This is a literal 2008 O'Reilly technical manual for editing the English Wikipedia, by John Broughton. It covers wiki markup syntax, article creation, source citation, page histories, vandalism reverting, WikiProjects, content dispute resolution, incivility handling, article categorization, and Wikipedia's governance norms (NPOV, No Original Research, Verifiability). It is not metaphorical, philosophical, or related to social justice or game design.

**Assessment for Sage altitude**: The mislabeling is worth noting. The book contains no emergent strategy content and no directly applicable game design philosophy. However, its documentation of *how Wikipedia actually governs itself* is a live case study in emergent, leaderless (or "leaderfull") collective knowledge production at scale — the exact model ES names as an inspiration. The analysis below reads it through that lens.

### Core concepts

1. **"Anyone can edit" as collective intelligence**: Wikipedia functions because an overwhelming percentage of edits are made in good faith by people trying to improve — not vandalize. Quality emerges from distributed attention, not from hierarchy.

2. **Consensus governance without formal hierarchy**: "How can tens of thousands of people work together when there is no hierarchy to provide direction and resolve disputes?" Wikipedia's answer: agreed-upon processes, community-granted authority to a small number of enforcers, and norm-following by the majority.

3. **WikiProjects as voluntary guilds**: Groups of editors organize around shared interest areas — not by assignment, but by affinity. They maintain standards, coordinate improvements, and tutor newcomers within their domain.

4. **Edit summary as legibility norm**: Every change must carry a brief explanation. This is the mechanism that makes distributed editing coherent — each actor's intent is made visible to every other actor.

5. **Sandbox as safe practice space**: Before editing real articles, editors practice in a sandbox environment where nothing breaks. Error is contained; learning is protected.

6. **Neutral Point of View (NPOV)**: Present significant viewpoints in proportion to their prominence. Represent fairly any differing views. Write without bias.

7. **No Original Research**: Information must be verifiable from published sources. Wikipedia is never the first place news appears. This forces humility — the system is a synthesizer of existing knowledge, not a generator of new claims.

8. **Revert as immune response**: Vandalism is handled by reverting — restoring a previous state. The system has immune memory (page histories) that any editor can read and act on.

9. **Templates as composable, auto-updating standards**: Templates encode community decisions once; they propagate automatically everywhere. Changing a template changes every page that uses it.

10. **"Stub" as honest incompleteness marker**: Articles can be published in incomplete form with a stub marker. This invites contribution without blocking publication. Incompleteness is normal and visible, not hidden.

### Existing system mappings

| Wikipedia concept | bars-engine mechanic | Code location |
|---|---|---|
| "Anyone can edit" / distributed contribution | Player-authored BARs visible to all; any player can "accept" a quest authored by another | `src/actions/quest-engine.ts` lines 290–318 |
| WikiProjects (voluntary guilds by affinity) | Nations / Archetypes group players by identity alignment; Campaign subcampaign domains group by interest | `prisma/schema.prisma` `nationId`, `archetypeId`, subcampaignDomain |
| Edit summary as legibility | `legibility_note` field on `SageResponse` — Sage must explain its routing | `backend/app/agents/sage.py` lines 67–70 |
| Templates as composable standards | `AdventureTemplate` + `FACE_PLACEHOLDER` — reusable passage grammar | `src/lib/template-library/index.ts` |
| Sandbox for practice | No current equivalent — players go straight to live quests | — |
| Stub / honest incompleteness | `isPlaceholderText()` check in template library — detects unedited placeholders | `src/lib/template-library/index.ts` lines 51–56 |
| Page history / revert | No current quest revert or history mechanism | — |
| No Original Research (verify before asserting) | `DocEvidenceLink` and `DocQuest` — evidence-weighted knowledge nodes | `src/actions/quest-engine.ts` lines 366–388 |
| NPOV (fair representation of views) | Six GM Faces represent different quadrant perspectives — no single face is "correct" | `backend/app/agents/sage.py` AQAL routing |
| Revert as immune response | `status: 'blocked'` on quests; key-unblocker cascade | `src/actions/quest-engine.ts` lines 104–108, 456–465 |
| Consensus governance | WAVE move + Sage routing — decisions emerge from multi-agent consultation, not unilateral choice | `backend/app/agents/sage.py` |

### Missing mechanics

**1. The Sandbox mechanic**
Wikipedia's sandbox is the highest-leverage onboarding pattern in the book: a place where you can make all the mistakes and nothing breaks. bars-engine has no sandbox equivalent. Players go directly from onboarding quests to live campaign actions. Missing: a `sandboxMode` flag on `PlayerQuest` or a designated `Instance` mode where quest completions are logged but don't mint vibeulons, advance threads, or trigger watering. This is where new players learn the grammar without consequences.

**2. Stub quests / honest incompleteness markers**
Wikipedia publishes incomplete articles with a stub marker, which invites contribution. The template library has `isPlaceholderText()` but there's no player-facing "stub" signal on quests. Missing: a `completionState: 'stub' | 'draft' | 'complete'` on `CustomBar`, where a stub quest is visible but flagged as needing more player contribution to become full. This transforms the "I don't know enough to do this" barrier into an invitation.

**3. Quest history / revert**
Wikipedia's page history makes every change visible and reversible. bars-engine has no audit trail of quest mutations (title changes, description edits, status changes). Missing: a `CustomBarHistory` table or JSON event log on `CustomBar`. This enables the Sage to detect when a quest has drifted from its original intent (similar to wiki article drift from its founding neutral statement).

**4. WikiProject-style domain guilds**
WikiProjects are not formal hierarchy — they're voluntary affinity groups that maintain quality standards. The campaign `subcampaignDomain` field exists, but there's no player-facing guild identity around it. Missing: a lightweight `DomainGuild` mechanic where players with matching `campaignDomainPreference` can see each other's BARs first, get notified of domain quests, and have their completions weighted as "guild expertise" in that domain.

**5. Distributed template updating (auto-propagation)**
Wikipedia's template system auto-updates every page when the source template changes. The current `AdventureTemplate` generates a one-time draft Adventure — it's a stamp, not a live connection. Missing: a `templateRef` field on `Adventure` (and passages) so that when the GM updates a template slot guidance text, existing Adventures can optionally pull the update. This is the difference between a template as a copy-paste tool and a template as a living standard.

**6. Edit summary norm (player action legibility)**
Wikipedia requires every edit to carry a brief explanation. bars-engine has no equivalent player-action legibility norm. When a player completes a quest with a reflection input, that input is stored but not surfaced as a "summary visible to others." Missing: a `publicSummary` field on `PlayerQuest.inputs` — a one-sentence player-authored note ("why I did this quest") that appears in campaign-level audit views. Turns individual actions into collective legibility.

### NPC constitution language

The Wikipedia book's governance structure, read through an Emergent Strategy lens, provides a distinct voice register for the Sage when operating as a *collective memory keeper* rather than a *routing meta-agent*.

**Voice patches**:
- "The vast majority of edits are made in good faith." (Sage defaults to charitable interpretation. When a player action seems misaligned, Sage names the good-faith reading first.)
- "No original research." (Sage does not invent player context. It synthesizes from what exists in the system. When context is thin, Sage says so explicitly rather than filling gaps with inference.)
- "Wikipedia is always a work in progress, not a finished product." (Sage treats every synthesis as provisional. Its `legibility_note` ends with: "This reading is current as of [player state]. It will update.")

**Values patches**:
- *Collective legibility*: Every Sage routing decision should be legible to a third observer. The `legibility_note` field is not optional — it is the mechanism by which distributed trust is maintained.
- *Immune memory*: Sage has access to quest history and should name when a player or campaign is revisiting a pattern that has been tried before. "This configuration appeared at period 2. Here is what emerged from it."

**Function patches**:
- Sage acts as the keeper of the "page history" of the campaign. Before synthesizing, it should surface: "The last time the campaign was at this stage, the following patterns emerged: [...]"
- When routing to a specialist agent, Sage leaves an edit summary: "Routing to [agent] because [reason]." This is the `legibility_note` pattern applied consistently.

---

## Cross-book synthesis

### The single highest-leverage integration

**Emergent Strategy's fractal principle + Wikipedia's sandbox mechanic = a "Fractal Sandbox" campaign mode.**

Emergent Strategy insists that small actions, practiced with integrity, propagate to the whole system. Wikipedia's sandbox lets actors practice those small actions without risk to the live system, then graduate to live editing.

bars-engine currently has no protected practice space. New players enter the live campaign immediately. The consequence: the cost of low-quality quest completions (thin reflections, misaligned inputs) propagates immediately into the vibulon economy, watering mechanics, and campaign signal. There is no immune layer between learning and production.

A **Fractal Sandbox** — an Instance mode, toggled per-player or per-cohort, where:
- Quest completions are real (feel, inputs, reflection are processed)
- Vibulon rewards are held in escrow rather than immediately minted
- Campaign watering signals are logged but not counted toward stage advancement
- The Sage reviews sandbox completions and surfaces "ready to go live" signals

This serves multiple emergent strategy principles simultaneously:
- "Less prep, more presence" — players practice by doing, not by reading documentation
- "Move at the speed of trust" — the sandbox is how trust is earned before live play
- "Never a failure, always a lesson" — sandbox completions are pure data, no economic consequence
- "Small is good, small is all" — players who learn the grammar at sandbox scale produce better outputs at campaign scale

### Recommended immediate action

**Add `altitudeTag` to `CustomBar` and wire it into the Sage routing system.**

This is the lowest-friction implementation path that begins connecting Emergent Strategy concepts directly to the quest grammar:

1. Add `altitudeTag String?` to `CustomBar` in `prisma/schema.prisma` (values: `fractal` | `mycelium` | `murmuration` | `adaptation` | `stub`)
2. In `backend/app/agents/sage.py`, add `altitude_tag` to `SageResponse` output schema — Sage assigns an altitude tag to each routed quest
3. In `src/lib/template-library/index.ts`, add `altitudeTag` defaults per slot type: `context` → `fractal`, `anomaly` → `murmuration`, `choice` → `adaptation`, `artifact` → `mycelium`
4. In the admin template editor (`src/app/admin/templates/`), surface `altitudeTag` as a visible label so GMs author with altitude awareness

This puts Emergent Strategy's biomimicry vocabulary directly into the quest grammar without requiring a migration, schema redesign, or new agent. It is composable, reversible, and immediately legible.

**The Sage's `legibility_note` should always name the altitude of its synthesis.** That single discipline, practiced consistently, is how a meta-agent becomes a Sage rather than a router.

---

*Note on book mislabeling: "Wikipedia: The Missing Manual" is not a game design, organizational theory, or spiritual/philosophical text. It is a 2008 technical editing guide for Wikipedia.org. Its value for this project is indirect — as a live case study in emergent, consensus-based collective knowledge production, the governance patterns are genuinely applicable. But it should not be assumed to contain direct design philosophy for bars-engine. If the intent was to include a book on wiki-governance as a collective intelligence model, a more targeted text (e.g., Yochai Benkler's "The Wealth of Networks" or Clay Shirky's "Here Comes Everybody") would be higher signal.*
