# Invitation Gap Analysis — Player User Stories

**Date**: 2026-03-17
**Source**: `npm run strand:invitation` (ouroboros agents — backend offline)
**Strand**: Shaman → Diplomat → Sage synthesis

---

## System State at Time of Consultation

### What is built
- **Landing page** (logged-out home): shows 4 basic moves (Wake Up, Clean Up, Grow Up, Show Up); primary CTA is Sign Up
- **ref param attribution**: `/?ref=bruised-banana` passes through sign-up; stored as `campaignRef` in player storyProgress; post-sign-up redirects to /event
- **Forge invitation page** (/hand/forge-invitation): player with gameAccountReady can create an invitation BAR targeting a nation or school (Game Master Face); generates a unique token
- **Invite token page** (/invite/[token]): recipient lands here with forger's name shown; nation/school pre-filled from invitation target; standard sign-up form (name, email, password, nation, archetype)
- **Player-led invitation BAR**: schema has forgerId, invitationTargetType, invitationTargetId; invitedByPlayerId recorded on new player
- **Quest integration**: "Invite an Ally" quest completion can trigger forge flow; Strengthen the Residency END_INVITE branch auto-creates invitation BAR

### Known gaps / deferred tasks
1. Sign-up flow does not yet capture "interest" (domain or intention choice) — deferred in T spec
2. Forge invitation page is discoverable only from /hand (Quest Wallet) — not prominently surfaced elsewhere
3. Post-sign-up orientation: player lands on /event after sign-up but there is no explicit "first quest" prompt or clear next action
4. CYOA (Wake-Up campaign): not yet "perfected" — not the primary entry for new players; dripped to existing players
5. No analytics on invitation conversion (who clicked → who signed up → who completed onboarding)
6. Sect (sub-group) targeting for invitations is deferred

---

## Shaman Analysis — Belonging & Entry Experience

### 1. Ritual Gaps — Does Entry Feel Like a Threshold Crossing?

No. It feels transactional.

**The threshold is unmarked.**
When a new player lands on `/invite/[token]`, they see the forger's name and a standard sign-up form. The form asks for nation and archetype, but without any context for what those words mean inside this world. "Nation" and "archetype" are load-bearing mythic concepts — they are the player's first act of self-placement in the system. Presented as form fields, they become administrative data entry. The ritual moment is swallowed by the UI pattern.

**The invitation itself has no voice.**
The forger created this invitation with intention — they named a target, they extended a hand. But the recipient's landing page does not reflect that intention back to them. There is no "why you were invited" layer. The forger's gesture is invisible except for a name display. A threshold crossing requires a witness — currently the system provides none.

**Post-sign-up is a dead zone.**
The player lands on `/event` after sign-up. There is no explicit first quest prompt, no orientation, no acknowledgment that they just crossed a threshold. The system knows they are new. It knows who invited them. It knows their nation and archetype. It uses none of that to greet them as a named person entering a named world.

**The 4 moves on the landing page are abstract without stakes.**
Wake Up, Clean Up, Grow Up, Show Up — these are the cosmology, not the entry point. For someone arriving cold, these labels mean nothing until they have skin in the game.

### 2. Belonging Gaps

Belonging requires three things: **recognition** (you are seen), **placement** (you are somewhere specific), and **first act** (you did something that mattered).

- **Recognition is missing.** The system knows the forger's name and invitation target. It should speak that back.
- **Placement is underdeveloped.** Nation and archetype selection happens during sign-up — the right moment — but with no narrative scaffolding.
- **The first act is missing entirely.** After sign-up, the player is on `/event` with no clear first quest. The system has archetype, nation, invitedByPlayerId, campaignRef — and uses none of it.
- **The forger has no feedback loop.** A player who extends an invitation has no way to know if it worked.

### 3. User Stories (Shaman Lens)

**US-S1: Named arrival** — As a new player arriving via invitation link, I want to see a landing page that names who called me here and what they are building, so that I experience my arrival as an answer to a specific summons rather than a generic sign-up.

**US-S2: Placement with meaning** — As a new player choosing my nation and archetype during sign-up, I want to see a one-sentence description of each option written in the voice of the world, so that my first act of self-placement feels like a declaration rather than a form field.

**US-S3: Threshold acknowledgment** — As a new player who just completed sign-up, I want to land on a page that greets me by name, acknowledges who invited me, and gives me one clear first action that fits my archetype, so that I feel the world has received me and is already responding to who I am.

