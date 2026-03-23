# Sage + Architect consult — Charge move alignment, events (Partiful), vibeulons, Bruised Banana

**Purpose:** Human-readable synthesis for alignment with [CLAUDE.md](../../CLAUDE.md) (Integral / Deftness), [charge-capture-personal-move-commitment](./spec.md), and residency throughput.  
**Use:** Paste into `sage_consult` (bars-agents) or strand for a **second pass** with live stack context; this file is the **offline** anchor.

---

## 0. Product decision (confirmed)

**Capture = intent · 321 = refinement**

- **Charge capture** commits *direction* — which of the four moves you’re standing in *now*, plus emotion/voltage. That is **declared intent** for the system (templates, ceremony, first-pass suggestions).
- **321** refines *meaning* — shadow, witness, aligned action. Output should **override or narrow** quest copy / quest grammar payload, not necessarily replace move unless the player **explicitly** changes stance post-321.
- **Implementation rule:** Persist `personal_move` on the charge BAR at capture; persist **321 refinements** on `Shadow321Session` / quest wizard prefill; merge policy: **321 refines title/description/metadata; move defaults from charge unless 321 UI offers “I’m in a different move now.”**

---

## 1. Architect — “How should event / RSVP attach so ‘this quest counts toward event X’?”

**Design goal:** *Structure without premature coupling.* The residency (Bruised Banana) already has a **first-class home** in the DB: `Instance`, `AppConfig.activeInstanceId`, `campaignRef`, Kotter, gameboard. **Events** (Partiful or otherwise) are **time-bound social shells** around that field — they should **point at** the campaign, not duplicate it.

**Recommended stack (v1 → v2):**

| Layer | Role | Why |
|-------|------|-----|
| **Admin-configured `Instance`** | Canonical “this fundraiser / residency” | Already drives hub, board, goals, `getActiveInstance()`. **“Counts toward BB”** = placement with `campaignRef` + instance membership, not a new identity model. |
| **`EventCampaign` / event artifacts** (existing engine) | Link a **calendar / Partiful-shaped event** to an `Instance` | Keeps “April 4 dance” as an **artifact** with RSVP semantics without putting RSVP on every Player row. |
| **Player metadata (optional)** | `storyProgress` or small JSON: `lastEventSlug`, `rsvpSource` | **Attribution & analytics** (“came from Partiful link”) — **not** the primary key for whether a **quest** counts. Quests count via **placement** + **instance**, not via “player tagged with event.” |
| **Invite link query params** | `?ref=bruised-banana`, `?event=…` | Cheap routing + analytics; **docs-only hooks** for Partiful until an API exists. |

**Architect answer in one line:**  
> **Bind quests to `Instance` + `campaignRef` (and gameboard/thread placement). Bind Partiful *events* to that same `Instance` via event-artifact / `EventCampaign` patterns; use player fields only for attribution, not for core eligibility.**

**Sage check:** Avoid making “RSVP” a second currency of belonging. **Belonging** = participation in the **field** (instance + visible progress); RSVP is **door**, not **throne**.

---

## 2. Sage — “Should move affect vibeulon amount, metadata, or labels only?”

**Design goal:** *Energy is real; gaming the meter is not.* Vibeulons are **recognition of transformation work**, not a slot machine.

**Recommended phased policy:**

| Phase | Move affects | Rationale |
|-------|----------------|-----------|
| **v1** | **Metadata + labels + analytics** (`VibulonEvent.notes` / JSON metadata: `personal_move`, `source: charge|321`, `campaignRef`) | Honest traceability; no economy drift; supports GM / Sage reports later. |
| **v2** | **Small multipliers or caps by move** (e.g. Show Up mint floor for collective placement) | Only after telemetry shows abuse isn’t dominating; **Regent** should review amounts. |
| **Avoid (until proven)** | Large amount swings by move | Invites optimization over embodiment; contradicts Deftness. |

**Sage answer in one line:**  
> **Record the move on mint always; change amounts only when the collective economy story is ready — otherwise you train the wrong god.**

---

## 3. Active Bruised Banana instance (code reference)

- **`getActiveInstance()`** — [`src/actions/instance.ts`](../../src/actions/instance.ts): `AppConfig.activeInstanceId` → `Instance`, else latest `isEventMode` instance.
- **Default campaign ref** — Many routes default `bruised-banana` when URL has no `ref` (e.g. campaign hub, BBMT guidance).
- **Milestone / placement** — [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md), [`getCampaignMilestoneGuidance`](../../src/actions/campaign-milestone-guidance.ts).

**Alignment:** Charge → 321 → quest should **resolve `campaignRef`** from **active instance** when the player is placing toward the residency, with explicit override if multi-campaign.

---

## 4. Sage — Whole-thread alignment (this slice of the project)

**Integral lens (AQAL):**

- **I (intent):** Capture move + honest charge text.  
- **We (field):** Instance, event, gameboard, Partiful as **gathering**, not scoreboard.  
- **It (system):** Persist move + merge 321; wire placement to `Instance`.  
- **Its (culture):** Copy that never shames; vault limits stay real.

**Risk to name:** “Feature creep” disguised as alignment — **Challenger** asks: are we building **throughput** or **more UI**? **Answer:** One vertical slice: **capture move → visible on quest → optional place on BB board** before Partiful API.

**Next Sage prompt (for MCP):**  
> Given `charge-capture-personal-move-commitment` + `bruised-banana-milestone-throughput`, list **three** acceptance tests that prove **campaign lands** for a player who did charge → 321 → quest → gameboard — without requiring Partiful.

---

## Changelog

| Date | |
|------|--|
| 2026-03-22 | Initial consult doc; capture=intent, 321=refinement; Architect event binding; Sage vibeulon policy. |
