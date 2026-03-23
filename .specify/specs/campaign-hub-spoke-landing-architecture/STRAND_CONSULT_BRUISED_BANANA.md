# Strand / Sage consult brief — Hub–spoke architecture × existing work × Bruised Banana events

Use this as the **input payload** for a strand consult or `sage_consult` (bars-agents / backend) when OPENAI_API_KEY is set. Paste sections below or attach paths.

## 1. What I’m building (one paragraph)

A **campaign plot engine**: players start at a **hub** (page → later map) with **8 spokes**. Each spoke is a **personal epiphany-bridge CYOA** that emits **BARs and quests** into the **vault** and ends on a **landing that is a “card”** from a **campaign deck** (creator chooses **52** or **64** topology). **I Ching**: **one cast per period** assigns **order** mapping spokes ↔ hexagrams. **Milestones** (creator interview, 321-like) advance periods. Paths are **emotional-alchemy aware** (hub → spoke → next node). **Vault is a hard gate**: if the player can’t absorb emissions, they must **compost** via a **modal mini-game** (specced separately) without abandoning the journey.

## 2. How it fits work already in the repo

- **Kotter / domains:** [campaign-kotter-domains](../campaign-kotter-domains/spec.md), [campaign-domain-decks](../campaign-domain-decks/spec.md), instance `kotterStage`, gameboard draws.  
- **Vault:** [vault-page-experience](../vault-page-experience/spec.md), caps, `/hand/compost`, `vault-limits.ts`.  
- **I Ching:** [scene-atlas-game-loop](../scene-atlas-game-loop/spec.md), cast persistence patterns, campaign context on casts.  
- **BAR → quest / alchemy:** [bar-quest-generation-engine](../bar-quest-generation-engine/spec.md), `emotionalAlchemy` on proposals, `emotional-alchemy.ts`, nation/archetype overlays.  
- **CYOA / onboarding:** cert CYOA, Twine flows, modular CYOA specs.  
- **Campaign map / UI:** [campaign-map-phase-1](../campaign-map-phase-1/spec.md).  
- **Milestone visibility + guided next actions (BB):** [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) — dashboard/hub/board CTAs so players **see** collective progress and **one** clear path forward.  
- **Integral / Deftness:** CLAUDE.md — personal vs collective throughput, compost as care.

## 3. Tension I want reflection on

- **CYOA mid-path save:** Emotional state at **entry** can change **which routes exist**. Options: (a) **session-only** (no save), (b) save position but **re-validate branches** on resume from current alchemy snapshot, (c) save only with matching entry snapshot. Ask: what best serves **integrity of the inner journey** vs **UX friction**?

## 4. Bruised Banana residency — desired output

**Question for the consult:** Given this architecture, what **concrete event sequence** (player-visible **events**, **dates or phases**, **hub/spoke** usage, **milestones**, **I Ching period ritual**, **vault/compost** touchpoints) would **ship** Bruised Banana as a **living residency** — not just a static campaign page? Tie suggestions to **existing** BB instance artifacts (fundraiser, quest map, allyship domains) where possible.

## 5. Canonical spec path

Full architecture: [spec.md](./spec.md). **Campaign lands (player guidance):** [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md).

## 6. Ask line (short)

> Sage/strand: stress-test this hub–spoke–card landing model against our stack; name gaps, sequencing risks, and a **minimum viable Bruised Banana residency runway** (events + milestones + one period of 8 landings) that we could implement without boiling the ocean.

## 7. Bruised Banana instance IDs (refresh per environment)

Run:

`npx tsx scripts/with-env.ts "npx tsx scripts/list-bb-instances.ts"`

Paste the JSON into a second-pass Sage prompt. **Sage output (pass 2):** [STRAND_OUTPUT_SAGE_BRUISED_BANANA_PASS2.md](./STRAND_OUTPUT_SAGE_BRUISED_BANANA_PASS2.md).

## 8. Challenger balance (narrative stress-test)

`challenger_propose` MCP only returns **canonical move JSON** (not prose). For **Challenger-voice critique** of Sage, use **`sage_consult`** with prompt: *“Answer only as the Challenger…”*. **Output:** [STRAND_OUTPUT_CHALLENGER_BALANCE.md](./STRAND_OUTPUT_CHALLENGER_BALANCE.md).
