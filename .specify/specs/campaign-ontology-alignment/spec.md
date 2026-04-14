# Spec: Campaign Ontology Alignment (Instance → Campaign → Subcampaign)

## Purpose

Re-center product and repository semantics so **Instance**, **Campaign**, **Subcampaign**, **CampaignSlot**, and **hub/spoke/node progression** have one authoritative meaning. This reduces spec translation cost, prevents wiring features to the wrong layer, and aligns runtime identity (`campaignRef` strings vs canonical `Campaign` records) with the intended vision.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Problem

The codebase already has instances, campaigns, slots, hub/spoke models, and narrative config—but **campaign meaning is split** across `Instance`, `Campaign`, `campaignRef`, and `CampaignSlot`. Authors cannot answer “what is a campaign?” from a single source of truth.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Instance | Durable **world / organization / venue** container: members, shared maps, governance context, campaigns, world-scoped events. |
| Campaign | Canonical **initiative** unit inside an instance: purpose, copy, stewards, narrative settings, invitations, topology (optional), artifacts/quests/BARs. |
| Subcampaign | **Child campaign** via parent relation on `Campaign`; may inherit defaults and override stewardship, copy, narrative, topology, eligibility. |
| CampaignSlot | **Content / navigation hierarchy** inside a campaign (branches, adventure clusters)—not the primary initiative ownership tree. |
| Hub / Spoke / Node | **Progression topology** attached to a campaign—not the definition of “campaign.” |
| Narrative layer | Flavor and sovereignty (`CampaignTheme`, narrative config, etc.) **enriches** structure; it does not replace canonical initiative structure. |
| `campaignRef` | May remain as **routing slug / compatibility**; progression and governance should converge on **canonical `campaignId`** where feasible. |
| Relation to spoke nesting | [.specify/specs/campaign-recursive-nesting/spec.md](../campaign-recursive-nesting/spec.md) defines **spoke-tree** behavior and `parentSpokeBinding`. This spec defines **initiative tree** on `Campaign`. During migration, both may apply; specs and code must document which tree owns a given concern. |

## Conceptual Model

| Dimension | In This Spec |
|-----------|----------------|
| **WHO** | Instance members; campaign stewards at each initiative depth |
| **WHAT** | Initiative containers, content slots, progression topology |
| **WHERE** | Instance → campaigns → optional subcampaigns; slots under a campaign |
| **Energy** | BARs and quests attach to the initiative that owns them (tree-aware provenance target state) |
| **Personal throughput** | Unchanged at player level; structure affects *where* quests live |

### Canonical example (Bruised Banana)

- **Instance:** Bruised Banana Organization  
- **Campaigns:** Residency, Mastering the Game of Allyship, Gather Resources, Raise Awareness  
- **Subcampaigns:** e.g. under MTGOA — Book, Card Game, Nonprofit; under Residency — Resource Gathering, Operations, Story Artifact Production  
- **CampaignSlot:** organizes adventures/branches *within* each campaign  
- **Hub/spoke:** optional per-campaign progression layer  

## Gap Analysis (repo-aligned)

| ID | Current | Needed |
|----|---------|--------|
| A | Flat `Campaign` | Parent-child hierarchy on `Campaign` |
| B | `Instance` mixes org and campaign-runtime identity | Re-center instance as container; campaign owns initiative runtime concerns |
| C | Identity split: `Campaign` vs `campaignRef` | Canonical campaign record + progressive reduction of string-only semantics |
| D | Hub/spoke split across surfaces | Campaign as primary owner of progression topology |
| E | Weak nested stewardship | Explicit stewards / roles per campaign depth |
| F | Fragmented provenance | Campaign-tree-aware lineage for BARs, quests, artifacts |

## Phased Delivery (non-greenfield)

### Phase 1 — Semantic clarification

- Glossary + architecture note; audit `campaignRef` usage (classify: canonical identity, routing, content grouping, progression, legacy).

### Phase 2 — Campaign hierarchy (schema)

- `parentCampaignId`, self-relations; query siblings/children; child override rules for copy/config.

### Phase 3 — Stewardship depth

- Owner, co-owner, steward, reviewer; inheritance vs override at child level.

### Phase 4 — Re-anchor progression to Campaign

- Audit: `CampaignDeckCard`, `CampaignPeriod`, `CampaignPortal`, `SpokeSession`, milestones, contributions—`campaignId` or resolvable campaign context.

### Phase 5 — Preserve CampaignSlot role

- Document-only guardrails: slot tree ≠ governance tree.

### Phase 6 — Tree-aware provenance

- Query lineage: instance → campaign → child → spoke/session as applicable.

## Functional Requirements

- **FR1**: Published glossary defines Instance, Campaign, Subcampaign, CampaignSlot, hub/spoke/node in one place.
- **FR2**: `campaignRef` audit produces a migration map (which call sites move to `campaignId` first).
- **FR3**: Schema supports parent/child campaigns with acceptance criteria from Phase 2 (see ontology issue doc).
- **FR4**: No feature treats `CampaignSlot` as the sole stand-in for subcampaign governance after Phase 2 ships.

## Dependencies

- [.specify/specs/campaignref-inventory-audit/spec.md](../campaignref-inventory-audit/spec.md) — classified `campaignRef` map and regen script ([issue #40](https://github.com/johnair01/bars-engine/issues/40))
- [.specify/specs/campaign-lifecycle/spec.md](../campaign-lifecycle/spec.md) — lifecycle, composting, clocks (orthogonal; uses `campaignRef` today—note alignment).
- [.specify/specs/campaign-recursive-nesting/spec.md](../campaign-recursive-nesting/spec.md) — deep spoke nesting; must stay consistent with initiative tree.

## References

- **Issue #39 (Phase 1 docs):** [Campaign ontology glossary](../../../docs/architecture/campaign-ontology-glossary.md) · [Architecture note (Bruised Banana)](../../../docs/architecture/campaign-ontology-architecture-note.md)
- Conclave source: campaign ontology gap document (Construc conclave bundle).
- Prisma workflow: [.agents/skills/prisma-migration-discipline/SKILL.md](../../../.agents/skills/prisma-migration-discipline/SKILL.md)

## Definition of Done (program level)

The program is complete when the repo can model (without hacks) multi-campaign instances, nested child campaigns, per-level stewards, optional hub/spoke per campaign, content trees via `CampaignSlot`, and queryable lineage—**and** a new author can answer “what is a campaign?” from this spec plus glossary.
