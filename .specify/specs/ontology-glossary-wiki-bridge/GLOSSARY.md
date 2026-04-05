# Ontology glossary — index for wiki & compost

**Purpose:** Stable term IDs for wiki stubs, OpenAPI copy, GPT context, and player handbook excerpts.  
**Rule:** Prefer these strings in **new** UI/docs; legacy routes may keep `/conclave/*` until CHS migration.

| term_id | Canonical term | Short definition | Prisma / code anchors | wiki_slug (suggested) |
|---------|----------------|------------------|------------------------|------------------------|
| `platform` | BARS Engine | The product grammar (BARs, quests, permissions) — not an organization. | Repo root, `CLAUDE.md` | `wiki/glossary/bars-engine` |
| `db_instance_ops` | Instance (operational) | **The DB row** `instances.*`: membership, money, stewardship — **not** the mythic “story world” by itself. | `Instance`, `InstanceMembership` | `wiki/glossary/instance-operations` |
| `story_world_layer` | Story world (layer) | **Flavor & immersion** applied **on top of** the operational Instance — **not** a second `Instance` row. Nations/archetypes *as fiction*, Conclave copy, kernel text. | `Instance.narrativeKernel`, `storyBridgeCopy`; see [STORY_WORLD_LAYER.md](./STORY_WORLD_LAYER.md) | `wiki/glossary/story-world-layer` |
| `story_engine` | Story engine | Subsystems that drive **immersion** (EA, Conclave rail, GM-face moves) — **optional** relative to core BAR/quest routing. | `src/lib/ontology/content-layer.ts` `StoryEngineSubsystem` | `wiki/glossary/story-engine` |
| `instance` | Instance | Top-level **organizational / campaign container** in data; one row in `instances`; members via `InstanceMembership`. | `Instance`, `InstanceMembership` | `wiki/glossary/instance` |
| `instance_slug` | Instance slug | URL-safe key for an instance (e.g. `bruised-banana-house`). | `Instance.slug` | `wiki/glossary/instance-slug` |
| `campaign_ref` | campaignRef | String namespace linking quests, adventures, gameboard rows to a **campaign initiative** (e.g. `bruised-banana`). Not a full Campaign table. | `CustomBar.campaignRef`, `Instance.campaignRef`, `Adventure.campaignRef` | `wiki/glossary/campaign-ref` |
| `campaign_product` | Campaign (product) | **Bounded initiative** inside an org: may be modeled as an **Instance**, a **campaignRef slice**, or both — **not** always one row. | See `instance`, `campaign_ref`; future `Campaign` model TBD | `wiki/glossary/campaign` |
| `subcampaign` | Sub-campaign | Nested initiative under a parent: **`Instance.parentInstanceId`** or domain-keyed ref (see CSC spec). | `Instance.parentInstanceId`, `childInstances` | `wiki/glossary/sub-campaign` |
| `conclave_rail` | Conclave (legacy rail) | **`/conclave/*` story-shaped entry**; **legacy** parallel to `ref` + hub/spoke; NPC/onboarding flows. Do **not** treat as the only “campaign.” | `src/app/conclave/*`, [CHS § Conclave](../campaign-hub-spoke-landing-architecture/spec.md#conclave-as-legacy-campaign-entry) | `wiki/glossary/conclave` |
| `narrative_overlay` | Narrative overlay | **Flavor layer** (lore, kernel, bridge copy) attached to instance/campaign/quest — **metadata v1**, not a separate table. | `Instance.narrativeKernel`, `storyBridgeCopy`, `wakeUpContent`, `showUpContent`, `CustomBar.watering*` | `wiki/glossary/narrative-overlay` |
| `quest_bar` | Quest (playable) | A **quest** players pick up: **`CustomBar`** row used as quest. | `CustomBar`, `PlayerQuest` | `wiki/glossary/quest-bar` |
| `quest_grammar` | Quest (grammar tree) | **Prompt / grammar** quest nodes — **`Quest`** model; different from quest_bar. | `Quest` | `wiki/glossary/quest-grammar` |
| `bar` | BAR | Player-authored **tension / signal** object; may become quest or feed campaigns. | `CustomBar` (general) | `wiki/glossary/bar` |
| `hub_spoke` | Hub & spoke | **Campaign hub** + **spokes** (CHS): deck topology, portal CYOA, milestone spine. | `Instance.campaignHubState`, `CampaignDeckTopology`, CHS spec | `wiki/glossary/hub-spoke` |
| `steward` | Steward / owner | Campaign/instance **governance**: `InstanceMembership.roleKey` (e.g. owner, steward) + global admin. | `InstanceMembership`, `playerCanEditCampaignAdventure` | `wiki/glossary/steward` |
| `membership` | Instance membership | Player ↔ instance link; roles for stewardship. | `InstanceMembership` | `wiki/glossary/instance-membership` |
| `provenance` | Provenance | Lineage: creator stamps, `campaignRef`, `collapsedFromInstanceId`, `sourceBarId`, PSS fields. | Various on `CustomBar` | `wiki/glossary/provenance` |
| `bar_quest_link` | Bar–quest link | Persisted suggestion **`BarQuestLink`** from BAR → quest catalog row. | `BarQuestLink` | `wiki/glossary/bar-quest-link` |
| `campaign_draft` | Campaign draft | Braided **`CampaignDraft`** (playerArc ∧ campaignContext). | `CampaignDraft` | `wiki/glossary/campaign-draft` |
| `lore_tifact` | Lore-tifact | **Blessed** content artifact (narrative bridge spec); overlaps `BlessedObjectEarned` / reliquary direction. | TBD implementation | `wiki/glossary/lore-tifact` |
| `extraction_ritual` | Extraction ritual | **EXTRACTION_RITUAL** move: interview → BAR[] / quest[] / draft (narrative bridge). | Future / Shadow321-adjacent | `wiki/glossary/extraction-ritual` |

## Compost rules

1. **New wiki page:** start from one row; expand in wiki with **Examples (Bruised Banana)** section.  
2. **OpenAPI:** import definition from **Short definition**; add `x-gm-faces` hints only where bar-forge style applies.  
3. **Breaking rename:** update this table **in the same PR** as code when changing user-visible ontology.

## See also

- [plan.md](./plan.md) — gap summary  
- [COPY_VIOLATIONS_INVENTORY.md](./COPY_VIOLATIONS_INVENTORY.md) — phrase fixes  
- [NARRATIVE_BRIDGE_SIX_FACE.md](./NARRATIVE_BRIDGE_SIX_FACE.md) — bridge spec analysis  
