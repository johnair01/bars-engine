# Vault Page (`/hand`) — Analysis: Style Guide, Six Faces, Compost Game

**Canonical implementation spec:** [spec.md](./spec.md) · [plan.md](./plan.md) · [tasks.md](./tasks.md) · **Place model:** [VAULT_NESTED_ROOMS.md](./VAULT_NESTED_ROOMS.md)

**Scope:** Player-facing **Vault** at `src/app/hand/page.tsx` (title: “Vault”, tagline: “Everything you’ve built.”).  
**Note:** This document is supporting analysis. For multi-agent synthesis via **bars-agents MCP** (`sage_consult`), run with `OPENAI_API_KEY` and point prompts at this file + `src/app/hand/page.tsx`.

---

## 1. Style guide alignment (app)

**Canonical reference:** [UI Style Guide](/wiki/ui-style-guide) (`src/app/wiki/ui-style-guide/page.tsx`)

| Principle | Vault today | Gap |
|-----------|-------------|-----|
| **Uncluttered by default** | Long vertical stack: charges → quests → drafts (`StarterQuestBoard`) → face moves → invitations… | No global **counts**, **collapsible sections**, or **progressive disclosure** on Vault itself (wiki explicitly calls for collapsible Active Quests / Journeys with count badges). |
| **Summaries first** | Quest cards use `line-clamp-2`; drafts delegate to `StarterQuestBoard` | Full draft lists can still overwhelm; no “show 5 + load more” or graveyard pattern on Vault. |
| **Lists / feeds** | Multiple unbounded lists (charges `take: 10`, drafts **unbounded**) | Wiki: avoid infinite scroll for dense action content; prefer **load more** / **collapsible groups**. |
| **Voice** | [Voice Style Guide](/wiki/voice-style-guide) — presence first, economical | Header is minimal (“Everything you’ve built.”) — good; section bodies could use **one-line purpose** per block (charge vs draft vs quest) in player language. |

**Verdict:** Vault is **on-brand visually** (black, zinc, amber/purple/rose accents, uppercase section rails) but **under-aligned** with the UI guide’s **information architecture** for high-inventory players.

---

## 2. Player needs by Game Master face

| Face | What the player needs on Vault | Current affordances | Tension |
|------|--------------------------------|----------------------|--------|
| **Shaman** | Feel the **charge** and what’s alive — not a spreadsheet | Charge Captures section, `ChargeBarCard` | Many items → **signal loss**; hard to sense “what wants attention now.” |
| **Regent** | **Clear rules**: what counts as draft vs quest, what to do next | Links to Quests/BARs/Daemons, placement actions | **No caps** → law doesn’t bound inventory; cognitive overload. |
| **Challenger** | Friction named: “you can’t keep everything” | Implicit | Missing **forced tradeoffs** — no “pick what dies” moment. |
| **Architect** | **Composable structure**: slots, piles, pipelines | Threads/gameboard placement from `HandQuestActions` | Good bones; **no meta-structure** for “vault hygiene” as a system. |
| **Diplomat** | Language that **doesn’t shame** hoarding but invites **release** | Neutral copy | Opportunity: **compost** framing as care, not deletion. |
| **Sage** | **One screen story**: “where I am in my work” | Many sections | Needs a **synthesis row** (counts, stale flags, “next compost”) at top. |

---

## 3. Readability & engagement (advice)

1. **Vault header = command center**  
   - Add: **counts** (drafts, unplaced quests, charges), **staleness** (e.g. “not touched in 30d”), **one primary CTA** (e.g. “Run compost” when the feature exists).

2. **Progressive disclosure**  
   - Collapse **Private Drafts** / **Personal Quests** by default when count > N; **expand** with badge `Private drafts (12)`.

3. **Reduce parallel chrome**  
   - Top nav pills (Quests, BARs, Daemons, …) duplicate global nav — consider **shortening** to 1–2 deep links or moving to a single “Browse collection →”.

4. **Emotional cadence**  
   - Alternate **dense** (lists) with **breathing** (single sentence + primary action). Matches Voice Style Guide: **presence first**, then mechanics.

5. **Engagement loop**  
   - Surface **one** “stuck” artifact per visit (rotate) — Shaman-first, not analytics-first.

