# Understood: live launch and interactive orientation

**Target:** Thursday, September 17, 2026, 2:00 p.m. Pacific
**Status:** implementation spec; release is not yet complete
**Product:** a live, same-device game for two people who speak aloud while chips carry emotional bids

**Design principle:** lengthen moments that are too short; shorten moments that are too long. Escalation often outruns listening, while unresolved conflict can linger. Chip placement, turn order, and visible temperature make room to notice an escalation; a hidden conflict meter gives the players a concrete path toward resolution.

## Outcome by 2:00 p.m.

1. Understood has a public, working route in the `bars-engine` deployment. A visitor can start a real two-person game without an account.
2. The public homepage has a visible **Try the guided demo** button. It opens an interactive orientation featuring two clearly fictional reader simulations in an active, ordinary conflict. The visitor can make game moves and see their consequences on the actual board.
3. The integrated game has survived repeated end-to-end playthroughs, including escalation, cooling, private resolution, stacking, passing, and mobile use. Any unresolved launch blocker is recorded before publishing.

**Out of scope for this deadline:** online multiplayer, AI-generated dialogue, recording or transcribing speech, authentication, cloud saves, payments, analytics of private conflict content, and a broad redesign of the bars-engine sales page.

## Confirmed starting point

- The working prototype is `The Library/relationship-conflict-mvp`, a Vite/React app with its rules and interface in `src/main.tsx`. It currently saves a session in browser `localStorage` and has no server or account requirement.
- The actual application checkout is `/Users/wendellbritt/bars-engine`, a Next.js app. Its `/` route redirects to `/mastering-allyship`; that page is the public homepage surface for the demo button.
- The bars-engine checkout has unrelated uncommitted changes. Integrate in an isolated worktree or clean branch from the intended deployment base; do not incorporate or overwrite those changes.
- Each player's conflict meter is hidden game information. The other player should infer its state through bids, listening, and chip movement, never from a shared-board number. Setup and any later peek must use a deliberate owner-only handoff; the current one-tap reveal needs review against that requirement before launch.
- The current game has one chip placement per active turn, at most one spoken bid, five stacks per player, face-up/face-down chips, a visible 0–5 conversation temperature, and hidden 0–5 conflict meters. When the owner says a spoken chip was heard, the chip moves to the listener and the owner chooses either temperature −1 or their private meter −1.

## Routes and entry

| Route | Purpose | Access |
| --- | --- | --- |
| `/mastering-allyship` | Add a compact Understood invitation and **Try the guided demo** button in a discoverable location; preserve existing book CTAs | Public |
| `/understood` | Short product orientation with **Try the guided demo** and **Start a two-person game** | Public |
| `/understood/demo` | Guided, replayable reader-simulation walkthrough | Public |
| `/understood/play` | The real local, same-device game | Public |

The homepage button goes directly to `/understood/demo`. The demo ends with a clear choice to replay or start a real game. Demo and real game must use separate state keys so a visitor cannot overwrite a live conflict by trying the tutorial. The real game retains its state across refresh in the same browser; **New game** explicitly clears only that real session.

## Integration approach

Port the board into a client component under the bars-engine routes. Keep the existing game rules in one shared state transition layer that both demo and real play call. The demo supplies scripted initial state and allowed user moves; it does not maintain a second, approximate rules engine. Scope the prototype's CSS and fonts to Understood so they cannot change unrelated bars-engine pages. Keep chips animated, with a reduced-motion path that still shows the final state.

No backend is required for this release. Do not log disclosures, meter values, or conflict content. The game should say plainly that it is intended for two people in the same room, on one device, speaking aloud. It must explain how to hand the device over for an owner-only meter check without showing the number to the partner. The demo contains only fictional text.

## Guided demo: two reader simulations

Use two fictional readers, **Wendell** and **Giuseppe**, discussing a mundane conflict: Giuseppe changed a shared plan without telling Wendell. The demo is a rehearsal of game moves, not a model answer to their relationship. Show the board, real chip animations, both hands, stacks, turn panel, visible temperature, and the demo's simulated meter outcome. Narration is brief and skippable; all simulated dialogue is labeled as fictional.

| Beat | Visitor action | Board consequence | Lesson |
| --- | --- | --- | --- |
| 1. Enter | Tap **Begin guided demo** | Seed two readers, five chips of each color, one chosen first turn, zero temperature | How the board is oriented |
| 2. First bid | Place Wendell's red anger chip face up in stack 1 | Chip flies from hand to stack; one placement is consumed | Anger names a boundary or change |
| 3. Curiosity | Tap Wendell's open chip and choose **Tell me more** for Giuseppe | Offered chip is held until answer; demo supplies a short spoken example | Questions cost a chip when available |
| 4. Escalation | Signal **Getting hotter** for Wendell | Public temperature rises one; private conflict remains unchanged | Heat is visible and distinct from unresolved conflict |
| 5. Dissatisfaction | On Wendell's next turn, add one unspoken blue chip to the same stack | Stack grows to two; top is visibly unspoken | A growing stack signals more remains unheard; sadness points to a value |
| 6. Hearing | After the example listening response, choose **I feel heard** on the spoken chip, then **Cool the conversation** | Chip moves to Giuseppe; heat falls one; private meter does not change | Hearing can first regulate the conversation |
| 7. Resolution | On a later spoken chip, choose **Resolve part of the issue** | Chip moves; Wendell's private meter falls one; temperature stays put | Hearing can also change the underlying conflict |
| 8. Handoff | Finish a turn and show the panel moving to Giuseppe's side | Giuseppe's controls become active | One player ends a turn; the other begins |
| 9. Exit | Tap **Start a two-person game** or **Replay** | Open clean real setup or reset only demo | Transition from rehearsal to play |

