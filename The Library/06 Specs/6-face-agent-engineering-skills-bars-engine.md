---
type: spec
aliases: [6-face-agent-engineering-skills]
tags: [bars-engine, 6-face-analysis, agent-engineering, skill-growth]
created: 2026-05-05
review: 2026-05-05
status: active
linked_to:
  - KEYTERM-BARS-ENGINE-ACTIONS
  - KEYTERM-BARS-ENGINE-LIB
  - KEYTERM-AI-Agent-Architecture
  - KEYTERM-AGENTS
---

# 6-Face Analysis: AI Agent Engineering Skills → Bars-Engine

**Source:** Image from Wendell — "Skills to learn: As an AI Agent Engineer"  
**Date:** 2026-05-05  
**Purpose:** Map 8 skill gaps to bars-engine architecture; determine what to Take, Leave, and Map  
**Framework:** 6 GM Faces (Architect / Regent / Challenger / Diplomat / Shaman / Sage)

---

## The 8 Skills Under Analysis

| # | Skill | Quadrant |
|---|-------|---------|
| 1 | Tool, function calling design | UL / UR |
| 2 | Agent planning, workflow orchestration | UL / LL |
| 3 | Memory, context management | UL / LR |
| 4 | State machines, multi-step execution | LL / LR |
| 5 | Retry, fallback, recovery logic | LR / UR |
| 6 | Agent evals, reliability testing | LR / UR |
| 7 | Cost, latency optimization | LR / UR |
| 8 | Human-in-the-loop patterns | LL / UL |

---

## 🧠 Architect — Structural Framing

**Altimeter:** What structure do these 8 skills impose on bars-engine? What does bars-engine become if we absorb them?

### Skill → Architecture Mapping

| Skill | Current State | Absorbed State | Structural Change |
|-------|--------------|----------------|-------------------|
| 1. Tool/fn design | Ad-hoc tool wrappers | Typed tool contracts (input/output schemas, error contracts) | Bars-engine tools become first-class typed modules, not inline functions |
| 2. Workflow orchestration | Quest flow is implicit (story writer intuition) | Explicit quest-state machine with transition rules | QuestPhase transitions become inspectable, testable state transitions |
| 3. Memory/context | Quest grammar + EA context only | Layered memory: scratchpad → quest memory → world model | Current context (EA state, quest phase) promoted to named memory layers |
| 4. State machines | Quest phases loosely defined | QuestState enum with explicit allowed transitions + guards | "What state am I in?" becomes a first-order question, not inference |
| 5. Retry/fallback | Silent failures on bad DAOE calls | Circuit breaker + typed retry with exponential backoff | DAOE calls gain reliability contracts — recoverable vs fatal errors |
| 6. Agent evals | No automated eval infrastructure | Eval harness: quest completion rate, BAR accuracy, route cleanliness | bars-engine ships with its own test suite, not dependent on runtime discovery |
| 7. Cost/latency | No tracking | Per-quest cost ledger + latency profiles per subsystem |每一笔BAR call都有成本意识 |
| 8. HITL patterns | Manual 321, manual quest approval | Escalation tiers: auto-approve → flag for review → hard block | Certain quest moves require human confirmation before execution |

### What This Makes Bars-Engine

A **production-grade agent system** with typed contracts, named memory layers, inspectable state, eval infrastructure, and cost awareness. The shift is from "craftsman quest runner" to "observable agent platform."

### Structural Tensions

- **Tension A:** Typed tool contracts (Skill 1) vs bars-engine's current spirit of emergent/narrative-first tooling — the contract model pushes toward specification, but bars-engine runs on narrative emergence. Who owns the schema?
- **Tension B:** State machines (Skill 4) vs EA's shamanic/emergent channel system — EA channels are not state machines. Mapping QuestPhase onto EA mode may create a dual-state problem (quest phase AND EA energy state operating simultaneously).
- **Tension C:** Cost tracking (Skill 7) vs the current free-form BAR calling model — cost introduces friction into the creative process. Is that acceptable?

---

## 🏛 Regent — Elegant Keep

**Altimeter:** What already exists in bars-engine that these skills are trying to solve? What should we keep?

### Already Present (Keep)

