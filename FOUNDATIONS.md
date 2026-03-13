# FOUNDATIONS — The Ontology of BARs Engine

## Origin Story
BARs Engine began as a narrative engine for parties: a way to generate quests, track lore, and turn moments into shared story. Over time, the project clarified itself as something closer to an operating system: a reusable world-building substrate people can install, fork, and evolve.

The app became mythological by necessity. When you are coordinating humans in real time, the “code” is only half the system. The other half is meaning: what counts, what matters, what gets remembered, what gets adopted, and how divergence becomes evolution rather than collapse.

## The Kernel Principle
A BAR is a **kernel**.

A kernel is a compressed unit of potential: small enough to carry, rich enough to bloom. A BAR can become:
- a quest
- a rule
- a piece of lore
- a design decision
- a feature spec
- an implementation plan
- a community norm
- a forked branch of reality

BARs are not “notes.” They are **seeds with provenance**.

## The Five Dimensions

The game is structured around five dimensions. Use this ontology when writing specs, quests, and lore:

| Dimension | Meaning | Examples |
|-----------|---------|----------|
| **WHO** | Identity | Nation, Archetype |
| **WHAT** | The work | Quests |
| **WHERE** | Context of work | Allyship domains (Gathering Resources, Direct Action, Raise Awareness, Skillful Organizing) |
| **Energy** | What makes things happen | Vibeulons |
| **Personal throughput** | How people get things done | 4 moves: Wake Up, Clean Up, Grow Up, Show Up |

**4 moves (personal throughput)** — distinct from allyship domains:
- **Wake Up** — See more of what's available (who, what, where, how)
- **Clean Up** — Get more emotional energy; unblock vibeulon-generating actions
- **Grow Up** — Increase skill capacity through developmental lines
- **Show Up** — Do the work of completing quests

Allyship domains = WHERE the work happens. Moves = how the player gets it done.

**Intention-activated value**: Value flows with intention. When players declare what they intend (domain-aligned or cross-domain), they activate the pipeline: intention → commitment → action → quest completion → vibeulons. See [docs/INTENTION_ACTIVATED_VALUE.md](docs/INTENTION_ACTIVATED_VALUE.md).

## Emotional Alchemy (Narrative Movement)

Quest narratives move through **emotional alchemy**—an **energy economy**, not a morality wheel. Control moves are high-cost precision moves (stabilizing, defensive, protective, catalytic), not bad moves.

**5 elements + WAVE**: Metal (Fear), Water (Sadness), Wood (Joy), Fire (Anger), Earth (Neutrality). Each element supports Wake → Clean → Grow → Show. Translation only after Show.

**15 canonical moves**: 5 Transcend (+2 energy), 5 Generative translate (+1), 5 Control translate (-1). Binary translate/transcend remains for Epiphany Bridge.

**Mastery**: Wake Up quests pass by choice (orientation, teaching). Show Up quests pass by action—end passage requires attestation input. Quest threads end with action; Wake Up is the exception.

The system derives movement from unpacking data (satisfaction, dissatisfaction, self-sabotage). See [.agent/context/emotional-alchemy-ontology.md](.agent/context/emotional-alchemy-ontology.md).

## Framework Influences

The following frameworks inform the app's design:

| Framework | Author(s) | Influence on the app |
|-----------|-----------|----------------------|
| Integral Theory | Ken Wilber | Developmental lines, quadrants, stages of growth |
| Octalysis Framework | Yu-Kai Chou | Gamification, core drives, player motivation |
| I Ching interpretation | Carol K. Anthony, Hannah Moog | Hexagram/quest readings, archetypal wisdom |
| Mastering the Game of Life | Wendell Britt | Life-as-game, personal development |
| Mastering the Game of Allyship | Wendell Britt | Allyship as practice, collective action |

## Two Axes of Change
BARs Engine treats collective change as two orthogonal processes:

### 1) Structural Maturity
A kernel becomes more structurally mature through a production grammar inspired by spec-driven development:

- Constitution: principles and constraints
- Spec: an explicit desired end-state
- Plan: architecture and approach
- Tasks: atomic steps with acceptance criteria
- Implement: artifacts are created
- Analyze: validation, coherence checks, and stability

This axis governs how a BAR becomes *well-formed*.

### 2) Social Adoption
A kernel becomes socially adopted through a change grammar inspired by Kotter:

- Urgency
- Coalition
- Vision
- Volunteers
- Barrier Removal
- Short Wins
- Acceleration
- Institutionalization