The tutorial should ask the visitor to perform each highlighted move. Do not make them type an emotional disclosure. A **Show me** control can perform the exact legal move when the visitor is stuck. An unobtrusive **Skip demo** link goes to `/understood/play`. The walkthrough should be usable with taps on an iPhone; dragging remains available in real play but is not required for the demo.

## Playthrough and defect protocol

Complete **five full start-to-finish runs** against the integrated build before release, with at least one run at an iPhone-size viewport and one run with two humans speaking the fictional lines aloud. Run these cases:

1. **Ordinary:** setup → one chip each → question → heard release to private resolution → pass → both meters reach zero.
2. **Heat:** a move makes play hotter → public signal → heard release cools only heat → later release lowers private conflict → finish only when both meters and heat reach zero.
3. **Unheard stack:** face-down and unspoken chips accumulate over multiple turns; stack count and face are unmistakable; one-placement limit holds through tap, drag, and stack modal.
4. **Scarcity:** a player lacks the desired color or has no chips; donate, trade, and free asking allow play to continue without negative hand counts or lost chips.
5. **Interruption:** timer expires without automatic handoff; pass works; refresh restores the real session; demo replay starts clean and never changes the real session.

For each run, record: device/viewport, exact move sequence, observed state, expected state, whether the players knew what to do next, defects, and severity. Fix all **P0/P1** defects before publishing: game cannot advance; chip count is wrong; a second placement slips through; a heard chip moves without its owner's choice; temperature and private meter both change from one release; demo changes real-game state; private meter is disclosed unexpectedly; or mobile controls cannot be used. P2 copy/layout issues can ship only when recorded with a clear follow-up owner.

Useful invariant checks after every run:

- A chip exists in exactly one place: a hand, stack, or temporary question offer. Total chips remain 50.
- A release moves one chip to the listener and changes **exactly one** track by one notch.
- Temperature remains within 0–5; private meters remain within 0–5.
- A turn allows at most one chip placement and one spoken bid; turn timer expiry never changes the turn by itself.
- The demo's scripted steps are legal transitions of the same rules used by real play.

## Acceptance and release gate

- `/understood/demo` and `/understood/play` load from the bars-engine deployment, directly and after refresh; `/mastering-allyship` has a working demo button.
- The demo explains face, color, stack depth, turn handoff, question payment, visible heat, and the two heard-chip outcomes through actions on the board.
- A new visitor can finish the demo in approximately five minutes without reading the full rules or entering text.
- The real game remains usable on a 390-pixel phone viewport and desktop, including Player Two's bottom turn controls. The hidden meter never appears during ordinary shared-board play, and an owner-only peek requires a deliberate handoff.
- Build and route validation pass in the isolated integration checkout. No unrelated bars-engine changes enter the release diff.
- Five runs and the defect log are reviewed. P0/P1 defects are closed. A deployment smoke test opens the homepage button, demo, and real setup on the public URL.
- Publishing is a separate final action after the integrated result and playthrough evidence are ready for review.

## Work order toward 2:00 p.m. Pacific

| By | Deliverable |
| --- | --- |
| 9:30 a.m. | Confirm target deployment branch and route placement; create isolated integration checkout |
| 11:15 a.m. | Real game runs inside bars-engine with scoped styles and persistent local session |
| 12:15 p.m. | Homepage button and guided demo run through the real transition layer |
| 1:15 p.m. | Five playthroughs complete; P0/P1 fixes and build/route checks complete |
| 1:40 p.m. | Reviewable diff and deployment candidate ready |
| 2:00 p.m. | Public smoke test complete, if publication is approved |

The schedule is a target, not a reason to skip the release gate. If integration takes longer, publish the working real game with a clear rules orientation only if the homepage link, mobile board, and core playthroughs are sound; defer the interactive demo rather than ship a misleading one.

## Decisions to confirm while implementing

- Which branch or release path of `bars-engine` is intended for today's production deployment?
- Does speaking a waiting chip after placing an unspoken chip in the same turn represent one feeling or two? The current prototype permits it; the playthrough should settle the intended rule before the demo teaches it.
- Should the public temperature signal be shared for the conversation (current build) or per player? Keep shared for today's release unless testing shows it obscures who needs relief.
