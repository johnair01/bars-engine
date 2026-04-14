# MTGOA Chapter 1 Demo — Acceptance Contract

**Drafted**: 2026-04-11  
**Ship target**: 2026-05-11 (30 days)  
**Status**: Active gate document  
**Integrating Sage**: Wendell  
**Source**: 6-face council session 2026-04-11; design conversation following decision to make spatial world the first-class player experience

---

## Purpose of This Contract

This document is the **gate** for what ships in the next 30 days. It is not a spec. It is a covenant.

When the team is tempted to add scope, they read this contract and say no. When the team is tempted to cut something essential, they read this contract and refuse. When a feature is in question, the answer is in this contract.

This contract supersedes optimistic timelines, side-quest features, and infrastructure work that does not serve the chapter 1 demo.

---

## What Ships

**The literal artifact**:

> Chapter 1 of *Mastering the Game of Allyship*, rendered as a single-player spatial walkthrough experience, accessible from the Bruised Banana spatial world via the existing MTGOA Organization sub-hub binding, producing at least one player_response BAR that is correctly tagged with the chapter, the book, the MTGOA Organization campaign, and the Bruised Banana parent — and that BAR contributes to a real Chapter 1 milestone whose progress is visible in the Mastering the Game of Allyship Book/Game hub view.

**Decomposed**:

1. **Architecture wiring (4 levels of nesting)**:
   - Bruised Banana → MTGOA Organization (already exists)
   - MTGOA Organization → MTGOA Book/Game (new — must build)
   - MTGOA Book/Game → Chapter 1 (new — must build)
   - Chapter 1 → spatial walkthrough rooms (new — the demo content)

