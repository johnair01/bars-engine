# Campaign ontology glossary

**Tracks:** [GitHub issue #39](https://github.com/johnair01/bars-engine/issues/39) · Spec kit [.specify/specs/campaign-ontology-alignment/](../../.specify/specs/campaign-ontology-alignment/)

Single vocabulary for specs, UI, and data modeling. **Prisma names** are cited where they exist today; this glossary is **product truth**—schema may lag until migration phases land.

---

## Instance

**Definition:** The durable **world / organization / venue** container: members, shared maps or lobbies, governance context, **hosted campaigns**, and world-scoped events or artifacts.

**Not:** A substitute for “the campaign players are in.” Players participate in **campaigns inside** an instance.

**In-repo (today):** `Instance` in [`prisma/schema.prisma`](../../prisma/schema.prisma) — often holds slug-like identifiers used alongside or instead of a separate `Campaign` row in some flows.

**Examples:** “Bruised Banana Organization” as one instance hosting multiple initiatives.

---

## Campaign

**Definition:** The canonical **initiative** unit **inside** an instance: purpose, copy, stewards, narrative settings, invitations, optional progression topology, and outputs (quests, BARs, artifacts).

**Question this answers:** “What initiative is this work for?”

**In-repo (today):** `Campaign` model; many runtime paths still key off string **`campaignRef`** (often aligned with slug). See [campaign-ontology-architecture-note.md](./campaign-ontology-architecture-note.md) and [`docs/CAMPAIGNREF_INVENTORY.md`](../CAMPAIGNREF_INVENTORY.md).

---

## Subcampaign

**Definition:** A **child initiative**: a campaign nested under another campaign, with optional inheritance of defaults and explicit overrides (stewardship, copy, narrative config, topology, eligibility).

**In-repo (today):** `Campaign.parentCampaignId` → self-relation `parentCampaign` / `childCampaigns` (apply migration locally: `npx tsx scripts/with-env.ts \"npx prisma migrate deploy\"`). Helpers: [`src/lib/campaign-hierarchy.ts`](../../src/lib/campaign-hierarchy.ts), CRUD in [`src/actions/campaign-crud.ts`](../../src/actions/campaign-crud.ts).

**Examples:** Under “Mastering the Game of Allyship”: Book, Card Game, Nonprofit. Under “Bruised Banana Residency”: Resource Gathering, Residency Operations, Story Artifact Production.

---

## CampaignSlot

**Definition:** **Content and navigation hierarchy** inside a campaign: branches, sub-branches, adventure clusters, and local navigation—not the primary **governance / ownership** tree for sub-initiatives.

**Rule:** Do not treat the slot tree alone as “who owns this initiative.” Use **Campaign / Subcampaign** for that.

**In-repo (today):** `CampaignSlot` in Prisma.

---

## Hub, spoke, and node (progression topology)

**Definition:** Optional **progression grammar** attached to a campaign:

| Term | Meaning |
|------|--------|
| **Hub** | Shared orientation, return point, or portal surface—social or navigational home base for a campaign’s runs. |
| **Spoke** | A guided arc, curriculum arm, or deep run players enter from the hub. |
| **Node** | A threshold: unlock, seed point, milestone surface, or place where **new structure** (e.g. a sub-initiative) may be introduced after maturity or capacity constraints. |

**Rule:** Hub/spoke/node describes **how** players move through an initiative; it does not replace the definition of **Campaign**.

**In-repo (today):** Models such as `CampaignPortal`, `SpokeSession`, deck/period/milestone-related tables—alignment to a single canonical campaign record is an explicit migration goal (ontology Phase 4).

**Onboarding metaphor (non-normative):** Like a bicycle wheel: the rim and spokes are built first; the **hub** ties spokes and transfers load—it is the **connection / return** more than the place where all “motion” happens. Use this only in player-facing or steward copy, not as a schema naming law.

---

## campaignRef (string)

**Definition:** A **string identifier** (often slug-shaped) used in URLs, legacy queries, `CustomBar`, and many `where` clauses.

**Roles today (non-exclusive):** routing convenience, compatibility alias for campaign slug, content scoping, progression keys.

**Direction of travel:** Keep where needed for URLs and migration; converge **authoritative** progression and governance on **`campaignId`** where feasible. Classified inventory: [`docs/CAMPAIGNREF_INVENTORY.md`](../CAMPAIGNREF_INVENTORY.md).

---

## campaignId

**Definition:** Stable primary key for a `Campaign` row—**canonical** initiative identity in the database.

**Use:** Prefer for new internal joins and provenance when the row exists; resolve from `campaignRef` at boundaries when required.

---

## Spoke tree vs initiative tree

**Initiative tree:** Parent/child **Campaign** (ontology spec).

**Spoke tree:** Nesting of **spokes** and sub-hubs inside a campaign hub (see [.specify/specs/campaign-recursive-nesting/spec.md](../../.specify/specs/campaign-recursive-nesting/spec.md), `parentSpokeBinding` and related behavior).

Both may coexist during migration; feature specs must state which tree owns a given requirement.

---

## Narrative layer

**Definition:** Themes, sovereignty, lore, and copy (`CampaignTheme`, narrative config, story bridges, etc.).

**Rule:** Narrative **enriches** structure; it does not replace **Instance / Campaign / Subcampaign / Slot** as structural truth.

---

## See also

- [`docs/CAMPAIGNREF_INVENTORY.md`](../CAMPAIGNREF_INVENTORY.md) — string usage index + migration map ([issue #40](https://github.com/johnair01/bars-engine/issues/40))
- [campaign-ontology-architecture-note.md](./campaign-ontology-architecture-note.md) — Bruised Banana example and diagrams
- [.specify/specs/campaign-ontology-alignment/spec.md](../../.specify/specs/campaign-ontology-alignment/spec.md)
- [.specify/specs/campaign-lifecycle/spec.md](../../.specify/specs/campaign-lifecycle/spec.md)
- [.specify/specs/campaign-recursive-nesting/spec.md](../../.specify/specs/campaign-recursive-nesting/spec.md)
