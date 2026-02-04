---
description: Multi-agent coordination framework using Roles (narrative lenses) and Playbooks (Kotter execution methods)
---

# Multi-Agent Coordination Guide

> *"The vibes must flow — sustainably."*

---

## 1. Philosophy

### Energy Over Speed

The goal of multi-agent development is **sustainable throughput**, not raw velocity.

```
Traditional:       You ←→ Codebase
                   (high cognitive load, context switching)

Multi-Agent:       You (Leader) ←→ [Agent A] [Agent B] [Agent C]
                   (strategic decisions)  (tactical execution)
```

**Energy costs shift from**:
- Execution → Coordination
- Remembering details → Defining boundaries
- Context switching → Review and approval

### Roles = Why, Playbooks = How

| Layer | Question | Answer |
|-------|----------|--------|
| **Role** | *What are we trying to achieve?* | Narrative orientation |
| **Playbook** | *How do we execute?* | Kotter stage energy |

---

## 2. The 5 Roles (Narrative Lenses)

Roles are **orientations toward the project** — the perspective from which work is approached.

| Role | Orientation | Focus | Key Question |
|------|-------------|-------|--------------|
| 🌱 **Rookie** | Dreaming, fresh eyes | QA, UX, onboarding | "Can a newbie have a good time?" |
| 🔧 **Engineer** | Problem-solving | Technical execution | "How do we make this work?" |
| 📜 **Veteran** | History, continuity | Maintaining context | "Is this consistent with what came before?" |
| 🎯 **Ace** | Impact, outcomes | Getting things done | "What difference does this make?" |
| 👑 **Leader** | Orchestration | Direction, decisions | "What should we build? Who does what?" |

> **Important**: Leader is always the developer (you). Agents can *support* Leader work, but final decisions flow through the human.

### When to Apply Each Role

| Situation | Role to Invoke |
|-----------|----------------|
| New user tests the app for the first time | 🌱 Rookie |
| Bug needs fixing, feature needs building | 🔧 Engineer |
| Checking if a change breaks existing patterns | 📜 Veteran |
| Shipping something that matters | 🎯 Ace |
| Deciding what to work on next | 👑 Leader |

---

## 3. The 8 Playbooks (Execution Methods)

Playbooks are **Kotter-aligned energies** — the *how* of execution. Each agent holds **one playbook (1:1)**.

| Playbook | Symbol | Kotter Stage | Energy | Module Affinity |
|----------|--------|--------------|--------|-----------------|
| **Thunder** | ⚡ | 1. Urgency | Spark, initiate | `/scripts/`, rapid prototypes |
| **Earth** | 🤝 | 2. Coalition | Connect, integrate | `/lib/`, shared utilities |
| **Heaven** | 👁 | 3. Vision | Architect, clarify | `/docs/`, schemas, types |
| **Lake** | 🎭 | 4. Communicate | Express, design | `/components/`, `/app/` |
| **Water** | 💧 | 5. Obstacles | Debug, infiltrate | `/actions/`, edge cases |
| **Fire** | 🔥 | 6. Wins | Deliver, complete | Tests, deployments |
| **Wind** | 🌬 | 7. Build On | Extend, spread | Cross-cutting features |
| **Mountain** | ⛰ | 8. Anchor | Stabilize, lock | Migrations, config, CI |

### Playbook Invocation

Ask: *"What stage of the Kotter cycle is this work in?"*

| If the work is about... | Invoke Playbook |
|-------------------------|-----------------|
| Starting something new | ⚡ Thunder |
| Getting buy-in, connecting systems | 🤝 Earth |
| Defining structure, architecture | 👁 Heaven |
| Making it beautiful, expressive | 🎭 Lake |
| Debugging, unblocking | 💧 Water |
| Shipping, completing | 🔥 Fire |
| Extending, spreading patterns | 🌬 Wind |
| Stabilizing, locking in | ⛰ Mountain |

---

## 4. Agent Identity = Role × Playbook

Every agent has a composite identity:

```
Agent Identity = Role (narrative lens) × Playbook (execution method)
```

