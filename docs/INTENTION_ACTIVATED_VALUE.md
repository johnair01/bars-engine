# Intention-Activated Value

**Philosophy**: Value flows with intention. When players declare what they intend to do, they activate value in the system.

---

## Core Idea

In the BARS Engine, **intention** is not passive. Declaring an intention—"I intend to gather resources that support the residency," "I intend to follow my curiosity," "I intend to take direct action"—activates a pipeline of value. The system responds by surfacing quests, campaigns, and opportunities aligned with that intention.

**Value flows with intention.** The clearer the intention, the more the system can route value (quests, vibeulons, BARs, campaigns) toward the player and the cause.

---

## Intentions Map to Domains

Intentions are keyed by **allyship domain** (WHERE):

| Domain | Emergent Problem | Example Intention |
|--------|------------------|-------------------|
| **GATHERING_RESOURCES** | Need external or inner resources | "I intend to contribute funds, time, or materials that strengthen the collective." |
| **DIRECT_ACTION** | Action needs doing; obstacles in the way | "I intend to take direct action that moves the work forward." |
| **RAISE_AWARENESS** | People aren't aware of what's available | "I intend to raise awareness about the residency and its mission." |
| **SKILLFUL_ORGANIZING** | No systems exist; the problem *is* lack of organization | "I intend to organize and coordinate so the engine runs smoothly." |
| *(cross-domain)* | Opt-out; exploratory | "Following my curiosity." |

When a player chooses a domain-aligned intention, the system can:
- Surface quests with matching `allyshipDomain`
- Prioritize campaigns that need that domain
- Route vibeulons and appreciation toward aligned work

When a player chooses "Following my curiosity," they remain open; the system does not filter by domain.

---

## The Value Pipeline

Value moves through the pipeline:

```
Intention → Commitment → Action → Quest Completion → Vibeulons
```

1. **Intention** — Player declares what they intend (orientation quest, dashboard update).
2. **Commitment** — Stored in `storyProgress` or quest inputs; visible on dashboard.
3. **Action** — Player plays quests, completes BARs, contributes to campaigns.
4. **Quest completion** — System mints vibeulons; value is realized.
5. **Vibeulons** — Currency flows; can be given, spent, or held.

**Misaligned intention** = value gets stuck. A player who intends to gather resources but only sees direct-action quests may disengage. Domain-aligned intention options (U spec) reduce that friction.

---

## Personal Throughput (4 Moves)

Intention activates *what* the player commits to. The **4 moves** (Wake Up, Clean Up, Grow Up, Show Up) are *how* they get it done:

- **Wake Up** — See more of what's available.
- **Clean Up** — Get more emotional energy; unblock vibeulon-generating actions.
- **Grow Up** — Increase skill capacity.
- **Show Up** — Do the work of completing quests.

Intention + moves = personal throughput. Value flows when both are aligned.

---

## Implementation

- **Domain-aligned intentions**: [.specify/specs/domain-aligned-intentions/spec.md](../.specify/specs/domain-aligned-intentions/spec.md) (U)
- **Intention options**: `src/lib/intention-options.ts`
- **Allyship domain definitions**: [.specify/memory/allyship-domain-definitions.md](../.specify/memory/allyship-domain-definitions.md)
- **Kotter by domain**: [.agent/context/kotter-by-domain.md](../.agent/context/kotter-by-domain.md)

---

## Reference

- Bruised Banana analysis: [.specify/specs/bruised-banana-house-integration/ANALYSIS.md](../.specify/specs/bruised-banana-house-integration/ANALYSIS.md)
- Terminology: [.agent/context/terminology.md](../.agent/context/terminology.md)