**US-S4: Forger witness** — As a player who forged an invitation, I want to receive a notification (or see a status update in my Quest Wallet) when my invitee signs up and completes their first step, so that I experience the invitation as a completed ritual act rather than a message sent into the void.

**US-S5: Orientation as first quest** — As a new player on `/event`, I want to see a pinned "First Quest" that is personalized to my archetype and nation — not generic — so that my first meaningful action in the system is legible as mine, not templated.

### 4. Unblock Priority (Shaman)

**Fix the post-sign-up landing.** When a player arrives at `/event` for the first time post-sign-up, detect `invitedByPlayerId`, `campaignRef`, `archetype`, and `nation` from their storyProgress, and render a personalized orientation block — at minimum: who called them, where they landed, and one quest to take. This does not require new schema. The data is already there.

---

## Diplomat Analysis — Connection & Invitation Flow

### 1. Invitation Flow Friction Map

**Friction Point A: The Forger's Gate is Invisible**
`/hand` requires `gameAccountReady` and redirects without explanation if the player is not ready. A player who wants to invite someone hits a redirect to `/conclave/guided` with no message explaining why or what they need to do to unlock invitation. The desire to invite and the ability to invite are disconnected with no bridge.

**Friction Point B: Forge Requires a Targeting Decision the Forger May Not Be Equipped to Make**
`ForgeInvitationForm` requires selecting a nation or school before the button becomes enabled (`disabled={isPending || !targetId}`). If the forger does not know which nation their invitee belongs to, they stall. There is no "general invitation" option.

**Friction Point C: The Invitation Artifact Has No Personal Voice**
The forge form allows a title and description, but these default to generic strings. The form does not prompt the forger to write a personal message explaining *why they are inviting this person*. The recipient sees only the forger's name with no personal testimony.

**Friction Point D: The Recipient Landing Page Drops Them Into a Form Without Context**
`InviteSignupForm` leads with "Accept Your Invitation" then immediately presents nation and archetype selects. Neither field has any explanation of what it means. A recipient who does not know this game world will not understand what they are choosing. The form also requires a password immediately — high cognitive load for someone still deciding whether to enter.

**Friction Point E: Post-Sign-Up, the Relational Thread is Severed**
After `createCharacter` succeeds, `InviteSignupForm` calls `router.push('/')` — the dashboard. There is no acknowledgment that this player arrived via invitation. The forger receives no signal. The orientation threads are assigned in the background but invisible to both parties.

### 2. Discoverability Gaps

The forge invitation feature is accessible from exactly one place: the `/hand` Quest Wallet page, as a third button in a horizontal row. It is not:

- Surfaced on the main dashboard
- Triggered by any quest completion flow a typical player would encounter naturally
- Present in any navigation element outside `/hand`
- Referenced in any visible onboarding step

The forge flow also has no shareable output beyond the raw URL — no generated message, no pre-written text the forger could paste into a text or email.

### 3. User Stories (Diplomat Lens)

**US-D1: The Impulsive Inviter** — As a player who just had a meaningful session and wants to immediately invite a friend, I want a visible "Invite Someone" action on the dashboard so that I can act on my impulse before it passes, without navigating to Quest Wallet first.

**US-D2: The Recipient Who Needs Context** — As someone who received an invite link and does not know what this game is, I want the invitation page to show me what my friend said about me and a one-sentence explanation of what I am entering, so that I feel pulled forward rather than confused by a form.

**US-D3: The Forger Who Wants to Know It Worked** — As a player who forged an invitation, I want to receive a notification or dashboard signal when my invitee accepts and creates their character, so that I know the invitation landed and can reach out to welcome them.

**US-D4: The Forger Who Does Not Know Their Friend's Nation** — As a player inviting someone from outside the existing community, I want to be able to send an open invitation that lets my invitee choose their own alignment, so that I am not blocked by a choice I cannot make on their behalf.

**US-D5: The New Player Who Was Invited** — As a player who just signed up via an invitation, I want my first screen to acknowledge that I was brought in by a specific person and show me one clear first action, so that I feel oriented and connected rather than dropped into an unfamiliar dashboard.

### 4. Unblock Priority (Diplomat)

**Give the recipient landing page a personal message and a deferred commitment option.** Add a `message` field to the forge form (personal, prompted), display it prominently on the invite landing page above the form, and send an in-system notification to the forger when the invite is accepted. These three changes close the relational loop that the current system opens but never completes.