### Examples

| Agent | Role | Playbook | Focus |
|-------|------|----------|-------|
| Onboarding QA | 🌱 Rookie | 🎭 Lake | Fresh eyes on UX/components |
| Bug Hunter | 🔧 Engineer | 💧 Water | Debugging actions |
| Architecture Guardian | 📜 Veteran | 👁 Heaven | Protecting schema consistency |
| Feature Shipper | 🎯 Ace | 🔥 Fire | Delivering complete features |
| System Integrator | 🔧 Engineer | 🤝 Earth | Connecting utilities |

---

## 5. Domain Precedence

When an agent needs to touch **another playbook's domain**:

### Rule 1: Leader Decides

The developer (Leader) can always authorize cross-domain work.

### Rule 2: Consult the Domain's Agent

If Leader isn't available, consult the agent whose playbook owns that domain.

| If touching... | Consult |
|----------------|---------|
| Architecture, schemas | 👁 Heaven |
| UI/UX components | 🎭 Lake |
| Shared utilities | 🤝 Earth |
| Stability, migrations | ⛰ Mountain |

### Handoff Protocol

```markdown
## Handoff: [Source Agent] → [Target Agent]

**Context**: [What was being worked on]
**Change needed in**: [Target's domain]
**Proposed change**: [What needs to happen]
**Rationale**: [Why this belongs to target]
```

---

## 6. Energy Optimization

### Parallel Work (Low Coordination Cost)

Safe to parallelize when agents work in **independent domains**:

| ⚡ Thunder (scripts) | 🎭 Lake (components) | ⛰ Mountain (config) |
|---------------------|---------------------|----------------------|
| Prototyping a script | Building a new component | Setting up CI |

### Serialize (High Coordination Cost)

Serialize when:
- Two agents touch the **same file**
- Work involves **shared state** (database, global context)
- Changes are **architecturally significant** (👁 Heaven's domain)

### Developer as Conductor

```
You (Leader)
    │
    ├── Define work boundaries
    ├── Assign agents (Role × Playbook)
    ├── Review outputs
    └── Resolve conflicts
```

Your energy goes to **orchestration**, not **execution**.

---

## 7. Terminology Sync

All agents must use canonical terminology from [terminology.md](file:///Users/test/.gemini/antigravity/bars-engine/web/.agent/context/terminology.md):

| Canonical | Context |
|-----------|---------|
| **Vibeulon** | The currency (prose uses Vibeulon, code uses `vibulon`) |
| **Quest** | User-created mission (`CustomBar` in code) |
| **Bar** | System/I Ching hexagram (1-64) |
| **Move** | Archetype action (⚡🤝👁🎭💧🔥🌬⛰) |

---

## 8. Quick Reference

### Role × Playbook Matrix

|  | ⚡ | 🤝 | 👁 | 🎭 | 💧 | 🔥 | 🌬 | ⛰ |
|--|---|---|---|---|---|---|---|---|
| 🌱 Rookie | Explore | Onboard | Learn | Test UX | Find bugs | Quick wins | Discover | Stabilize |
| 🔧 Engineer | Prototype | Integrate | Design | Build | Debug | Ship | Extend | Configure |
| 📜 Veteran | Recall | Connect | Guard | Document | Investigate | Validate | Spread | Anchor |
| 🎯 Ace | Spark | Rally | Decide | Express | Overcome | Deliver | Scale | Lock |
| 👑 Leader | Prioritize | Align | Vision | Communicate | Unblock | Celebrate | Grow | Solidify |

### Domain Quick Map

| Directory | Primary Playbook |
|-----------|-----------------|
| `/scripts/` | ⚡ Thunder |
| `/lib/` | 🤝 Earth |
| `/docs/`, types, schemas | 👁 Heaven |
| `/components/`, `/app/` | 🎭 Lake |
| `/actions/` | 💧 Water |
| Tests, deployments | 🔥 Fire |
| Cross-cutting features | 🌬 Wind |
| Migrations, config, CI | ⛰ Mountain |