---

## 4. Core problem: too many BARs & quests

**Observed risk:**  
- Draft query has **no `take`** — unbounded private BARs.  
- Personal quests list is filtered but can still grow.  
- **Psychological:** Vault feels like **infinite inbox**, not **sacred holding space**.

**Design direction (your thesis):**

- **Hard limits** on concurrent drafts and/or unplaced quests (numbers TBD by economy + onboarding).  
- **Composting** as first-class **game verb**: break down stale items → **useful parts** (tokens, snippets, tags) + discard fluff.  
- **Repeatable “quest”**: a **Vault Compost** flow players can run whenever over cap or on a schedule — **infinitely repeatable**, ritualized.  
- **Reward layer (future):** After compost, run a **“hard compost”** job (batch organizer — sort, cluster, suggest merges) using **compost output** as input; *not* raw vault dump.

This matches **Integral** product ethos: **metabolize**, don’t hoard; **composting over necromancy** (CLAUDE.md).

---

## 5. Proposed game frame: “Vault Compost” (concept)

| Element | Description |
|---------|-------------|
| **Trigger** | Over soft cap, or player-initiated, or “stale > X days” |
| **Actions** | Select N BARs/quests → **salvage** (title snippet, tag, vibeulon shard, thread hook) → **discard** rest |
| **Feel** | **Game**: clear rules, visible rewards, maybe streaks / “clean vault” badge |
| **Output** | **Compost ledger** (structured) → feeds **organizer pipeline** |
| **Organizer (later)** | AI/rules pipeline to propose groupings, merges, archive — **only** after compost reduces noise |

---

## 6. Recommended spec kit follow-ups

| Spec / artifact | Purpose |
|-----------------|--------|
| `vault-page-experience/spec.md` | Caps, compost loop, UX states |
| `vault-compost-game/spec.md` | Repeatable quest, rewards, ledger schema |
| `player-inventory-limits/spec.md` | Prisma / enforcement (if caps persist server-side) |

---

## 7. Sage consult (bars-agents MCP) — synthesis

**Tool:** `sage_consult` on `project-0-bars-engine-bars-agents` (same prompt as §1–5 above, condensed).

| Field | Value |
|--------|--------|
| **consulted_agents** | Shaman, Regent, Challenger, Architect, Diplomat |
| **discerned_move** | `wake_up` |
| **legibility_note** | “Wake up” = breadth + emergent action — fits resetting baseline player experience and style-guide alignment. |

**Synthesis (verbatim from MCP):**

> Based on the synthesis across the Six Faces and analysis of the Vault page at `/hand`, here are the prioritized product decisions, identified risks, and a proposed next 90 days sequence to enhance player experience and alignment with the UI style guide.
>
> ### Prioritized Product Decisions
>
> 1. **UI Style Guide Alignment** — Develop a detailed adherence plan: collapsible sections, “show 5 + load more”; Vault header as command center (counts, staleness, primary CTA “Run compost”).
> 2. **Vault Inventory Caps and Composting Game Loop** — Hard limits on BARs/quests; compost ledger integrated as a repeatable cycle for resource management.
> 3. **Emotional and Structural Engagement** — Progressive disclosure; emotional cadence (breathing room); rotate one “stuck” artifact per visit.
>
> ### Identified Risks
>
> - **Overwhelming complexity** — New systems must stay intuitive; clear caps and pathways.
> - **Technical hurdles** — Sync/query performance (note: Sage echoed “failed delegations” language; validate against real backend metrics when implementing).
>
> ### Next 90 Days Sequence
>
> - **0–30d:** Audit UI; ship initial style-guide changes; scaffold caps + compost action quorum (wording as in Sage output).
> - **30–60d:** Player-test compost loop; harden backend reliability for vault flows.
> - **60–90d:** Ship compost-ledger-oriented organizer; iterate from feedback.

**generative_deps (from MCP):** Vault player construct for compost cycle, hard limit induction.

---

## 8. Changelog

| Date | |
|------|--|
| 2026-03-21 | Initial analysis: Vault `/hand`, UI style guide, Six Faces, compost direction. |
| 2026-03-21 | Sage `sage_consult` synthesis appended (§7). |
