# Architect Books — Integration Analysis
**Books**: Actionable Gamification, MTGOA (Mastering the Game of Allyship), 10,000 Hours of Play
**Date**: 2026-03-19
**Analyst altitude**: Architect (Orange/Strategy sect — Heaven trigram, systems design)

---

## Actionable Gamification
*Yu-kai Chou, 2014–2017. "Beyond Points, Badges, and Leaderboards."*

### Core Concepts

**The Octalysis Framework** — 8 Core Drives arranged in an octagon:
1. Epic Meaning & Calling (top — White Hat)
2. Development & Accomplishment (left — extrinsic/White Hat)
3. Empowerment of Creativity & Feedback (right — intrinsic/White Hat)
4. Ownership & Possession (left — extrinsic)
5. Social Influence & Relatedness (right — intrinsic)
6. Scarcity & Impatience (bottom-left — Black Hat extrinsic)
7. Unpredictability & Curiosity (bottom-right — Black Hat intrinsic)
8. Loss & Avoidance (bottom — Black Hat)

**Left Brain vs Right Brain**: Left = extrinsic (logic, ownership, accomplishment). Right = intrinsic (creativity, social, curiosity). Right Brain Drives produce stickier engagement because the activity itself is rewarding.

**White Hat vs Black Hat**: White Hat (top drives) makes users feel empowered and good. Black Hat (bottom) creates urgency and even addiction but leaves users feeling bad — they leave when they can.

**The PBL Fallacy**: Points, Badges, Leaderboards are the outer shell only. Most failed gamification is PBL-only. The real question is which Core Drives are activated, not which mechanics are present.

**Level II Octalysis — 4 Player Journey Phases**:
- Discovery (why try it)
- Onboarding (learn rules and tools)
- Scaffolding (repeated action loops toward a goal)
- Endgame (how to retain veterans)

Each phase needs different Core Drives. Motivation at Day 1 is not motivation at Day 100.

**Game Techniques** (named mechanics within each Core Drive):
- CD1: Narrative, Humanity Hero (chosen-one narrative)
- CD2: Progress Bar, Achievement Symbols, Boss Fights, Star of Bethlehem (guiding users toward next step)
- CD3: Evergreen Mechanics (user-generated content that keeps itself fresh)
- CD4: Collector's Sets, Avatar/Identity systems, Build From Scratch
- CD5: Social Proof, Mentorship, Social Treasure, Gifting
- CD6: Appointment Dynamics, Throttle Mechanics, Torture Breaks
- CD7: Random Rewards, Easter Eggs, Mini Quests, Sudden Rewards
- CD8: Sunk Cost Prison, Progress Loss, FOMO ("Limited time!")

**Overjustification Effect**: Adding extrinsic rewards to intrinsically motivated behavior can kill intrinsic motivation once the reward is removed.

### Existing System Mappings

| Octalysis Core Drive | bars-engine Mechanic | Code Location |
|---|---|---|
| CD1: Epic Meaning & Calling | Campaign system with Kotter stages; allyship domain framing; "increase well-being of others" as mission | `src/lib/gameboard.ts`, `prisma/schema.prisma` (campaignRef, kotterStage) |
| CD2: Development & Accomplishment | Vibulon rewards on quest completion; `kotterStage` progression (1-8); `BlessedObjectEarned` talisman on gameboard | `src/actions/quest-engine.ts` lines 213–287; `prisma/schema.prisma` BlessedObjectEarned |
| CD3: Empowerment of Creativity & Feedback | BAR creation → quest generation loop; growQuestFromBar, growDaemonFromBar, growArtifactFromBar | `src/actions/bars.ts` lines 674–824 |
| CD4: Ownership & Possession | BARs as personal artifacts; avatar system; vibulon tokens as owned objects | `prisma/schema.prisma` Vibulon model; avatar system |
| CD5: Social Influence & Relatedness | sendBar / sendBarExternal; BarShare; NationMove unlocks | `src/actions/bars.ts` lines 251–414; `src/actions/quest-engine.ts` lines 350–364 |
| CD7: Unpredictability & Curiosity | I Ching hexagram draws seeding quests; `drawFromCampaignDeck` shuffle | `src/lib/gameboard.ts` lines 193–210; quest-grammar/iching-faces.ts |
| CD8: Loss & Avoidance | Quest expiry (`expiresAt` on BarShareExternal); period bonuses (+50%) for old quests create "don't miss it" pressure | `src/actions/quest-engine.ts` lines 159–175; `src/actions/bars.ts` line 332 |

