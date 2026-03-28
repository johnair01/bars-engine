# Spec: Campaign hub, spokes, CYOA landings (cards), I Ching order

**Status:** Spec kit — architecture locked from product interview (hub → CYOA → landing rooms). **MVP shipped:** `/campaign/hub`, persisted `Instance.campaignHubState`, `/campaign/landing`.  
**Ops track (Apr 4–5 residency):** [TEST_PLAN_PARTY_AND_INTAKE.md](./TEST_PLAN_PARTY_AND_INTAKE.md) — **BB-APR26** (1.16.2) **[x] Done** in [BACKLOG.md](../../backlog/BACKLOG.md).  
**Relates to:** [campaign-kotter-domains](../campaign-kotter-domains/spec.md), [campaign-domain-decks](../campaign-domain-decks/spec.md), [campaign-onboarding-cyoa](../campaign-onboarding-cyoa/spec.md) (unified onboarding ontology; Conclave convergence), [campaign-hub-spatial-map](../campaign-hub-spatial-map/spec.md) (hub as forest clearing + eight portals — presentation slice; site-signal 2026-03-27), [vault-page-experience](../vault-page-experience/spec.md) (vault limits), [vault-compost-minigame-modal](../vault-compost-minigame-modal/spec.md) (modal compost on journey), [scene-atlas-game-loop](../scene-atlas-game-loop/spec.md) (I Ching cadence patterns), [bar-quest-generation-engine](../bar-quest-generation-engine/spec.md) (`emotionalAlchemy` on proposals), [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) (player-visible milestone progress + guided next actions into hub/board/quests), narrative / emotional alchemy (`src/lib/quest-grammar/emotional-alchemy.ts`, `src/lib/alchemy/`).

## Purpose

Orchestrate **how players move through campaign plot**: a **hub** (page or future map) with **8 spokes**. Each spoke is a **personal CYOA** that deposits players on a **landing** that is **conceptually a card** — the same mental model as **campaign topology decks**. Campaign creators configure **one campaign deck** in either style: **52-card** (BARs-style topology) or **64-card** (8 suits × 8 — inner/outer × four moves, Kotter-aspects). **Collective** progress is paced by **milestones** and **period** boundaries; **I Ching** assigns **which hexagram names which spoke** for that period.

**Alignment (campaign lands):** Hub/spoke/landing gives **place and ritual**; [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) ensures players also see **what “forward” means** and **which primary actions** (including entering a spoke or the board) advance **Bruised Banana** collective beats — without replacing this architecture.

**Practice:** Deftness — vault capacity as honest constraint; personal CYOA vs collective field; emotional alchemy traceable across hub → spoke → next node.

---

## Resolved architecture decisions

