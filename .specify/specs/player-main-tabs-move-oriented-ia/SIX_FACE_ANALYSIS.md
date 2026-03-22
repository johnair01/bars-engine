# Six-Face Analysis — Player Main Tabs (Now / Vault / Play)

**Status:** Complete — Phase 0 deliverable
**Date:** 2026-03-22
**Analyst:** Architect face (ooo persona)
**Source:** Live code audit — `src/app/page.tsx`, `src/app/hand/page.tsx`, `src/app/hand/{charges,quests,drafts,invitations}/page.tsx`, `src/app/adventures/page.tsx`, `src/app/play/page.tsx`, `src/components/dashboard/OrientationCompass.tsx`, `src/components/dashboard/ThroughputLanesSection.tsx`, `src/components/hand/VaultFourMovesStrip.tsx`

---

## Now (`/`)

### Shaman

The page opens with player identity (nation, archetype, vibulon count), then immediately delivers 13+ sections before the player has exhaled. The felt field is "notification inbox" not "morning practice." The only genuine felt-field signal is the DailyCheckInQuest wizard and the OrientationCompass — but both are buried beneath AppreciationsReceived, RecentChargeSection, and ThroughputLanesSection. A player who arrived carrying emotional charge finds the charge-capture entry point at position four in the visual stack, below a social feed they may not have earned the context for yet. The emotional narrative the page tells is: "Here is everything you might care about. Now decide." That is not a shamanic field; it is a dashboard anxiety grid. The correct signal for a returning player should be: "What's alive in you right now?" followed by exactly one door. That move is available (OrientationCompass exists and computes it correctly) but it arrives too late to function as an orienting force.

### Regent

The rules are unclear in three ways. First, sovereignty over the daily cycle is split: the DailyCheckInQuest is inside DashboardHeader (step wizard), but the OrientationCompass is a separate card four sections later — two systems computing the recommended next move independently, with no explicit contract about which one governs. A player who completes the check-in wizard and then sees the Compass suggesting a different move has no way to know which one to trust. Second, the "Active Quests" collapsible shows up to five items with a "View Vault →" link when overflow exists, but the Vault itself does not deeplinkably highlight those same quests without a `?quest=` parameter — the handoff is lossy. Third, the DashboardActionButtons (321 Shadow, Create BAR, My BARs, EFA Kit, The Conclave) appear after the Journeys section with no move labeling — five orphaned CTAs with no stated move relationship, leaving the player to guess whether clicking "EFA Kit" is a Clean Up or a Grow Up move.

### Challenger

The page allows unlimited passive browsing. A player can scroll through appreciations, charges, throughput lanes, compass, discover strip, journeys, action buttons, active quests, and the graveyard without ever committing to a single move. The collapsible sections (Journeys, Active Quests, Graveyard) each default to expanded when count is low, so a player with moderate engagement sees the full inventory without being required to choose. The DiscoverStrip presents library quests "matching your move" but those quests appear as browse links with no friction gate — there is no moment that says "you are now in Clean Up; these are your options; pick one and go." The premature comfort is that everything is visible and everything is optional. The Challenger asks: why does the OrientationCompass suggest "Clean Up" and then provide a single "Run the 321 process →" link, when the player can simply scroll past it and poke at the Graveyard instead? The surface allows avoidance without naming it.

### Architect

The data load is structurally overextended: 17+ distinct server-side calls (db.player, ensureWallet, vibulon count, potentialDelegates, completedBars/activeBars, ichingReadings, globalState, onboardingStatus, threads, packs, appreciations, todayCharge, chargeArchive, todayCheckIn, myCampaignSeeds, campaignsResponsible, discoverQuests). Several of these are used to derive conditions for conditional rendering (campaignsResponsible.length > 0, myCampaignSeeds.some(...), intention, bbThread), meaning the page fetches data for sections that frequently render nothing. The structural problem for move-based navigation is that the page has no primary region concept: the four moves (Wake Up / Clean Up / Grow Up / Show Up) are implied by the OrientationCompass single suggestion, but the surrounding sections are not organized by move — they are organized by data type (appreciations, charges, throughput lanes, quests, graveyard). Composing move-based navigation requires each section to declare its move affiliation; right now that information does not exist at the section level. The `recommendedMoveType` derivation in `page.tsx` (lines 405–411) is a pure function that correctly computes the move, but that value is only passed to OrientationCompass and DiscoverStrip — it is not propagated to section visibility logic.