This axis governs how a BAR becomes *collectively real*.

Structural maturity and social adoption can progress independently:
- a BAR can be cleanly specified yet culturally unadopted
- a BAR can be popular yet structurally brittle

## Governance: Holacratic Orientation
BARs Engine aims to support **holacratic governance**: authority is role-based and domain-scoped rather than personal or purely admin-based.

In practice, this means:
- permissions and visibility are tied to roles (and domains)
- ratification is a recorded event, not a vibe
- circles (or domain groups) can validate kernels within their scope

Governance is not primarily about control. It is about clarity: who can decide what, and how decisions become legible.

## Evolution: Forking as First-Class Reality
Open source world-building implies divergence.

BARs can be **forked**:
- forks preserve provenance and lineage
- forks allow simultaneous emergent paths
- forks treat disagreement as evolution rather than failure

A forked BAR may preserve structural maturity while restarting social adoption. The “same” kernel can bloom into multiple worlds.

## BARs Engine as Version-Managed Backlog

BARs Engine is a **lightweight version management system for quests**. The vision: *if Jira could interface with GitHub via a procedurally generated choose-your-own-adventure game.*

- **Jira** (backlog, sprints, issues) maps to campaign deck, periods, quests.
- **GitHub** (branches, PRs, forks) maps to quest forking, AID offers, fork-on-decline.
- **CYOA** (choices, paths, procedural narrative) maps to quest grammar, emotional alchemy, choice privileging.

The **Architect Game Master** teaches players to steward the collective backlog with honor and amusement — a virtual sys-admin teacher for the school of Heaven (strategy, blueprint). See [docs/JIRA_GITHUB_CYOA_METAPHOR.md](docs/JIRA_GITHUB_CYOA_METAPHOR.md).

## Inspiration as Currency
Vibeulons track inspiration and invested creative energy.

BARs can accumulate “weight” as they become more structurally mature and artifact-rich. Weight is descriptive: it records the amount of meaningful work and coherence loaded into the kernel. It is not a prediction engine and does not assume future momentum.

Acceleration is emergent. The system records and rewards real work; it does not fabricate social physics.

## Contextual Inspiration: Attunement and Transmutation
Inspiration belongs to the player, not to a single character or instance. BARs are portable kernels and can be carried across worlds freely.

Vibeulons operate in two layers:
- A global inspiration reserve (persistent, player-owned)
- Local instance liquidity (bounded, context-specific leverage)

Players may **attune** global inspiration into a specific instance to gain local leverage. This is voluntary and recorded.

Local liquidity is intentionally scarce. It creates meaningful choices and prevents economic flattening across worlds.

Local liquidity does not automatically return to the global reserve. Cross-context carry is possible only through a rare, recorded governance move (transmutation), where a circle ratifies that local value should matter beyond its originating world.

## Metabolism of Roadblocks

In the BARS Engine, an **Emergent Roadblock** is not just a bug; it is a manifestation of misaligned intention—a knot in the pipeline of inspiration. When the system (the codebase) fails to metabolize a BAR (a user request or signal), it produces a Roadblock Error.

The ritual for metabolizing roadblocks:

- **Pre-commit Scan**: Before code reaches the shared branch, a type-check and validation run. Commits that introduce build errors, export mismatches, or missing directives are rejected.
- **Agent Reflection**: The AI agent is taught to verify imports against exports, ensure `"use client"` or `"use server"` where required, and treat build errors as Roadblock Quests—to be completed before any commit.
- **Principle**: Roadblocks must be metabolized before they manifest in the shared field. Stagnation in the pipeline is allowed privately; the committed branch stays clean.

## The Yellow Brick Road

For any given Point A and Point B — where A is where you are now and B is who you want to become — there is a road made of yellow bricks.

The **Bars-Engine** is the vehicle that:

1. **Travels the Yellow Brick Road** — it carries individuals and groups from A toward B.
2. **Converts blockers into yellow bricks** — anyone and anything you encounter on the road can be transmuted into a Yellow Brick experience.

**Yellow Brick BARs** are the kernels that pave the road. The act of emotional alchemy — transmuting a blocker (dissatisfied state) into a brick (satisfied state) — generates the Vibeulons that fuel the vehicle.

Even when the road forks, you can never go the wrong way. Wherever the road leads is where you want to go. Divergence is evolution, not failure.

The vehicle's speed is governed by one constraint: **you can only move as fast as you can identify and metabolize blockers.** There is no shortcut past the blockers; they are the raw material.

