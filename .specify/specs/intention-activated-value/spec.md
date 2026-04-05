# Spec: Intention-Activated Value (D)

## Purpose

Document the philosophy that **value flows with intention** in the BARS Engine. Intentions map to allyship domains (WHERE); when players declare an intention, they activate value in the system. This doc anchors the conceptual model for domain-aligned intentions (U spec), quest routing, and the vibeulon economy.

## Rationale

- **Game language consistency**: Players choose intentions during onboarding; those intentions should connect clearly to domains, quests, and value creation.
- **Design clarity**: Contributors need a shared understanding of why intention options are domain-keyed and how value moves through the pipeline.
- **Dependency**: U (Domain-Aligned Intentions) is implemented; D provides the philosophy layer that U rests on.

## Scope

### In scope

| Deliverable | Description |
|-------------|-------------|
| Philosophy doc | `docs/INTENTION_ACTIVATED_VALUE.md` — intentions map to domains; value flows with intention |
| Spec | This spec; link from BACKLOG.md |
| Cross-references | terminology.md, allyship-domain-definitions, kotter-by-domain |

### Out of scope

- Schema changes (U already stores intention in quest inputs / storyProgress)
- New intention options (U defines them)
- Admin UI for intentions

## Conceptual Model

- **Intention** = What the player commits to for their journey; stored from orientation quest completion.
- **Allyship domain (WHERE)** = The emergent problem type: GATHERING_RESOURCES, DIRECT_ACTION, RAISE_AWARENESS, SKILLFUL_ORGANIZING.
- **Intention-activated value** = When a player declares an intention, they activate value in the system. Value flows through: intention → commitment → action → quest completion → vibeulons.

Intentions map to domains (or are cross-domain, e.g. "Following my curiosity"). Domain-aligned intentions surface quests and campaigns that match WHERE the player wants to contribute.

## Functional Requirements

- **FR1**: A philosophy doc MUST exist at `docs/INTENTION_ACTIVATED_VALUE.md` explaining intention-activated value.
- **FR2**: The doc MUST state that intentions map to allyship domains and that value flows with intention.
- **FR3**: The doc MUST reference U (domain-aligned intentions), allyship domains, and the 4 moves (personal throughput).
- **FR4**: BACKLOG.md MUST link D to this spec.

## Reference

- U spec: [domain-aligned-intentions/spec.md](../domain-aligned-intentions/spec.md)
- Allyship domains: [.specify/memory/allyship-domain-definitions.md](../../memory/allyship-domain-definitions.md)
- Kotter by domain: [.agent/context/kotter-by-domain.md](../../../.agent/context/kotter-by-domain.md)
- Bruised Banana analysis: [bruised-banana-house-integration/ANALYSIS.md](../bruised-banana-house-integration/ANALYSIS.md)