**Notable strength**: CD1 (Epic Meaning) is unusually deep here. The entire allyship framing, Kotter change management arc, and Integral Theory grounding places this above typical gamification. Most systems have weak CD1; this one has it as the structural spine.

### Missing Mechanics

**CD2: Star of Bethlehem** (guiding users to their next step) is absent.
- The system has no visible "your next best action" indicator surfaced at the right moment.
- `src/actions/next-action-bridge.ts` exists as an untracked file but is not integrated into the main dashboard UX.
- Chou's prescription: Show the player exactly one compelling next step during Scaffolding phase. This should be a computed "next quest" derived from WAVE stage + kotterStage + emotional alchemy tag.

**CD6: Scarcity & Impatience** (Appointment Dynamics) is almost entirely absent.
- There are no time-gated quests, no "come back in X hours" mechanics, no throttle mechanics.
- The 72-hour expiry on `BarShareExternal` (`src/actions/bars.ts` line 332) is the only scarcity signal and it's invisible to the recipient.
- Missing: campaign slots that close at end of a Kotter period; first-completer bonuses (partially present with `firstCompleterId` in schema) need surfacing as a visible race mechanic.

**CD7: Appointment/Random Reward** mechanics for BARs sent.
- BARs arrive passively — no "you have a waiting BAR" notification loop or arrival ritual.
- The talisman / first-view mechanic (`recordBarShareViewed`) exists but produces no visible delight moment.

**Endgame design** is largely absent.
- The system has no designed Endgame phase for veteran players (those who have completed many quests, high vibulon counts, full move unlocks).
- Chou: Endgame is the hardest design problem — what does a veteran do? The system needs Veteran-track quests (bounty creation, quest authoring, GM roles) surfaced as a clear progression arc.

**CD4: Collector's Sets** — the 15 canonical moves (3×5 Transcend/Generative/Control) form a natural collection, but there is no UI surface showing a player's "move library" as something to complete. Collecting all 15 moves should feel like completing a Pokédex.

**Progression curve visualization** — players have no external signal of where they are in their overall journey. The Kotter stage exists in the DB but is not surfaced as a visible progression indicator in the player view.

### NPC Constitution Language (for Architect agent)

From Chou's framework, the Architect agent should embed these values:

- **Design for motivation, not mechanics.** "It's not what game elements you put in — it's how, when, and most importantly, why these game elements appear." When drafting a quest, the Architect should ask: which Core Drive does this activate? Is it intrinsic or extrinsic? White Hat or Black Hat?
- **The Star of Bethlehem principle**: Every quest the Architect designs should answer one question for the player: "What do I do next?" If it doesn't, it is incomplete.
- **Endgame awareness**: The Architect must distinguish between Onboarding-phase quests (CD2-heavy, accomplishment-focused) and Endgame quests (CD3/CD5-heavy, creative and social). The grammar should shift with the player's level.
- **Overjustification guard**: Do not attach vibulon rewards to intrinsically motivating activities (creative flow, deep connection, identity work). Reserve vibulon rewards for CD2-type accomplishments.
- **Voice**: Analytical, structural, pattern-seeking. Asks "what does this system optimize for?" before asking "what should the player do?"

### Game Loop Improvements

1. **Level II Octalysis audit**: Apply the 4-phase analysis (Discovery → Onboarding → Scaffolding → Endgame) to the current player journey. Current design has strong Onboarding and Scaffolding but weak Discovery and no designed Endgame.

2. **CD6 insertion**: Add one time-gated mechanic per Kotter period. Example: "This period's gameboard slots close in 72 hours." Surface this countdown visibly on the gameboard.

3. **CD7 BAR arrival ritual**: When a BAR is received, the first-view experience should include a moment of unpredictability — the "talisman reveal" should animate or surprise. Currently `recordBarShareViewed` is a silent DB write.