---

## Sage Synthesis — Canonical User Stories & Prioritized Backlog

### Unified Gap List

Both analyses converged on the same structural wound viewed from different angles.

**Gap 1: The relational thread is never closed.**
The forger extends a hand. The recipient arrives. The system treats these as two unconnected events. No signal flows back. No acknowledgment flows forward. Shaman: "no witness." Diplomat: "relational thread severed."

**Gap 2: The recipient landing page provides no personal context.**
The invitation token carries the forger's identity and intention, but the landing page does not use it. No personal message. No explanation of the world they are entering. Nation and archetype as unlabeled form fields. Shaman: "threshold is unmarked." Diplomat: "dropped into a form without context."

**Gap 3: Post-sign-up is a dead zone.**
After character creation, the player lands on a generic screen with no acknowledgment of who called them, where they landed, or what to do first. Both analyses flag this independently and with matching priority.

**Gap 4: Nation targeting creates unnecessary friction for forgers.**
The forge form requires selecting a nation before the button enables. Forgers who do not know their invitee's alignment stall or guess. Diplomat-primary gap.

**Gap 5: Forge invitation is hard to find.**
One location, one button in a row, no dashboard presence. Impulse-to-action latency is high.

**Gap 6: The forge form does not prompt personal testimony.**
The forger can write a title and description, but is not asked *why* they are inviting this person. The form produces generic artifacts.

**Gap 7: Nation and archetype choices lack narrative scaffolding.**
The first act of self-placement in this world happens through unlabeled dropdowns. Both faces name this — the Shaman as ritual failure, the Diplomat as context deprivation.

---

### Canonical User Stories

**[INV-1]** As a new player arriving via invitation link, I want to see the forger's personal message and a one-sentence description of the world I am entering, so that my arrival feels like an answer to a specific summons rather than a generic sign-up.
**Acceptance**: The forger's written message appears above the sign-up form. The page heading references the forger by name ("X called you here because...").
**Priority**: High | **Face**: Both

**[INV-2]** As a new player choosing my nation and archetype during sign-up, I want to see a brief in-world description of each option, so that my first act of self-placement feels like a declaration rather than a form field.
**Acceptance**: Each nation and archetype option shows one sentence of in-world flavor text. The field is never a bare dropdown.
**Priority**: High | **Face**: Shaman

**[INV-3]** As a new player who just completed sign-up via an invitation, I want to land on a page that greets me by name, names who invited me, and surfaces one first quest appropriate to my archetype, so that the world has visibly received me.
**Acceptance**: Post-sign-up redirect goes to a personalized arrival screen (not bare `/`). Screen shows inviter name, player's nation/archetype, and one pinned first quest. Uses data already present on the player record — no new schema required.
**Priority**: High | **Face**: Both

**[INV-4]** As a player who forged an invitation, I want to see a status update in my Quest Wallet when my invitee signs up and completes their first step, so that I experience the invitation as a completed ritual act rather than a message sent into the void.
**Acceptance**: When invitee creates their character, forger's Quest Wallet shows a "Your invitation was accepted by [name]" event. Notification persists; does not require the forger to be online.
**Priority**: High | **Face**: Both

**[INV-5]** As a player forging an invitation who does not know which nation my friend belongs to, I want to send an open invitation that lets my invitee choose their own alignment, so that I am not blocked from inviting people outside the existing community.
**Acceptance**: Nation field on forge form has an "Open — let them choose" option. Invitee on the landing page sees the full nation selection with descriptions (per INV-2) rather than a pre-selected value.
**Priority**: High | **Face**: Diplomat

**[INV-6]** As a player forging an invitation, I want to be prompted to write a personal message about why I am inviting this person, so that the artifact I send carries my voice rather than a generic title.
**Acceptance**: Forge form includes a `message` field (optional first, later required). Placeholder: "What do you see in this person that belongs in this world?" Message displayed on recipient landing page.
**Priority**: Medium | **Face**: Diplomat

**[INV-7]** As a player who just had a meaningful session, I want a visible "Invite Someone" action on the main dashboard or end-of-session screen, so that I can act on the impulse to invite before it passes.
**Acceptance**: A clear invite action is present on the main authenticated dashboard — not buried in `/hand`. It resolves to the forge flow or shows a gate-explanation if `gameAccountReady` is false.
**Priority**: Medium | **Face**: Diplomat

---

