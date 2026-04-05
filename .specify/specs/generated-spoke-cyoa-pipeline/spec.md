# Spec: Generated spoke CYOA pipeline (v1 — generation, charge, face, terminal nursery)

**Status:** Spec kit — product lock from Sage/product thread (Apr 2026).  
**Related:** [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) (CHS), [spoke-move-seed-beds](../spoke-move-seed-beds/spec.md) (SMB), [unified-cyoa-graph-authoring](../unified-cyoa-graph-authoring/spec.md) (UGA), [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) (BBMT), [site-signal-card-club-chs-portal-bar-journey](../site-signal-card-club-chs-portal-bar-journey/spec.md) (SCL), [cyoa-blueprint-bar-metabolism](../cyoa-blueprint-bar-metabolism/spec.md) (CBB), [charge-capture-ux-micro-interaction](../charge-capture-ux-micro-interaction/spec.md) (GD), [vault-page-experience](../vault-page-experience/spec.md) (VPE / vault gates).

## Purpose

Ship **v1** of a **single production pipeline** for **campaign hub spokes**: each spoke run is a **generated** (not merely templated-empty) **grammatical CYOA journey** whose inputs are **collective and personal state**, and whose outputs are a **charge-parameterized achievement BAR**, **nursery plant at the terminal node**, and **return to hub** for another path.

**Problem:** Today, **portal adventures**, **GM faces** (canonical six: **Shaman, Challenger, Regent, Architect, Diplomat, Sage** — see `src/lib/quest-grammar/types.ts`), **charge**, and **nursery** are **partially wired** but not **one ordered experience** with **generation in the loop** and **terminal-local nursery** for the spoke.

**Practice:** Deftness — **spec before code**; **UGA** (or equivalent) **validates** any machine-produced graph; **honest** milestone/fundraising (no fabricated ticks); cite-or-silence if library or book chunks participate in generation.

## Locked product decisions (v1)

| Topic | Decision |
|-------|----------|
| **Generation** | **v1 includes generation** — the middle of the journey is **produced** from inputs (see below), not only a static graph with unfilled slots. Guardrails: schema validation, graph completeness, admin/steward preview where applicable. |
| **Opening beat** | **Campaign context** + **fortune for this spoke** (draw: hexagram / hub assignment) + **live milestone** + **fundraising** (when instance exposes URLs / progress — same honesty rules as BBMT). |
| **Move + charge** | Player **chooses one of the four moves** (Wake / Clean / Grow / Show) to **focus** this run and **captures charge** (felt signal) **scoped to this spoke** before or as part of the generated path. |
| **Cultivation sifu (GM face)** | Player **chooses a Game Master face path**; each face has a **signature move** and yields a **signature achievement BAR** on completion; **BAR body is parameterized by player charge text** (not fully static copy). |
| **Terminal** | **One terminal node** (or atomic terminal transition) performs: **emit achievement BAR** (provenance: `campaignRef`, `spokeIndex`, `moveType`, `gmFace`, charge-derived fields) + **nursery plant for this campaign spoke** (SMB / `campaign_kernel` — align with existing actions). **Nursery for this spoke exists at the terminal** — not only on a separate `/seeds` page (that page may remain for power users). |
| **Return** | After terminal completion, player is routed **back to campaign hub** (or equivalent `returnTo`) to **choose another path**. |

## Inputs to generation (contract)

Minimum **machine-readable** inputs passed to the generator (names are illustrative — finalize in `plan.md`):

| Input | Source |
|-------|--------|
| `campaignRef`, instance display / domain | `Instance`, campaign config |
| Kotter stage | `Instance.kotterStage` (or campaign state) |
| Spoke index + **fortune** (hexagram id, name, changing lines if any) | Hub draw / `campaignHubState` / query handoff |
| **Live milestone** snapshot | BBMT guidance API or equivalent (honest strings) |
| **Fundraising** snapshot | Instance pay URLs, optional progress copy — **only if real** |
| **Chosen move** (four moves enum) | Player selection |
| **Charge text** (and optional structured fields from capture UI) | Player entry |
| **Chosen GM face** | Player selection among six canonical faces |