4. **Star of Bethlehem surface**: The `next-action-bridge.ts` action pattern should produce a single computed card shown on the dashboard — "Your next move: [quest title] — based on your current WAVE stage and Kotter period." This collapses CD2 + CD6 + the Epiphany Bridge grammar into a single clear signal.

---

## MTGOA — Mastering the Game of Allyship
*Actual title: "This Is Not a Book (It's a Game Board)" [v2 — Now with 37% more Actual Allyship]*
*Author: Not explicitly credited in the excerpt; appears to be a custom work developed for this project / community.*

**Note on title**: The file is named `book-mtgoa.txt` but the actual document title is "This Is Not a Book (It's a Game Board)." MTGOA = "Mastering The Game Of Allyship" — the subtitle or internal codename for this work. This is original content authored for the bars-engine project community, not a commercial publication.

### Core Concepts

**Allyship as Infinite Game**: Drawing on James P. Carse — "A finite game is played for the purpose of winning. An infinite game is played for the purpose of continuing the play." Allyship has no final boss, no level cap, only deeper presence.

**The Five Roles** (narrative function, not developmental hierarchy): Rookie, Ace, Veteran, Leader, Engineer.

**Six Allyship Superpowers** (referenced but not fully enumerated in excerpt): unique forms of ally contribution.

**Allyship Domains**: Fundraising, Direct Action, Storytelling, Organizing.

**Emotional Alchemy as gameplay**: Emotional charge is fuel, not obstacle. Fear sharpens. Sadness restores. Joy expands. Anger protects. Neutrality stabilizes. The WAVE cycle (Wake → Clean → Grow → Show) structures how charge is metabolized.

**Shadow Work as game mechanic**: "Every moment you flinch from discomfort, deny resentment, or delay grief costs you something." Shadow work = composting stuck emotional charge into usable energy. The 3-2-1 Process is named explicitly.

**Inner Guild of Voices**: Protector, Controller, Skeptic, Fixer, Emotion Voices (Anger/Fear/Sadness/Joy/Neutrality), Victim, Damaged Self, Vulnerable Child. The Inner Child holds "design authority" — the Game Master role.

**Quest Seeding by Insight**: "Every time you metabolize shadow, meet a charged part of yourself, or recognize an unmet need in the system you serve — you gain the clarity to act. That action becomes a quest."

**Charge as resource**: "Emotional currency" is the system's fuel. The book explicitly introduces "an internal currency you'll soon learn to track."

**Hearts Blazing reference**: The five-role system is explicitly credited to the indie RPG Hearts Blazing (ensemble sci-fi stories). The game mechanic language of "moves that evolve," "quests that impact the lives of other players," and "campaigns that change the world" maps directly to the bars-engine grammar.

### Existing System Mappings

| MTGOA Concept | bars-engine Mechanic | Code Location |
|---|---|---|
| Five Roles (Rookie/Veteran/Ace/Leader/Engineer) | Archetypes (nationId + archetypeId) | `prisma/schema.prisma` Player.archetypeId; Archetype model |
| Allyship Domains (Fundraising, Direct Action, Storytelling, Organizing) | `allyshipDomain` field (GATHERING_RESOURCES, DIRECT_ACTION, RAISE_AWARENESS, SKILLFUL_ORGANIZING) | `prisma/schema.prisma` CustomBar.allyshipDomain |
| WAVE cycle (Wake/Clean/Grow/Show) | `moveType` (wakeUp/cleanUp/growUp/showUp); PersonalMoveType in quest-grammar | `src/lib/quest-grammar/types.ts` line 123; `prisma/schema.prisma` CustomBar.moveType |
| Emotional Alchemy (5 elements as charge) | EmotionalChannel (Fear/Anger/Sadness/Joy/Neutrality); 15-move engine with Transcend/Generative/Control | `src/lib/quest-grammar/types.ts` lines 10-21; `src/lib/quest-grammar/move-expressions.ts` |
| Shadow Work / 3-2-1 Process | `src/app/shadow/321/Shadow321Runner.tsx`; `Shadow321Session` model | `prisma/schema.prisma` Shadow321Session; `src/app/shadow/321/` |
| Inner Guild of Voices | Not yet implemented — the "sub-boss" inner voice characters | No current code mapping |
| Quest seeded by insight | BAR → Quest generation pipeline; `growQuestFromBar` | `src/actions/bars.ts` lines 674–743 |
| Charge as tracked currency | Vibulon economy; VibulonEvent table | `src/actions/quest-engine.ts` lines 244–287; `prisma/schema.prisma` Vibulon |
| Emotional literacy before allyship | DailyCheckIn flow with emotional channel selection | `src/actions/alchemy.ts`; `src/components/dashboard/DailyCheckInQuest.tsx` |
| Hearts Blazing role mechanics | GameMasterFace (shaman/challenger/regent/architect/diplomat/sage) | `src/lib/quest-grammar/types.ts` lines 200–211 |
| "Allyship is learnable through repetition" | Repeatable quest patterns; Quest Threads | `src/actions/quest-thread.ts`; ThreadQuest model |