### Prioritized Recommendation: The Single Highest-Leverage Action

**Fix the post-sign-up landing screen.** (INV-3)

This is the change that closes the loop on everything.

Every other gap is upstream of this moment. But a player who lands on a dead generic screen after crossing every other threshold will not remember the warmth of the invitation landing page. The momentum collapses at the last step.

The data is already on the player record: `invitedByPlayerId`, `campaignRef`, `archetype`, `nation`, `name`. The forger record is reachable via a single join. A first quest can be pinned from the existing quest grammar filtered by archetype.

**No schema changes required.** One redirect change in `InviteSignupForm` (`router.push('/')` → arrival page) and one arrival screen component. The forger notification (INV-4) can be fired as a side effect in the same `createCharacter` call.

One PR, no migrations, closes:
- Gap 1 (relational thread — forger notification as side effect)
- Gap 3 (dead zone — replaced with arrival screen)
- Partial Gap 2 (personal context — if INV-1 is bundled with it)

---

### What NOT to Build Now

**1. Personalized first-quest AI generation.**
The Shaman envisions a first quest generated fresh from the player's full profile. Appealing but premature — quest generation must be hardened before it is trusted at onboarding, the highest-stakes, lowest-tolerance moment in the system. For now, a pinned static first quest filtered by archetype is sufficient and safe.

**2. Required personal testimony gate on forge form.**
INV-6 is real. But making the personal message field *required* before shipping the rest adds forge-side friction at a moment when the bigger wound is on the recipient and post-sign-up side. Add the field as optional first, observe usage, then make it required in the next iteration.

---

## Code-Level Findings (from Shaman code read)

The grounded Shaman analysis read the actual source and found a critical shortcut:

### The ceremony is already built — it's just not wired

`src/app/page.tsx` lines 497–513 contains a complete `ritualComplete` ceremony: a purple banner with context and 2 CTAs. It is triggered by `?ritualComplete=true` in the URL.

`src/app/invite/[token]/InviteSignupForm.tsx` line 35: `router.push('/')` — **does not append this param.**

The fix for INV-3 is **one line**:
```diff
- router.push('/')
+ router.push('/?ritualComplete=true')
```

This activates the existing ceremony for all players entering through an invitation, with no schema changes and no new components.

### Other grounded findings (Shaman)

- `assignOrientationThreads` is called during `createCharacter` but the thread lands buried in "Journeys" (collapsed by default if >3 journeys). Not directed.
- `OnboardingChecklist` shows 3 generic tasks — not connected to invitation context or archetype.
- `WelcomeScreen` does not reference the forger, the invitation, the nation, or the archetype. Generic copy.
- The `ritualComplete` banner references the forger's name if available — so wiring `?ritualComplete=true` immediately surfaces it.
- Forge invitation accessible only from `/hand` — no `DashboardActionButtons` surface.

### Additional findings (Diplomat code read)

- **`claimUrl` vs `/invite/[token]` discrepancy**: After forging, the form shows `claimUrl` which routes to `/invite/claim/[barId]`, not the meaningful `/invite/[token]` experience. Players copy the wrong URL. Silent UX bug.
- **No copy-to-clipboard / share mechanic**: After forging, players get a raw URL with no message body, no share sheet, no context. The social act of inviting is reduced to manually composting a URL into a text message.
- **No invitation history in `/hand`**: No record of outstanding invitations, no status (pending / accepted). After forging, the loop goes silent.
- **`DashboardActionButtons.tsx`** lists 4 self-directed actions (Create BAR, My BARs, Emotional First Aid, The Conclave) — "Invite Someone" is absent.
- The `gameAccountReady` gate is never explained to pre-ready players — the capability is invisible at the stage when excitement peaks (first session).

---

## Next Steps

1. **INV-3 quick win** — in `InviteSignupForm.tsx`, change `router.push('/')` → `router.push('/?ritualComplete=true')` (one line, activates existing ceremony)
2. **INV-4** — fire forger notification as side effect in `createCharacter` when `invitedByPlayerId` is present (same PR as INV-3)
3. **INV-1 + INV-6** — add `message` field to forge form, display on invite landing page (next PR)
4. **INV-5** — open invitation option in forge form (next PR)
5. **INV-7** — invite CTA on dashboard via `DashboardActionButtons` (next PR)
6. **INV-2** — nation/archetype flavor text during sign-up (design task before dev)
7. Re-run this strand after implementing INV-3 to measure progress
