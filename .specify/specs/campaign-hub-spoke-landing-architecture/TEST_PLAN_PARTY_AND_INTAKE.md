# Test plan: Campaign hub MVP + party invite (4th–5th) + intake track

**Spec:** [spec.md](./spec.md) · **Shipped routes:** `/campaign/hub`, `/campaign/landing`, `Instance.campaignHubState`  
**Purpose:** Validate the player journey with **real in-game content**, ship **party invitations on time**, and **not block** light-weight scrum-intake improvements.

---

## 0. Locked decisions (interview — 2026)

| Topic | Decision |
|-------|----------|
| **Dates** | **April 4** and **April 5** — **America/Los_Angeles (Pacific)**. **Two separate drops** (not one multi-day blur). |
| **Canonical URLs (layers)** | **RSVP / logistics:** Partiful — **two events** (Apr 4 + Apr 5); paste copy from [docs/events/bruised-banana-apr-2026-partiful-copy.md](../../docs/events/bruised-banana-apr-2026-partiful-copy.md). **In-app campaign home:** **`/event`** on the BARS domain. **Optional pre-Apr5 CYOA:** public **BAR → lightweight story** — see [EVENT_INVITE_BAR_CYOA_MVP.md](./EVENT_INVITE_BAR_CYOA_MVP.md). *Physical “one QR” posters:* pick **one** primary destination (often **Partiful Apr 4**); link **`/event`** inside Partiful body or confirmation. |
| **Apr 4** | **Public** — dance party; optimize first screenfold for **strangers** (excited, low friction, clear what/when/where). |
| **Apr 5** | **Potential collaborators & donors** — tone can assume **curiosity about the engine / residency**; CTA can point to **deeper** paths (hub, board, donate) *from inside* `/event`. |
| **Intake source** | Document will be **produced in ChatGPT** — ingestion must assume **markdown-ish blocks**, not handwritten Jira. |
| **Experience bar** | Guests should feel they are entering an **amazing, exciting, playful, vibey adventure** that is about **changing how people collaborate** and **produce events and projects** — not a dry signup wall. |

**IA implication:** `/event` carries **both nights** in one scroll (or two clear sections). Use in-page anchors for sharing: `#apr-4` and `#apr-5` so the canonical URL stays one string while DMs can deep-link: `/event#apr-5`.

**Secondary URL (not poster-only):** `/campaign/hub?ref=bruised-banana` — linked **from** `/event` or post-RSVP email as *“Step into the 8 paths.”*

**Partiful ↔ engine:** Draft copy is versioned in-repo; implementation plan for **Partiful → BAR → CYOA → Apr 5** is [EVENT_INVITE_BAR_CYOA_MVP.md](./EVENT_INVITE_BAR_CYOA_MVP.md).

---

## 1. Preconditions (dev / staging)

| Step | Action | Pass criteria |
|------|--------|----------------|
| P1 | `npx tsx scripts/with-env.ts "npx prisma migrate deploy"` | No pending migrations; `campaignHubState` column exists |
| P2 | Instance for BB: `campaignRef: bruised-banana` (e.g. `bb-bday-001`) | `get8PortalsForCampaign('bruised-banana')` resolves an instance |
| P3 | `npm run seed:portal-adventure` (or `npx tsx scripts/seed-campaign-portal-adventure.ts bruised-banana`) | Adventure `campaign-portal-bruised-banana` ACTIVE; instance has `portalAdventureId` set |
| P4 | Logged-in test player | Can open `/campaign/hub?ref=bruised-banana` |

**Quick verify portal link:** On hub, “Enter CYOA →” must not say “seed:portal-adventure”. If it does, run P3 and confirm `instances.portal_adventure_id` for that row.

---

## 2. Sage playtest script (one playtester, ~25 min)

Use **`ref=bruised-banana`** unless you explicitly test another campaign.

1. **Hub load & persistence**  
   - Open `/campaign/hub?ref=bruised-banana`.  
   - Note **Spoke 1** hexagram name + GM face line.  
   - Hard refresh. **Expect:** same spoke labels (persisted draw for current `kotterStage`).