**Key observation**: MTGOA is not a source book the system is drawing from — it IS the system's narrative layer. The bars-engine is the game board MTGOA describes. The alignment is nearly total at the conceptual level. The gaps are all implementation gaps, not conceptual gaps.

### Missing Mechanics

**Inner Guild of Voices as NPC sub-bosses**: The book names 8 inner voice archetypes (Protector, Controller, Skeptic, Fixer, Emotion Voices, Victim, Damaged Self, Vulnerable Child). These should map to Daemon entities or quest obstacles — the inner cast that resists growth. Currently Daemons exist (`prisma/schema.prisma` Daemon model, `src/actions/daemons.ts`) but are not yet wired to specific inner voice archetypes.

**Five Roles as player progression track**: The Rookie/Ace/Veteran/Leader/Engineer role ladder is not surfaced in the player UI. Players have archetypes but not narrative roles. A player should be able to see their current role and how it is evolving through gameplay.

**Charge economy visibility**: MTGOA promises "an internal currency you'll soon learn to track." The vibulon economy exists but is opaque. Players need a "charge meter" — visible emotional energy level that depletes with certain moves and refills with others. This maps to the `energyDelta` field already present in `NodeEmotional` (`src/lib/quest-grammar/types.ts` line 190) but is not surfaced to players.

**Co-designer escalation**: "Eventually, you'll create quests for others. Designing a quest for someone else — to help them stretch, integrate, or rise — is a sacred act in this game." This is the current bounty/quest-creation system, but it lacks the ceremony and escalation narrative. Players who have completed enough quests should be prompted to move from Player to Co-Designer with explicit ceremony.

**"The board responds to attention"**: The book states the game board is alive and responds to choices. The current system tracks player choices (via PlayerQuest, ThreadProgress) but does not surface visible narrative feedback — "the board noticed what you did." Post-completion messages showing how a player's action affected the campaign are partially present (`campaignImpact` in `completeQuest` return) but need UI weight.

### NPC Constitution Language (for Architect agent)

The Architect agent, when operating from the MTGOA perspective, should:

- **Values**: Allyship as sustainable practice, not heroism or performance. Design quests that build "emotional stamina, narrative courage, and strategic flexibility." Avoid design that burns out players.
- **Voice**: "The board is alive and responds to your attention." Treat the player as a skilled co-designer who is being invited deeper, not a user being pushed through a funnel.
- **Function**: When a player presents a narrative lock, the Architect should first ask: "Which of the five roles does this player currently occupy? What is their charge state? What inner voice is blocking them?" Then select the grammar accordingly.
- **Limits**: Do not design quests that shame or punish. "What would make this feel fun, brave, and worth it — for my Inner Child?" is the north star test for any quest design.
- **Shadow work integration**: The Architect should detect when a player is in a Controller or Skeptic voice and name it in the quest framing — "You notice something in you pulling away. That's your Skeptic. Let it speak." This bridges the shadow system into quest grammar.

---

## 10,000 Hours of Play
*Yu-kai Chou, 2025. "Unlock Your Real-Life Legendary Success." Co-authored with Mark Diaz.*

### Core Concepts

**The Life RPG frame**: Life is an RPG. The player is the hero. Work = quests. Skills = abilities. Network = guild/party. Milestones = major quest completions. NPC = stagnant person with no growth arc.

**The 10K HP Six-Step Journey**:

