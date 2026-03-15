# Game Master Face Moves — Exploration

**Purpose**: Think through what moves each Game Master face can make — both in the **codebase** (scripts, admin, API, backlog) and in the **game** (player-facing, quests, campaign). This doc supports an interview-style exploration.

---

## Current State Summary

### In the Codebase (Backend Agents)

| Face | Trigram | Current Output | Tools |
|------|---------|----------------|-------|
| **Shaman** | Earth | EmotionalAlchemyReading (element, narrative lock, shadow belief, guidance) | load_player_context, load_active_quests |
| **Challenger** | Fire | MoveProposal (available moves, recommended, energy assessment) | get_player_context, get_active_quests, get_nation_moves, get_player_move_unlocks, get_player_equipped_moves, discern_wave_move |
| **Regent** | Lake | CampaignAssessment (Kotter stage, threads, readiness) | get_campaign_state, get_instance_threads, get_campaign_playbook, get_player_context |
| **Architect** | Heaven | QuestDraft, QuestCompilation | get_player_context, get_active_quests, get_nation_moves, get_similar_existing_quests, check_for_compostable, discern_wave_move |
| **Diplomat** | Wind | CommunityGuidance (instance, domain, onboarding step, BAR suggestions) | get_player_context, get_player_onboarding_state, get_available_instances, get_recent_bar_shares |
| **Sage** | Mountain | SageResponse (synthesis, consulted agents, hexagram alignment) | get_player_context, get_current_wave_move, consult_architect, consult_challenger, consult_shaman, consult_regent, consult_diplomat, cast_hexagram_alignment |

### In the Game (Player-Facing)

- **Faces as developmental lenses**: Players choose a face at onboarding; quests and copy are translated per face.
- **Face sentences**: One sentence per face that frames entry into the CYOA (e.g. Shaman: "Enter through the mythic threshold…").
- **Quest alignment**: Quests can be tagged with gameMasterFace (shaman, challenger, etc.); Market/Dojo filters by face.
- **WAVE moves**: Wake Up, Clean Up, Grow Up, Show Up — how players get things done.
- **15 canonical moves**: Transcend, Generative, Control — Challenger proposes these.

### Codebase Scripts / Admin

- `npm run sage:brief` — Sage synthesizes backlog + coordination; outputs assignment suggestions.
- `npm run sage:deft-plan` — Sage + hexagram for planning.
- Agent API: `POST /api/agents/...` — Sage routes, specialists consult.
- Sage coordination: `getSageCoordinationSuggestions()` — keyword-based backlog assignment.

---

## Two Dimensions: Codebase vs Game

| Dimension | Codebase | Game |
|-----------|----------|------|
| **Who acts** | Developers, admins, scripts | Players |
| **What moves** | Backlog items, quests, schema, agents | Quests, BARs, vibeulons, campaign |
| **Face as** | AI agent with tools | Developmental lens / sect head |
| **Example** | Sage assigns work to Architect; Architect drafts quest | Player serving Shaman completes a quest that unlocks a ritual |

**Key question**: Should moves be *symmetric* (each face has analogous moves in both dimensions) or *asymmetric* (codebase moves ≠ game moves)?

---

## Interview Questions — By Face

### Shaman (Earth — Mythic threshold, belonging, ritual)

**Codebase**
- What would it mean for the Shaman to "create a ritual" in the codebase? (e.g. a script that runs on a schedule, a passage that triggers a 321 reflection?)
- Should the Shaman be able to *name* shadow beliefs or narrative locks from backlog/feedback data?
- Could the Shaman "bridge worlds" — e.g. map emotional_alchemy tags to quest grammar, or suggest when a BAR is stuck in a metal/fear channel?

**Game**
- What Shaman moves *already exist*? (321 shadow process, Emotional First Aid, witness note?)
- What ritual actions could players take that feel Shaman-aligned? (Light a candle before a quest? Name a belief before completing?)
- Should the Shaman "preside" over certain game events (e.g. completion of a Transcend move)?

---

### Challenger (Fire — Proving ground, action, edge)

**Codebase**
- The Challenger proposes moves. What could the Challenger *do* in the codebase? (Validate that a PR is "Show Up" vs "Clean Up"? Flag blocked quests?)
- Could the Challenger "challenge" the backlog — e.g. "This item is stuck; it needs a Clean Up move before it can ship"?
- Should the Challenger have a tool to *unblock* something? (e.g. suggest a fork, or mark a quest as "needs energy")