2. **Spoke → CYOA**  
   - Click **Enter CYOA →** on **Spoke 1**.  
   - Complete: portal → **Enter the room** → try **Wake Up** / **Clean Up** (redirects) or **Show Up** back to hub.  
   - **Expect:** no broken redirects; return path usable.

3. **Landing card**  
   - From hub, open **Landing card →** for **Spoke 0** and **Spoke 3**.  
   - **Expect:** `/campaign/landing?...&spoke=N` shows title/copy; BB shows **Q-MAP-(N+1)** body from `data/bruised_banana_quest_map.json`; hexagram line matches hub for that spoke.

4. **Kotter invalidation (optional / admin)**  
   - Advance instance `kotterStage` in admin (or DB) by 1, reload hub.  
   - **Expect:** **new** persisted draw (spokes can change). Document if you want different product behavior later.

5. **Board + event coherence**  
   - From hub: **Gameboard**, **Event**, **Campaign story**.  
   - **Expect:** same `ref`; no dead ends for the “party guest” mental model.

6. **Canonical URL smoke (party-critical)**  
   - Open **`/event`** logged **out** (incognito).  
   - **Expect:** Apr 4 / Apr 5 messaging visible (once copy is in `wakeUpContent` / `storyBridgeCopy` / `targetDescription` or scheduled blocks); no 500; path to **Join** or **Conclave** if you want public capture.

---

## 3. In-game content to add (minimum for “experience we’re looking for”)

**Voice:** Playful, high-energy, **adventure-first**; collaboration + event-making as the **prize**, not the homework.

| Content | Owner | Notes |
|---------|--------|--------|
| **`/event` page** | Admin (Event editor) + copy | **§0** narrative: H1 stays instance name; add **two blocks** — **Apr 4 — Dance (public)** and **Apr 5 — Collaborators & donors** with Pacific times/locations/asks. Anchors `id="apr-4"` / `id="apr-5"`. Secondary CTA: **“Enter the 8 paths (hub) →”** → `/campaign/hub?ref=bruised-banana`. |
| **Portal passage copy** | Admin / Twine | Tune `Portal_1…8` + `Room_1…8` toward **epiphany-bridge** + **party energy** (Apr 4) / **depth** (Apr 5 cohort). |
| **Drop 1 artifact (Apr 4 EOD PT)** | Comms | Primary: **Partiful Apr 4** link + copy from [bruised-banana-apr-2026-partiful-copy.md](../../docs/events/bruised-banana-apr-2026-partiful-copy.md). Include **`/event`** (or `#apr-4`) in description/confirmation for engine context. |
| **Drop 2 artifact (Apr 5 EOD PT)** | Comms | Primary: **Partiful Apr 5** link + copy from same doc. Optional **pre-experience:** BAR CYOA link per [EVENT_INVITE_BAR_CYOA_MVP.md](./EVENT_INVITE_BAR_CYOA_MVP.md). |
| **Playtest quest (optional)** | Internal | Point QA at §2 + §6. |

**Defer until after party (Sage-aligned):** full gameboard↔hub cohesion, roster on landings, vault modal gate, new CYOA graph per spoke.

---

## 4. Throughput plan: **April 4 & 5 (Pacific) — two drops**

| When (PT) | Focus |
|-----------|--------|
| **Before Apr 4** | §2 steps **1–3** + §6 **`/event` incognito**; fix blockers. Lock **Partiful Event 1** copy ([Partiful doc](../../docs/events/bruised-banana-apr-2026-partiful-copy.md)). |
| **Apr 4 EOD** | **Publish Partiful Event 1** (public dance); include **`/event`** in description or confirmation. |
| **Before Apr 5** | Lock **Partiful Event 2** + optional **BAR pre-CYOA** ([EVENT_INVITE_BAR_CYOA_MVP.md](./EVENT_INVITE_BAR_CYOA_MVP.md)). |
| **Apr 5 EOD** | **Publish Partiful Event 2**; link **`/event#apr-5`** + pre-experience when ready. |
| **After** | Hub/board polish; ChatGPT intake pipeline (§5b). |