Phase 1 — Know Yourself:
1. Choose Your Game (Mission) — identify the life objective that is worth 10,000 hours
2. Know Your Attributes (Talents) — innate strengths that persist across contexts
3. Select Your Role (Specialty) — narrative identity + professional specialization

Phase 2 — Grow Yourself:
4. Enhance Your Skills (Craft) — deliberate skill acquisition as spell learning
5. Build Your Alliances (Network) — Factions, Guilds, Parties, Partnerships as distinct relationship types
6. Achieve Your Quests (Milestones) — SMART Quests with OKRs; quest types as taxonomy

**Quest Taxonomy** (from 10K HP Chapter 8):
- Main Quests vs Side Quests
- Major Quests vs Minor Quests
- Learning Quests vs Health Quests
- Quests as Sagas and Arcs (series of major quests)

**Hero vs NPC distinction**: NPCs do "same old, same old." Heroes are never stagnant — new skills, new people, new quests, new alliances. The distinction is behavioral and aspirational, not moral.

**Alliance taxonomy**:
- Factions: large ideological/interest groups
- Guilds: structured communities of practice (Octalysis Prime as example — 40,000 members)
- Parties: small, close-knit quest companions
- Partnerships: one-to-one high-trust relationships

**Chou's 7 Leadership Personas** (Ch. 3): Named leadership archetypes with distinct styles (Strategy Sage, Industrious Storyteller, Existential Innovator, Revolutionary Architect, Inventive Polymath, Inspirational Mogul, Scientific Trailblazer — titles drawn from OP Hero Profiles).

**10K HP Alignment** (Ch. 9): The convergence of Mission + Attributes + Role + Skills + Alliances + Quests into a coherent life game. Called "OP Mode" — overpowered alignment where everything reinforces everything else. Historical examples: Gandhi, Disney, Oprah, Musk, da Vinci, Curie.

**Gameful Skill Classes** (Ch. 5): Real-life game skills encoded as spell names: Enchant (gamification), Charge (approaching strangers), Iron Skin (rejection immunity), Thunderclap (public speaking). These are real skills but named as game abilities.

### Existing System Mappings

| 10K HP Concept | bars-engine Mechanic | Code Location |
|---|---|---|
| Life RPG / Hero Journey | Entire system — quest grammar, archetypes, nations | System-wide |
| Choose Your Game (Mission) | Nation selection; campaign `campaignRef` | Player.nationId; `src/actions/onboarding.ts` |
| Know Your Attributes / Select Your Role | Archetype selection; Character Creator | Player.archetypeId; `src/app/character-creator/` |
| Enhance Your Skills (Craft) | NationMove unlocks via quest completion; `grantsMoveId` | `src/actions/quest-engine.ts` lines 350-364; `prisma/schema.prisma` CustomBar.grantsMoveId |
| Build Alliances (Guilds, Parties) | Nations as Factions; Instances as campaign guilds; BarShare as party gift economy | `prisma/schema.prisma` Nation, Instance, BarShare |
| Achieve Your Quests | Core quest completion loop | `src/actions/quest-engine.ts` |
| Quest taxonomy (Main/Side, Major/Minor, Learning/Health) | CustomBar types (quest, inspiration, vibe, onboarding, doc); kotterStage | `prisma/schema.prisma` CustomBar type field |
| Saga/Arc progression | Quest Threads; Campaign Kotter arc (8 stages) | `prisma/schema.prisma` Thread, ThreadQuest |
| Alliance-building (Cold Contact, Networking Principles) | BAR sharing as initiation gesture; invite/forgeInvitationBar | `src/actions/bars.ts` sendBarExternal; `src/actions/quest-engine.ts` forgeInvitationBar effect |
| 10K HP Alignment / OP Mode | No direct equivalent yet — the convergence state is not modeled | Gap |

### Missing Mechanics

**Quest Taxonomy as visible grammar**: The system uses type tags (quest/inspiration/vibe/onboarding/doc) and kotterStage, but players cannot see or navigate a quest taxonomy. 10K HP explicitly structures quests as Main/Side, Major/Minor, and groups them into Sagas and Arcs. This maps naturally to: Campaign Quests = Main, Gameboard Quests = Side; kotterStage 1-8 = Arc structure; the full set of a player's completed quests = their personal Saga. This Saga view does not exist.

