# Spec: Site signal — Card Club anchors + CHS portal BAR journey

**Status:** Spec kit — triage from **site-signal (nav)** (`.feedback/cert_feedback.jsonl`), Mar 27 2026.  
**Related:** [site-signal-nav-report](../site-signal-nav-report/spec.md), [campaign-hub-spatial-map](../campaign-hub-spatial-map/spec.md) (HSM), [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) (CHS), [spoke-move-seed-beds](../spoke-move-seed-beds/spec.md) (SMB / 1.56), [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) (BBMT), [cert-feedback-blob-persistence](../cert-feedback-blob-persistence/spec.md) (CFB).

## Purpose

Close the loop on **four** **Share Your Signal / site-signal (nav)** reports filed the same evening (plus follow-up Sage notes on **landing-first** routing and **admin authoring**): **Card Club** affordances (Regent librarian, nation rooms) and **campaign hub spoke → portal adventure** clarity (Wake Up BAR vs four moves, hexagram context, library path, GM faces). **Sage consult** (integration): ship **Phase A** (world lobby) before **Phase B** (portal graph + BAR semantics) to avoid fragmented player trust and to unblock navigation before deep CHS content work.

**Practice:** Deftness — one spec kit with **two implementation phases**; align metaphor (library = Regent/order) across surfaces; do not fork a second hub mental model.

## Source feedback (verbatim excerpts)

| Time (UTC) | Page | Signal |
|------------|------|--------|
| `2026-03-27T22:41:30Z` | `/world/lobby/card-club` | Regent librarian should take players to a **Library** page; clicking does nothing. |
| `2026-03-27T22:42:31Z` | `/world/lobby/card-club` | Players **not** of a nation should not enter nation rooms — message: **only members of that nation**. |
| `2026-03-27T22:51:41Z` | `/adventure/.../play` (Portal_1, spoke 0) | **Wake Up** path asks for a **generic** BAR; expected **four moves**, then **six GM face** choices, then adventures producing BARs that **help campaign milestones**; Wake Up BARs should move people **toward the library**; hexagram felt disconnected from BAR. |
| `2026-03-27T23:38:39Z` | `/campaign/landing?ref=…&spoke=0` | **Landing card is good** — should be where people **land before** the CYOA flow; page should carry the same **informational role** as “after Wake/Clean/Grow/Show”; after recording **Wake path + GM face**, a **CYOA** should guide a **gather-resources**-style quest that **completes** a **Wake + GM-face** move and yields a **BAR** that can be **planted as a campaign seed** or **stored in the vault** for expansion; need to **wire** this and name **LEGO** so **admins author spoke quests** without **traveling as a player** and filing **Share Your Signal** each time. |

## Sage consult summary (2026-03-27)

- **Bundle risk:** A+B together increases dependency overlap; **ship A first** (visible wins, fewer blockers for B).
- **Trust:** Nation gating needs **legible copy** (ritual boundary, not arbitrary exclusion). Phase B needs **visible** links between BAR, hexagram context, and **campaign** progress where honest data exists (no fake milestone ticks).
- **Split in doc, unity in metaphor:** Keep one spec; separate **FR groups** by mechanism (modal/world vs `AdventurePlayer` / passages).
- **Generative dependency:** Librarian + nation rules are **foundation** for library- and territory-aligned portal work.

**Follow-up (same thread, landing signal + Sage consult):**

- **Routing:** Treat **`/campaign/landing`** (per spoke) as the **default front door** before entering the **portal adventure** CYOA unless a later task explicitly documents a shorter path (e.g. return visitors).
- **Sequencing:** **Move + face** choices are **inputs** to the next CYOA segment; downstream content should read as **one** journey: orientation → choice → **quest-shaped** work → **BAR** outcome.
- **Outcomes:** **Plant seed** vs **vault** are **honest** branches: ship **copy + CTAs** first; **SMB** / **CBS** persistence when those specs are in flight — no **fake** “seed planted” without DB/events.
- **Admin LEGO:** Prefer **template + validate + preview** over **live co-play**: **UGA** graph validation, **`preview=1` admin play** (per UGA), **seed scripts** for portal adventures, optional **DT** / sim for regression — document which artifact owns each spoke.

