# Game Master Consult — Portal → 4-Move Implementation Plan

**Purpose**: Concrete implementation plan for fixing the campaign lobby: each portal should lead to a portal-specific screen with Wake Up / Clean Up / Grow Up / Show Up choices—not to Bruised Banana onboarding. Informed by the six Game Master faces.

**Source**: [INTERVIEW_AND_GM_CONSULT.md](INTERVIEW_AND_GM_CONSULT.md), [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), [portal-path-hint-gm-interview](../portal-path-hint-gm-interview/)

---

## The Problem (Current State)

| Current | Expected |
|---------|----------|
| All 8 portals link to `/campaign?ref=bruised-banana` | Each portal → portal-specific CYOA entry |
| Every portal treats players as onboarding for Bruised Banana | Each portal → Room (branch node) with 4 moves |
| No move choice at portal entry | Player chooses: Wake Up, Clean Up, Grow Up, or Show Up |

---

## Game Master Perspectives

### Architect (Structure, Blueprint)

*"The structure is hub-and-spoke with recursive branching. Lobby = hub. 8 portals = first-level spokes. From each portal, the 4 moves create second-level branches. The fix requires:*

1. **Portal → Adventure mapping**: Each portal must route to a *portal-specific* entry node, not the campaign root. One shared `campaign-portal-adventure` per instance with 8 entry passages (Portal_1 … Portal_8).
2. **Room = branch node**: A room is a Passage with exactly 4 choices (wakeUp, cleanUp, growUp, showUp). Path passages (between lobby and room) have 1–2 choices (continue).
3. **Schema**: `Instance.portalAdventureId` — FK to the Adventure that contains the 8 portal entries + room passages. When missing, create on campaign bootstrap.

*The Architect recommends: Phase 2 (portal wiring) before Phase 3 (4 moves). Get the routing right first.*"

---

### Regent (Order, Rules, Campaign)

*"Kotter stage and allyship domain govern what is *valid* at each moment. The campaign deck is the source of truth. The hexagram interprets. The Regent insists:*

1. **Rule**: At stage N, domain D, the 8 portals are contextualized. The portal Adventure must receive `campaignRef`, `kotterStage`, `allyshipDomain` so passage text can vary.
2. **Rule**: The 4 moves are only available at *branch nodes*—not at every node. Linear path passages do not offer 4 moves.
3. **Rule**: Show Up → return to lobby. That is the completion contract. No Show Up path should drop the player into onboarding.

*The Regent recommends: Add a `portalAdventureId` check on Instance. If null, the lobby should not offer "Enter" until the portal Adventure exists. Bootstrap script or admin action creates it.*"

---

### Shaman (Threshold, Emergence, Wake Up)

*"The Wake Up move is the threshold between what exists and what emerges. At a room, Wake Up does two things:*

1. **Extend the path**: 321 + unpacking → AI or admin creates a *new room* with paths aligned to player desires.
2. **Reveal an option**: Open a choice that was hidden—'You notice a door you didn't see before.'

*The Shaman asks: Does the player choose (extend vs reveal), or does the system decide? For Phase 2–3, we can start with extend-only: Wake Up → 321 flow → new room. Reveal can come later.*

*The Shaman recommends: Wake Up must not feel like onboarding. It is *exploration*, not sign-up. The 321 flow should feel like entering a ritual, not filling a form.*"

---

### Diplomat (Relational, Invitation)

*"The campaign speaks its needs. The hexagram interprets. The player is *invited*—not pushed. The Diplomat wants:*

1. **Portal as invitation**: Each portal's path hint (from portal-path-hint-gm-interview) should be face-voiced. The hexagram + changing lines → primary face → invitation copy.
2. **Room as choice space**: The 4 moves at a room are an invitation: 'What do you need right now?' Not a funnel. Clean Up → EFA is care, not punishment. Grow Up → schools is growth, not obligation.
3. **Campaign deck = relational**: Who speaks for the campaign? The instance. The campaign deck (BAR seeds) is what the campaign needs. The hexagram translates that into something the player can *choose* to engage.