**"OP Mode" — Alignment convergence state**: 10K HP's Chapter 9 is entirely about a high-alignment state where Mission + Attributes + Role + Skills + Alliances + Quests all reinforce each other. The system has no state that signals "you have achieved alignment." A player who has completed their archetype, nation, all onboarding steps, has an active campaign, has sent BARs, and has unlocked moves is in "OP Mode" — but nothing names or celebrates this.

**Alliance taxonomy surfaced**: The system has Nations (Factions) and Instances (Guilds/Campaigns) but the Party layer (small close-knit quest companion group) is absent. BarShare is the closest mechanic but it is gift-giving, not party formation. A 2-5 person "quest party" that can co-complete quests or see each other's progress would activate CD5 (Social Influence) significantly.

**Gameful Skill Names**: 10K HP names real-life skills as game spell names (Iron Skin, Thunderclap, Enchant). The bars-engine has 15 canonical moves with rich descriptions (`src/lib/quest-grammar/move-expressions.ts`) but these are internal system concepts. Surfacing them with evocative names as "abilities in your skill tree" — similar to NationMove unlocks — would convert them from grammar abstractions into player-visible power-ups.

**NPC vs Hero framing for player dashboard**: 10K HP opens with a diagnostic: are you an NPC or a Hero? The dashboard has no equivalent entry point. A player who hasn't engaged in N days could be surfaced the "NPC Warning" — a gentle challenge that names stagnation and offers a re-entry quest.

**Deliberate Practice tracking**: 10K HP is built on the 10,000-hour principle — hours invested in deliberate practice toward mastery. The system tracks quest completions but not cumulative play time, depth of engagement, or skill progression curves. A "skill depth" metric per move type would make the practice dimension legible.

### NPC Constitution Language (for Architect agent)

From 10K HP, the Architect agent should integrate these operating principles:

- **Vision**: "The harsh reality of game designers is that no one ever has to play a game... the moment a game is no longer fun, users leave." Every quest the Architect designs must justify why a player would choose this over doing nothing. The quest must activate at least one Core Drive intrinsically.
- **Quest design test**: Before finalizing a quest draft, the Architect should apply the 10K HP SMART Quest criteria: is the quest Specific, Measurable, Achievable, Relevant, Time-bound? Most bar-generated quests lack Time-bound and Measurable dimensions.
- **Alliance awareness**: When drafting a quest, the Architect should note whether it is a solo quest or a party quest. If the player has sent BARs or is in a campaign with others, offer party quest options.
- **Saga consciousness**: The Architect should track the player's completed quest history as a Saga — "You have completed 12 quests in the Direct Action domain. You are becoming an Ace in this area." Name the player's emerging arc.
- **Endgame design**: When a player has high vibulon counts and many move unlocks, the Architect should shift from quest-giving to quest-authoring invitations: "Your next mission is to create a bounty that others can complete."

---

## Cross-Book Synthesis

### Convergence Analysis

All three books point at the same architectural gap from different angles:

| Book | Gap Named | Symptom |
|---|---|---|
| Actionable Gamification | Missing CD6 (Scarcity), missing Endgame design, no Star of Bethlehem | Players don't know what to do next; veterans have nothing designed for them |
| MTGOA | Inner Guild of Voices not implemented; Charge meter invisible; Co-designer escalation absent | The emotional fuel system exists in the grammar but is opaque to players |
| 10K HP | No Saga view; no OP Mode convergence state; no quest taxonomy for player navigation | Players cannot see their own growth arc; completions don't compound into visible mastery |

These are three descriptions of the same structural gap: **the player has no legible view of their own progression arc, and the system does not signal when they have achieved meaningful alignment or mastery.**

### The Single Highest-Leverage Integration

**The "Next Move" surface — a computed progression state card.**

This is the Star of Bethlehem (Chou), the "board responds to attention" moment (MTGOA), and the 10K HP Saga checkpoint collapsed into a single UI component.