| Skill | What's Already in Bars-Engine |
|-------|------------------------------|
| 1. Tool/fn design | `DAOEAdapter` + typed personality mappers — already a typed tool contract layer |
| 2. Workflow orchestration | Quest grammar (unpacking-constants.ts) defines quest phases — already a workflow spec |
| 3. Memory/context | Quest grammar Q1–Q6 is a context-management protocol — the questions ARE the memory |
| 5. Retry/fallback | Pattern 33 (parser-before-pipeline) + Pattern 13 (substring resolution) encode retry-on-failure patterns |
| 6. Agent evals | Pattern 50/51 (reconciliation specs) + AAR system are forms of eval infrastructure |
| 8. HITL patterns | 321 shadow process is a HITL pattern — human does emotional processing before agent acts |

### What to Discard (Leave)

| Skill | What to Leave | Why |
|------|--------------|-----|
| 1. Generic "tool call design" | Generic MCP/OpenAI-style tool schemas | bars-engine tools aren't CRUD tools — they're narrative catalysts. Schema-first contracts would constrain emergent tool behavior. |
| 6. "Agent evals" as benchmark跑分 | Synthetic benchmark quests | bars-engine eval should measure quest completion narrative quality, not benchmark numbers. Benchmark跑分 would drive the wrong optimization target. |
| 7. Cost tracking as a primary metric | Token counting as the cost unit | Token cost ≠ narrative cost. A quest that takes 1 API call but produces no transformation is "expensive" by actual value, not token count. |

### The Regent's Core Argument

We have most of the infrastructure already. These skills are real gaps, but they need **bars-engine-native implementations**, not generic agent engineering patterns grafted on. The DAOE adapter is already a typed tool contract. Quest grammar is already a context protocol. The gap is not missing the pattern — it's missing the **enforcement** and **observability** of these patterns.

### Tensions with Regent

- **Tension:** "We have the pattern, just not the enforcement" vs "the pattern itself may be wrong." The quest grammar Q1–Q6 is a good memory protocol, but is it the RIGHT memory protocol for a stateful quest that spans sessions? The 321 process is a HITL pattern, but it gates human processing rather than agent action. True HITL should be upstream of agent decisions.

---

## ⚔️ Challenger — What to Reject and Challenge

**Altimeter:** What failures do these skills predict? What is the bars-engine failure mode these skills are trying to prevent?

### The Challenger's Core Challenge

**Challenge 1: Tools are not functions.**

Skill 1 (tool design) treats tools as well-defined functions with typed inputs/outputs. Bars-engine tools are *narrative catalysts* — their output depends on EA state, quest phase, player meaning-making, and emergent shadow. A tool contract that specifies "input: string, output: string" captures nothing about the tool's effect on EA energy or quest direction. The generic tool/fn calling paradigm will produce well-typed nonsense.

**Challenge 2: Planning vs emergence.**

Skill 2 (orchestration) implies we can plan agent workflows. But bars-engine runs on EA-driven emergence. The Challenger says: if we add explicit orchestration, we will kill the emergence that makes the system interesting. The quest grammar is a framework, not a plan — the difference is load-bearing.

**Challenge 3: State machines can't represent EA energy.**

Skill 4 (state machines) is the wrong formalism for what bars-engine is tracking. EA energy is a continuous dial (Metal/Fear → Earth/Neutrality), not a finite state machine. Converting EA channels to QuestPhase states loses the nuance of the energy economy. The Challenger warns: you will build a state machine, then discover it can't represent what you actually care about.

**Challenge 4: Eval infrastructure will be used to optimize the wrong thing.**

Skill 6 (agent evals) will produce metrics. Metrics drive behavior. If we measure "quest completion rate," writers will produce quests that complete without transformation. If we measure "BAR accuracy," the system will become a BAR mimicking machine. The Challenger says: the eval infrastructure will be captured by whatever metric is easiest to measure, not what matters.

### What the Challenger Rejects Entirely

- **Reject:** Generic tool schemas applied to narrative catalysts
- **Reject:** Explicit orchestration layered on top of EA-driven emergence
- **Reject:** State machines as the primary formalism for EA energy tracking
- **Reject:** Benchmark-style evals for bars-engine

### What the Challenger Keeps (With Modifications)

- **Keep:** Typed tool contracts — but as EA-aware contracts (input: EA state + narrative context, output: EA delta + narrative delta), not generic typed functions
- **Keep:** Orchestration awareness — but as "quest phase guards" not explicit workflow plans
- **Keep:** State machine for quest phase only — EA energy tracked separately as continuous state
- **Keep:** Eval — but measuring transformation outcomes, not task completion