2. **Chapter 1 spatial experience**:
   - At least one MTGOA Book/Game spatial clearing (visually distinct from BB and from MTGOA Organization)
   - At least one Chapter 1 spoke clearing (or a sequence of rooms representing the chapter's narrative beats)
   - The 6 named NPCs available where appropriate, with chapter-specific dialogue overrides
   - Walkable, navigable, with the same control scheme as the existing spatial worlds

3. **Chapter 1 narrative content**:
   - The Call to Play moment from chapter 1 of the book, rendered as in-world experience
   - Player makes their first move (a real BAR creation moment)
   - Player meets at least one face NPC and engages with their face moves
   - Player exits the chapter with a tagged BAR in their hand

4. **Milestone wiring (the proof that the chapter is a spoke)**:
   - At least one MTGOA Book/Game milestone exists for Chapter 1
   - The BAR created during chapter 1 contributes to that milestone
   - Milestone progress is visible in the Mastering the Game of Allyship Book/Game hub view (does not need to be visible in the BB hub for the demo — wiki link is sufficient there)

5. **Felt-continuity infrastructure**:
   - The World State Provider (spec 1.40) is built and used by all new chapter 1 rooms
   - Carrying a BAR through chapter 1 rooms does not require URL hacks or state-threading
   - Selected face persists across all chapter 1 room transitions
   - The HUD never blinks or resets when navigating between chapter 1 rooms

6. **Wiki callouts for orientation**:
   - Players entering chapter 1 see at least one wiki callout link explaining what MTGOA Organization is
   - Players completing chapter 1 see at least one wiki callout link explaining how their work contributes to Bruised Banana
   - Wiki content does not need to be authored from scratch — links to existing wiki pages are sufficient

---

## What Does NOT Ship

These are explicitly out of scope. The team is forbidden from spending demo-window time on them.

| Item | Why deferred |
|------|--------------|
| **Bounded hand model (spec 1.37)** | Loose hand is fine for single-player demo. Bounding can ship after we have player feedback on what scarcity should feel like. |
| **Save state ceremony + departure modal (spec 1.38)** | A single `lastRoomSlug` field on player record is enough for the demo. Full save state spec ships post-demo. |
| **Hand → Vault rename (spec 1.39)** | Cosmetic. The demo plays through `/world/...` and never directly references `/hand` or `/vault`. Rename ships when there's calendar slack. |
| **Multiplayer presence / Stage 3 infrastructure** | Demo is single-player. No WebSockets, no server-side player session model, no live presence. Ships only when actual multiplayer is needed. |
| **Visual design language per campaign (full system)** | Chapter 1 needs ONE visually distinct space (the MTGOA Book/Game clearing). Not a full design language. The full system ships post-demo. |
| **Spatial size taxonomy (small/medium/large/enormous)** | Reuse existing room sizes. Don't redesign the spatial scale system. |
| **Chapters 2–12** | Out of scope. Chapter 1 only. The chapter-spoke template (1.41) makes 2–12 cheaper later, but they do not ship now. |
| **Authoring tools for non-engineer chapter creation** | Chapter 1 is hand-authored by the team. Tooling for future chapters is post-demo work. |
| **NPC trial CYOAs for the other 5 NPCs** | Only Ignis has an authored trial. The other 5 stay at "Choose your move" only. Trials for others ship later. |
| **Refactoring existing BB or MTGOA Organization spaces to use the provider** | Only chapter 1 rooms use the new provider. Existing spaces keep their current state model. We migrate them after the demo proves the pattern. |
| **Vault BAR overflow / compost UX** | The hand stays loose for the demo. Overflow is not a demo concern. |
| **Mobile-specific layout fixes beyond what already works** | Demo target is desktop. Mobile is a known gap, not a demo blocker. |

When the team is tempted to add anything from this list, the answer is no. The integrating Sage (Wendell) is the only person who can authorize a scope change, and only if doing so is in service of the covenant test below.

---

## The Covenant Test

The demo is shipped when, and only when, the following are simultaneously true:

### Test 1: Felt Continuity

A first-time reader of chapter 1 walks through the demo end-to-end without ever feeling the world forget them.

Specifically:
- The carrying indicator (when carrying a BAR) **never blinks** during a room transition
- The selected face NPC indicator **never resets**
- The player avatar never disappears or repositions unexpectedly
- The HUD never reloads with a flicker

This is testable: walk through 5 chapter 1 room transitions while carrying a BAR. If anything in the above list happens even once, the covenant is not met.

### Test 2: Architecture Wiring

The 4-level nesting is real. A BAR created in chapter 1 has, in the database:
- `campaignRef = 'mtgoa-chapter-1'` (or equivalent)
- `agentMetadata.chapterRef = 'mtgoa-chapter-1'`
- `agentMetadata.bookRef = 'mtgoa-book'`
- `agentMetadata.orgRef = 'mtgoa-org'`
- `agentMetadata.parentCampaignRef = 'bruised-banana'`

OR the equivalent representation that allows milestone roll-up to traverse the chain. The exact field names are negotiable; the **traversability** is not.

### Test 3: Milestone Visibility

After playing chapter 1 and creating a BAR, the player can navigate to the Mastering the Game of Allyship Book/Game hub and **see** that their BAR contributed to a specific Chapter 1 milestone, with progress incremented.

This proves that chapter 1 is not decorative — it is a working chapter-spoke that produces real campaign progress.

### Test 4: The Reader's Test

A reader of the book — someone who has read chapter 1 in print or PDF and is encountering the demo for the first time — completes the demo and says, in some form: **"That felt like the chapter."**

Not "that was a cute web app." Not "that was a Pokemon mod." Not "that was a clever interpretation." **It felt like the chapter.** The covenant is met when the medium and the message are inseparable for the reader.

This test is qualitative and ultimately judged by Wendell as Sage. But it must be asked of at least 3 actual readers before the demo is declared shipped.

---

## Team Ownership (by Face)

Six people, six faces, five concrete workstreams + integration.

| Face | Owner | Owns | Primary deliverable |
|------|-------|------|---------------------|
| **Sage** | Wendell | Integration. The covenant. Cross-team unblocking. Final go/no-go on scope changes. Vision continuity across the demo and the larger project. | The contract is honored. The team is unblocked. The covenant is met. |
| **Shaman** (Kaelen-coded) | (team member) | Chapter 1 narrative authoring. Twee passages. NPC dialogue overrides for chapter 1 context. The threshold rituals. The voice of the book in the spatial experience. | Chapter 1 narrative content, ready for spatial integration by week 3. |
| **Challenger** (Ignis-coded) | (team member) | Demo execution edge. The no-list. Scope policing. Daily standup of "what got cut today." The person who reads this contract aloud when the team is tempted to add. | A weekly velocity report. Zero scope creep. The team finishes what they start. |
| **Architect** (Vorm-coded) | (team member) | The four-spec infrastructure builds — provider (1.40), bounded hand (1.37, deferred), save state (1.38, deferred), rename (1.39, deferred). Schema. Server actions. Migration paths. The structural lattice. | Spec 1.40 (provider) shipped by end of week 1. Wiring for the 4-level nesting closed by end of week 1. |
| **Regent** (Aurelius-coded) | (team member) | The acceptance contract (this document). Milestone wiring. The structural rules of how chapter 1 rolls up to MTGOA Book/Game → MTGOA Org → BB. The roll-up plumbing. The BAR-to-milestone-to-progress-display chain. Verification of Test 2 and Test 3 of the covenant. | A working roll-up: BAR planted in chapter 1 → milestone progress visible in MTGOA Book/Game hub. Verified by week 3. |
| **Diplomat** (Sola-coded) | (team member) | Playtesting. Felt-experience checks. Verification of Test 1 (felt continuity) and Test 4 (the reader's test). Coordination across the team. Catching the moments where the world feels like it forgot the player. Inviting at least 3 readers for Test 4. | Daily playtest log starting week 2. Reader test results week 4. |

**Wendell (Sage)** holds the integrating role. When two faces conflict, Sage decides. When the team needs to decide whether to ship or hold, Sage decides. The other five faces are autonomous within their domain but accountable to the contract.

---

## Sequence and Timeline

### Week 1: Foundation
- **Architect**: Build minimal World State Provider (spec 1.40). Mount at `/world/[instanceSlug]/layout.tsx`. Migrate `carryingBarId` and `selectedFace` into provider.
- **Architect**: Close the 4-level nesting wiring — create MTGOA Book/Game instance + spatial clearing, bind it to MTGOA Organization, prepare Chapter 1 sub-hub binding.
- **Shaman**: Begin chapter 1 Twee authoring in parallel.
- **Regent**: Define the milestone schema for Chapter 1. Author the roll-up plan.
- **Diplomat**: Define the playtest checklist.
- **Challenger**: Daily contract review, prevent scope drift.

### Week 2: Build
- **Architect**: Build chapter 1 spatial rooms (3-5 rooms). Wire them to the provider.
- **Shaman**: Continue chapter 1 narrative; integrate into the spatial rooms as Twee passages and NPC dialogue context overrides.
- **Regent**: Implement the milestone roll-up plumbing. BAR created in chapter 1 → MTGOA Book/Game milestone progress visible.
- **Diplomat**: Begin daily playtests of what's been built so far. Log felt-experience issues.
- **Challenger**: Cut anything that drifts from the contract.

### Week 3: Integration
- **Shaman**: Final narrative polish.
- **Architect**: Performance pass on the provider. Ensure no flicker on transitions.
- **Regent**: Verify Test 2 and Test 3 — wiring and milestone visibility both functional.
- **Diplomat**: End-to-end playtest sessions. Catch every felt-discontinuity.
- **Challenger**: Bug triage. Cut features if needed to hit the date.

### Week 4: Ship
- **Diplomat**: Reader testing — invite at least 3 readers for Test 4.
- **Whole team**: Bug fixes from reader feedback.
- **Sage**: Final go/no-go.
- **Whole team**: Ship.

---

## Rollback Plan

If by end of week 3 the covenant test cannot be met, the integrating Sage may invoke one of the following:

1. **Cut a chapter beat** — narrative is shortened to a section of chapter 1 instead of the full chapter
2. **Cut a room** — spatial sequence is condensed to fewer rooms
3. **Cut milestone wiring** — chapter 1 BAR is created but milestone roll-up is stubbed; demo ships as visual prototype only (this is the most degraded version of the covenant; avoid if possible)
4. **Slip the date** — ship date moves to week 5 or later

These are listed in order of preference. Cutting a chapter beat is preferred over slipping the date. Slipping the date is preferred over shipping with the covenant unmet.

---

## What Comes After the Demo

When the demo ships:
- Specs 1.37 (bounded hand), 1.38 (save state), 1.39 (rename) become next-quarter work
- The chapter-spoke template (spec 1.41) becomes the basis for chapters 2–12
- Reader feedback informs which deferred specs ship next
- Stage 3 (multiplayer presence) is reconsidered based on actual player demand
- Visual design language per campaign becomes a deliberate workstream
- Spatial size taxonomy is designed deliberately rather than reactively

The demo is not the end. It is the first instance of a 12-chapter pattern. Treat it accordingly.

---

## Sign-off

This contract is active when **all six faces** have read it and agreed to its terms. The contract may be amended by the integrating Sage (Wendell) only — and amendments are timestamped and recorded in this file.

| Face | Read | Agreed | Date |
|------|------|--------|------|
| Sage (Wendell) | ☐ | ☐ | |
| Shaman | ☐ | ☐ | |
| Challenger | ☐ | ☐ | |
| Architect | ☐ | ☐ | |
| Regent | ☐ | ☐ | |
| Diplomat | ☐ | ☐ | |

When all six are checked, the demo work begins.