*The Diplomat recommends: Every portal and room passage should pass the vibe check—'Would a player feel invited, not pushed?'*"

---

### Sage (Integration, Whole)

*"The whole system is a map of meaning. The lobby is the center of awareness. The 8 portals are the directions the campaign can go. The 4 moves are how a player *participates*. The Sage asks:*

1. **Shared vs personal**: When a player completes a path, does the map change for everyone or only for them? For now: personal. Each player has their own progress. Shared world (map changes for all) is Phase 5+.
2. **Terminology**: Portal = entrance to free-play CYOA. Room = branch node. Path = edge between room and lobby. Branch = path off a room. Use these consistently.
3. **Schools = 6 faces**: Grow Up → one Adventure with 6 branches (Shaman, Challenger, Regent, Architect, Diplomat, Sage). Not nations. Each face path has 4 moves at branch nodes (recursive).

*The Sage recommends: Implement the minimal loop first—Lobby → Portal → Room (4 moves) → Show Up → Lobby. Then add Grow Up, Clean Up, Wake Up.*"

---

## Unified GM Synthesis

| Face | Priority | Recommendation |
|------|----------|----------------|
| **Architect** | Structure first | Portal Adventure template; 8 entry passages → room; `Instance.portalAdventureId` |
| **Regent** | Rules | 4 moves only at branch nodes; Show Up → lobby; bootstrap portal Adventure when missing |
| **Shaman** | Wake Up as ritual | Wake Up → 321 flow; not onboarding; extend path (reveal later) |
| **Diplomat** | Invitation | Face-voiced path hints; room = choice space, not funnel |
| **Sage** | Minimal loop | Lobby → Portal → Room (4 moves) → Show Up → Lobby first |

---

## Concrete Implementation Plan

### Phase 2A: Portal → Adventure Wiring (Architect + Regent)

**Goal**: Each portal "Enter" goes to a portal-specific CYOA entry, not `/campaign?ref=bruised-banana`.

| Task | Owner | Description |
|------|-------|-------------|
| **2A.1** | Architect | Add `Instance.portalAdventureId` (optional FK to Adventure). Migration. |
| **2A.2** | Architect | Create seed script `seed-campaign-portal-adventure.ts`: one Adventure per campaignRef with 8 entry passages (Portal_1 … Portal_8) + 8 room passages (Room_1 … Room_8). Each Room has 4 choices: Wake Up, Clean Up, Grow Up, Show Up. |
| **2A.3** | Architect | Each Portal_N passage: hexagram-flavored text (from portal data), single choice "Enter the room" → Room_N. |
| **2A.4** | Regent | Wire "Enter" on lobby: `href={/adventures/{portalAdventureId}/play?start=Portal_{portalIndex}}}`. Pass portal index (1–8) so we start at the right entry. |
| **2A.5** | Regent | If `instance.portalAdventureId` is null, create it on first lobby load (bootstrap) or show "Campaign not ready" and link to admin. |
| **2A.6** | Architect | `get8PortalsForCampaign` returns `portalAdventureId` and `portalStartNodeIds: string[]` (e.g. `['Portal_1', …, 'Portal_8']`) so the lobby can link each portal to its entry node. |

**Files**:
- `prisma/schema.prisma` — `portalAdventureId` on Instance
- `scripts/seed-campaign-portal-adventure.ts` — new
- `src/actions/campaign-portals.ts` — return portalAdventureId, portalStartNodeIds
- `src/app/campaign/lobby/page.tsx` — "Enter" links to `/adventures/{id}/play?start={nodeId}`

---

### Phase 2B: Room Passages with 4 Moves (Regent + Shaman)

**Goal**: Each room is a branch node with Wake Up, Clean Up, Grow Up, Show Up.

