# Spec: Campaign branch seeds (plant → water → metabolize)

## Purpose

Let **players** leave **soft signals** (“seeds”) at a **campaign CYOA node** when something is missing, confusing, or imaginatively expandable—without authoring `Passage` rows or editing the graph directly. **Stewards** and **admins** (and later **agents**) **water** those seeds (signal + visibility). **Metabolism** turns accepted seeds into real **edges/nodes** under steward control, with **unified graph validation** ([UGA](../unified-cyoa-graph-authoring/spec.md)) so the live campaign does not regress into broken targets.

**Problem:** Today, broken `targetId` surfaces as player-facing failure (“Could not load this step.”). Admins fix graphs in `/admin`; players have no **legitimate, low-friction** way to contribute **branch intent** that stewards can **queue, rank, and integrate** without spamming shared canon.

**Practice:** Deftness + Integral ethos—**emotional energy as fuel** (curiosity, care) not shame; **sovereignty** (player owns their words; campaign owns canon); **composting** (seeds are proposals, not silent overwrites). Aligns with [player-facing CYOA generator](../player-facing-cyoa-generator/spec.md) at the **proposal/queue** layer without requiring the full PFCG draft pipeline in v1.

---

## Relationship to other specs

| Spec | Relationship |
|------|----------------|
| [unified-cyoa-graph-authoring](../unified-cyoa-graph-authoring/spec.md) (UGA) | **Metabolize** must pass the same directed-graph rules as admin saves (`validateFullAdventurePassagesGraph` / `upsertCampaignPassage`). |
| [player-facing-cyoa-generator](../player-facing-cyoa-generator/spec.md) (PFCG) | CBS is a **narrow slice**: in-context **seed** + **water** + **steward queue**; PFCG’s broader draft/generator can attach later. |
| [campaign-onboarding-cyoa](../campaign-onboarding-cyoa/spec.md) (COC) | Same **ontology** of campaign + passages; seeds are **precursors** to authored passages. |
| [bar-seed-metabolization](../bar-seed-metabolization/spec.md) (BSM) | **Different object**: BSM is BAR soil/compost; CBS is **CYOA branch** proposals on `Adventure`/`Passage`. Cross-link in UI copy only if product wants “link this seed to a BAR.” |
| [event-invite-inline-editing](../event-invite-inline-editing/spec.md) | Invite JSON remains steward-edited; **v1 CBS targets campaign `Passage` graph** unless plan explicitly extends to invite stories. |

---

## Definitions

| Term | Meaning |
|------|---------|
| **Node context** | A specific `Passage.nodeId` within an `Adventure` the player is reading via `CampaignReader` (identified by adventure slug + `nodeId`). |
| **Seed** | A player-created **artifact**: structured payload (see FR2) attached to a node context; never a live graph mutation by itself. |
| **Water** | An authenticated **pour** on a seed: acknowledgment, note, steward flag, or status bump—stored as an event with **actor role** for ranking. |
| **Metabolize** | Steward/admin (or agent-assisted draft + human approve) applies graph changes that create/update `Passage` rows; must pass UGA validation before commit. |

---

## Premises

| Premise | Implication |
|---------|-------------|
| **Soft default** | Planting a seed is **optional** and **non-blocking**; broken-path UX still offers **exit** (back, home, report issue) per existing patterns. |
| **No player graph write** | Players never call `upsertCampaignPassage` directly; they create seeds and water events only. |
| **Weighted visibility** | **Steward** and **global admin** water events contribute **higher rank weight** than **player** water for default ordering and steward digest surfaces. |
| **Return visits** | The **planter** may **return** to the same node context and add another pour (new seed or water on existing—see open decision in plan). |
| **Provenance** | Every seed and water event records `playerId`, timestamps, and role at time of action. |

---

## User stories

### US1 — Plant on fracture
**As a** player hitting a broken or confusing step, **I want** to **plant a seed** with my words (and optional links/tags) **so that** stewards see **where** the story broke and **what** I wished happened.

**Acceptance:** Seed is stored with `adventureId` + `nodeId` + optional `brokenTargetId` when known; user sees confirmation without exposing internal errors.

### US2 — Plant in calm
**As a** player on a working passage, **I want** a **quiet** “Suggest a branch” (or equivalent) **so that** I can offer ideas without an error state.

**Acceptance:** Same seed type with `trigger: optional_suggest` vs `trigger: broken_path` (enum) for analytics and steward triage.

### US3 — Water as player
**As a** player who **returns** to a node, **I want** to **water** seeds (mine or others—see FR5) **so that** the community signal grows gently.

**Acceptance:** Water event persisted; UI shows updated count or thread per product choice in plan.

### US4 — Water as steward/admin
**As a** steward or admin, **I want** to **water** seeds with **higher visibility weight** **so that** important signals surface in the queue ahead of noisy player-only piles.

**Acceptance:** Sort key uses role-weighted score; stewards see badge or “steward pour.”