### Mapping to the Five Dimensions

| YBR Element | Dimension | Mechanic |
|-------------|-----------|----------|
| See the road ahead | Wake Up | Orientation — see more of what's available |
| Metabolize blockers into bricks | Clean Up | Unblock — convert dissatisfaction into emotional energy |
| Upgrade the vehicle | Grow Up | Capacity — increase skill through developmental lines |
| Travel the road | Show Up | Action — do the work of completing quests |
| The bricks themselves | BAR (Kernel) | Seeds with provenance, planted and paved |
| The kiln that fires the bricks | Emotional Alchemy | fromState → toState transmutation |
| The fuel | Vibeulons | Energy generated by the alchemy |
| The forking road | Evolution (Forking) | Divergence as first-class reality |

### Design Implications

- **Quest arcs are stretches of road.** The Epiphany Bridge (6-beat) and Kotter (8-stage) models are both road-paving grammars. Kotter Stage 5 (Obstacles) is explicitly the moment where blockers are surfaced; Stage 6 (Wins) is when they become bricks.
- **Roadblock Metabolism is brick-making.** The ritual described above — pre-commit scan, agent reflection, metabolize before merge — is the vehicle's maintenance cycle. The road stays passable because blockers are processed, not avoided.
- **The 321 Shadow Process is prospecting.** Phase 3 (Face It) identifies raw material. Phase 2 (Talk to It) breaks it down. Phase 1 (Be It) fires the brick. The resulting BAR paves the next stretch.
- **Speed is honest.** The vehicle does not accelerate by wishing. It accelerates by getting better at identifying and metabolizing blockers — which is the Clean Up → Grow Up → Show Up progression.

## Creative Composting: Metabolizing the Past Self

BARs Engine is also a vehicle for **creative composting** — the deliberate metabolism of past creative energy into new form. The creator's prior creative output (voice recordings, written prose, character work, instructional material) is raw material, not archaeology.

### The Ethical Frame

Using AI to remix, resurface, and reimagine your own past creative voice raises an uncanny question: *is this necromancy?* The answer, within this project's ontology, is no — because the ontological footing is strong enough. Integral Theory provides a moral center that treats past selves as compostable material, not sacred relics. The past version of yourself is someone you have been and no longer are. Composting that version — metabolizing the emotional energy it carries — generates Vibeulons, not ghosts.

**Principle**: Emotional energy is fuel, not judgment. The system exists to metabolize that energy into creative output rather than self-recrimination or nostalgia. This is the Clean Up move applied to the creator's own development: unblocking vibeulon-generating action by transmuting stored emotional charge.

### Agent Voices from Transcription Data

A natural extension: transcription data (voice recordings, prose archives) can seed distinct **agent personalities** — facets of the creator's voice that serve different roles. These voices are characters in the system, not impersonations. They carry tonal qualities, vocabulary patterns, and emotional textures that enrich the narrative engine.

Example: *Giacomo* is one such voice — a NPC/villain character whose tone and perspective derive from a specific layer of the creator's archived creative work.

### Dual-Track: AI and Non-AI Versions

BARs Engine maintains a **dual-track strategy**:

1. **AI-augmented version** — full narrative generation, agent voices, emotional alchemy driven by language models
2. **Non-AI version** — the same quest grammar and gamification substrate, powered by templated content and human facilitation

This is not a compromise; it is a design principle. Different communities have different relationships with AI. The non-AI version ensures the ontology and game mechanics remain accessible wherever they are needed.

## Massing Allyship: The First 30 Days

The initial product surface — **Massing Allyship** — is a guided 30-day experience:

- Participants watch prompted videos and complete **3-2-1 exercises** (the shadow/integration process from Integral Theory)
- The exercises generate personal BARs — seeds with provenance
- Each exercise is a quest: Face It (Phase 3) → Talk to It (Phase 2) → Be It (Phase 1)
- Completion generates Vibeulons and paves Yellow Bricks on the participant's road

Originally conceived as a book for Kickstarter backers, the format evolved into an app-delivered experience. The book's content is the substrate; the app is the vehicle.

## What This Project Is
BARs Engine is an ecology:
- kernels (BARs)
- maturation (spec grammar)
- adoption (change grammar)
- governance (roles and domains)
- evolution (forking)
- creative composting (metabolism of past creative energy)

It is built to help groups generate narratively impactful experiences and to preserve the resulting reality as a living, forkable world.