---

## 🎭 Diplomat — Bridge and Harmonize

**Altimeter:** How do we bridge the generic agent engineering skills with bars-engine's actual architecture without losing what makes either work?

### The Bridge: EA-Native Tool Contracts

Generic tool design → **EA-aware tool contracts**

Instead of:
```
Input: string (player action)
Output: string (narrative response)
```

Do:
```
Input: { player_action, current_EA_state, quest_phase, EA_channel_triggered }
Output: { EA_delta, narrative_delta, next_quest_phase, transformation_quality }
```

The tool contract carries the EA context as first-class input/output. The tool isn't just "did it work" — it's "did the EA state move?"

### The Bridge: Workflow Orchestration → Quest Phase Guards

Instead of explicit workflow plans, add **phase entry/exit guards**:

```
QuestPhase.WANDERING
  entry: { EA_channels_active, allowed_tools }
  exit_conditions: { door_entered, NPC_approached, EA_threshold_crossed }
  exit_transitions: { QuestPhase.DOOR_ENCOUNTER, QuestPhase.NPC_DIALOGUE, QuestPhase.STUCK }

QuestPhase.DOOR_ENCOUNTER
  entry: { EA_channel_of_door, door_narrative_context }
  exit_conditions: { player_confirms_enter, EA_resistance_check }
  HITL_gate: { EA_channel == Metal/Fear && resistance > 7 } // hard block on high-fear doors
```

This is orchestration without a plan — it constrains transitions without prescribing them.

### The Bridge: HITL at the Right Point

Current 321 is: human processes emotion → agent acts.  
Bars-engine HITL should be: agent identifies high-stakes decision → flags for human → human approves/modifies → agent executes.

```
if (quest_move.EA_channel == Metal && quest_move.resistance > threshold) {
  escalate_to_human(quest_move, EA_state_snapshot)
  // agent pauses until human confirmed
}
```

### The Bridge: Eval Measuring What Matters

Instead of completion rate, measure:
- **EA movement:** Did the player's EA state actually shift during the quest?
- **Transformation quality:** Does the quest outcome reflect the player's meaning-making, not just the system's?
- **Narrative coherence:** Does the quest feel like it was earned, not assembled?

These map to the WAVE spiral (Wake/Clean/Grow/Show) — eval should measure WAVE progression, not benchmark scores.

---

## 🌊 Shaman — Shadow and Metaphysical

**Altimeter:** What is bars-engine afraid of? What shadows move through the system? What fails psychologically?

### The Shadow Beneath These Skills

**Fear of the system being "not real engineering."**

These 8 skills are the vocabulary of production-grade AI agent engineering. Learning them is implicitly an answer to "is bars-engine a real system?" The Shaman says: the desire to learn these skills is partly a developmental move (wanting to grow up) and partly a shadow move (wanting to be recognized as legitimate).

The shadow signal: "I need tool calling design so bars-engine is taken seriously as an agent system."  
The growth signal: "I need tool calling design so the system doesn't fail silently in production."

These are different motivations leading to the same skill list. The Shaman asks: which is driving the learning?

**Fear of emergence without accountability.**

EA-driven emergence is powerful but accountability-free. When a quest fails or a player has a bad experience, there's no trace of what happened. The Shaman says: we want these skills (especially evals and retry logic) partly because we want to be able to say "the system did X because Y, and we can prove it." That's a legitimate need. The shadow is when we let that need drive us toward over-engineering.

**Fear of the quest being too fragile.**

A quest that depends on emergence is fragile by design. If the EA state isn't right, the narrative doesn't land. The Shaman says: state machines and retry logic feel like they make the quest less fragile, but they might just make the fragility invisible. The quest fails differently, not less.

### What the Shaman Says to Keep

The Shaman's primary contribution: **EA energy is the real state.** Skills 4 (state machines) and 5 (retry logic) should be in service of protecting EA energy, not replacing it. The retry logic should answer: "did the EA state survive this failure, and can we recover it?" not "did the API call succeed?"

The Shaman also says: **human-in-the-loop is not a safety feature — it's part of the transformation.** The 321 process is valuable not because it prevents bad agent actions, but because it makes the human's transformation part of the quest loop. HITL is not a gate; it's a participation mechanism.

---

## 📖 Sage — Wisdom and Principle

