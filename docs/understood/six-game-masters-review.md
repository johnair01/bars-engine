# Hostile review: Understood launch and orientation spec

**Reviewed:** `LAUNCH_ORIENTATION_SPEC_2026-09-17.md`
**Date:** September 17, 2026
**Method:** six sequential Game Master Face lenses from `bars-engine/specs/doctrine/gm-faces.md`. These are critical readings of the spec, not outputs from six running NPCs or a claim that human playtesting has occurred. The Library face map treats the Faces as nonhierarchical lenses; bars-engine's current doctrine treats them as an ascent. This review uses the bars-engine sequence because that is the launch destination.

## Verdict

**Creator correction:** the hidden conflict meter is an intentional information mechanic, not a promise of cryptographic privacy. Players are meant to infer the other person's unresolved charge through play. The game should lengthen rapid escalation and shorten the long tail of conflict. The earlier criticism of numerical progress as inherently coercive was misplaced; the meter is part of the point.

**Do not implement the demo script as written.** Its central stacking example violates the game's stated rule, and the release gate cannot detect that violation. The plan also tries to port, refactor, teach, test, and publish a new product inside a few hours without a credible cut line. The strongest part of the spec is its distinction between visible heat and hidden conflict; preserve that.

## 1. Shaman — is there a living conflict under the lesson?

**What breaks:** Ari and Bea are scripted to demonstrate mechanics in a conflict that always yields a clean lesson. That may teach button order while missing the actual charged moment: one player says something and the other feels less heard, more exposed, or unwilling to continue. Five runs of a deterministic script cannot establish whether the talismanic chips help two people stay in contact.

**Evidence in spec:** the demo calls for a "short spoken example" and a "later spoken chip" but gives neither a credible utterance nor a point where a reader can choose *not* to feel heard. The only human run asks two people to speak fictional lines aloud.

**Required revision:** write the precise two-reader dialogue and one genuine fork: after a listening attempt, Ari can say **not yet heard** and leave the chip in its stack, or **heard** and choose cooling/resolution. Add one two-human playthrough of an unscripted fictional conflict to the test gate. Record whether the turn structure actually slows a fast escalation and whether the meter gives the players a reason to keep working toward resolution. Do not present the simulation as proof of relational benefit.

## 2. Challenger — which claimed rule survives pressure?

**Launch blocker:** Beat 5 puts an unspoken blue chip on top of Ari's red chip; beat 6 releases the red chip while blue remains unheard. The user's rule is that a stack cannot be taken until all feelings in it have been heard. The prototype currently permits selecting and releasing a buried spoken chip. A tutorial that teaches this would make a defect into doctrine.

**Other pressure points:**

- "One chip each" followed by "both meters reach zero" is only possible if both meters start at one and both chips are heard; the test gives no initial values or exact transitions.
- The spec says one placement and one spoken bid, while the prototype allows placing a silent chip and speaking a different waiting chip in the same turn. The demo must not teach a rule still undecided.
- The 2:00 p.m. promise is two deliverables, but the fallback silently drops the interactive demo. That is a scope change, not a successful launch.

**Required revision:** settle the stack-release rule and the silent-plus-spoken turn rule before scripting. Treat the demo and live route as separate named gates; if either misses, report the miss rather than calling the remaining half complete.

## 3. Regent — can this be held safely and repeated?

**What breaks:** the hidden meter is the game’s information asymmetry, but the current one-tap meter reveal can expose it to the partner on a shared phone. If a player sees the number, they no longer have to read bids and chip flow to understand the conflict. This is a mechanism failure, not a reason to remove the hidden meter.

**Required revision:** preserve the meter as owner-only information. Give setup and later checks a deliberate device handoff with a covered/interstitial state before the value appears, then reseal it before the shared board returns. Verify during playthroughs that the other player cannot glimpse the number through ordinary turn changes. A session may still be ended without declaring resolution; that does not replace the meter’s purpose.

**Release containment:** the bars-engine checkout has unrelated uncommitted changes. The current spec says use an isolated checkout but does not name the merge base, deployment owner, or rollback route. A 1:40 candidate is not reviewable if branch provenance is still undecided at 1:30. Resolve the branch and deployment path before integration starts.

## 4. Architect — is the mechanism real or a second kingdom?

**What breaks:** the Vite prototype keeps state, rules, animation, and UI largely in one `src/main.tsx`. Extracting a shared transition layer, porting to Next, building a scripted demo, and scoping CSS by noon is an architecture project disguised as a launch task. The spec has not compared a thin, self-contained integration with a full port.