### US5 — Metabolize to graph
**As a** steward, **I want** to **promote** a seed into a **draft passage change** (new node and/or retargeted choice) **so that** the campaign graph stays valid.

**Acceptance:** Pre-commit validation runs UGA rules; on failure, steward sees same class of errors as `CampaignPassageEditModal`; no partial apply.

---

## Functional requirements

### FR1 — Surfaces (player)

- **FR1.1:** **Broken path:** When `CampaignReader` cannot load the next step (or equivalent error branch), show **primary** CTA to **plant a seed** (copy: compassionate, non-technical) plus existing recovery actions.
- **FR1.2:** **Quiet path:** On any loaded passage (authenticated), show **secondary** entry (e.g. collapsed link or kebab) to **suggest a branch** without implying breakage.
- **FR1.3:** All plant flows require **authentication**; logged-out users get **login** CTA with `callbackUrl` preserved.

### FR2 — Seed payload (v1)

- **FR2.1:** **Body** (required, max length TBD in plan, suggest 500–2000 chars).
- **FR2.2:** **Optional title** (short line).
- **FR2.3:** **Optional** reference to a **BAR** or **quest** the player holds (id + type discriminator)—for steward context only.
- **FR2.4:** **Optional** **mood/tags** (enum or controlled tags + free tag cap—decide in plan to prevent abuse).
- **FR2.5:** **Context fields** (server-set): `adventureId`, `nodeId`, `instanceId` or `campaignRef` if resolvable, `trigger` enum, optional `brokenTargetId` when applicable.

### FR3 — Water events

- **FR3.1:** **Roles:** `player` | `steward` | `admin` (steward = instance/campaign steward matrix as defined in COC/plan; admin = global admin).
- **FR3.2:** **Weight:** Default sort score = `f(player_waters) + Ws * steward_waters + Wa * admin_waters` with `Ws > 1`, `Wa >= Ws` (exact constants in plan).
- **FR3.3:** **Payload:** Short optional note (max length TBD); optional steward-only **internal note** (visible only to stewards/admins).

### FR4 — Steward/admin surfaces

- **FR4.1:** List seeds **scoped** by `campaignRef` / `instanceId` / `adventureId` (exact scoping in plan).
- **FR4.2:** Filter by node, trigger type, recency, weighted score.
- **FR4.3:** Actions: **water**, **decline/archive**, **open metabolize** (opens flow tied to admin passage editor or inline wizard).

### FR5 — Visibility of seeds to players

- **FR5.1:** **Decision required in plan** (pick one for v1):
  - **A)** Seeds at a node are **visible to all players** who reach that node (community board).
  - **B)** Seeds are **private** to planter + stewards/admins until metabolized or explicitly “published to node.”
  - **C)** **Hybrid:** planter’s seeds private; aggregate count or anonymized snippets public.

### FR6 — Metabolism & validation

- **FR6.1:** Metabolize produces either **new `Passage`** and/or **updates** to `choices` JSON on an existing passage—same as admin authoring.
- **FR6.2:** **Before commit**, run **UGA** full-graph validation for the adventure (reuse `validateFullAdventurePassagesGraph` / existing `upsertCampaignPassage` validation path).
- **FR6.3:** On success, link seed (and optionally water thread) to resulting passage ids for audit trail.

### FR7 — Agents (later phase)

- **FR7.1:** Optional **agent-suggested** passage text from seed body—**never** auto-applies; steward accepts/edits then metabolizes.
- **FR7.2:** Bounded roles per [admin-page-composting-agent-evolution](../admin-page-composting-agent-evolution/spec.md) / Game Master agent rules.

### FR8 — Abuse & rate limits

- **FR8.1:** Rate limit plant + water per player per time window (numbers in plan).
- **FR8.2:** Basic profanity/spam heuristics optional; steward **decline** always available.

---

## Non-goals (v1)

- Replacing **cert feedback** JSONL or **narrative quality** pipelines—optional cross-link only.
- **Player-authored** `Passage` rows without steward metabolize step.
- **Invite** `storyContent` seeds (unless plan explicitly adds Phase 2).

---

## Acceptance criteria (release)

1. Authenticated player can plant from **broken** and **quiet** paths; seed appears in steward queue with correct context.
2. Player can **water** per FR5 decision; steward/admin water **increases** default sort rank vs player-only waters.
3. Steward can **metabolize** to graph changes that **pass** UGA validation; failing validation shows actionable errors.
4. Audit: each seed/water has actor, role, timestamp; metabolized seeds reference resulting graph ids.

---

## Open decisions (resolve in `plan.md`)

- FR5 visibility model (A / B / C).
- Whether **multiple seeds per player per node** are allowed vs single thread.
- Exact **steward** resolution (instance owner, `campaignRef` hosts, membership table).
- Schema naming: `CampaignBranchSeed`, `BranchSeedWater`, etc.