### Diplomat

The social layer (AppreciationsReceived) appears second in the visual stack, before the player has even located their own current move context. This privileges received social validation over self-orientation, which is diplomatically backward: the player should locate themselves first, then see their relational field. The campaign-related conditionals (CampaignSeedReadyCard, CampaignsResponsibleSection) correctly appear near the top as leader-relevant signals, but they load unconditionally for all players and render nothing for the majority. The Journeys collapsible contains both personal threads and campaign-connected threads with no visual distinction — a player managing a campaign quest and a private orientation thread sees them interleaved. The page diplomatically serves everyone equally, which means it serves no one precisely.

### Sage

The integrative failure is that NOW accumulates rather than distills. Each sprint that added a feature appended it to the vertical stack. The page currently represents the full game model — identity, social, charge, throughput, compass, discovery, campaigns, quests, graveyard — rather than representing "where are you in the cycle and what is the next move." The Sage meta-pattern for this tab should be: "This session, you are in [Move]. Here is one door." The OrientationCompass already contains this wisdom; the rest of the page contradicts it by offering all doors simultaneously. Across sessions, the page does not surface session-over-session progression ("last time you were in Clean Up; today you have a charge — do you want to continue or start fresh?"). The DailyCheckInQuest wizard is the closest thing to a ritual opening, but it is gated behind the header component and only visible when `todayCheckIn` is null. The Sage verdict: the page has all the right instruments but has not been told to play a song — it plays all of them at once.

---

## Vault (`/hand` + sub-rooms)

### Shaman

The Vault lobby narrates itself as a filing cabinet, not a living space. "Review your charges and quests — tend what's waiting to move." The phrase "tend what's waiting" is the right shamanic framing, but the lobby then presents the same data as NOW (charge previews, quest previews, draft previews) organized identically — collapsible sections by data type. The felt field on entering the Vault should be: "I am in my private studio; I can metabolize what I've been carrying." Instead the felt field is: "I am in a slightly smaller version of NOW, with a different header." The VaultSummaryStrip (rose for charges, amber for unplaced quests, purple for drafts, red-warning for stale) is the strongest shamanic element — it presents the player's inventory as a living state with urgency signals (stale items). The four sub-rooms (Charges, Quests, Drafts, Invitations) each have VaultFourMovesStrip, which correctly names the emotional arc (see/survey → metabolize → deepen → act). But the strip only appears after navigating into a sub-room, not on the lobby itself. The lobby does not orient by move at all.

### Regent

The sub-rooms enforce cleaner sovereignty than the lobby. Each room's VaultFourMovesStrip provides an unambiguous set of four options, one per move, with concrete hrefs. The lobby's sovereignty problem is the duplicate preview pattern: the Charges collapsible links to "Open Charges room →" but also shows the top-N items inline. The player can act on items from either the lobby preview or the room — but the lobby preview lacks the move-framing context. A player who composts a charge from the lobby preview does not see the Clean Up affordance that the Charges room provides. The lobby thus creates two governance contexts for the same objects, where only one (the sub-room) is move-aware. The VaultQuickLinks nav shortcuts and VaultNestedRoomsNav room pills are both present on the lobby, creating two navigation elements for the same destination set. The "Capture Charge," "Forge Invitation," and "Moves Reference" action buttons at the bottom of the lobby header are the right move-entry points but appear without move labels. Regent clarity requires that every action button declare which move it belongs to.

### Challenger

The Vault lobby is too comfortable as a browsing surface. A player can enter the Vault, review previews of charges, quests, and drafts, feel "informed," and leave without doing anything. The sub-rooms are better at this — the VaultFourMovesStrip presents the Wake Up move as "see what's here" (survey the list) and immediately follows with Clean Up (compost/metabolize), Grow Up (deepen), and Show Up (act). But the stale item count on VaultSummaryStrip has no associated action on the lobby — it tells the player "you have N stale items" but provides no CTA to address them (the compost route is buried in the sub-room clean-up moves). The Challenger asks: when a player has 8 stale charges, should the lobby simply report that number? Or should it interrupt the usual preview flow and surface the compost action directly? The current design allows the player to acknowledge the staleness signal without being challenged by it.