**Output:** A **passage graph** (or runtime step list) that **validates** under **UGA** rules for portal/adventure graphs, ending in a **terminal** type that triggers **BAR emit** + **nursery plant** + **hub return**.

## Non-goals (v1)

- Full **CBS** branch-seed graph or **watering** economy beyond what **SMB + existing `advanceCampaignWatering`** already supports.
- Replacing **landing** (`/campaign/landing`) — it remains the **default orientation** before CYOA unless a task explicitly short-paths for return visitors.
- **Six** fully distinct **long** prose paths per face in v1 if product accepts **stub depth** for some faces — document in tasks which faces are **full** vs **minimum viable** copy.

## Functional requirements

### FR1 — Opening beat (context + fortune + live collective)

- **FR1.1:** First segment(s) present **campaign context** (name, domain, residency framing as appropriate).
- **FR1.2:** **Fortune** for this spoke is **shown** (hexagram label/id, relation to spoke index, consistent with hub draw).
- **FR1.3:** **Milestone strip** or equivalent **live** collective guidance (BBMT-aligned; no fake progress).
- **FR1.4:** **Fundraising** block when instance has real donation/config data; omit or soften when missing.

### FR2 — Move choice + charge

- **FR2.1:** Player selects **exactly one** primary **four-move** focus for this run.
- **FR2.2:** Player provides **charge** (text + any structured capture) **scoped to this spoke**; this text **feeds** BAR parameterization and generator prompts.

### FR3 — Cultivation sifu (GM face)

- **FR3.1:** Player selects **one** canonical **GM face**; copy presents **signature move** framing for that face.
- **FR3.2:** Completion emits **achievement BAR** with **face + spoke + move** provenance and **charge-parameterized** body/title rules.

### FR4 — Generation

- **FR4.1:** **Generator** consumes inputs (§ Inputs) and produces a **valid** CYOA artifact (Passage records or approved intermediate).
- **FR4.2:** **Validation** — `validateFullAdventurePassagesGraph` (or adapter) **before** player commit / publish; admin **preview** path for stewards.
- **FR4.3:** **Latency** — document strategy (async job, skeleton-first, streaming copy) in tasks; v1 must not **block** opening beat indefinitely without UX.

### FR5 — Terminal (BAR + nursery + return)

- **FR5.1:** **Terminal node** triggers **achievement BAR** creation (server action), using charge text + blueprint rules for the face.
- **FR5.2:** **Same terminal** (or immediate chained server flow) performs **nursery plant** for **`(campaignRef, spokeIndex)`** per SMB — **surface UI** at terminal, not only deep link to `/seeds`.
- **FR5.3:** **Return to hub** — `returnTo` / hub URL with `ref` preserved.

### FR6 — Vault / gates

- **FR6.1:** Respect **CHS vault / compost** rules when emitting BARs would exceed caps — modal or gate per [vault-compost-minigame-modal](../vault-compost-minigame-modal/spec.md) / VPE.

## API / implementation notes

- Prefer **server actions** for: generate (or enqueue), validate, persist passages, emit BAR, plant kernel.
- **Idempotency:** define whether one **generated adventure id** is created per **spoke session** vs **regenerate on retry** — decide in `plan.md`.
- **Telemetry:** log generation version, inputs hash (no PII in logs), validation outcome.

## Verification

- **Manual:** Hub → landing → spoke → complete **full** path → BAR in vault/hand with correct metadata → kernel visible for spoke bed → hub.
- **Automated:** unit tests for validation adapter; optional integration test with fixture generator output.
- **Cert:** add or extend cert quest id when stable (e.g. `cert-generated-spoke-cyoa-v1`).

## References (code)

- Spoke entry: [`src/app/campaign/spoke/[index]/page.tsx`](../../../src/app/campaign/spoke/[index]/page.tsx)
- Adventure play: [`src/app/adventure/[id]/play/AdventurePlayer.tsx`](../../../src/app/adventure/[id]/play/AdventurePlayer.tsx)
- Campaign hub: [`src/components/campaign/CampaignHubView.tsx`](../../../src/components/campaign/CampaignHubView.tsx)
- SMB actions: [`src/actions/spoke-move-seeds.ts`](../../../src/actions/spoke-move-seeds.ts), [`src/actions/campaign-bar.ts`](../../../src/actions/campaign-bar.ts)