## Design decisions

| Topic | Decision |
|-------|----------|
| **Phasing** | **Phase A:** `librarian_npc` modal → primary CTA **`/library`** (quest library); optional secondary `/wiki`. **Nation gate:** block entry to `nation_room` when `Player` nation does not match room `nationKey` (with clear message + return path). **Phase B:** Portal adventure content + optional code hooks for move-typed BAR templates, post-BAR library CTA, and scoped face-picker / micro-flows — align tasks with CHS + SMB, not a duplicate routing tree. |
| **Admin / test** | Admins or flag: may bypass nation gate for cert (spec task: define `isAdmin` or env). |
| **Hexagram + BAR** | v1: copy + UI that **names** the carried hexagram/face when query params present; deeper binding to BAR metadata = Phase B / SMB. |
| **Milestone honesty** | BAR completion may **not** yet advance `CampaignMilestone` — spec requires **explicit** “what moved” line or link (e.g. board, donate, hub state) per BBMT; no fabricated progress. |
| **Landing before CYOA** | From hub/spoke entry, players see **`/campaign/landing`** (spoke-scoped) **before** `AdventurePlayer` portal flow unless spec’d exception; landing copy can summarize **four moves** and **what happens next**. |
| **State handoff** | **Spoke index**, **chosen move** (Wake/Clean/Grow/Show), **chosen GM face** must be **available** to the portal adventure and any **linked quest** (query params, session, or persisted player-campaign metadata — align with [CHS_RUNTIME_DECISIONS](../campaign-hub-spoke-landing-architecture/CHS_RUNTIME_DECISIONS.md) and implementation). |
| **BAR disposition** | After qualifying **move + face** BAR emit: player chooses or is offered **plant as campaign seed** (SMB/CBS when implemented) vs **keep in vault** / expand later; v1 may be **CTA-only** if seed persistence is not yet wired. |
| **Admin authoring** | Stewards/admins use **UGA-validated** graphs, **templates**, **admin preview play**, and **seeds** — not **mandatory** player shadowing; Share Your Signal remains **optional** QA, not the authoring loop. |

## Conceptual model

| WHO | WHAT | WHERE |
|-----|------|--------|
| Player | Interacts with **Regent (Librarian)** and **nation embassies** | `/world/lobby/card-club`, nation `MapRoom`s |
| Player | Enters **spoke** from hub, plays **portal CYOA**, emits **move-shaped BAR** | `/campaign/spoke/*` → `/adventure/*/play` |
| Steward | Authors **passage graph** and templates | Admin adventures / seeds |

## API contracts

**v1 — no new public HTTP routes required** unless nation check is exposed for SSR (prefer server-side load in [`src/app/world/[instanceSlug]/[roomSlug]/page.tsx`](../../../src/app/world/[instanceSlug]/[roomSlug]/page.tsx) or guard in client `RoomCanvas` with session from existing patterns).

- **Server:** Resolve `Player.nation` → `Nation.key` (or equivalent) vs `MapRoom.nationKey` for lobby nation rooms.
- **Client:** `librarian_npc` → `router.push('/library')` or modal + button (UX choice in tasks).

## User stories

### P1 — Librarian opens the library

**As a** player in Card Club, **I want** the Regent (Librarian) to **open a clear path to the library**, **so that** the anchor is not a dead interaction.

**Acceptance:** Interacting with `librarian_npc` shows purposeful UI and reaches `/library` (or explicit equivalent) without an empty modal.

### P2 — Nation rooms respect membership

**As a** player who has not joined a nation, **I want** to be **stopped with an understandable message** when entering a nation’s room, **so that** territory feels intentional.

