# Design notes: BAR ↔ quest links and campaign drafts

## Ingest mapping

| Ingest file | Captured in spec |
|-------------|------------------|
| `bar_to_quest_router_spec.md` | Routing not generation; WAVE; primary + secondaries |
| `bars_api_cursor_spec_full.md` | Layers; BarQuestLink; bulk; campaign drafts |
| `bars_campaign_draft_full_spec.md` | Braided playerArc + campaignContext; CampaignQuestLink (phase later) |
| `bars_game_loop_architecture_spec.md` | Phase 4 — loops + drives |
| `bars_octalysis_spec.md` / `bars_octalysis_analysis.md` | **D3** — schema v1, inference later; anti-superficial-gamification |

## Six-face decisions

See pre-spec discussion: decisions **D1–D4** were chosen with Shaman through Sage lenses; **Sage** emphasis on integration (one catalog + provenance, tiered review, defer inference).

## ELI5 summary (stakeholder)

One toy box + stickers; grown-up for picture day; simple motivation stickers first; kids playing before big piles — see team chat or spec **Product decisions** section.

---

## Optional clarifications — six-face analysis (deftness + API-first)

**Status:** Promoted to locked product decisions **D5–D9** in [spec.md](./spec.md). The tables below remain as rationale.

**Deftness** (dev sense): contract before UI, smallest whole slice, avoid load-bearing wrong abstractions, document external surfaces, fail-fix before layering features.

**API-first**: ship **OpenAPI + route handlers + DTOs** first; UI is a thin client; use **server actions** only where React-internal.

### Q1 — Who confirms links? (steward vs admin vs campaign owner)

| Face | Take |
|------|------|
| **Shaman** | Belonging: whoever **holds the room** for that campaign should bless visible matches — often **campaign steward**, not anonymous admin. |
| **Challenger** | Ship **one** permission string in the API (`canConfirmBarQuestLink`) and test it; don’t split three roles on day one. |
| **Regent** | **Rules in the contract**: `PATCH` link status requires `proposed → accepted` with **auditable actor id**; role is secondary to the state machine. |
| **Architect** | **Campaign-scoped** confirm matches mental model (drafts are per campaign); **instance admin** fallback = fewer edge cases than global admin-only. |
| **Diplomat** | Avoid “only god-mode admin” — **delegates care** to people who know the table; **campaign editor** is enough for v1 if documented. |
| **Sage** | **Same API** for all confirmers; **role resolution** is policy plug-in later — don’t fork endpoints per role. |

**Deftness + API-first recommendation:** Implement **one** `PATCH /api/bar-quest-links/:id` (or server action wrapper) with **authorization** = “player may confirm if `campaignId` matches stewardship OR `role: admin`.” Document the matrix in OpenAPI **description** fields. **Default:** **campaign owner / editor** + **admin**; add named `steward` only when you have a second user story.

---

### Q2 — First in-app surface (which route?)

| Face | Take |
|------|------|
| **Shaman** | Entry should feel like **threshold** — wherever players already **name tension** (`/capture`, `/hand`) beats a new island. |
| **Challenger** | Smallest **vertical slice**: one page that calls **GET match** and shows results — route is secondary to **API working**. |
| **Regent** | Pick **one** canonical URL in the spec so bookmarks and support don’t fracture. |
| **Architect** | **`/bars/create` or `/hand`** already composes BAR + next steps — **embed** “suggested quests” **component** there vs new route = less routing debt. |
| **Diplomat** | Fewer **surprise** new nav items; embed reduces “where did this feature go?” |
| **Sage** | **Component-first**: `SuggestedQuestsPanel` fed by API; mount on **hand** or **bars/create** when BAR exists — **Sage** defers route bikeshedding. |

**Deftness + API-first recommendation:** **No new route required for v1.** Ship **`POST /api/match-bar-to-quests`** (already exists) **+** new **link persistence** endpoints; add a **client component** on **`/hand`** or **`/bars/create`** behind a flag. **Default:** **`/hand`** if charge/BAR context lives there; else **`/bars/create`** after BAR draft exists.