### Architect

The structural problem is lobby-as-mirror. The Vault lobby (`/hand`) is architecturally a read-only aggregation view of data that the sub-rooms manage. This creates a two-tier structure: lobby (browse, conditional render) and rooms (act, move-aware). The lobby fetches data via `loadVaultCoreData(playerId, 'lobby')` and the rooms via `loadVaultCoreData(playerId, 'room')` — the same query function with a scope parameter, which is correct. But the lobby renders collapsible previews that duplicate content from sub-rooms, adding page weight without adding move context. For move-based navigation to compose, the lobby should function as a move dashboard (which move am I in? what is the one action for this move across all vault objects?) rather than a data preview aggregator. The FaceMovesSection (rendered unconditionally after drafts) is a global reference to GM face moves — thematically appropriate but architecturally orphaned; it has no move-based routing function. The Route map for Vault is currently: lobby → sub-rooms (flat); it should be: lobby (move picker) → sub-room (move executor) → confirmation.

### Diplomat

The Vault is correctly private-first. The Invitations section (forged invitations with claim URLs) is the only social surface, and it is appropriately located at the bottom of the lobby and isolated in its own sub-room. The "Invitations Accepted" section (showing who accepted a player's invitation) is a relational signal that belongs at the lobby level — it tells the player their social reach is alive — but it appears after the FaceMovesSection, nearly invisible. The sub-rooms do not connect to other players at all, which is architecturally correct for a personal metabolization space. The diplomatic gap is that the Vault has no view into what quests from this player have been placed in shared campaigns. A player who placed a quest on the campaign gameboard cannot see that connection from the Vault — the quest either remains in unplaced state or disappears from personal quests, but there is no "placed in campaign" status visible here.

### Sage

The Vault is the cleanest of the three tabs in terms of developmental purpose: it is the Clean Up space. But it does not state this. The lobby header says "Vault" and "Review your charges and quests — tend what's waiting to move." The Sage would name it more directly: this is where you metabolize. The four sub-rooms (Charges, Quests, Drafts, Invitations) map clearly to the materials of metabolization: raw felt charges, crystallized quests, in-progress BARs, and relational reach. The VaultFourMovesStrip in each sub-room is the strongest implementation of move-oriented IA in the codebase — it names the move, provides a one-line description, and links a concrete action. The Sage sees that this pattern should be the model for NOW and PLAY, not a feature unique to Vault rooms. The integrative failure is that the Vault's Clean Up wisdom is locked inside sub-rooms that the player must navigate to — the lobby doesn't lead with it.

---

## Play (`/adventures`)

### Shaman

The Play page (`/adventures`) opens with "Moves you can make right now" and "Shadow work, quest arcs, I Ching — pick a container and go." This is closer to a functional shamanic entry point than NOW — it names the player's options as containers, not inventories. But the emotional signal breaks down immediately: Shadow Work (321 Process — "Face it. Talk to it. Be it.") appears as a static link card with no felt-field charge. There is no signal about whether the player has charge ready to metabolize, whether they have been in the middle of a 321 session, or whether the shadow work is urgent or optional. Active Journeys appear only if the player has active threads — meaning a new player with no threads sees Shadow Work and then immediately the empty state ("No active moves yet. Start with the 321 process above"). The page does not read the player's actual state (what move are they in? do they have charge today?) — it lists available containers without personalizing the invitation. The `/play` demo page ("Try the loop") is better at felt-field framing: Charge → Scene Atlas → I Ching as three stops on a single journey. But these are two separate pages with no clear relationship to each other, and `/play` is not the primary PLAY tab in the NavBar — `/adventures` is.

### Regent

The `/adventures` page has no stated rules about what the player should do first, what the prerequisite order is, or what "completing" a move in this space looks like. The 321 Process link is always visible regardless of whether the player has captured a charge today — the prerequisite (have something charged to metabolize) is not enforced or even surfaced. Daemon Work appears only if `activeDaemons.length > 0` (summons in progress), which means a player who has not yet summoned a daemon sees no entry point to the daemon system from PLAY. Adventures (Twine stories) show completion state (opacity-40 + "Complete" badge) but provide no "next story" affordance — completion is a dead end visually. The Campaign Board entry requires active campaign membership, which is correct gating, but a player who is eligible for a campaign but not yet enrolled has no entry point from this page to fix that. Regent clarity requires that every section either show the player's current state or tell them how to get into range.

### Challenger

The Play page is the most honest of the three tabs about what it is — a list of active work containers — but it is also the most passive. The player arrives, scans the list, and leaves if nothing resonates. The 321 Process card ("Face it. Talk to it. Be it.") is the strongest challenger move in the system, but it appears as a neutral link card. There is no signal from the system saying "based on your current charge, you need to be here" — the Challenger's confrontation is missing. Active Journeys show thread titles and next quest ("Next: [quest title]"), which is genuinely useful, but the visual treatment is identical to all other cards (zinc-900/60, zinc-800 border) — a "do it now" journey has the same visual weight as a completed adventure opacity-40. The Challenger asks: if you have an active thread with an overdue quest, should the Play page tell you that? Right now it shows position (e.g., "3/7") but not urgency or staleness. Daemon Work appears with "Summoned — work in progress" but no sense of what "progress" means or when it is overdue. The premature comfort is that everything on this page is equally quiet.

### Architect

The PLAY tab is split across two routes: `/play` (the "Try the loop" demo onboarding page) and `/adventures` (the active play hub). The NavBar maps PLAY to `/adventures`, but the ThroughputLanesSection on NOW links "Try it →" to `/play`. These are architecturally disconnected: `/play` is a three-step demo loop for new players; `/adventures` is the ongoing play hub. New players following ThroughputLanes will land on `/play`, not `/adventures`, and will not see their active journeys. Returning players following NavBar will land on `/adventures` and never discover `/play`. The PLAY tab has no four-move organization — it is organized by container type (Shadow Work, Journeys, Daemon Work, Campaign, Adventures) which does not map cleanly to moves. Shadow Work = Clean Up. Journeys = Show Up (execute quest arc). Daemon Work = Grow Up. Campaign = Show Up (collective). Adventures = Grow Up or Show Up depending on the story. This move-container mapping is implicit and unrendered. Data dependencies: `/adventures` fetches `getPlayerThreads()`, `getPlayerDaemons()`, `listPublishedStories()`, and a campaign membership query — reasonable. But it computes nothing about the player's current move context (no charge state, no compass input), so it cannot personalize the invitation.

### Diplomat

The PLAY tab is where the multiplayer game actually lives — threads connect to campaign gameboards, daemon work produces quests that can be contributed, adventures certify the player for further collaborative roles. But the page presents these as a flat list without surfacing the relational dimension. Journeys show thread titles and quest positions but do not show whether a thread is connected to a campaign or is purely personal. Campaign Board appears as a single link card if the player is in a campaign, with no context about what is happening there (active quests, other players' contributions, current stage). A player who has placed a quest on the campaign gameboard and is awaiting collective response has no status signal here. The diplomatic failure is that PLAY presents multiplayer affordances (Campaign Board, Invitations from the Vault) as individual containers rather than as connective tissue. The page does not answer: "Who else is moving alongside me right now?"

### Sage

PLAY should be the Show Up surface — the place where charge that was named (Wake Up) and metabolized (Clean Up / Grow Up) becomes visible action in the world. But the page does not know where the player is in that arc. It presents all containers as equally available, which means a player who has never captured a charge can walk into an adventure (Grow Up container) without having done the prerequisite Clean Up work. The page's empty state ("Start with 321 — it will generate your first quest") is the most integrative statement on the page: it names the correct entry point and explains the generative dependency. But it only appears when everything else is absent. The Sage asks: should this logic be inverted? Should the page always open with "where are you in the cycle?" and only surface the containers appropriate to that position? The meta-pattern failure is that PLAY does not advance the throughput arc — it presents options without declaring the player's current position, making it impossible to see session-over-session progression toward Show Up.

---

## Synthesis — Gaps to Move Placement to Priority

| ID | Gap | Affected Tab | Proposed Move Area | Subpage / Affordance | Priority |
|----|-----|-------------|-------------------|----------------------|----------|
| G1 | OrientationCompass fires too late — appears after 4 sections on NOW; player has already context-switched before seeing their recommended move | Now | Wake Up (primary) | Move Compass to position 2 (directly after DashboardHeader identity card); everything below keyed to compass output | P0 |
| G2 | Two competing move-suggestion systems (DailyCheckInQuest wizard inside DashboardHeader + OrientationCompass card) with no stated priority contract between them | Now | Wake Up | Merge into a single ritual gate: check-in wizard IS the compass entry; compass card shows post-check-in confirmation, not a parallel suggestion | P0 |
| G3 | NOW page loads 17+ server-side queries including conditionally-rendered sections (campaigns, seeds, intention) that return empty for most players most of the time | Now | All moves | Defer conditional sections (CampaignSeedReadyCard, CampaignsResponsibleSection, IntentionDisplay) to lazy client components; only fetch when relevant player state is true | P0 |
| G4 | DashboardActionButtons (321 Shadow, Create BAR, My BARs, EFA Kit, The Conclave) have no declared move affiliation — five orphaned CTAs | Now | Clean Up / Show Up | Label each button with its move; reorganize under four-move quadrant layout on NOW | P1 |
| G5 | AppreciationsReceived appears before OrientationCompass — social inbox before self-orientation | Now | Diplomat | Move AppreciationsReceived below the compass / after move commitment; player locates self before receiving social field | P1 |
| G6 | Vault lobby is a mirror of NOW: same data (charges, quests, drafts) in collapsible sections without move labeling — duplicated browsing surface | Vault | Clean Up (primary) | Lobby should show VaultSummaryStrip + move dashboard (which move is most urgent for this player's vault state?) with one CTA per move, linking to sub-room; remove inline previews from lobby | P0 |
| G7 | Stale item count on VaultSummaryStrip has no associated CTA on lobby — information with no action | Vault | Clean Up | When staleItems > 0, render an inline "Compost stale items →" CTA on the lobby, not just a count | P1 |
| G8 | Vault lobby has two navigation elements for sub-rooms (VaultQuickLinks + VaultNestedRoomsNav) with different visual treatment — redundant and confusing | Vault | All moves | Collapse to a single four-move room nav rail; label each room pill with its move (Wake Up = Charges, Clean Up = Quests+Drafts, Grow Up = [Moves Reference], Show Up = Invitations) | P1 |
| G9 | FaceMovesSection on Vault lobby is thematically appropriate but architecturally orphaned — GM face reference in the middle of a player-facing possession management page | Vault | Grow Up | Move to a dedicated `/hand/moves` route (already exists as "Moves Reference" button); remove from lobby | P2 |
| G10 | Placed quests disappear from Vault personal quests view with no "placed in campaign" status — player loses visibility of quests they contributed | Vault | Show Up | Add "In Campaign" status tag to VaultPersonalQuestsBlock for quests with thread/gameboard placement; link to the campaign or thread | P1 |
| G11 | PLAY tab is split across two routes: `/play` (onboarding demo) and `/adventures` (active play hub) with no navigational relationship between them | Play | All moves | Decide canonical PLAY route; if `/adventures` is primary (per NavBar), redirect `/play` there for authenticated players or inline the three-stop loop as a Wake Up section within `/adventures` | P0 |
| G12 | `/adventures` does not read player's current move context (charge state, compass recommendation) — presents all containers with equal weight regardless of where player is in cycle | Play | All moves | Accept `recommendedMoveType` or compass props at the page level; visually promote the contextually appropriate container; demote others | P0 |
| G13 | Daemon Work on PLAY shows only if active summons exist — no entry point for a player who should start a daemon but hasn't | Play | Grow Up | Add "Start Daemon Work →" CTA to Grow Up section when player has active daemons with zero summons; or when archetype suggests daemon work | P1 |
| G14 | Adventure completion is a visual dead end (opacity-40 + "Complete" badge) with no "next story" or "what this unlocked" affordance | Play | Show Up | On adventure completion, surface: certification status, next recommended adventure, or quest generated by completion | P1 |
| G15 | Campaign Board on PLAY is a single link card with no current state signal — no context about what is happening, who else is active, or what the player's pending contribution is | Play | Show Up | Expand Campaign Board card to show: current stage, player's pending quests, one "next action" CTA; mirror the data available on campaign board landing | P2 |
| G16 | Move framing on PLAY is implicit in container type (321=Clean Up, Journeys=Show Up, etc.) but not rendered — player cannot see their move context | Play | All moves | Add move badge to each container card ("Clean Up", "Grow Up", "Show Up") using the VaultFourMovesStrip color tokens (sky, violet, amber); reorder containers by recommended move for session | P1 |
| G17 | OrientationCompass derivation (`recommendedMoveType`) is computed in NOW `page.tsx` but not shared with Vault or Play — each tab independently re-derives (or ignores) move context | Cross-tab | All moves | Lift move-context derivation to a shared server utility (`getPlayerMoveContext(playerId)`) called once; pass result to all three tab pages and to sub-components that need it | P0 |
| G18 | NOW Journeys collapsible shows personal and campaign-connected threads interleaved with no visual distinction — player cannot tell which threads affect others | Now | Diplomat / Show Up | Add campaign affiliation tag to each thread card in the Journeys collapsible; or segment the list: "Personal Journeys" vs "Campaign Arcs" | P2 |
| G19 | Empty state on PLAY ("Start with 321") is the most correct integrative statement on the page — but only appears when the player has nothing. It should be the default opening for new sessions | Play | Clean Up | Move the "start with 321" orientation to a persistent first section framed as the Wake Up entry point, conditional on no active charge today; deprioritize, do not remove, after charge captured | P1 |
| G20 | Vault "Invitations Accepted" section (who claimed your invitation) appears near the bottom of the lobby after FaceMovesSection — a relational signal buried at low visibility | Vault | Diplomat | Promote "Invitations Accepted" to just below VaultSummaryStrip; it signals active relational field and belongs in lobby prime position | P2 |

---

## Phase 0 Verdict

**Structural root cause across all three tabs:** The four moves (Wake Up / Clean Up / Grow Up / Show Up) exist as labels and as data (`moveType` on quests, `recommendedMoveType` in compass logic, `VaultFourMovesStrip` in sub-rooms) but they do not organize the top-level IA. Each tab is organized by **data type** (appreciations / charges / quests / journeys / adventures) rather than by **move**. The result is three tabs that collectively contain everything the game loop needs, but none of them tell the player where they are in the loop or what to do next with authority.

**Priority 0 work (unblocks everything else):**
1. Lift `getPlayerMoveContext()` to shared utility (G17) — gives all three tabs a single source of truth for current move.
2. Move OrientationCompass to position 2 on NOW (G1) — makes the compass the governing structure, not an afterthought.
3. Merge check-in wizard and compass into a single ritual gate (G2) — eliminates competing authority.
4. Collapse Vault lobby to move dashboard (G6) — removes the mirror-of-NOW duplication.
5. Resolve the `/play` vs `/adventures` route split (G11) — eliminates the broken onboarding path.
6. Pass move context to `/adventures` (G12) — makes PLAY contextual, not encyclopedic.

**What is already working and should be preserved:**
- VaultFourMovesStrip in sub-rooms is the correct pattern. Extend it up and out, do not redesign it.
- OrientationCompass derivation logic is correct. Promote it, do not replace it.
- VaultSummaryStrip stale/urgency signaling is the right shamanic surface for the Vault. Keep it at the top.
- PLAY `/adventures` container-per-section structure is the right skeleton — it needs move labels and contextual ordering, not a redesign.
- DailyCheckInQuest wizard (check-in → scene) is the correct ritual opening for NOW. It needs to be the first major interaction, not one item in a header component.

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| Draft | Architect (ooo) | 2026-03-22 |
| Review | | |