**Acceptance:** Wrong nation → no room load (or immediate bounce) + copy that names the nation and offers **Back to Card Club** (or similar).

### P3 — Hub spoke portal journey reads as “moves + campaign”

**As a** player arriving from **campaign hub** on spoke 0, **I want** the Wake Up path to **feel like a move toward helping the campaign** and **toward the library**, **not** a generic BAR form, **so that** hexagram/face context and next steps make sense.

**Acceptance:** Documented passage changes + at least one **library CTA** after Wake Up BAR path; four-move branch structure **authored** for portal entry (scope in tasks); six-face path **scoped** (full vs stub) in Phase B tasks.

### P4 — Landing orients before the portal CYOA

**As a** player entering a spoke from the campaign hub, **I want** the **spoke landing** to ground me **before** the portal CYOA, **so that** I understand **four moves**, **what I already chose**, and **what the next quest/BAR will do**.

**Acceptance:** Documented **default route**: hub → **`/campaign/landing`** → CTA into portal adventure; landing can show **post-move** summary when move/face already recorded (exact fields in tasks).

### P5 — Gather-resources quest completes the Wake + face move

**As a** player who picked **Wake** and a **GM face**, **I want** a **short CYOA + quest** that feels like **gathering what I need**, **so that** completing it **earns** a **BAR** tied to that move/face — not a generic form.

**Acceptance:** Authored **passage + quest** path (or stub + honest copy) documented in tasks; completion **emits** or **links** BAR with **move/face** metadata where the engine supports it.

### P6 — BAR lands in campaign seed or vault

**As a** player finishing the spoke flow, **I want** to **plant** the BAR toward the **campaign** or **keep it in my vault**, **so that** I know how my work feeds the residency vs personal expansion.

**Acceptance:** At least **two CTAs** or branches (**seed** / **vault**) with **honest** behavior per milestone honesty row; wire to SMB/CBS when those features land.

## Functional requirements

### Phase A — Card Club + nation rooms

- **FR-A1:** Implement `librarian_npc` in [`AnchorModal`](../../../src/components/world/AnchorModal.tsx): title, short Regent/library copy, primary link/button to **`/library`**, optional `/wiki`.
- **FR-A2:** Nation membership gate for **`roomType === 'nation_room'`** (and/or `nation_embassy` portal targets): compare player nation to `MapRoom.nationKey`; block with modal or dedicated lightweight page + message.
- **FR-A3:** Document bypass policy for **admin** (and optional unassigned nation → allow Card Club only or message).

### Phase B — Portal adventure + BAR semantics (CHS)

- **FR-B1:** Authoring: portal adventure from **`Portal_1`…** presents **four moves** (Wake / Clean / Grow / Show) as **distinct** early branches where product agrees (seed/script or admin edit).
- **FR-B2:** **Wake Up** passages: replace generic-only BAR copy with **Wake Up–framed** prompts; post-submit or inline **CTA to `/library`** (and preserve `returnTo` / `ref` where applicable).
- **FR-B3:** **Hexagram / face** query params: show a **single** contextual line in `AdventurePlayer` strip when `hexagram` / `face` present (no silent drop).
- **FR-B4:** **Six GM faces:** define v1 minimum — e.g. **face picker node** routing to short stubs vs full micro-adventures; tasks split **B4a** stub **B4b** full.
- **FR-B5:** **Milestones:** if no DB wiring, show honest **“what helps the residency next”** links (event, board, donate) per instance; if wiring exists, attach only **real** fields.

## Non-goals (v1)

- Full **SMB** nursery / watering implementation (track in [spoke-move-seed-beds](../spoke-move-seed-beds/spec.md)).
- Replacing portal adventure with **intake-generated** graph only (separate track).
- Pixel art / new librarian sprite.

## Persisted data & Prisma