The system already has all the data it needs:
- Player's WAVE stage (moveType from PlayerQuest completions)
- Emotional channel (from DailyCheckIn / alchemy system)
- Kotter stage (from Instance / GameboardSlot)
- Move unlocks (PlayerNationMoveUnlock)
- BAR receipt and sharing history (BarShare)
- Quest completion history by domain and type (PlayerQuest + CustomBar.allyshipDomain)

A computed "Next Move" card on the dashboard should:
1. Name the player's current arc in Saga language ("You are in the Urgency arc of your Direct Action campaign")
2. Identify one specific quest as the next best step ("Your WAVE position suggests a cleanUp move is ready — here is one: [quest title]")
3. Show one visible scarcity signal if applicable ("3 players have already completed this in the current period")
4. Name the player's inner voice if they are in a Control or Skeptic state ("Something in you is pulling away. That energy is useful — let it speak through this quest")

This integration synthesizes CD2 (Accomplishment — seeing a clear next step), CD1 (Epic Meaning — named arc), CD6 (Scarcity — period pressure), and the MTGOA shadow-work-as-fuel principle into a single legible surface.

**Code integration points**:
- `src/actions/next-action-bridge.ts` — already exists as untracked file, needs wiring
- `src/lib/gameboard.ts` — `drawFromCampaignDeck` logic can be repurposed to select "next best quest" for player
- `src/lib/quest-grammar/types.ts` — `PersonalMoveType` and `EmotionalChannel` are the inputs
- `prisma/schema.prisma` — `GameboardSlot.moveType`, `CustomBar.emotionalAlchemyTag`, `CustomBar.kotterStage` are all filterable

### Recommended Immediate Action

**Spec and implement the "Saga View" — a player-facing progression dashboard that names their arc.**

This is lowest-effort, highest-leverage because:

1. All data already exists in the DB. No schema migration required.
2. It activates three books' worth of missing design simultaneously (CD2+CD6 from Actionable Gamification; charge visibility from MTGOA; Saga arc from 10K HP).
3. It directly addresses the highest dropout risk: players who don't know what to do next.

**Saga View components**:
- Player's current role (mapped from archetype + completion history: Rookie/Ace/Veteran/Leader/Engineer from MTGOA)
- Current arc name (derived from kotterStage + campaign name)
- Move library progress (how many of 15 canonical moves have been encountered in quest nodes — the Collector's Set mechanic from Octalysis CD4)
- One computed "Next Quest" card with scarcity indicator if applicable
- One computed "Your current charge state" based on last DailyCheckIn or emotional alchemy session

**Spec location**: `.specify/specs/saga-view/`

**Architect agent patch**: The architect agent at `backend/app/agents/architect.py` should be given access to a new tool `get_player_saga()` that returns the computed progression state. When drafting quests, the Architect should reference the player's current saga arc and name it explicitly in the quest's `reasoning` field.

---

## Appendix: Octalysis Score of bars-engine (Architect's Assessment)

| Core Drive | Current Strength (1-10) | Notes |
|---|---|---|
| CD1: Epic Meaning & Calling | 9 | Integral Theory grounding, allyship mission, nation identity — exceptionally strong |
| CD2: Development & Accomplishment | 6 | Vibulon rewards, move unlocks, Kotter stage — present but not visible enough |
| CD3: Empowerment & Creativity | 7 | BAR creation → quest seeding is genuinely creative; needs Evergreen surface |
| CD4: Ownership & Possession | 6 | BARs as artifacts, vibulon tokens — present; no Collector's Set surface |
| CD5: Social Influence | 5 | BarShare exists; no party mechanic, no social proof signals |
| CD6: Scarcity & Impatience | 2 | 72h share expiry invisible; first-completer exists but not surfaced; this is the biggest gap |
| CD7: Unpredictability & Curiosity | 7 | I Ching seeding is genuinely surprising; deck shuffle adds variability |
| CD8: Loss & Avoidance | 3 | Blocked quest mechanic; period-old quest penalty logic — not surfaced to player |

**Design note**: This is a White Hat-dominant system (CD1, CD3, CD4 are the strongest). This is correct given the community context (Portland community with allergy to manipulative design, CLAUDE.md). The CD6/CD8 gap is intentional in that manipulative scarcity is off-brand — but *ethical* scarcity (Kotter period closing, first-completer ceremonies, campaign slot limits) is entirely aligned with the project ethos and should be added.
