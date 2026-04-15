# Spec: BAR ↔ quest links, routing, and campaign drafts (Conclave construct)

**Status:** Spec kit — product decisions locked; implementation phasing in [plan.md](./plan.md).  
**Related ingests:** [docs/specs-ingest/conclave-construct/README.md](../../../docs/specs-ingest/conclave-construct/README.md)  
**Existing code:** `src/lib/bar-forge/match-bar-to-quests.ts`, `POST /api/match-bar-to-quests`, `/api/bar-registry/*`

## Purpose

Formalize the **BAR → quest** system as **routing and composition**, not primary story generation:

1. **Match** player BARs (tension objects) to **quests** (interventions) with explainable scores.  
2. Persist **BarQuestLink** (or equivalent) as a **first-class** row: confidence, reason, review status — not only fields embedded on BAR.  
3. Enable **campaign drafts** that **braid** inner **playerArc** and outer **campaignContext** (see ingested `bars_campaign_draft_full_spec.md`).  
4. **Sequence** work so the **in-app player loop** validates trust and match quality **before** scaling **GPT / OpenAPI** bulk and authoring tools.  
5. Add **Octalysis / Core Drives** only in a **thin v1** (structure + explainability); defer inference APIs until review UX exists.

**Canonical Game Master faces** (copy, IA, tagging): **Shaman, Challenger, Regent, Architect, Diplomat, Sage** only — `src/lib/quest-grammar/types.ts`.

---

## Product decisions (locked)

These resolve the pre-spec “open questions” and the six-face synthesis (toy-box / grown-up / stickers / kids-first framing).

### D1 — Source of truth for “quests”

- **Decision:** A **canonical quest catalog** in the data layer (stable IDs, WAVE phase, BAR-type tags, permissions).  
- **Provenance:** Every quest row carries **where it came from** (e.g. library seed, book pipeline, campaign, thread-derived) — **mix allowed**, one logical shape for the matcher.  
- **Rationale:** Avoid multiple incompatible definitions of “quest”; support mythic continuity for book-aligned content (Shaman) without forking the matcher (Architect/Sage).

### D2 — Human-in-the-loop default

- **Decision:** **Tiered**, not globally manual or globally automatic.  
  - **Shared / published / campaign-visible** matches: status starts **`proposed`**; promotion to **confirmed** requires a **steward** (or policy-defined role).  
  - **Private / sandbox / single-player** contexts: allow **faster acceptance** via feature flag or scope (product-tunable).  
- **Rationale:** Safety and trust for visible outcomes; speed for learning in private (Sage tiering + Regent audit for public).

### D3 — Octalysis / motivation scope v1

- **Decision:** **v1 = structure + explainability**, not a black-box motivator.  
  - Store **Core Drive enum** (see ingests) **+ rationale** (+ optional **anti-drives**) on **BAR analysis** and optionally on **quest motivation design** fields.  
  - **Defer** `POST /api/bar-registry/infer-motivation` (or equivalent) until **v1.5+** with review UI, logging, and humility in copy (Diplomat/Sage).  
- **Rationale:** Avoid superficial gamification; match the warning in `bars_octalysis_analysis.md`.

### D4 — Primary consumer sequencing

- **Decision:** **In-app Chapter 1 (narrow player loop)** first — prove **routing quality** and **trust** in the product.  
- **Then:** **GPT / OpenAPI** bulk ingest, clustering, campaign draft persistence — **same matcher core**, authoring/review surfaces on top.  
- **Rationale:** Same brain, two skins (Sage/Architect); players before piles.

### D5 — Who confirms BarQuestLinks (v1)

- **Decision:** **One** state-changing surface: `PATCH /api/bar-quest-links/:id` with auditable actor. **Authorization:** **global admin** OR **campaign room** = player has `InstanceMembership` with `roleKey` in **`owner` \| `steward`** for the `Instance` tied to the link (via optional `instanceId` or resolved `campaignRef`). Same API for all confirmers; richer roles are policy later.  
- **Rationale:** Regent audit trail + Architect single contract + Diplomat delegating care to people who hold the room (see `design-notes.md` Q1).

### D6 — First in-app surface (v1)

- **Decision:** **No new top-level route required for v1.** Ship link persistence + catalog APIs first; add a thin **`SuggestedQuestsPanel`** client component mounted on **`/hand`** (default) or **`/bars/create`** when a BAR draft exists, behind a feature flag if needed.  
- **Rationale:** API-first vertical slice; threshold stays at existing vault / BAR flows (Shaman/Sage component-first).