**v1 likely needs no schema change** if `Player.nationId` + `Nation` key align with `MapRoom.nationKey`. If a new flag (e.g. `skipNationGate`) is required, add migration + tasks.

| Check | Done |
|-------|------|
| Models/fields in Design / API | N/A unless gate flag added |
| `tasks.md` includes migrate if schema changes | |
| `npm run db:sync` + `npm run check` after any Prisma edit | |

## Verification Quest

1. Log in as player **with** nation A; enter Card Club; interact **Regent** → land on **`/library`** with coherent copy.
2. Log in as player **with** nation B (or none); attempt nation A room from embassy → **blocked** + message + escape hatch.
3. **Spoke 0 / hub (manual):** From **`/campaign/hub?ref=bruised-banana`**, use **Landing card first →** on **Portal 1** → URL should be **`/campaign/landing?...&spoke=0`**. Click **Continue into spoke CYOA** → adventure loads with **`start=Portal_1`**, **`spoke=0`**, optional **`hexagram`** / **`face`** from hub state. On **`Portal_1`**, confirm **four move** choices (Wake / Clean / Grow / Show). Take **Wake Up** → **face picker** (six choices) → **Gather (Wake)** stub → **Wake BAR** with face-shaped copy (not generic-only when `face` is set). After BAR submit, confirm **`PostWake_Library`**: prose + **Open the quest library** + board / events / donate + **Continue to hub return**. Hub strip should show **Hexagram N** / **GM face** when those query params are present. *(Power users: **Enter CYOA directly →** skips landing — documented in [CHS_RUNTIME_DECISIONS](../campaign-hub-spoke-landing-architecture/CHS_RUNTIME_DECISIONS.md).)*
4. **Gather → BAR → seed / vault (manual):** After **Continue to hub return** on **`Hub_Return`**, confirm **seed planting** runs once (idempotent per `plant-seed-from-spoke`); UI shows **Continue to landing card** + optional quest hook + **Return to hub**. No fabricated milestone ticks; “seed planted” line only after successful plant. **Vault:** use normal vault / hand paths (SMB “vault vs seed” branch is future work).
5. **Site-signal smoke:** Submit **Share Your Signal** with a message that names this spec (e.g. `site-signal-card-club-chs-portal-bar-journey`) so cert triage can file or close the row.

**Automation (SCL-B6):** `npm run test:scl-portal` (portal graph contract vs seed) and `npm run test:site-signal-schema` (SCL-shaped payload + formatter).

## Dependencies

- [site-signal-nav-report](../site-signal-nav-report/spec.md) — pipeline for nav feedback.
- CHS MVP + [CHS_RUNTIME_DECISIONS](../campaign-hub-spoke-landing-architecture/CHS_RUNTIME_DECISIONS.md).
- [UI_COVENANT.md](../../../UI_COVENANT.md) for modal/button tokens.

## Changelog

| Date | |
|------|--|
| 2026-03-28 | Initial spec kit from last 3 site-signal (nav) lines + Sage consult. |
| 2026-03-28 | Fourth signal (`/campaign/landing`): landing-before-CYOA, gather-resources quest leg, BAR → seed/vault, admin LEGO; FR-B6–B9, P4–P6, tasks SCL-B7–B10; BACKLOG 1.62 + cert row. |
| 2026-03-28 | **Shipped routing slice:** hub + `SpokePortalModal` default → landing; landing → “Continue into spoke CYOA”; login `returnTo` → landing; `AdventurePlayer` strip shows **GM face** label when `face` query set; CHS_RUNTIME_DECISIONS + plan query contract + authoring checklist. Tasks **B3, B7, B8, B10** checked. |
| 2026-03-28 | **SCL-B6:** `portal-graph-contract.ts` + `test:scl-portal`; site-signal schema smoke for SCL triage messages; spec Verification Quest expanded (manual steps 3–5 + automation); BACKLOG cert rows updated for portal site-signal lines. |
