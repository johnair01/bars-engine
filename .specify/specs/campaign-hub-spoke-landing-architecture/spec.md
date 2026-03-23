# Spec: Campaign hub, spokes, CYOA landings (cards), I Ching order

**Status:** Spec kit — architecture locked from product interview (hub → CYOA → landing rooms). **MVP shipped:** `/campaign/hub`, persisted `Instance.campaignHubState`, `/campaign/landing`.  
**Ops track (Apr 4–5 residency):** [TEST_PLAN_PARTY_AND_INTAKE.md](./TEST_PLAN_PARTY_AND_INTAKE.md) — **BB-APR26** (1.16.2) **[x] Done** in [BACKLOG.md](../../backlog/BACKLOG.md).  
**Relates to:** [campaign-kotter-domains](../campaign-kotter-domains/spec.md), [campaign-domain-decks](../campaign-domain-decks/spec.md), [vault-page-experience](../vault-page-experience/spec.md) (vault limits), [vault-compost-minigame-modal](../vault-compost-minigame-modal/spec.md) (modal compost on journey), [scene-atlas-game-loop](../scene-atlas-game-loop/spec.md) (I Ching cadence patterns), [bar-quest-generation-engine](../bar-quest-generation-engine/spec.md) (`emotionalAlchemy` on proposals), [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) (player-visible milestone progress + guided next actions into hub/board/quests), narrative / emotional alchemy (`src/lib/quest-grammar/emotional-alchemy.ts`, `src/lib/alchemy/`).

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
| **Campaign creation** | Creator establishes a **campaign deck** (choose **52** or **64** topology). Deck + period bundle define which “card” each landing is. |
| **CYOA on spokes** | **Epiphany-bridge**-style scripts: **personal** inner work / clarity path that **bridges** the player from hub toward **collective milestones** (not generic dungeon crawl). |
| **Milestones** | **Campaign creator** defines milestones (v1: **interview flow**, 321-like depth but **milestone-focused** — meaningful, verifiable collective beats). |
| **CYOA inventory gate** | **Hard block** when the next emission would violate **vault caps**. Player is prompted to **compost** via **[vault compost mini-game in a modal](../vault-compost-minigame-modal/spec.md)** — **stay on the journey** (no requirement to leave for `/hand/compost` only). After modal completion, **retry** the gated CYOA step. |
| **CYOA progress persistence** | **Tension:** the **emotional / alchemy state** at **path entry** can change **which routes are valid**; naively saving mid-path can strand or wrong-foot players who return in a different state. **v1 options (pick in implementation):** (A) **Session-only** — no server checkpoint mid-spoke; losing tab = restart spoke (short spokes mitigate). (B) **Checkpoint + revalidate** — persist passage id + **re-run branch eligibility** on resume from **current** alchemy snapshot (may alter visible choices). (C) **Resume only if entry snapshot matches** within defined tolerance. Default recommendation: **(B)** for longer spokes once modal + gates exist; **(A)** acceptable for MVP short graphs. |
| **I Ching cadence** | **One cast per period for the whole campaign** (field-level assignment of hexagram order for the 8 landings). Not per-player per-spoke for this layer. |
| **Emotional alchemy** | Spoke paths (and downstream nodes) are **alchemy-aware**: the **system** tracks (and the **player** can be shown) the **alchemy journey** from **hub → through spoke → next node** (continuity for routing, NPC tone, quest grammar, proposal `emotionalAlchemy` JSON). |
| **Early CYOA beats** | First passages: **choose move** (Wake / Clean / Grow / Show) + **choose Game Master face** — seeds downstream content and alchemy context. |
| **Landing presence** | End state: see **other players** who reached this landing + **NPCs** anchored to path/room. |

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

**Strand consult (Bruised Banana runway):** [STRAND_CONSULT_BRUISED_BANANA.md](./STRAND_CONSULT_BRUISED_BANANA.md)  
**QA + party invite + intake:** [TEST_PLAN_PARTY_AND_INTAKE.md](./TEST_PLAN_PARTY_AND_INTAKE.md) · **Partiful copy:** [docs/events/bruised-banana-apr-2026-partiful-copy.md](../../docs/events/bruised-banana-apr-2026-partiful-copy.md) · **BAR invite CYOA MVP:** [EVENT_INVITE_BAR_CYOA_MVP.md](./EVENT_INVITE_BAR_CYOA_MVP.md)

---

## References

- Kotter × domain matrix: [campaign-kotter-domains](../campaign-kotter-domains/spec.md).  
- Domain decks / gameboard draw: [campaign-domain-decks](../campaign-domain-decks/spec.md).  
- Vault limits copy and behavior: [vault-page-experience](../vault-page-experience/spec.md), `src/lib/vault-limits.ts`.  
- Modal compost (stub): [vault-compost-minigame-modal](../vault-compost-minigame-modal/spec.md).  
- Emotional alchemy in quests: `emotionalAlchemy` in bar-quest proposals; `src/lib/quest-grammar/emotional-alchemy.ts`.
