# Six Game Master Faces — Narrative OS Map v0

Analysis of the **Narrative OS Map** product direction (four spaces, NUI over GUI, campaign overlays, baseline play without campaign) against **BARs Engine** as it exists today. Uses the six Game Master faces from project rules: **shaman**, **regent**, **challenger**, **architect**, **diplomat**, **sage**.

See also: [spec.md](./spec.md) (ontology lock), [plan.md](./plan.md) (inventory + API scope).

---

## Shaman — felt field, emotional signal

**What the Narrative OS spec is doing**

- Names a **world shell** so the product is not a “haunted CMS wearing a wizard hat.” Library / Dojo / Forest / Forge give players a **felt sense of place** before they touch campaign artifacts.
- Positions **mythic language** (spaces, transitions) as first-class, so the UI reads as **moving through something** rather than administrating content.

**What is actually happening in the repo today**

- Strong **throughput** language (Wake Up / Clean Up / Grow Up / Show Up) on [`/game-map`](../../../src/app/game-map/page.tsx) and in [player-main-tabs](../player-main-tabs-move-oriented-ia/spec.md).
- **Vault** and **charge** flows carry much of the emotional truth (`/hand`, `/capture`, shadow 321) but are framed as **possession studio**, not “Forge” by name.

**Gaps and distortions**

- Without a **unified baseline loop** and real starter content per space, the new shell risks **empty theater** — pretty nodes with no heat.
- Two metaphors ( **moves** vs **spaces** ) can split the felt field if not integrated (see spec ontology).

**Direction**

- Anchor each space to **concrete** existing flows (plan inventory) so Shaman signal is **honest**: Library = wiki/library reads; Forge = capture + 321 + hand metabolization; etc.

---

## Regent — rules, sovereignty, clarity

**What the Narrative OS spec is doing**

- **Campaigns seed in; they do not own the map.** Clear jurisdiction: overlay model, per-space APIs.
- **Playable without campaign** — baseline rules must exist for “empty” instance.

**What the repo does today**

- **Top nav** ([`NavBar`](../../../src/components/NavBar.tsx)) is the **law of the land**: Now / Vault / Events / Play. Permissions and auth gates follow these routes.
- **Instance / campaign** state (`getActiveInstance`, hubs, boards) already splits “residency” from personal play in places.

**Gaps**

- Adding a **second primary model** (four spaces) without locking **who owns navigation truth** creates Regent debt: players may not know whether **tab** or **space** is “where I am.”
- **Spec resolution:** Top nav unchanged in v0; **Game Map** screen owns the **space** model for world exploration.

**Direction**

- Document **permissions** on new APIs same as existing patterns (session, player id). Keep **one** answer for “primary shell” until a deliberate nav redesign ships.

---

## Challenger — friction, honesty

**What the Narrative OS spec is doing**

- **Challenges campaign-first UI creep** by insisting the **setting** (Narrative OS) is not the **module** (campaign).
- Demands **real** play without campaign — forces honest baseline content.

**What the repo rewards**

- Campaign surfaces are rich (hub, board, CYOA, events). Easy to ship **another** campaign feature instead of **world shell** depth.

**Gaps**

- Full endpoint grid in the download prompt is **large**; pretending to implement everything in v0 avoids the **honest** cut: shell + seams + one sharp loop.

**Direction**

- Use [plan.md](./plan.md) **defer/mock** tags ruthlessly. Prove **one** overlay path and **one** cross-space loop before scaling APIs.

---

## Architect — structure, dependencies

**What the Narrative OS spec is doing**

- **Domain layer** (spaces, transitions, overlays) + **space services** + **UI shell** + **baseline seed** — API-first.

**What exists**

- [`/game-map`](../../../src/app/game-map/page.tsx): **static** `MAP_SECTIONS` organized by **move**, not space — no `SpaceId`, no `WorldMapState`.
- **Partial** APIs: [`/api/library/search`](../../../src/app/api/library/search/route.ts), [`/api/guidance`](../../../src/app/api/guidance/route.ts), adventures APIs, admin forge — **not** unified under `/api/world/*`.

**Gaps**

- **Migration path:** refactor static map config → **data-driven** `GET /api/world/map` over time.
- **Dojo** has no single route; must be **composed** from hand moves + character creator + registry (plan inventory).

**Direction**

- New module `src/lib/narrative-os/` for types and deterministic recommendations; thin route handlers; **avoid** god-object world endpoint.

---

## Diplomat — We-space, campaigns, others

**What the Narrative OS spec is doing**

- **Overlays** tie campaigns to **spaces** without a fifth nav item — good for residency and shared play.
- Forest space implies **multiplayer / field**; v0 non-goals cap depth.

**What exists**

- [`/event`](../../../src/app/event/page.tsx), campaign hub, board, marketplace — **social/campaign** surfaces.
- [game-map-gameboard-bridge](../game-map-gameboard-bridge/spec.md) links map metaphor to board.

**Gaps**

- Risk of **duplicate “campaign home”** if Narrative OS **and** hub both claim **primary** story. Spec AC9: overlays **complement** hub/event, not replace them.

**Direction**

- Overlays: **badges and featured rows** inside space homes; deep link into existing campaign routes.

---

## Sage — integration, meta-pattern

**What the Narrative OS spec is doing**

- **NUI over GUI** and **play without campaign** are **integration moves**: one architecture for story and product (AQAL / deftness alignment with [CLAUDE.md](../../../CLAUDE.md)).

**Relation to player-main-tabs**

- Both want **orientation** and **throughput**. **Sage synthesis:** **Tabs = app topology** (Now/Vault/Play/Events); **Spaces = world topology** (L/D/F/F); **Moves = developmental flow** (WCGS). None negates the others if the ontology is explicit ([spec.md](./spec.md)).

**Gaps**

- If implementation collapses spaces into **generic feature pages**, Sage is lost — the shell becomes **taxonomy**, not **world**.

**Direction**

- Keep **narrative headers and transition copy** as first-class data (even if deterministic strings in v0).

---

## Synthesis table — gap → mitigation → priority

| Gap | Mitigation | Priority |
|-----|------------|----------|
| Spaces vs moves confusion | Ontology subsection in spec.md; Game Map space-first + optional move tags | P0 |
| No `/api/world/map` | Phase 1: implement minimal GET handlers | P0 |
| `/game-map` move-only | Refactor to four space regions + inventory deep links | P0 |
| Dojo not a single route | Dojo “home” = composed links + `GET /api/dojo/home` aggregator | P1 |
| Forge vs Vault overlap | Forge space points **into** capture/321/hand; no duplicate Vault | P1 |
| Campaign vs shell competition | Overlay model + AC9 | P1 |
| Endpoint sprawl | plan.md v0/mock/defer discipline | P0 |
| Empty theater | Baseline seed package + AC7 loop in tasks | P1 |

---

## Optional follow-up

- After drafts stable: `sage_consult` (bars-agents MCP) for copy/integration review per [game-master-agents](../../../.cursor/rules/game-master-agents.mdc).