---

### Q3 — Book quests: import into catalog vs external reference + join

| Face | Take |
|------|------|
| **Shaman** | Book = **ritual text** — players trust **one** list; orphan references feel like homework lost in another room. |
| **Challenger** | **Import** = one code path for matcher; **reference** = two queries and sync bugs = rework. |
| **Regent** | **Provenance field** matters more than import mechanics — **either** works if enforced in schema. |
| **Architect** | **Import to catalog** with `sourceType: book`, `sourceId` = **normalized**; matcher always joins `quest.id`. |
| **Diplomat** | Show **“from book X”** in UI regardless — **import** still allows friendly attribution. |
| **Sage** | **Single graph** for “what can be matched” — **Sage** picks **import + provenance** over split brain. |

**Deftness + API-first recommendation:** **Import into canonical catalog** with **provenance columns** (`sourceType`, `sourceExternalId`). Expose **`GET /api/quests?sourceType=book`** in OpenAPI so GPT and app see **one** list. **Avoid** long-term dual-path matcher logic.

---

### Q4 — Clustering v1 (simple vs ML vs GPT-only)

| Face | Take |
|------|------|
| **Shaman** | Clustering is **circle at the fire** — steward **names** groups first; algorithm second. |
| **Challenger** | **POST /cluster** with **deterministic** input (BAR ids + optional steward tags) — **prove** API before smart. |
| **Regent** | Log **who** created a cluster revision — **audit** beats cleverness. |
| **Architect** | **Stub**: `cluster` returns **single arc** with **manual** order — **upgrade** to k-means or GPT **behind same endpoint** (`strategy` query param). |
| **Diplomat** | Don’t ship **opaque** clusters — **reason** field per arc for care. |
| **Sage** | **Same endpoint, evolving strategy** — **Sage** integrates ML later without UI churn. |

**Deftness + API-first recommendation:** **`POST /api/bar-registry/cluster`** accepts `{ barIds[], strategy: "manual" | "heuristic_v1" }`; **v1** = **heuristic** (e.g. shared WAVE + type) or **steward-defined** buckets. **Defer** GPT/ML until **link + draft** APIs are stable — **contract first**, intelligence swappable.

---

### Q5 — OpenAPI: extend `bar-forge-api.yaml` vs new file

| Face | Take |
|------|------|
| **Shaman** | One **hearth** — Custom GPT users shouldn’t hunt five YAML files. |
| **Challenger** | **One file** until **line count / merge pain** forces a split — **measure** pain. |
| **Regent** | **Version** the API in path or `info.version`; file split is not governance. |
| **Architect** | **bar-forge** already = BAR + forge; **bar-quest-link** + **campaign-draft** are **same product surface** for GPT → **extend** with **tags** `BarQuestLink`, `CampaignDraft`. |
| **Diplomat** | **Single entrypoint** for partners reduces confusion. |
| **Sage** | If file **> ~800 lines** or **merge conflicts** spike, **split** by **bounded context** (`bar-routing.yaml`) — **Sage** integrates with cross-file `$ref` if needed. |

**Deftness + API-first recommendation:** **Extend `openapi/bar-forge-api.yaml`** with **tags** and **clear operationIds** (`createBarQuestLink`, `listQuests`, `createCampaignDraft`). **Split** only when **git blame** shows repeated conflicts or reviewers ask. **Document** new paths in spec **FR** section and **ENV** if auth headers differ.

---

### Cross-face summary (API-first + deftness)

| Topic | Recommendation |
|-------|----------------|
| **Q1 Confirm** | **One PATCH contract**; auth = campaign stewardship **or** admin; document in OpenAPI. |
| **Q2 Surface** | **API + component first**; default mount on **`/hand`** or **`/bars/create`**; no new route strictly required. |
| **Q3 Books** | **Import to catalog** + **provenance**; single matcher path. |
| **Q4 Cluster** | **One POST** with `strategy`; v1 heuristic or steward; GPT/ML later. |
| **Q5 OpenAPI** | **Extend bar-forge-api.yaml** until scale forces split. |