**Game**
- What Challenger moves are already in play? (15 canonical moves, nation moves, archetype moves?)
- Could the Challenger "issue a challenge" — a time-bound quest, a bid, a dare?
- Should the Challenger be the one who says "You're ready for the next step" or "Not yet"?

---

### Regent (Lake — Order, structure, roles, rules)

**Codebase**
- The Regent assesses campaign. What could the Regent *change*? (Advance Kotter stage? Create a thread? Assign a quest to a campaign?)
- Could the Regent "declare a rule" — e.g. "No campaign quests complete outside gameboard" (already exists) or "Instance X is in Stage 2 until threshold met"?
- Should the Regent have a "court" — a list of active players, threads, domains — and suggest who should do what next?

**Game**
- What Regent moves exist? (Admin advances stage; Market filters by stage?)
- Could the Regent "grant a role" — e.g. steward, quest-owner, campaign contributor?
- Should the Regent "declare a period" — e.g. "We are now in Coalition; focus on coalition-building quests"?

---

### Architect (Heaven — Blueprint, strategy, project)

**Codebase**
- The Architect drafts quests. What else could the Architect *build*? (A new passage type? A quest template? A grammar rule?)
- Could the Architect "compile" something other than quests — e.g. a campaign deck, a Market view, a certification flow?
- Should the Architect "steward the backlog" — create, prioritize, or decompose items?

**Game**
- What Architect moves exist? (Quest creation, subquest attachment, quest grammar?)
- Could the Architect "offer a blueprint" — a quest template players can fork, or a strategy guide?
- Should the Architect "design" the gameboard layout, slot order, or draw logic?

---

### Diplomat (Wind — Weave, relational field, care)

**Codebase**
- The Diplomat guides onboarding. What could the Diplomat *weave* in the codebase? (Connect a player to an instance? Suggest a BAR to share? Create an invitation?)
- Could the Diplomat "bridge" — e.g. match a stuck player to a campaign, or suggest who to reach out to?
- Should the Diplomat have a "community pulse" tool — e.g. recent BAR shares, event RSVPs, onboarding funnel?

**Game**
- What Diplomat moves exist? (Invite, share BAR, join campaign?)
- Could the Diplomat "offer connection" — e.g. "Player X is also in Gathering Resources; consider reaching out"?
- Should the Diplomat "host" something — e.g. a community event, a shared reflection space?

---

### Sage (Mountain — Wise trickster, integration, flow)

**Codebase**
- The Sage routes and synthesizes. What could the Sage *do* beyond that? (Cast a hexagram before a deploy? Suggest which face should own a new spec?)
- As a wise trickster — could the Sage "use a mask" to *act* as another face? (e.g. Sage runs Architect with a specific narrative_lock?)
- Should the Sage have "move" tools — e.g. `sage_suggest_next`, `sage_cast_for_decision`, `sage_resolve_conflict`?

**Game**
- What Sage moves exist? (I Ching reading? Integration of multiple insights?)
- Could the Sage "hold paradox" — e.g. present two opposing choices without resolving?
- Should the Sage "witness" — e.g. a completion, a transition — and offer a meta-perspective?

---

## Framework: Move Types

Proposed move taxonomy for thinking:

| Move Type | Codebase | Game |
|-----------|----------|------|
| **Read** | Load context, assess, propose | View quest, read BAR, see campaign |
| **Propose** | Suggest assignment, draft quest | Suggest move, offer quest |
| **Create** | Create quest, thread, backlog item | Create BAR, create quest |
| **Assign** | Assign to face, assign to player | Assign quest to player |
| **Advance** | Advance stage, advance period | Complete quest, advance story |
| **Connect** | Link items, route to agent | Invite, share, attach |
| **Witness** | Log, record, acknowledge | Witness completion, hold space |
| **Challenge** | Flag blocker, issue dare | Issue challenge, time-bound quest |
| **Resolve** | Synthesize, merge, decide | Resolve conflict, integrate |

---

## Design Decisions (Captured)

| Topic | Decision |
|-------|----------|
| **Symmetry** | Each face MUST have an application in both codebase and game; both must be explicit. |
| **Sage as trickster** | When the Sage "uses a mask," the Sage *runs as* that face — same tools, different prompt. Not delegation. |
| **Priorities** | Deepen both codebase and game; slight emphasis on game first. |
| **Constraints** | Faces must not leave their domains except with counsel from the Sage. |
| **Agency** | Agent desires (Shaman rituals, Challenger challenges, Regent declarations, etc.) are appropriate; proceed. |

---

## Next Steps

- Refine move types and add per-face move matrices (codebase + game).
- Draft spec for Game Master Face Moves.
- Implement game-side moves first, then codebase-side.
