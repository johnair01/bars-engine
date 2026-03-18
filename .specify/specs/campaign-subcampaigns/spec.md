# Spec: Campaign Subcampaigns

## Purpose

Add **subcampaigns** as children of top-level campaigns, keyed by allyship domain. Each subcampaign gets its own orientation quest(s) and Adventure content. This avoids multiple full copies of a campaign; instead, one campaign branches by domain with domain-specific orientation.

**Problem**: Without subcampaigns, we'd create separate campaign variants (e.g. bruised-banana-raise-awareness, bruised-banana-direct-action) — duplicated structure, hard to maintain. Subcampaigns let one campaign have domain-scoped branches with inherited context.

**Practice**: Spec kit first. Schema + domain rules + orientation wiring.

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Subcampaign = child of campaign, keyed by domain** | Each subcampaign is identified by parent campaignRef + allyship domain. |
| **Exclude parent domain** | If top-level campaign is Gathering Resources, subcampaigns are Raise Awareness, Direct Action, Skillful Organizing — not Gathering Resources. |
| **Direct Action inheritance** | Direct Action subcampaign's available quests/actions come from the parent campaign's domain (e.g. "Direct Action, Gather Resource flavored"). |
| **One orientation per subcampaign** | Each subcampaign has its own Adventure and orientation quest thread. |
| **Nesting** | Subcampaigns can nest further; depth limit TBD (e.g. max 2–3 levels). |
| **Template generation** | Subcampaign-scoped: "generate orientation for bruised-banana + Direct Action". |

---

## Conceptual Model

### Top-Level Campaign

- Has one **primary allyship domain** (e.g. Bruised Banana = Gathering Resources).
- Stored: `campaignRef` (slug), `primaryDomain` (allyship domain).

### Subcampaign

- Child of a campaign.
- **Domain** = one of the three allyship domains that are **not** the parent's domain.
- **Identity**: `parentCampaignRef` + `domain` (e.g. bruised-banana + DIRECT_ACTION).

### Example: Bruised Banana

| Node | Type | Domain | Notes |
|------|------|--------|-------|
| bruised-banana | Campaign | GATHERING_RESOURCES | Top-level |
| bruised-banana | Subcampaign | RAISE_AWARENESS | Orientation for Raise Awareness path |
| bruised-banana | Subcampaign | DIRECT_ACTION | Orientation for Direct Action; quests inherit from Gather Resources |
| bruised-banana | Subcampaign | SKILLFUL_ORGANIZING | Orientation for Skillful Organizing path |

### Direct Action Inheritance

For a **Direct Action** subcampaign: the concrete quests/actions in the campaign deck come from the **parent campaign's domain**. So Bruised Banana (Gathering Resources) → Direct Action subcampaign has "Gathering Resources flavored" direct actions — the *what* (resources) comes from Gather, the *how* (direct action) is the subcampaign domain.

---

## User Story

**As a** player who chose a domain in the campaign CYOA, **I want** to land in that domain's orientation quest thread, **so that** I'm oriented to the subcampaign (Raise Awareness, Direct Action, or Skillful Organizing) I selected.

**As an** admin, **I want** to generate orientation content per subcampaign (e.g. bruised-banana + Direct Action), **so that** each domain path has tailored content without duplicating the whole campaign.

---

## Functional Requirements

### Phase 1: Schema + Domain Rules

- **FR1**: Add `Campaign` model (or extend Instance/Adventure) to represent campaign hierarchy:
  - `id`, `slug` (campaignRef), `parentId?` (null = top-level), `primaryDomain` (allyship domain for top-level).
  - Subcampaign: `parentId` set, `domain` = one of the three non-parent domains.
- **FR2**: `getSubcampaignDomains(parentDomain: string): string[]` — returns the three allyship domains excluding the parent. (GATHERING_RESOURCES → [RAISE_AWARENESS, DIRECT_ACTION, SKILLFUL_ORGANIZING])
- **FR3**: Subcampaign identity: `campaignRef` + `subcampaignDomain` (e.g. `bruised-banana:DIRECT_ACTION`). Used in URLs, Adventure.campaignRef, quest threads.

### Phase 2: Orientation Wiring

- **FR4**: Each subcampaign has its own Adventure (orientation content). `Adventure.campaignRef` = compound ref (e.g. `bruised-banana:DIRECT_ACTION`) or separate `subcampaignDomain` field.
- **FR5**: When player chooses domain in CYOA, assign orientation thread for that subcampaign. `assignOrientationThreads` (or equivalent) uses `campaignRef` + chosen domain to find the right thread.
- **FR6**: Direct Action subcampaign: campaign deck quests filtered or tagged by parent domain. Deck logic: when subcampaign is Direct Action, quests are "direct actions in context of parent domain."

### Phase 3: Template Generation

- **FR7**: Template generation is subcampaign-scoped. `generateFromTemplate(templateId, { campaignRef, subcampaignDomain? })`. When `subcampaignDomain` provided, creates orientation Adventure for that subcampaign.
- **FR8**: Admin UI: when generating for campaign, optionally select subcampaign domain (or "top-level").

### Phase 4: Nesting (Future)

- **FR9**: Subcampaigns can nest. Depth limit: max 2–3 levels. Validation: no cycle; domain exclusion applies at each level (child cannot repeat parent's domain).

---

## Domain Exclusion Rule

```
ALL_DOMAINS = [GATHERING_RESOURCES, DIRECT_ACTION, RAISE_AWARENESS, SKILLFUL_ORGANIZING]

subcampaignDomains(parentDomain) = ALL_DOMAINS.filter(d => d !== parentDomain)
```

So:
- Parent = GATHERING_RESOURCES → subcampaigns: DIRECT_ACTION, RAISE_AWARENESS, SKILLFUL_ORGANIZING
- Parent = DIRECT_ACTION → subcampaigns: GATHERING_RESOURCES, RAISE_AWARENESS, SKILLFUL_ORGANIZING
- Parent = RAISE_AWARENESS → subcampaigns: GATHERING_RESOURCES, DIRECT_ACTION, SKILLFUL_ORGANIZING
- Parent = SKILLFUL_ORGANIZING → subcampaigns: GATHERING_RESOURCES, DIRECT_ACTION, RAISE_AWARENESS

---

## Direct Action Inheritance (Semantics)

For a **Direct Action** subcampaign under a parent with domain D:

- **Direct Action** = the *how* (action needs doing; removing obstacles).
- **Parent domain D** = the *what* (context of the action).
- **Campaign deck**: quests that are Direct Action type *in the context of* D. Example: Bruised Banana (Gather) → Direct Action subcampaign has quests like "Gather resources by taking direct action" (e.g. organize a donation drive, clear a blocker for a resource).

Implementation: tag or filter quests by `allyshipDomain: DIRECT_ACTION` and `parentDomainContext: GATHERING_RESOURCES` (or equivalent).

---

## Non-Functional Requirements

- **Backward compatibility**: Existing campaigns (bruised-banana, wake-up) continue to work. Top-level = no subcampaignDomain.
- **Migration**: Bruised Banana gets `primaryDomain: GATHERING_RESOURCES`; subcampaigns created for RAISE_AWARENESS, DIRECT_ACTION, SKILLFUL_ORGANIZING when orientation content exists.

---

## References

- [conceptual-model.md](../../.specify/memory/conceptual-model.md) — allyship domains
- [game-master-template-content-generation](../game-master-template-content-generation/spec.md) — template generation, orientation
- [bruised-banana-onboarding-flow](../bruised-banana-onboarding-flow/spec.md) — campaign flow