**Biggest deadline risk:** Partiful goes live but **`/event`** 500 / no active instance / broken **`/event`** link in body — run §6 on **production** before each Partiful publish; don’t send **`/campaign/hub`** as the *only* line for Apr 4 public guests.

---

## 5. Scrum intake — **ChatGPT-generated doc** (don’t block party)

### 5a. One-page schema (paste into ChatGPT as system / first message)

Ask GPT to output **only** markdown with **repeated blocks** like:

```markdown
## ITEM
### Quote_or_note
(paste scrum line)
### Role
### Decision_or_blocker
### Suggested_artifact
(one of: event_copy | hub_copy | quest_stub | bar_stub | admin_task | defer)
### Priority
(P0_party | P1 | defer)
```

Split on `## ITEM` for scripts or manual triage. One structure no matter how messy the meeting was.

### 5b. Optional follow-up (post-party)

- Add `docs/SCRUM_INTAKE_CHATGPT_TEMPLATE.md` with the block above + one example.  
- Tiny `tsx` script: stdin → JSON rows (no DB).

**Defer:** auto-creating BARs from GPT until the template survives 2–3 sprints.

---

## 6. Sage consult output (2026-03-18, MCP)

- **7-day style sequence:** test hub MVP → draft invite → ship → monitor → post-party intake template.  
- **Test script:** landing routes, portal navigation, BB quest text alignment.  
- **Defer:** full hub/gameboard cohesion post-invite.  
- **Ingestion slice:** templated path from intake → structured summaries.  
- **Risk:** fast invite without integration testing → bugs; plan **agile hotfix** after send.  
- **Metadata:** consulted **Shaman**; hexagram **24** (attunement / timing); move **wake_up**.

Full machine-readable log can be re-run via `sage_consult` with an expanded prompt in [STRAND_CONSULT_BRUISED_BANANA.md](./STRAND_CONSULT_BRUISED_BANANA.md).

---

## 7. Tasks checklist

**Backlog:** **BB-APR26** (priority **1.16.2**) is **[x] Done** in [`.specify/backlog/BACKLOG.md`](../../backlog/BACKLOG.md). Spec tasks: [tasks.md](./tasks.md) section *Apr 2026 residency — ops & QA*. Agent prompt: [bb-apr-2026-party-ops.md](../../backlog/prompts/bb-apr-2026-party-ops.md).

### Environment & QA (engineering)

- [x] **§1** Run preconditions on **target** environment (staging then production before each Partiful publish) — see §1 table  
- [x] **§2 + §6** Execute Sage playtest + canonical URL smoke; **file GitHub/spec issues** for blockers (link issues in a comment on this file or BB-APR26 notes)  

### Content (in-engine / Twine)

- [x] Populate **`/event`** with **Apr 4** + **Apr 5** sections + anchors (`#apr-4`, `#apr-5`) — `BruisedBananaApr2026EventBlocks` when `Instance.campaignRef === 'bruised-banana'`  
- [x] **Portal copy pass** — tune `Portal_1…8` + `Room_1…8` for **Apr 4** (public / party energy) vs **Apr 5** (collaborator / depth); see §3 table  

### Comms & external (Partiful)

- [x] **Apr 4 EOD PT:** Partiful Event 1 live; body or confirmation includes **`/event`** (or `#apr-4`); copy from [bruised-banana-apr-2026-partiful-copy.md](../../docs/events/bruised-banana-apr-2026-partiful-copy.md)  
- [x] **Apr 5 EOD PT:** Partiful Event 2 live; link **`/event#apr-5`**; optional pre-experience [EVENT_INVITE_BAR_CYOA_MVP.md](./EVENT_INVITE_BAR_CYOA_MVP.md) → `/invite/bb-event-invite-apr26`  

### Intake & optional

- [x] `docs/SCRUM_INTAKE_CHATGPT_TEMPLATE.md` — ChatGPT prompt + `## ITEM` schema (§5a)  
- [ ] *(Optional)* Re-run **`sage_consult`** with §0 locked decisions in prompt for tone check on invite / Partiful copy ([STRAND_CONSULT_BRUISED_BANANA.md](./STRAND_CONSULT_BRUISED_BANANA.md))