| Topic | Decision |
|-------|----------|
| **Hub → spoke** | Player must complete a **CYOA adventure** to leave the hub on a spoke (no free teleport to landing). |
| **8 spokes ↔ 8 hexagrams** | **Draw assigns order**: one ritual cast per period yields an **ordering** of 8 hexagrams; spoke *i* maps to hexagram *order[i]* for that period (stable for the period until advance). |
| **Landings** | Landings are **cards** — same intuition as deck faces: the **room** is the **card** at that topology position for the campaign/period. |
| **Campaign creation** | Creator establishes a **campaign deck** (choose **52** or **64** topology). Deck + period bundle define which “card” each landing is. **Creator-facing copy** (story affordances + council + Diplomat user voice): [§ Deck topology: story affordances](#campaign-deck-topology-story-affordances-creator-copy). |
| **CYOA on spokes** | **Epiphany-bridge**-style scripts: **personal** inner work / clarity path that **bridges** the player from hub toward **collective milestones** (not generic dungeon crawl). |
| **Milestones** | **Campaign creator** defines milestones (v1: **interview flow**, 321-like depth but **milestone-focused** — meaningful, verifiable collective beats). |
| **CYOA inventory gate** | **Hard block** when the next emission would violate **vault caps**. Player is prompted to **compost** via **[vault compost mini-game in a modal](../vault-compost-minigame-modal/spec.md)** — **stay on the journey** (no requirement to leave for `/hand/compost` only). After modal completion, **retry** the gated CYOA step. |
| **CYOA progress persistence** | **Tension:** the **emotional / alchemy state** at **path entry** can change **which routes are valid**; naively saving mid-path can strand or wrong-foot players who return in a different state. **v1 options (pick in implementation):** (A) **Session-only** — no server checkpoint mid-spoke; losing tab = restart spoke (short spokes mitigate). (B) **Checkpoint + revalidate** — persist passage id + **re-run branch eligibility** on resume from **current** alchemy snapshot (may alter visible choices). (C) **Resume only if entry snapshot matches** within defined tolerance. Default recommendation: **(B)** for longer spokes once modal + gates exist; **(A)** acceptable for MVP short graphs. |
| **I Ching cadence** | **One cast per period for the whole campaign** (field-level assignment of hexagram order for the 8 landings). Not per-player per-spoke for this layer. |
| **Emotional alchemy** | Spoke paths (and downstream nodes) are **alchemy-aware**: the **system** tracks (and the **player** can be shown) the **alchemy journey** from **hub → through spoke → next node** (continuity for routing, NPC tone, quest grammar, proposal `emotionalAlchemy` JSON). |
| **Early CYOA beats** | First passages: **choose move** (Wake / Clean / Grow / Show) + **choose Game Master face** — seeds downstream content and alchemy context. |
| **Landing presence** | End state: see **other players** who reached this landing + **NPCs** anchored to path/room. |
| **Conclave URLs** | **`/conclave/*` is a legacy campaign entry rail** — same residency story as Bruised Banana / `campaignRef`, but implemented **before** hub/spoke and **Instance**-scoped flows were canonical. **New work** routes through **`ref`**, **`/campaign/hub`**, **`/event`**, **`/login?callbackUrl=…`** — not `/conclave/guided` as the default front door. Migration: **redirect shims** first, then CTA/redirect inventory; see [§ Conclave as legacy campaign entry](#conclave-as-legacy-campaign-entry). |

---

## Conclave as legacy campaign entry

### Why this exists in the spec

**Conclave** began as **lore and story** for the Bruised Banana residency; **mechanics** (auth, orientation, gates, spatial lobby) were wired to **`/conclave/*`** early. That created an **invisible second class of navigation** — parallel to **campaign** primitives (`Instance`, `campaignRef`, hub, spokes, donate). For **social CYOA at scale** and **Show Up → donate → return to hub**, there must be **one ontological rail**: **campaign language in URLs and redirects**, with Conclave paths **deprecated** for new entrypoints.

This section is the **product contract**; implementation tasks live in **`tasks.md`** (and may overlap [campaign-onboarding-cyoa](../campaign-onboarding-cyoa/spec.md)).

### Target principles

1. **Canonical vocabulary** — Entry, return, and “continue the residency” use **`ref`**, **`/campaign/hub`**, **`/campaign/landing`**, **`/event`**, **`/event/donate`**, **`/login`** / **`/signup`** with **`callbackUrl`** — not `/conclave/...` for new CTAs.
2. **Conclave = backward compatibility** — Existing bookmarks, certs, and old posts keep working via **HTTP redirects** (or thin pages that redirect) until traffic dies or a later phase removes routes.
3. **Do not conflate** — **`/conclave/space`** (spatial lobby) is **not** the same as **guided onboarding**; migration may **rename or re-home** spatial URLs under **`/world/...`** or a **campaign-tagged** route in a later slice — **not** in the first redirect-only slice unless explicitly scoped.
4. **Auth and orientation** — Redirect targets must **preserve** login, `returnTo` / `callbackUrl`, **`campaignRef`** application, and **orientation thread** completion; **first slice success** = no new dead ends for users on legacy URLs.

### Redirect target table (v1 contract — edit as code lands)

| Legacy path | Intended campaign-era behavior (v1) |
|-------------|-------------------------------------|
| **`/conclave`** | **302** → **`/campaign/hub?ref=bruised-banana`** (or Instance default `campaignRef` when multi-campaign; until then BB default is documented in implementation). |
| **`/conclave/wizard`** | Same as **`/conclave`** (already redirects to guided today — **collapse to same target as `/conclave`** once shim is centralized). |
| **`/conclave/guided`** | **302** → **`/login?callbackUrl=…`** encoding **`/campaign/hub?ref=…`** (or **`/campaign/initiation`** if that subsumes guided copy) **or** interim **`/campaign/...`** onboarding CYOA when that surface ships — **preserve** `returnTo`, `ref`, `step` query params in mapping spec when implementing. |
| **`/conclave/onboarding`** | Keep **controller behavior** initially; **optional** alias URL under **`/campaign/onboarding`** later. New sign-up flows should **not** hard-code this path (use dashboard / hub per [dashboard-orientation-flow](../dashboard-orientation-flow/spec.md)). |
| **`/conclave/space`**, **`/conclave/space/[mapId]`** | **No change in slice 1** unless scoped; unauth redirect today goes to **`/conclave`** — update to **login** or **hub** when `/conclave` root redirect lands, so unauth users are not bounced into a redirect loop. |

*Table values are **contract drafts** for implementers; exact query preservation (`utm_*`, `returnTo`, `ritual`) must be listed in **`plan.md`** / tasks when each row is implemented.*

### First slice success criterion (Sage consult alignment)

**Any user hitting a legacy Conclave URL used in production today completes auth and orientation paths without regression** — they may land on **hub** or **dashboard** instead of **guided**, but they do not **404**, **loop**, or **lose** `campaignRef` / return intent compared to current behavior.

### Social / promo alignment

Promotional CYOAs (many entry links) should **never** target **`/conclave/*`** as primary; they target **`/campaign/hub?ref=…`** plus **`entry` / `adventure` / UTM** params. Legacy Conclave links in old posts remain valid via redirects above.

---

## Conceptual stack

```text
Campaign
  ├─ CampaignDeck (52 OR 64 topology)     ← creator-authored backbone
  ├─ Period (Kotter theme, e.g. Create Urgency)
  │    ├─ I Ching: one cast → permutation of 8 hexagrams → spoke 0..7 mapping
  │    ├─ Milestones (creator-defined; interview-generated)
  │    └─ 8 landings = 8 card-faces (topology position + hexagram skin + copy)
  ├─ Hub
  │    └─ Spoke k → CYOA template (epiphany bridge) → Landing(card k)
  └─ Player state: vault emissions, alchemy trace, chosen move/face
```

---

## Campaign setup (creator checklist)

1. **Campaign deck** — Create/select **52** or **64** topology; bind to instance/campaign record.  
2. **Milestones** — Generate via **milestone interview**; link to period unlock rules.  
3. **I Ching** — On period start (or campaign start for period 1): **one cast**, persist **ordered list of 8 hexagram ids** for spoke mapping.

---

## Campaign deck topology: story affordances (creator copy)

**Binding rule (both topologies):** The campaign has a **fixed slot count** — **52** or **64**. Stewards **bind** content to slots over time. **Draw / eligibility uses only bound slots** (e.g. five cards bound ⇒ draw pool of five). **Unbound slots are intentional empty inventory**, not misconfiguration — same mental model as a **Pokémon or Magic loadout**: you run what you’ve put in the list.

**Implementation note:** Runtime uses a **canonical spine** (spoke index, period, instance); topology changes **labels, template families, and slot grid** — see path **B** in [CHS_RUNTIME_DECISIONS.md](./CHS_RUNTIME_DECISIONS.md) § Deck topology when that section is expanded.

### 52-slot topology — what story it’s for

Use the **52-slot backbone** when the campaign should feel like a **tight roster or a familiar pack** — episodic beats, recurring faces, troupe- or table-energy, or any arc where **each bound slot is a card you’ve actually put in play** and **empty seats mean “not in the rotation yet.”** Players experience a **deliberate loadout**: a small bound set reads as **focused**; growth means **equipping more slots**, not fixing holes.

### 64-slot topology — what story it’s for

Use the **64-slot lattice** when the campaign needs a **shared map of change** — **eight × eight** geometry aligned with **period rhythm**, **WAVE moves**, and **Kotter-aspect** language — so landings have both a **stable coordinate** on the grid and a **hexagram skin** for the period. It suits **movement** and **seasonal field** stories: same **board identity** each advance, new assignments; sparse binding is still valid — **unfilled cells are space the campaign hasn’t forged yet**, not an error.

### Council one-liners (optional UI / docs)

Short lines stewards may see beside the topology choice — **loadout framing**, not fear of picking wrong.

| Face | One-liner |
|------|-----------|
| **Alchemist** | Only what you’ve **bound** enters the reaction; the rest of the deck is **crucible you haven’t opened yet**. |
| **Sage** | **Fifty-two** is a **known pack**; **sixty-four** is a **field grid** — pick the grammar your story speaks in; the draw still honors **only what you’ve committed**. |
| **Regent** | **Under-filled decks are legitimate** — the commons are served by **honest equipment**, not by padding the list. |

### Diplomat — voice for players and stewards (after the council)

**Diplomat** follows the council lines: same truths, but **customer-care clarity** — tooltips, onboarding, in-app help, and anything that should sound like a **good host**, not a mystic or a charter. Use this voice when speaking **in the language users already use** (games, teams, seasons) without asking them to adopt BARs jargon first.

**Example blurb (topology choice — paste/adapt for UI):** *You’re picking a **deck shape**, not a difficulty. **52** feels like a **classic card roster** — great when your campaign is about **people and beats** you add over time. **64** feels like a **big shared board** — great when your campaign is about **where we are on the map** each chapter. Either way, you only **play what you’ve added**; empty slots just mean “not in the mix yet.” You’re not behind — you’re **running a lean build** until you’re ready to equip more.*

**Stable enum names (implementation):** `CampaignDeckTopology` on `Instance`: **`CAMPAIGN_DECK_52`** | **`CAMPAIGN_DECK_64`** (DB column `campaign_deck_topology`). **Player-facing labels** in admin/UI use `CAMPAIGN_DECK_TOPOLOGY_OPTIONS` in `src/lib/campaign-deck-topology.ts` and can evolve without enum changes.

---

## User stories (architecture-level)

### H1 — Spoke order from cast

**As** the campaign field, **I want** a single period cast to define **which hexagram colors which spoke**, **so** all players share the same symbolic map for that period.

### H2 — Landing is a card

**As** a player, **I want** each landing to feel like **a card in our campaign deck**, **so** deck authoring and room UX stay one mental model.

### H3 — Epiphany bridge spoke

**As** a player, **I want** the spoke CYOA to be a **personal bridge** into collective work, **so** my vault gains BARs/quests that match my inner step before the group milestone.

### H4 — Vault as hard gate + modal compost

**As** a player, **I want** a **clear stop** when my vault can’t hold the next spoke rewards, **so** I’m not silently failing — and **I want** to **compost in a modal** and **continue the same journey** without losing context.

### H4b — CYOA persistence honesty

**As** a player returning mid-spoke, **I want** my **current inner state** to **matter for which choices are offered**, **so** the path stays emotionally honest (even if that means some saved branches disappear).

### H5 — Alchemy trace

**As** the system, **I want** a **structured alchemy path** from hub through spoke to next node, **so** NPCs, quests, and generation stay consistent with the player’s emotional journey.

---

## Non-goals (this spec)

- Exact Twine file layout or MCP authoring UI (see CYOA / modular specs).  
- Replacing existing `BarDeck` / Scene Atlas; **52** here means **same class of topology** as BAR deck, not necessarily the same table.  
- Multiplayer real-time hub (future map can reuse same routes).

---

## Open questions (for tasks / follow-up interviews)

- **CYOA persistence mode**: confirm **(A) session-only**, **(B) checkpoint + revalidate**, or **(C) snapshot-gated resume** per template length and risk tolerance.  
- **64 vs 52** on same instance: one campaign one topology, or allow migration?  
- **Alchemy trace schema**: extend `storyProgress`, quest tags, or dedicated `PlayerCampaignPath` model.  
- **Epiphany bridge**: minimum template count (1 parameterized graph vs 8 bespoke).

**Runtime decisions (persistence, alchemy JSON):** [CHS_RUNTIME_DECISIONS.md](./CHS_RUNTIME_DECISIONS.md) · **Template matrix:** [TEMPLATE_INDEX.md](./TEMPLATE_INDEX.md) · **Vault gate playtest:** [PLAYTEST_VAULT_GATE.md](./PLAYTEST_VAULT_GATE.md)

**Strand consult (Bruised Banana runway):** [STRAND_CONSULT_BRUISED_BANANA.md](./STRAND_CONSULT_BRUISED_BANANA.md)  
**QA + party invite + intake:** [TEST_PLAN_PARTY_AND_INTAKE.md](./TEST_PLAN_PARTY_AND_INTAKE.md) · **Partiful copy:** [docs/events/bruised-banana-apr-2026-partiful-copy.md](../../docs/events/bruised-banana-apr-2026-partiful-copy.md) · **BAR invite CYOA MVP:** [EVENT_INVITE_BAR_CYOA_MVP.md](./EVENT_INVITE_BAR_CYOA_MVP.md)

---

## References

- Player **plant / water** campaign kernels from **hub spokes** (four move beds, first-mover anchor): [spoke-move-seed-beds](../spoke-move-seed-beds/spec.md).  
- Kotter × domain matrix: [campaign-kotter-domains](../campaign-kotter-domains/spec.md).  
- Domain decks / gameboard draw: [campaign-domain-decks](../campaign-domain-decks/spec.md).  
- Vault limits copy and behavior: [vault-page-experience](../vault-page-experience/spec.md), `src/lib/vault-limits.ts`.  
- Modal compost (stub): [vault-compost-minigame-modal](../vault-compost-minigame-modal/spec.md).  
- Emotional alchemy in quests: `emotionalAlchemy` in bar-quest proposals; `src/lib/quest-grammar/emotional-alchemy.ts`.