**Altimeter:** What are the enduring principles that survive the analysis? What should we remember?

### Principles That Survive

**Principle 1: Bars-engine is an EA system with agent infrastructure, not an agent system with EA flavoring.**

Every skill in this list should be evaluated by whether it makes EA energy more inspectable and effective, not by whether it makes bars-engine look like a mainstream agent system. The architecture decision is EA-first, not agent-first.

**Principle 2: The gap is enforcement and observability, not pattern discovery.**

The Regent confirmed: bars-engine already has most of these patterns in embryonic form. The gap is that the patterns are implicit, not enforced, and not observable. Skill 1 (tool design) doesn't need new patterns — it needs typed enforcement on the DAOE adapter. Skill 2 (orchestration) doesn't need new workflow specs — it needs quest phase guards that are actually checked. Skill 3 (memory) doesn't need a new memory architecture — it needs the quest grammar context to be surfaced as named memory layers.

**Principle 3: Cost is narrative, not token count.**

The Regent said it: token cost ≠ narrative cost. A cost tracking system that only measures tokens will drive the wrong behavior. If cost tracking is added, it should measure EA movement per unit cost — did we produce transformation efficiently, not did we use few tokens.

**Principle 4: Eval must measure transformation, not completion.**

The Challenger was right: metrics drive behavior. Bars-engine eval infrastructure should measure WAVE progression (did the player Wake/Clean/Grow/Show through the quest), not quest completion rate. Completion is easy to measure; transformation is hard — but it's the only thing that matters.

**Principle 5: The human is part of the system, not a safety gate.**

HITL is most powerful when it makes the human's transformation visible and intentional, not when it blocks the agent. The 321 process is the right model — human processes, agent responds. The goal is not "human approves agent action" (that kills emergence). The goal is "human does their work, agent responds to that work."

### The Sage's Verdict

These 8 skills are the right skills to learn. But they must be learned EA-first, not agent-first. The question for each skill is not "how do I apply generic agent engineering pattern X?" but "how does EA-aware pattern X protect and accelerate transformation?"

---

## Synthesis: What to Take, Leave, and Map

### Take (Into Bars-Engine)

- **EA-aware tool contracts** (Skill 1, bridged via Diplomat)
- **Quest phase guards** (Skill 2, bridged from orchestration)
- **Named memory layers for quest context** (Skill 3, from current quest grammar)
- **QuestState enum with typed transitions** (Skill 4, limited application)
- **EA-surviving retry logic** (Skill 5, EA-state-aware circuit breakers)
- **WAVE-based eval harness** (Skill 6, transformation measurement)
- **EA-movement-per-cost tracking** (Skill 7, narrative cost, not token cost)
- **Participatory HITL** (Skill 8, 321 as participation, not gate)

### Leave (Discard or Defer)

- Generic tool schemas without EA context
- Explicit workflow orchestration plans
- State machines for EA energy (keep for quest phase only)
- Benchmark-style eval metrics
- Token-count cost tracking

### Map (Adapt Before Absorbing)

- Tool contracts → EA tool contracts (add EA state to input/output)
- Orchestration → phase guards (constrain transitions, don't prescribe them)
- State machines → QuestState enum + EA continuous state (dual-track)
- Retry logic → EA-aware recovery (preserve EA state across failures)
- HITL → participatory 321 (human transformation visible in loop)

---

## Next Steps (Actionable)

1. **Spec the EA-aware tool contract** — define the schema for an EA-tool-input and EA-tool-output; draft in `06 Specs/`
2. **Audit current DAOE adapter** — which methods have typed contracts, which don't, which need EA state added
3. **Define QuestState enum** — enumerate the phases, their entry/exit guards, and their EA prerequisites
4. **Design WAVE eval harness** — what does "quest completion with WAVE progression" look like as a test?
5. **Map 321 into bars-engine** — is 321 a quest phase, a tool, or a mode switch? Clarify its role in the quest loop

---

## Cross-References

- [[BARS-ENGINE-ACTIONS]] — where tool actions live
- [[BARS-ENGINE-LIB]] — where current infrastructure lives
- [[AI-AGENT-ARCHITECTURE]] — agent engineering framework we're growing into
- [[AGENTS]] — workspace agent rules (enforcement context)
- [[EA-Translator]] — EA channel system (energy economy)

---

*Analysis date: 2026-05-05 | Framework: 6 GM Faces | Status: READY*