### D7 — Book and external quests in the catalog

- **Decision:** **Import into the canonical catalog** (`custom_bars` as matchable quests) with **provenance** (`questSource`, `campaignRef`, book pipeline fields as today). **Do not** maintain a long-term parallel “external id only” matcher path — one graph for “what can be matched.” Expose **`GET /api/quests`** with filters (e.g. source / campaign) for app + GPT.  
- **Rationale:** Single code path for Challenger/Architect; Shaman “one list” trust.

### D8 — Clustering (v1 contract, intelligence later)

- **Decision:** **`POST /api/bar-registry/cluster`** (or equivalent under bar-forge) accepts `{ barIds, strategy: "manual" \| "heuristic_v1" }`. **v1** = deterministic heuristic or steward-ordered arcs; **defer** GPT/ML-heavy clustering until link + draft APIs are stable. **Audit** who created each revision.  
- **Rationale:** Same endpoint, swappable strategy (Sage); no opaque blobs (Diplomat).

### D9 — OpenAPI packaging

- **Decision:** **Extend `openapi/bar-forge-api.yaml`** with tags (e.g. `BarQuestLink`, `CampaignDraft`, `QuestCatalog`) and clear `operationId`s. **Split** to a second file only if size or merge conflict pain warrants it (threshold ~800 lines or repeated conflicts).  
- **Rationale:** One hearth for Custom GPT partners; version in `info.version`, not file count.

---

## Core principles (from ingests)

- **BAR → Quest affinity mapping**, not “BAR → generated story” as the default contract (`bar_to_quest_router_spec.md`).  
- **Do not** store quest matches **only** on BAR records; use a **link** model with lifecycle (`bars_api_cursor_spec_full.md`, `bars_campaign_draft_full_spec.md`).  
- **Campaign draft** is a **braided** object: **playerArc ∧ campaignContext** (`bars_campaign_draft_full_spec.md`).  
- **Game loop** (later phase): BAR → Quest → Core Drive → Loop → Campaign (`bars_game_loop_architecture_spec.md`); **loops** follow **trigger → action → feedback → reward** with repeatability in mind.

---

## Non-goals (v1)

- Replace quest grammar runtime or I Ching systems with this spec alone.  
- Ship full **LoopTemplate** CRUD + **recommend-loops** before **BarQuestLink** + **campaign draft** MVP.  
- **Infer-motivation** as the first shipped API.  
- Optimize only for GPT throughput without an in-app **proof loop**.

---

## Functional requirements (high level)

| ID | Requirement |
|----|-------------|
| **FR1** | **Match contract:** Given BAR + analysis fields, return **primary + secondary** quest suggestions with **score breakdown** (type, WAVE phase, optional charge weighting) — align with existing `matchBarToQuests` behavior; extend as needed. |
| **FR2** | **BarQuestLink (or equivalent):** Persist `barId`, `questId`, `matchType`, `confidence`, `reason`, `supportedBy`, `status` (`proposed` \| `accepted` \| `rejected` \| …), `createdBy`, timestamps; support accept/reject flows for stewards where policy requires. |
| **FR3** | **Quest catalog:** Queryable list/detail for matcher and admin; tags for WAVE, BAR types, optional GM face hints — **canonical six faces** only. |
| **FR4** | **Campaign draft (MVP):** Persist drafts with **playerArc** + **campaignContext** + ordered **arcs** referencing BAR ids and quest ids; status `draft` \| `review` \| `approved` \| `archived`. |
| **FR5** | **API layering:** Registry → routing (links) → composition (drafts) → runtime (existing GM/quest resolution) — see [plan.md](./plan.md). |
| **FR6** | **Octalysis v1:** Schema for Core Drive enum + rationale on analysis; optional quest-side **motivation design** fields; **no** required inference endpoint in v1. |

---

## Success criteria

- Players or stewards can say **why** a quest was suggested (reason + scores).  
- No duplicate “source of truth” for matches: **links** are inspectable and reviewable.  
- Campaign drafts read as **both** inner journey and **outer** organizing need, not one alone.  
- Shipping order respects **in-app validation** before **bulk GPT** paths.

---

## References

- Ingested bundle: `docs/specs-ingest/conclave-construct/*.md`  
- Game Master sects (Sage integration / masks): `.agent/context/game-master-sects.md`  
- Matcher implementation: `src/lib/bar-forge/match-bar-to-quests.ts`