**Required revision:** run a short integration spike first. Choose the smallest verified way to serve the existing board from bars-engine while preserving its behavior and style isolation. The demo must call the *same move functions or reducer* as real play, but a wholesale refactor is not a prerequisite if a thin adapter can do it. Keep a route-level smoke test for direct load, refresh, assets, and local state separation.

**Rules-state tests that the current gate misses:**

- Buried chips cannot be released while an unheard layer blocks them, if the stack rule stands.
- A chip offered during **Tell me more** is counted in the temporary offer, not lost or duplicated.
- A release at temperature zero cannot cool, and a release at meter zero cannot reduce that meter; the owner still needs a clear legal next action.
- Demo replay cannot mutate a previously saved real game.
- First turn, pass, and expired timer are deterministic under refresh.

## 5. Diplomat — whose experience is the demo centering?

**What breaks:** the scripted conflict casts Bea as the person who changed a plan and Ari as the person with anger, then lets Bea mainly ask, listen, and receive. It risks making "good conflict" look like one party's disclosure and the other's correction. The visible heat signal is shared, but the button is on each player's side; the tutorial does not explain whose report it represents or how a partner should respond without disputing it.

**Required revision:** give Bea a coherent feeling and boundary of her own. Explain that a heat signal is a self-report about the conversation, not a verdict about which person caused it. In the demo, let the visitor guide both readers and label the current perspective before each action. Include one branch where a proposed question is declined or a chip remains face down; the listener's curiosity does not override that boundary.

**Homepage concern:** `/mastering-allyship` is a book sales page. A large new game CTA there could confuse visitors about the main offer. Test a compact invitation in the existing page hierarchy and confirm that "guided demo" clearly names a different product experience.

## 6. Sage — what whole is the game teaching?

**What breaks:** the spec has two meters but does not explain their different time jobs. Visible temperature is meant to slow escalation that happens too quickly. The hidden conflict meter is meant to shorten conflict that otherwise takes too long. If the tutorial treats cooling as resolution, it loses the second job; if it drives the hidden meter down while play is hot, it loses the first.

**Required revision:** stage both motions clearly: a heat rise interrupts the rush; a heard chip can cool that immediate moment; a later heard chip can lower unresolved conflict. Preserve the cooperative zero state as a meaningful win condition. The game can still be resumed or played beyond zero without making zero the only acceptable human outcome.

## Priority rulings before implementation

| Priority | Ruling | Why |
| --- | --- | --- |
| P0 | Make stack release legal and rewrite beats 5–7 around that rule | Current tutorial violates the game's own premise |
| P0 | Define the turn combination: silent placement plus speaking a waiting chip | Demo and tests need one teachable action economy |
| P0 | Decide a minimal bars-engine integration path and deployment branch before building | Prevents a deadline-driven, unreviewable port |
| P1 | Protect the hidden meter during setup and owner-only peeks | Preserves the game’s information asymmetry on one device |
| P1 | Write concrete dialogue with a not-heard branch and a second perspective | Makes the demo about relational choice, not button rehearsal |
| P1 | Add exact starting meters, chip counts, turn states, and expected state after every tutorial beat | Makes the demo and five runs falsifiable |
| P2 | Reduce launch routes to `/understood/demo` and `/understood/play` if the landing page adds no essential instruction | Protects time while retaining both requested deliverables |

## Revised launch gate

The product can be called ready only when a new visitor can enter from the homepage, complete a legal interactive demo, and start a real two-person game; two humans can play an unscripted fictional conflict and report whether the game slowed escalation and made resolution feel attainable; the core state invariants hold; mobile controls work; and the other player does not see an owner’s hidden meter during ordinary play. If this evidence is unavailable by 2:00 p.m., report which deliverable is incomplete. Do not turn an untested simulation into a claim that the conflict game works.

## GM Face Routing

Primary Face: **Challenger** — the spec's load-bearing assumption is that a tutorial can teach the current rules without contradiction.
Charge: the desire to get a tangible relationship game live today that slows fast escalation and speeds long-delayed resolution without exposing hidden information.
Element: **not assigned by this document**; no live Shaman reading or human play encounter has established it.
Satisfaction payoff: visitors can learn why cooling and resolving are different moves, and two people can read each other through play while the hidden meter gives resolution traction.
Altitude reached: **review lenses only**; no claim of a full Game Master ruling or operator reading.
Secondary Faces: Shaman, Regent, Architect, Diplomat, Sage.
Council concerns: protection of hidden information, provenance of demo rules, and release evidence.
