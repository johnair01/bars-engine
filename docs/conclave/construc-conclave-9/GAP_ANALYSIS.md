# Gap analysis: Construc Conclave (9) vs bars-engine

Compares the imported bundle to **existing** specs and code. **New spec kits** capture net-new proposed work; **covered** items point to existing authority.

---

## 1. Book OS (full + v1 cursor)

### Proposed
- Governed manuscript authoring: `BookSection`, sources, canon/style rules, runs, approval, BAR links, context pack, ChatGPT draft push, admin UI under `/admin/books/.../sections`.

### Already in repo
- `Book`, extraction, `book-analyze`, `book-to-thread`, Books Context API, admin pipeline ([`src/actions/books.ts`](../../../src/actions/books.ts), etc.) — **ingestion → gameplay**, not **living manuscript scaffold**.

### Gap
- No `BookSection` (or equivalent) with draft/approved split, `SectionRun`, `ApprovalEvent`, `SectionBARLink`, or section context-pack API.
- No admin section map / intake flows as described in [book_os_v1_cursor_spec.md](./book_os_v1_cursor_spec.md).

### Spec kit
- **[`.specify/specs/book-os-v1-authoring/`](../../../.specify/specs/book-os-v1-authoring/)** — implementation authority for v1.
- [book_os_full_spec.md](./book_os_full_spec.md) — **conceptual** BookProject / agent roles; fold into later phases or agent design, not duplicate Prisma from cursor spec on day one.

### Related
- [.specify/specs/book-cyoa-stewardship/](../../../.specify/specs/book-cyoa-stewardship/) — stewardship / 1st-party pilot; Book OS is **authoring + retrieval governance**, complementary.

---

## 2. Pixel identity system v0 + humanoid_v1

### Proposed
- **CharacterIdentity** → visual tokens → layered composition → sprite output; emotional/BAR overlays; AI pipeline with human canon; asset registry layout.
- **humanoid_v1**: strict **64×64** frames, **512×64** sheet, **8-frame** order, anchor **(32,56)**, layer categories, palette discipline, export metadata JSON, validation checklist.

### Already in repo
- Walkable: [`getWalkableSpriteUrl`](../../../src/lib/avatar-utils.ts), precomposed **nation×archetype** sheets — not full runtime layer composition.
- [.specify/specs/walkable-sprite-pipeline-demo/](../../../.specify/specs/walkable-sprite-pipeline-demo/), [.specify/specs/walkable-sprites-implementation/](../../../.specify/specs/walkable-sprites-implementation/), [docs/WALKABLE_SPRITES.md](../../WALKABLE_SPRITES.md) — align **frame layout** with humanoid_v1 (already similar: 8×64×64).
- Portrait / Register 3: [.specify/specs/avatar-paper-doll-coherence/](../../../.specify/specs/avatar-paper-doll-coherence/) — separate from walkable contract.

### Gap
- No **CharacterIdentity** type or **visual token resolver** in production.
- No **equipment slot** composition for walkable in engine.
- **Anchor (32,56)** and **export metadata** contract not enforced in code or CI.
- AI asset quantization / approval workflow not specified in repo beyond scattered asset specs.

### Spec kits
- **[`.specify/specs/pixel-identity-system-v0/`](../.specify/specs/pixel-identity-system-v0/)** — VIE spine, phases, integration with alchemy/BARs.
- **[`.specify/specs/humanoid-v1-walkable-contract/`](../.specify/specs/humanoid-v1-walkable-contract/)** — normative art/engine contract; **source copy** in this folder.

---

## 3. Campaign ontology gap doc

### Proposed
- Instance / Campaign / Subcampaign / Slot / hub-spoke narrative and phased migration.

### Already in repo
- [.specify/specs/campaign-ontology-alignment/](../../../.specify/specs/campaign-ontology-alignment/), glossary + [CAMPAIGNREF_INVENTORY](../../CAMPAIGNREF_INVENTORY.md), `parentCampaignId` hierarchy (Phase 2 started).

### Gap
- Ongoing: `campaignRef` migration, hub/spoke re-anchor, stewardship, provenance — tracked in ontology **tasks.md**, not duplicated here.

### Action
- Treat [campaign_ontology_gap_alignment_issue.md](./campaign_ontology_gap_alignment_issue.md) as **historical/source**; link from ontology spec **References** if desired.

---

## 4. Sprite issue + cursor_spec

### Proposed
- End-to-end avatar → walkable URL → Pixi, demo asset, WASD direction, fallback.

### Already in repo
- Implemented under [walkable-sprite-pipeline-demo](../../../.specify/specs/walkable-sprite-pipeline-demo/) + env demo + `argyra-bold-heart` asset.

### Gap
- Optional: agent sprite parity, dynamic compositing — explicitly non-goals in imported docs; still on walkable-sprites-implementation backlog.

---

## 5. Audio PDF

### Proposed
- Transcript: hub/spoke metaphor, nodes → sub-campaigns, social hub presence, book/CYOA — partially captured in ontology + book-cyoa stewardship.

### Gap
- Not in git as PDF; distill any **new** AC into relevant spec kits (e.g. hub-social-presence P3).

---

## Summary table

| Bundle artifact | Primary spec kit | Status |
|-----------------|------------------|--------|
| book_os_v1_cursor_spec | book-os-v1-authoring | **New** |
| book_os_full_spec | book-os-v1-authoring (later phases / agents) | Partial overlap |
| bars_pixel_identity_system_v0 | pixel-identity-system-v0 | **New** |
| humanoid_v1_spec | humanoid-v1-walkable-contract | **New** |
| campaign_ontology_gap | campaign-ontology-alignment | **Exists** |
| sprite_issue / cursor_spec | walkable-sprite-pipeline-demo | **Largely shipped** |
