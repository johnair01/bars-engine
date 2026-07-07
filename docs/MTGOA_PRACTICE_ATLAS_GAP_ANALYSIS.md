# Practice Atlas — Hostile Review Gap Analysis (v2 → v3)

**Input**: hostile review of `docs/MTGOA_PRACTICE_ATLAS.md` v2, run against the failure criterion *"the system fails if it produces beautiful but non-playable language."*
**Output**: every finding gets an ID, a severity, a design decision, and the v3 section that implements it. Findings marked **OPEN** are acknowledged and deferred, with the reason stated.

Severity: **B** = blocker (composer built from v2 would misbehave or fail its own fixtures) · **M** = major (playability or safety hole) · **m** = minor.

---

## 1. Mechanics findings

| ID | Finding | Sev | v3 decision | Resolved in |
|---|---|---|---|---|
| M1 | Move-role assignment rule can't produce "metabolize"; scenarios need role *sequences* the single `moveRole` field can't represent | B | Roles are **removed from the selection chain** and become a descriptive `rolePath[]` annotation derived after tool choice: running a Transform/Contact-class tool logs `metabolize`; the target then logs `transcend` (same channel) or `translate` (cross-channel). Matrix 2 remains a rank tiebreak only. | Atlas §0, §1.2, §4.1 |
| M2 | Scenarios violate the v2 selection heuristic (S1, S6, S10, S11 recommend tools outside the stated sets; S11's tool is transcend-weak) | B | The one-line heuristic is replaced by an **explicit scored selection algorithm** (guards as hard blocks; score = channelFit×2 + submoveFit + shapeBonus 3; defined tiebreaks). The algorithm was hand-run against all sixteen fixtures and reproduces every recommendation. Weights are declared as v3 seeds to be tuned from session logs. | Atlas §4.1 |
| M3 | S8 skips the intensity ≥ 7 → T07 rule; S1 offers an external Show Up at intensity 6 without the override question | B | Fixtures corrected: S8 now shows the T07 prepend; S1 now shows the safety fork and the hot-action override being asked. The gates are steps 1 and 7 of the algorithm, not prose. | Atlas §4.1, S1, S8 |
| M4 | Card–vector mismatch unhandled (hot charge + Show Up card; card that doesn't land) | B | **Resonance Check + card banking**: one tap ("Does this card land? yes / not this one") with one redraw, original banked to hand; unsafe submove for the vector → composer inserts a bridge (T07 + a Clean Up mini) and banks the card's practice as the scheduled aim. | Atlas §1.3 step 2b, §4.1 step 1b |
| M5 | Re-rate delta ≤ 0 has no branch — a tool that made things worse just ends the session | M | **Close-the-loop branch table**: delta ≤ −2 → T07 now + graceful exit offered + session flagged `escalated` + thread demotes the tool; delta −1…+1 → one switch to next-ranked tool or capture-only close (max one switch); delta ≥ +2 → Show Up check. | Atlas §1.5 |
| M6 | Internal-Show-Up ratchet can't fire — no blocker identity across free-text sessions | M | **Blocker threads**: at capture the player picks "new blocker or existing thread?"; threads have player-authored short labels (not raw text). Ratchet, prior-session history, and tool demotion all key on the thread. | Atlas §1.3 step 3, §8.3 |
| M7 | `fuel` is a dead parameter; timeboxes have no enforcement mechanic | M | Fuel rule: depleted → timebox cap 5 min, candidates restricted to T07/T03-quick/T09 (guards permitting), and "rest is the move" close offered (calendar rest block = internal Show Up). Timebox mechanic: visible timer; expiry always routes to output capture ("close with what you have"); one +50% extension allowed; never silently extends. | Atlas §1.4, §4.1 step 4 |
| M8 | The twelve fixtures test only happy paths — no fixture exercises any guard, fork, or exit | B | Four **adversarial fixtures** added: S13 (Joy-tool hard block at Anger 8), S14 (graceful exit mid-tool), S15 (safety fork: power-over recipient), S16 (target-of-harm branch). A composer must pass all sixteen. | Atlas §6 S13–S16 |

## 2. Dangerous-inference findings

| ID | Finding | Sev | v3 decision | Resolved in |
|---|---|---|---|---|
| I1 | Pipeline stores blocker/story verbatim, contradicting the 321 doctrine's privacy model (raw text stays client-side) | B | **Privacy model aligned with doctrine**: only structured fields persist (vector, tool, rolePath, structured output slots, thread label, delta, flags). Raw blocker/story text stays in the client session by default; explicit "save my words" opt-in per session. | Atlas §1.6 |
| I2 | Altitude silently inferred from intensity in a document that forbids inferring emotional state | M | **Defaults shown, not silent**: altitude renders as a pre-selected, visible, one-tap-editable field (dissatisfied preselected when intensity ≥ 4). Same treatment for target state and blocker shape. Zero taps to accept, one to change. | Atlas §1.3 step 4, §8.1 |
| I3 | S1 is about fear of senior people at work and the safety fork never fires in the fixture | B | S1 rewritten: the power-gradient question fires, internal option leads, external is opt-in with stakes named. | Atlas S1 |
| I4 | Layer check exists only for Anger; sadness/fear masking is equally common | m | Layer check generalized: offered once for any channel at intensity ≥ 5, phrased per channel (anger→fear/grief; sadness→anger; fear→anger/desire). Still exactly one layer, still player-initiated. | Atlas §8.2 |
| I5 | The channel picker cannot produce the diagnoses two fixtures depend on (S10 "stuck joy as dull dread"; S11 "overloaded fog" fits neither "rest" nor "wall") | B | **Picker v3**: chips = mad / sad / scared / flat-or-numb / bright-but-stuck / I can't tell. The *flat* chip opens a four-answer fork: rested-calm (genuine Peace) / walled-off (→ T02) / buried-in-too-much (→ Earth overload) / grey-missing-aliveness (→ Joy-starved). S10 and S11 updated to route through it. | Atlas §3.1, S10, S11 |

## 3. Missing-diagnostic findings

| ID | Finding | Sev | v3 decision | Resolved in |
|---|---|---|---|---|
| D1 | No crisis screen upstream of the graceful exit | B | Always-visible "I need more than a practice" affordance + intensity-10 triggers "Do you need support beyond a practice right now?"; yes → region-configurable resources card, no tool recommendation, honorable close, nothing extra persisted. | Atlas §8.4 |
| D2 | No temporal question (happening now / replay / upcoming) despite it pivoting tool fit | M | Fourth core tap added. Routing: now+interpersonal → T07 first + smallest tool; replay → T01 shape bonus; upcoming → rehearsal bias (T04 experiment, T06 practice delivery, T05 risk map). | Atlas §1.3 step 4, §4.1 |
| D3 | No prior-session question; the composer would re-recommend a tool that just failed | M | Threads (M6) carry history: composer shows "last time on this thread: [tool], delta [n]" and applies a −2 rank penalty to tools with flat/negative deltas on that thread. | Atlas §8.3 |
| D4 | No card-resonance question | M | Covered by the Resonance Check (M4). | Atlas §1.3 step 2b |
| D5 | External options assume a reachable, safe recipient — never verified | M | Recipient check before any external interpersonal option: reachable + no power-over risk → offer; power-over → safety branch; unreachable → internal or T10 artifact route. | Atlas §8.5 |
| D6 | Ally-vs-target fork declared but its branches never defined ("changes every recommendation" — how?) | B | Branches defined concretely: **witnessed** → full tool set, external may address the situation; **received** → composer never defaults to moves directed at the person who caused harm (no educate-the-harmer, no repair-toward-harmer as default), externals default toward support people and boundaries, T04 restricted to agency-restoring turnarounds; **own conduct** → the S3 repair path. Explicit player override re-runs the safety fork. | Atlas §8.6 |

## 4. Playability findings

| ID | Finding | Sev | v3 decision | Resolved in |
|---|---|---|---|---|
| P1 | No rendered example of the final practice card — the system's actual deliverable | B | §5 added: a complete deterministic walkthrough of S2, screen by screen, in player-facing words — every question, the rendered practice card, both Show Up options, the output form, the re-rate. | Atlas §5 |
| P2 | Deterministic Show Up generation unspecified — the no-AI path dies at the hardest step | B | **Show Up template table**: per tool, one internal and one external template whose slots are filled from the tool's own structured outputs plus exactly two player-supplied values (recipient, date). Fully deterministic. | Atlas §5.2 |
| P3 | "Owned-energy sentence" unexecutable for a first-timer; completion criterion unverifiable in the moment | M | Operational check + worked good/bad example rendered in-protocol: the sentence must name a quality the *player* wants to use and must not mention the other person. | Atlas §5.4 |
| P4 | "I can't tell" routes to the tool requiring the most felt-sense skill (circular) | M | **T02-Guided variant**: body-location chips (head/throat/chest/belly/elsewhere/nowhere) then three offered handle-words per location to test — the praxis doc's pre-focusing scaffold, made concrete. | Atlas §5.5 |
| P5 | Satisfaction-spirit variations are non-performable poetry ("looks for the ache of care") | M | Spirit rule: a spirit variant adds **exactly one fill-in-the-blank step** to any protocol, nothing else. The five steps are authored in §5.3. | Atlas §5.3 |
| P6 | Recurring unverifiable success criteria ("one true sentence," "role sized to risk," "short, true") | M | Operational checks table: Clean Line stranger test; body test as an explicit protocol step with a retry bound; S8 role-sizing rule (any unmitigated real threat → remote/support role). | Atlas §5.4 |

## 5. Still open after v3 (deliberate)

| ID | Item | Why open |
|---|---|---|
| G1 | Grow Up rep-ladder mechanic | Needs its own design pass; T11 covers the game-shaped subset only |
| G2 | Dyadic/relational tool (repair rehearsal, feedback receiving) | New tool authoring, not an Atlas patch — candidate T12 |
| G3 | Sadness-native flow tool | Taxonomy research question 5; T10 remains the stopgap |
| G4 | Three tool registries in code | Implementation target 1; can't be closed by documentation |
| G8 *(new)* | Blocker-shape classifier needs authored heuristics + confirm UI | Shape is the one computed value that touches routing; mitigated by the visible-editable confirm chip, but the heuristics themselves are unwritten |
| G9 *(new)* | Spirit-step strings and scoring weights are unvalidated | Declared as seeds; tune from session logs, not taste |
| G10 *(new)* | Crisis-resources card needs region-configurable content | Product/ops decision, not a mechanic |

**Residual risks carried forward into v3 §9**: delta gaming (display, never reward), Sadness as the structurally weakest channel column, allyship-culture anger over-neutralization (standing guard question), vocabulary debt, and the non-clinical terseness requirement.