| Task | Owner | Description |
|------|-------|-------------|
| **2B.1** | Regent | Room passage template: 4 choices with `moveType` metadata. Wake Up → `WakeUp_1` (placeholder), Clean Up → `/emotional-first-aid` or EFA quest, Grow Up → `Schools_Entry` (placeholder), Show Up → `Lobby_Return`. |
| **2B.2** | Regent | Show Up choice: link to passage that redirects to `/campaign/lobby?ref={campaignRef}`. Or use `action: 'REDIRECT_LOBBY'` in passage metadata. |
| **2B.3** | Shaman | Clean Up: link to `/emotional-first-aid` or create EFA quest assignment. Document in passage. |
| **2B.4** | Architect | Grow Up: link to schools Adventure (Phase 2C). Placeholder passage for now: "Schools coming soon" → back to room. |
| **2B.5** | Shaman | Wake Up: link to `/shadow/321` or embedded 321 flow. Placeholder for Phase 4: "Wake Up (321) coming soon" → back to room. |

**Files**:
- `scripts/seed-campaign-portal-adventure.ts` — room passages with 4 choices
- `src/app/adventures/[id]/play/` — handle REDIRECT_LOBBY or similar
- Passage `choices` JSON: `[{ "text": "Wake Up", "targetId": "WakeUp_1", "moveType": "wakeUp" }, …]`

---

### Phase 2C: Schools Adventure (Grow Up) — Stub

**Goal**: Grow Up from room → 6-face schools CYOA. Minimal stub first.

| Task | Owner | Description |
|------|-------|-------------|
| **2C.1** | Architect | Create `schools-adventure` or `game-master-schools` Adventure. 6 entry passages (Shaman, Challenger, Regent, Architect, Diplomat, Sage). Each leads to a stub "School path coming soon" → back to room. |
| **2C.2** | Regent | Wire Grow Up from room → `/adventures/{schoolsId}/play?face=shaman` (or similar). Resolve schools Adventure id from config or Instance. |
| **2C.3** | Sage | Document: schools = 6 GM faces, separate from nations. Recursive 4 moves at branch nodes within each school (Phase 3+). |

**Files**:
- `scripts/seed-schools-adventure.ts` — new
- `src/lib/campaign-portals.ts` or config — `getSchoolsAdventureId(campaignRef)`

---

### Phase 2D: Lobby UX (Diplomat)

**Goal**: Portals feel like invitations, not funnels.

| Task | Owner | Description |
|------|-------|-------------|
| **2D.1** | Diplomat | Ensure `portal.pathHint` uses face-voiced templates (from portal-path-hint-gm-interview). Already partially done; verify. |
| **2D.2** | Diplomat | Room passage text: "What do you need right now?" or similar. Four choices with warm labels: "Wake Up — See what's emerging", "Clean Up — Tend to what blocks you", "Grow Up — Study at a school", "Show Up — Return to the lobby". |
| **2D.3** | Diplomat | No "onboarding" language in portal or room passages. Campaign-specific, not Bruised Banana–centric. |

---

## Verification Checklist (GM-Signed)

- [ ] **Architect**: Each portal "Enter" routes to `/adventures/{portalAdventureId}/play?start=Portal_{N}`. No portal links to `/campaign?ref=bruised-banana`.
- [ ] **Regent**: Room passages have exactly 4 choices. Show Up returns to lobby. portalAdventureId exists or is created on bootstrap.
- [ ] **Shaman**: Wake Up path exists (stub or 321). Does not feel like onboarding.
- [ ] **Diplomat**: Path hints and room copy pass invitation vibe check.
- [ ] **Sage**: Minimal loop works: Lobby → Portal → Room → Show Up → Lobby.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Instance.kotterStage, allyshipDomain | Yes |
| Adventure, Passage | Yes |
| get8PortalsForCampaign | Yes |
| portal-context (path hints) | Yes |
| Emotional First Aid route | Check |
| 321 / Shadow321Session | Yes |
| Instance.portalAdventureId | No — Phase 2A |

---

## Next Steps

1. Run `npm run strand:consult` with a prompt focused on this plan (optional — get live Architect/Regent input).
2. Create `portal-4-move-implementation` spec kit (spec.md, plan.md, tasks.md) from this document.
3. Implement Phase 2A first — portal wiring. Then 2B (room 4 moves). Then 2C (schools stub), 2D (UX polish).
