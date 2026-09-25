# Mastering the Game of Allyship — Practice Atlas

**Status**: Design doctrine (v3). Bridges the book, the Allyship Deck, Emotional Alchemy, and bars-engine.
**v3 change basis**: [`docs/MTGOA_PRACTICE_ATLAS_GAP_ANALYSIS.md`](MTGOA_PRACTICE_ATLAS_GAP_ANALYSIS.md) — every hostile-review finding (M1–M8, I1–I5, D1–D6, P1–P6) is resolved here or explicitly deferred there. Finding IDs are cited inline as `[M4]` etc.
**Canonical tool layer**: [`docs/EMOTIONAL_ALCHEMY_TOOL_TAXONOMY.md`](EMOTIONAL_ALCHEMY_TOOL_TAXONOMY.md) (T01–T11, v1.1) — protocols, ratings, completion criteria. Where the two disagree, the taxonomy wins.
**Grounding**: `src/lib/allyship-deck/move-library.ts`, `src/lib/technique-library/canonical.ts`, `specs/doctrine/emotional-alchemy-321.md`, `docs/FELT_SENSE_321_PRAXIS.md`, `src/lib/emotional-first-aid.ts`, `.specify/specs/allyship-deck-literacy/spec.md`.
**Rule for this document**: every practice names a timebox and a recordable output. Anything labeled *(inference)* is a design proposal, not established canon. No book citations are invented.

---

## 0. Terminology Bridge

| Atlas term | Meaning | Codebase term | Where |
|---|---|---|---|
| **Move** | The emotional transformation needed (e.g., Anger at 8 → Triumph) | `CapabilityDef` dissatisfied → satisfaction | `move-library.ts` `CAPABILITIES` |
| **Role path** | Descriptive annotation of what a session did, derived after tool choice — never a selector `[M1]`: running a Transform/Contact-class tool logs `metabolize`; the target then logs `transcend` (same channel) or `translate` (cross-channel). Matrix 2 ratings are a rank tiebreak only (§4.1). | Taxonomy Compact Matrix 2 | `EMOTIONAL_ALCHEMY_TOOL_TAXONOMY.md` |
| **Submove** | One WAVE phase: Wake Up, Open Up, Clean Up, Grow Up, Show Up | `BasicMove` | `move-library.ts` `MOVES` |
| **Tool** | A named, timeboxed protocol that performs a submove (T01–T11) | `Technique` / EFA tool / taxonomy tool | taxonomy; `technique-library/`; `emotional-first-aid.ts` |
| **Card** | Submove × Operation × Domain (120 total) | `MoveCard` | `assemble.ts` |
| **Emotional vector** | `{channel, intensity, altitude, target}` — §1.2 | *(implementation target #2)* | — |
| **Blocker shape** | A situational classification that biases tool ranking (§4.1) — computed, shown, one-tap editable, never silent | *(implementation target #3)* | — |
| **Thread** | A player-named blocker identity linking sessions `[M6]` | *(implementation target #4)* | — |
| **Satisfaction spirit** | The target state; mechanically it adds exactly one fill-in-the-blank protocol step (§5.3) `[P5]` | `CapabilityDef.satisfaction` | `move-library.ts` |
| **Playable recommendation** | vector + submove + tool + spirit step + Show Up options + output form, with rolePath logged | *(implementation target #3)* | — |

⚠ **Naming collisions** (unchanged from v2, still needing canon decisions before UI copy): (1) "submove" = WAVE phase here vs Move×Operation in `SUBMOVES` — proposal: WAVE phase = submove, Move×Operation = **stance**; (2) WAVE the arc vs `tech-wave` the breath tool — proposal: fold the breath tool into T07 as a reset mode; (3) deck "Transcend/Translate/**Neutralize**" vs role path "metabolize/translate/transcend" — proposal: Neutralize ≈ metabolize. All three *(inference)*.

**Channel constants** (canonical in `move-library.ts`):

| Channel | Element | Dissatisfied emotion | Capability | Satisfaction |
|---|---|---|---|---|
| Anger | Fire | Anger | Agency — "I can act." | **Triumph** |
| Sadness | Water | Sadness | Connection — "I can connect." | **Poignance** |
| Fear | Metal | Fear | Exploration — "I can explore." | **Wonder** |
| Joy | Wood | Joy (stuck) | Participation — "I can participate." | **Bliss** |
| Neutrality | Earth | Neutrality | Rest — "I can rest." | **Peace** |

The channel gives the **default** target. Cross-channel routing (the `translate` role) is a player choice via a visible, editable default — never a silent inference (§8.1).

---

## 1. From Card to Recommendation

### 1.1 The core law

> A tool without a move is inert. A move without a tool is too abstract.
> A recommendation is **playable** only when the player can execute it from the rendered card alone (§5 shows one in full), it fits the declared timebox, and it names one inspectable output.

### 1.2 The emotional vector

```
EmotionalVector {
  channel:    anger | sadness | fear | joy | neutrality
  intensity:  0–10           // player-rated
  altitude:   dissatisfied | neutral | satisfied      // visible default, editable [I2]
  target:     peace | triumph | poignance | bliss | wonder   // visible default from channel, editable
}
```

`rolePath: ('metabolize'|'translate'|'transcend')[]` is **derived, not chosen** `[M1]`: append `metabolize` when a Transform/Contact-class tool runs; append `transcend` or `translate` from target vs channel. It is logged for telemetry and matrix tuning, and it never gates selection.

### 1.3 The pipeline

**Question budget** *(honest accounting, replacing v2's "≤3 questions")*: **4 taps** (channel, intensity, time, temporal) + **3 visible-editable defaults** (altitude, target, blocker shape — zero taps to accept, one to change) + **conditional forks** (at most 2 ever shown: flat-fork, layer check, safety, recipient — each fires only on its trigger). The crisis affordance is always visible and costs nothing.

1. **Capture the blocker** — one sentence, free text, client-side (§1.6). The prompt invites the somatic pause per the felt-sense praxis ("Notice where in your body the charge lives" — optional, never required).
2. **Draw** — the card fixes the WAVE submove, the stance question, and the domain.
   **2b. Resonance Check** `[M4][D4]` — one tap: *"Does this card land? (yes / not this one)"*. "Not this one" → one redraw; the original is **banked** to the player's hand. If the diagnostic (step 4) later shows the card's submove is unsafe for the vector (e.g., Show Up or Grow Up card at intensity ≥ 7), the composer inserts a bridge — T07 plus a Clean Up mini-tool — runs that now, and banks the card's practice as a scheduled aim with a date. The card is never silently overridden and never forces a hot player into action.
3. **Thread check** `[M6][D3]` — *"New blocker, or one you're already working?"* Existing thread → the composer shows history ("last time: T04, delta +1") and applies the demotion rule (§8.3).
4. **Diagnose** — channel (picker v3, §3.1, including *I can't tell*), intensity 0–10, time (2/10/30), temporal (*happening now / replaying the past / coming up*) `[D2]`; then the three visible defaults: altitude, target, blocker shape. Conditional forks fire here if triggered (§8).
5. **Capture the story** — "What are you telling yourself about the blocker?" One sentence, client-side. Situation ≠ interpretation; the story feeds Clean Up tools.
6. **Resolve** — the composer runs the §4.1 algorithm and renders the practice card (§5): tool protocol + stance question + spirit step + timebox + output form.
7. **Play** — visible timer `[M7]`. Expiry always routes to output capture ("close with what you have — write the output line now"); one +50% extension allowed; never silently extends.
8. **Show Up check** — one internal and one external option rendered from the template table (§5.2). Pick, schedule, or decline; declining is logged, not shamed.
9. **Close the loop** — re-rate intensity; branch per §1.5.
10. **Graceful exit — available at every step** `[D1]`: "this feels too big for a practice right now — that's useful signal too." Logged as an honorable outcome.

AI is additive at steps 6–8 (tailoring language); the deterministic path is complete without it — §5 proves it by example.

### 1.4 Fuel and time gating `[M7]`

Fuel (depleted / steady / charged) is asked with intensity. **Depleted** → timebox capped at 5 min; candidate tools restricted to T07, T03-quick, T09 (guards permitting); and the composer offers "rest is the move": a calendar rest block, which counts as an internal Show Up. **Time = 2 min** → T03-quick or T07 only.

### 1.5 Close the loop — branch table `[M5]`

| Re-rate delta | Composer behavior |
|---|---|
| ≤ −2 (worse) | T07 now; graceful exit offered; session flagged `escalated`; the thread demotes this tool (§8.3) |
| −1 … +1 (flat) | Offer **one** switch to the next-ranked tool, or a capture-only close. Never more than one switch per session. |
| ≥ +2 (moved) | Proceed to Show Up check |

Deltas are displayed, never scored or rewarded — reward the *logging*, never the *number*, or players learn to inflate the before-rating.

### 1.6 Privacy model `[I1]`

Aligned with the 321 doctrine (`specs/doctrine/emotional-alchemy-321.md`): **persisted** = structured fields only (vector, tool id, rolePath, structured output slots, thread label, delta, flags like `escalated`/`exited_gracefully`). **Client-session only by default** = raw blocker text, raw story text, raw protocol answers. A per-session **"save my words"** opt-in persists raw text when the player explicitly chooses. Thread labels are short player-authored names, not raw text.

### 1.7 The Show Up distinction (load-bearing, unchanged)

Show Up ≠ external; external ≠ Show Up. Show Up = the charge becomes embodied: commitment, artifact, communication, ritual, boundary, ask, quest seed, or action. Internal Show Up is a real move (rehearsed line, 24-hour rule, ritual, vow with a date) — not another journal entry. Reflection artifacts are Clean Up outputs; they become Show Up only when bound to a recipient, a date, or a public artifact. External options require the §8.5 recipient check and the §1.5 gate (intensity < 4, or an explicit asked-not-defaulted hot-action override).

---

## 2. Tool Roster and Matrix A

Roster digest (protocols, completion criteria, and misuse notes live in the taxonomy):

| ID | Tool | Native submoves (strong) | Timebox | Output |
|---|---|---|---|---|
| T01 | 321 Charge Dialogue | Wake, Clean, Grow | 7–15 min (mini 3) | part name + quote + owned-energy sentence + optional quest seed |
| T02 | Find the Felt Thread | Wake, Open, Clean | 3–8 min | body location + handle + fit signal + sentence |
| T03 | BAR Capture | Wake, Grow | 5–10 min (quick 90 s) | BAR seed + blocker + next artifact |
| T04 | Story Turnaround | Clean, Grow | 8–15 min | belief + cost + turnarounds + replacement + experiment |
| T05 | Put It On The Board | Wake, Grow | 10–20 min (fast 5) | map + classified blocker + next-move location |
| T06 | Clean Line | Grow, Show | 5–12 min | script + outcome |
| T07 | Return to the Body | Open | 1–5 min | before/after rating + reset mode + next signal |
| T08 | One True Next Move | Show | 3 + ≤10 min | mission + action + completion note |
| T09 | Happy Apples | Open | 2–5 min | three apples + one received + share/log |
| T10 | Make It Real | Open, Show | 5–15 min | ritual sentence + action + integration note |
| T11 | Make It A Game *(canonized v1.1)* | Grow | 15 min + rep ≤15 | game card + rep 1 log |

**Matrix A — Tool × WAVE submove** (canonical; taxonomy Compact Matrix 1 + T11): unchanged from the taxonomy — see that document. The honest readings stand: Show Up has exactly three strong tools (T06, T08, T10), and Grow Up's strong ratings all produce reflection or single acts — the rep-ladder mechanic remains gap G1.

---

## 3. Matrix B — Channel × Transformation Need, and the Picker

Matrix B is unchanged from v2 (Anger→clean force→Triumph; Sadness→grieve/restore flow→Poignance; Fear→orient/protect/explore→Wonder; Joy→express/participate→Bliss; Neutrality→structure/rest **or misdiagnosed numbness**→Peace), each with its signature bypass. The operative change is the instrument:

### 3.1 Channel picker v3 `[I5]`

Chips: **mad · sad · scared · flat or numb · bright-but-stuck · I can't tell**

- *I can't tell* → T02-Guided (§5.5) before any routing. A first-class answer, per the felt-sense praxis's pre-focusing level.
- *flat or numb* → the **flat fork** (one follow-up, four answers):

| Answer | Reading | Route |
|---|---|---|
| "Rested-calm — genuinely okay" | Real Peace | Peace-check close; celebrate; optionally declare a rest window (internal Show Up) |
| "Walled-off — something's behind it" | Frozen charge | T02 to find what froze (the S12 path) |
| "Buried — too many things" | Earth overload | Neutrality channel, overload shape (the S11 path) |
| "Grey — missing aliveness" | Joy-starved | Joy channel, stuck-joy reading (the S10 path) |

The app never maps flat → Peace automatically; the fork is mandatory before Neutrality can carry a Peace target.

---

## 4. Matrix C and the Selection Algorithm

**Matrix C — Tool × Channel** ratings are canonical in the taxonomy (Compact Matrix 3 + T11). The Atlas adds the **hard guards**, which the composer enforces as blocks, not footnotes:

| Guard | Rule |
|---|---|
| Hot charge | intensity ≥ 7 → T07 prepended before any other tool, always `[M3]` |
| Joy-tool block | T09, T11 blocked at Anger or Sadness intensity ≥ 5 |
| Grief-inquiry block | T04 blocked on fresh Sadness; on the *received-harm* branch, T04 restricted to agency-restoring turnarounds (§8.6) |
| No gamified risk | T11 blocked when the blocker involves physical risk; risk goes to T05 as an inventory with mitigations |
| Action-on-grief block | T08 blocked on early Sadness |
| Clean-line readiness | T06 blocked while the intent is punish / recruit guilt / control outcome (taxonomy item 14) |
| External gate | external Show Up options require §8.5 recipient check + §1.7 intensity gate or explicit override |

### 4.1 The selection algorithm `[M2]`

Deterministic, ordered. Ratings: strong = 2, medium = 1, weak = 0 (excluded).

```
recommendPractice(card, vector, ctx {time, fuel, temporal, shape, thread, flags}):

0. Crisis flag set                     → resources path (§8.4); no tool. STOP.
1. intensity ≥ 7                       → prepend T07 (1–5 min); shrink time budget.
1b. card.submove ∈ {show_up, grow_up} AND intensity ≥ 7
                                       → bridge: T07 + best Clean Up mini; bank card as scheduled aim [M4].
2. channel = can't-tell                → T02-Guided (§5.5). STOP (session = locate + capture).
3. Candidates = tools rated strong for card.submove (Matrix A).
   If, after step 4, the set is empty  → admit medium-rated tools.
4. Remove hard-guard-blocked tools (table above + temporal rules:
   now+interpersonal → smallest tool; upcoming → rehearsal bias T04/T05/T06).
5. Score each candidate:
     score = channelFit × 2  +  submoveFit  +  (shapeBonus: +3 if the blocker shape names this tool)
   Shape → tool map: interpersonal-live → T06 · imagined/replayed other → T01 ·
   two-voices-at-war → T01 · belief-in-one-sentence → T04 · many-items-swirl → T05 ·
   win-that-won't-land → T09 · practice-edge → T11 · unclear-heavy-body → T02 ·
   ready-to-act → T08.
   Thread demotion: −2 to any tool with a flat/negative delta on this thread (§8.3).
6. Tiebreaks, in order: aim fit (Matrix 2, transcend/translate) → shortest timebox
   that fits the budget → registry order.
7. If the chosen tool is not Show-Up-strong and time remains → attach the best-fit
   Show Up bridge (T06/T08/T10) via the §5.2 templates.
```

The blocker **shape** is the one computed value that touches routing. It is computed from the blocker/story text, **shown as a chip, and one-tap editable** — computed-and-confirmed, never silent (gap G8 tracks the classifier heuristics).

**Weights are v3 seeds** `[G9]`: chosen because they reproduce all sixteen fixtures (§6) when hand-run; they are to be re-fit from session logs, not taste. The sixteen fixtures are the composer's regression suite — a change to weights or guards that breaks a fixture is a canon change and must be made deliberately.

---

## 5. The Rendered Practice Card `[P1]` — and the Deterministic Machinery Behind It

### 5.1 Worked example: S2, end to end, no AI

Player draws **CLEAN-SO-CHALLENGER** (Clean Up × Challenger × Skillful Organizing).

> **Card**: *Challenge interpretation — "What story am I believing?"*
> **[Does this card land?]** → yes
> **[New blocker or existing thread?]** → new · label it: `logistics-resentment`
> **Blocker** (stays on your device): "I'm the only one who does logistics for the group, again."
> **[Which is closest?]** mad · **[How strong, 0–10?]** 5 · **[Time?]** 10 min · **[When is this?]** happening now
> **Defaults shown**: altitude *dissatisfied* ✓ · target *Triumph* → player changes to **Peace** · shape *belief-in-one-sentence* ✓
> **Story** (stays on your device): "If I don't do it, nobody will."
>
> *(Composer: no crisis flag; intensity 5 < 7; candidates for Clean Up = T01/T02/T04; anger guards pass; scores — T04: 2×2+2+3 = 9, T01: 6, T02: 4. T04 wins. Target Peace ≠ channel Anger → aim translate. rolePath will log [metabolize, translate].)*
>
> ---
> **Your practice: Story Turnaround — 10 minutes. Timer starts when you do.**
> 1. Write the story as one sentence: "I cannot ___ because ___."
> 2. Is this completely true right now? (yes / no / not completely)
> 3. When you believe it, what happens? One line each: body / action / emotion.
> 4. Who would you be for 10 minutes without this thought? One line.
> 5. Write three turnarounds. *(Example shape: "Nobody will" → "Nobody has been asked with a date attached.")*
> 6. Pick the one replacement you could test **today**.
> 7. **Peace step**: "What would let this settle is ___."
>
> **Output form** (this is what's saved): belief · cost lines · 3 turnarounds · replacement · experiment · peace line.
> **Show Up — pick one, or decline:**
> - *Internal*: Hold "[replacement]" for 24 hours; log evidence tonight at [time].
> - *External*: Run the ≤10-minute experiment — "[experiment]" — before [date]. *(Anyone involved? → recipient check runs.)*
> **Re-rate: how strong is the charge now, 0–10?**

Every bracketed slot is filled from the diagnostic or the tool's own output fields. Nothing above requires a language model.

### 5.2 Show Up template table `[P2]`

Deterministic: slots come from the tool's structured output plus at most two player-supplied values (**recipient**, **date/time**).

| Tool | Internal template | External template |
|---|---|---|
| T01 | Vow: "I will honor **[part]** by **[one conduct rule]** for 24h." | Send one ask written from "**[owned-energy sentence]**" to **[recipient]** by **[date]**. |
| T02 | Save "**[handle]**" as a BAR seed for a later quest. | Ask one curiosity question about **[handle]** to **[recipient]** by **[date]**. |
| T03 | Adopt "**[next artifact]**" as a 24-hour practice; check off at **[time]**. | Send/publish **[next artifact]** to **[recipient/venue]** by **[date]**. |
| T04 | Hold "**[replacement]**" for 24h; log evidence at **[time]**. | Run the ≤10-min experiment "**[experiment]**" before **[date]**. |
| T05 | Hold the edge: "**[circled move]**" is the only work on this today. | Make the ask to **[resource item]** by **[date]**. |
| T06 | Keep "**[line]**" as a 24-hour rule. | Deliver "**[line]**" to **[recipient]** at **[event/date]**. |
| T07 | Pause-before-reply rule until **[time]**. | Rejoin **[task]** and do one ≤10-min action now. |
| T08 | Mission lock: "**[mission]**" — refuse other missions for 1 hour. | Do "**[action]**" now, or at **[scheduled time]**. |
| T09 | Permission slip: "**[apple]** counts." | Share **[apple]** with **[recipient/channel]** by **[date]**. |
| T10 | Perform **[ritual action]** privately at **[time]**; log the shift. | Create/share **[artifact]** with **[recipient]** by **[date]**. |
| T11 | Play round one solo tonight; log the score. | Recruit **[partner]** for rep 1 on **[date]**. |

### 5.3 Spirit steps `[P5]`

A satisfaction spirit adds **exactly one fill-in-the-blank step** to any protocol — nothing else. The five steps:

| Spirit | Added step |
|---|---|
| Peace | "What would let this settle is ___." |
| Triumph | "The clean power I want to use here is ___." |
| Poignance | "What I care about under this is ___." |
| Bliss | "What wants to be shared or played here is ___." |
| Wonder | "The question that makes this interesting is ___." |

The taxonomy's per-tool spirit notes (item 18) are guidance for *authoring* tool-specific variants later; until playtested, only these five generic steps ship `[G9]`.

### 5.4 Operational checks for fuzzy criteria `[P3][P6]`

| Fuzzy criterion | Operational check (rendered in-protocol) |
|---|---|
| Owned-energy sentence (T01) | Must name a quality **you** want to use; must not mention the other person. ✗ "The clean energy is that Marcus should listen." ✓ "The clean energy I can reclaim is my directness." |
| Clean Line "short and true" (T06) | Stranger test: would a stranger reading only this sentence know exactly what is being asked or declined? |
| "One true sentence" (T02) | Body test as an explicit step: read it aloud; if the body loosens, keep it; if it tightens or nothing happens, try once more, then keep the best of the two. Bounded — two attempts, not a perfection loop. |
| Role sized to risk (S8) | If any *real* threat on the board lacks a mitigation with an owner → remote/support role. All mitigated → on-street with buddy. Player override allowed and logged. |

### 5.5 T02-Guided — the "I can't tell" scaffold `[P4]`

For pre-focusing players (per `FELT_SENSE_321_PRAXIS.md` level 1), plain T02 assumes skill they don't have yet. T02-Guided replaces open questions with choices:

1. 20–30 s pause (the app holds the silence — a visible slow timer, no text).
2. "Where does it sit?" — chips: head / throat / chest / belly / elsewhere / nowhere I can find.
3. The app offers **three handle words** for that location (authored per location, e.g. chest: *tight · heavy · fluttery*) plus "none of these."
4. "Say the word to yourself. Does your body go *more open*, *tighter*, or *nothing*?" — that one question **is** the checking skill being trained.
5. Output: location + best handle (or "no handle formed yet" — a valid completion) + one sentence if one comes.

---

## 6. Sixteen Fixture Scenarios

S1–S12 are the golden path; S13–S16 are adversarial `[M8]`. All sixteen are the composer's test suite; each was hand-run through §4.1. Role paths are the logged annotation, not a selector.

### S1 · The Interrupted Colleague — Anger → Triumph *(rewritten: safety fork fires `[I3][M3]`)*

- **I want** to intervene when Maya gets talked over in meetings **so I can feel Triumph**.
- **Blocked by** my freeze response in rooms with senior people. **Story**: "It's not my place — I'd make it about me."
- **I feel** mad · 6 · dissatisfied. **Vector**: Anger 6 → Triumph. Shape: *interpersonal-live*.
- **Safety fork fires** (workplace, power gradient): "Does acting on this involve your boss, your livelihood, or someone with power over you?" → *"Senior people, yes."* → composer leads internal, frames external as opt-in with stakes named.
- **Deck practice**: Show Up × Challenger × Direct Action. **Tool**: T06 Clean Line (score 6 + shape bonus; T08 loses tiebreak).
- **Internal Show Up** (led): the line — "I want to hear Maya finish her point." — spoken aloud 3×; 24-hour rule signed; meeting calendared.
- **External Show Up** (opt-in, stakes named): recipient check runs → *power-over risk acknowledged* → the option renders with the risk stated and a fallback ("if the room punishes it, the follow-up is a 1:1 with Maya, not silence"). Player chooses.
- **Output**: the line + post-meeting log + re-rate. **rolePath**: [transcend].

### S2 · The Invisible Labor Ledger — Anger → Peace (player-chosen translate)

As rendered in full in §5.1. **Tool**: T04 + T08 follow-on. **rolePath**: [metabolize, translate]. Standing guard applies: *"Neutralizing because it's complete — or because anger is unwelcome here?"* is asked when an Anger player retargets to Peace.

### S3 · Called In — Anger (layered) → Peace

Unchanged from v2 in substance: intensity 7 → **T07 prepend fires** (step 1), then T01 on "The Judge" (shape: *imagined/replayed other*). Layer check offered once. Internal: owned-energy sentence + drafted acknowledgment ("You were right about the impact; thank you for telling me directly."). External: deliver within 48h, then stop talking. **rolePath**: [metabolize, translate]. This is also the **own-conduct branch** exemplar (§8.6).

### S4 · After the Ballot Measure Failed — Sadness → Poignance

Unchanged: T02 (3–8 min; T04 guard-blocked on fresh grief), one-true-sentence with the §5.4 body test; T10 candle-and-roster ritual as internal Show Up; public thank-you by Sunday as external. **rolePath**: [metabolize, transcend].

### S5 · The Ruptured Friendship — Sadness → Poignance

Unchanged: T01 run twice (shape: *two-voices-at-war*) — The Gatekeeper, The One Who Misses Him; decision line both parts can live with; T06 repair-type script as external. **rolePath**: [metabolize, transcend].

### S6 · First Workshop Terror — Fear → Wonder

Unchanged, T11 now canonical: "Recovery Reps" — win = one clean recovery from a mistake, not a flawless workshop (shape: *practice-edge*, bonus makes T11 beat T01/T04). Rep 1 with two curveball-throwing friends this week. **rolePath**: [transcend].

### S7 · The Ask I Keep Not Making — Fear → Wonder

Unchanged: temporal = *coming up*; shape: *imagined other* → T01 on "The Donor Who Says No"; T06 ask-script; one ask sent by Friday; imagined "no" logged next to the actual answer. **rolePath**: [metabolize, transcend].

### S8 · Before the March — Fear → Peace *(rewritten: hot-charge gate fires `[M3]`)*

- **I feel** scared · **7** · dissatisfied. **Vector**: Fear 7 → Peace (player-chosen). Shape: *many-items-swirl*. Temporal: *coming up*.
- **Step 1 fires**: T07 Return to the Body, 2 min (longer-exhale rounds), re-rate → 5. Then:
- **Deck practice**: Clean Up × Shaman × Direct Action. **Tool**: T05 (shape bonus; T04 guard-blocked — external danger is real, per its own when-not-to-use). T11 guard-blocked (physical risk).
- Board: facts vs stories; every real threat gets a mitigation **with an owner**; role sized by the §5.4 rule.
- **Internal**: board + chosen role. **External**: buddy pair confirmed + safety plan shared by Thursday.
- **Output**: T07 before/after + the board + role + buddy message. **rolePath**: [metabolize, translate].

### S9 · The Win Nobody Toasted — Joy (stuck) → Bliss

Unchanged: T09 (shape: *win-that-won't-land*; the Anger/Sadness ≥ 5 guard does not apply — channel is Joy). Three apples; 30-second receive; org-channel post + 20-minute timeboxed celebration. **rolePath**: [transcend].

### S10 · The Grim Duty Problem — Joy (starved) → Bliss *(picker path fixed `[I5]`)*

- Player taps **flat or numb** → flat fork → **"Grey — missing aliveness"** → channel reads Joy (starved), intensity 4.
- **Deck practice**: Grow Up × Shaman. **Tool**: T11 (shape: *practice-edge/play*; Joy-tool guard passes — no hot Anger/Sadness). Redesign the dreariest task as a game; score in Happy Apples.
- **Internal**: game card + one solo round tonight. **External**: recruit one playtest partner (T08-sized invite).
- **Output**: game card + round-one score + partner and date. **rolePath**: [transcend].

### S11 · Three Orgs, Zero Sleep — Neutrality → Peace *(picker path fixed `[I5]`)*

- Player taps **flat or numb** → flat fork → **"Buried — too many things"** → genuine Earth overload, intensity 6.
- **Deck practice**: Wake Up × Regent × Skillful Organizing. **Tool**: T05 (shape: *many-items-swirl*), keep max 5 / hand off / end; T08 follow-on for the first hand-off.
- **Internal**: board + calendar rest block with meeting-grade standing. **External**: two step-back messages with named successors or clean end dates.
- **Output**: the board (17 items marked) + 2 messages + rest block. **rolePath**: [transcend].

### S12 · The Nothing — flat, unverified

- Player taps **flat or numb** → fork → **"Walled-off — something's behind it."** Target stays *undetermined*; the app refuses a Peace target until the channel is verified.
- **Deck practice**: Wake Up × Shaman. **Tool**: T02 (or T02-Guided if the player also can't rate intensity) + T03 quick capture for whatever thaws. "No handle formed yet" is a valid completion.
- **Internal**: verdict BAR ("the nothing is a wall in my chest; behind it, grief about the deportations") — or *rested-calm re-verdict*, celebrated. **External**: one re-engagement act sized to fuel, or a declared rest window.
- **Output**: location + handle + verdict BAR + sized act or rest window. **rolePath**: [metabolize] (+ later aim once the channel is known).

### S13 · Guard fixture — "Just give me the good-vibes tool" `[M8]`

- Setup: player taps mad · **8** · asks for Happy Apples by name ("I want to feel good").
- **Expected composer behavior**: step 1 prepends T07. T09 is **hard-blocked** (Anger ≥ 5); the block is *explained, not silent*: "Happy Apples on top of hot anger tends to paint over it — let's cool the charge and meet it first; apples after." Offer: T07 → T01. Player may still capture-only close.
- **Output**: T07 before/after + either T01 outputs or a capture-only close. Fixture passes only if T09 never renders as the practice.

### S14 · Exit fixture — grief too big mid-tool `[M8]`

- Setup: S4-like player, mid-T02, taps the always-visible "I need more than a practice."
- **Expected**: protocol halts without a completion demand; graceful-exit copy ("too big for a practice right now — that's useful signal too"); resources card offered (§8.4); session logged `exited_gracefully` with no penalty state; thread preserved; nothing extra persisted.
- Fixture passes only if the exit is reachable in ≤ 1 tap from every protocol step.

### S15 · Safety fixture — the boss `[M8]`

- Setup: blocker names the player's manager; intensity 6; card Show Up × Challenger.
- **Expected**: safety fork fires on capture (power-over). External-toward-boss options are **not rendered by default**; the composer leads with internal (T06 line as a held rule) and offers a *support-directed* external (rehearse the line with a trusted peer by [date]) instead. Confront-the-boss appears only behind an explicit "I want to act on this directly" tap, which re-runs the recipient check with stakes named.
- Fixture passes only if no default option targets the person holding power over the player.

### S16 · Target-of-harm fixture — received, not witnessed `[M8][D6]`

- Setup: player received a slur at an organizing meeting; taps mad · 7; card Open Up × Diplomat.
- **Expected**: the ally-or-target question fires (identity-harm trigger); answer *received* → the **received-harm branch** (§8.6): T07 prepend (intensity 7); tool T01 or T02 for the player's own charge; **no rendered option suggests educating, repairing toward, or managing the harmer**; external options default to support people ("tell [trusted person] what happened by [date]") and boundaries ("the T06 line names what you won't absorb, delivered only if and when you choose"); T04, if reached later, restricted to agency-restoring turnarounds — never one that assigns the player fault for harm received.
- Fixture passes only if every default external points toward support or boundary, none toward the harmer.

**Coverage**: all five submoves as drawn cards, all four domains, all five spirits, both translate cases (S2, S8), every tool T01–T11 as primary or follow-on, every hard guard, both fork paths of the flat chip, the safety fork, the received-harm branch, and the graceful exit.

---

## 7. Gaps — v3 status

| ID | Gap | Status |
|---|---|---|
| G1 | Grow Up rep-ladder mechanic (reps, rungs, evidence) | **OPEN** — T11 covers the game-shaped subset only |
| G2 | Dyadic/relational tool (repair rehearsal, feedback receiving) | **OPEN** — candidate T12; S3/S5 still exit the system where the hardest move begins |
| G3 | Sadness-native flow tool | **OPEN** — taxonomy research question 5; T10 is the stopgap; the UI should say so rather than route grief silently to a mediocre fit |
| G4 | Three tool registries in code | **OPEN** — implementation target 1 |
| G5 | Completion check | **CLOSED** — §1.5 branch table + session log (target 5) |
| G6 | Make It A Game orphaned | **CLOSED** — T11 canonized in taxonomy v1.1 |
| G7 | Fuel/time gating | **CLOSED** — §1.4 + timer mechanic |
| G8 | Blocker-shape classifier heuristics + confirm UI | **OPEN** *(new)* — the one computed value touching routing; mitigated by computed-and-confirmed display |
| G9 | Scoring weights and spirit steps unvalidated | **OPEN** *(new)* — declared seeds; tune from session logs |
| G10 | Region-configurable crisis resources content | **OPEN** *(new)* — product/ops decision |

---

## 8. Ask, Don't Infer — v3 question inventory

Core (always): channel tap · intensity 0–10 · time · temporal `[D2]`. Visible-editable defaults (never silent `[I2]`): altitude · target · blocker shape. Conditional forks (max 2 shown per session):

1. **Defaults rule.** A default is *asked* if it is visible, pre-selected, and one-tap editable before anything downstream uses it. Silent computation of any emotional field is forbidden; blocker shape is the sole computed routing input and carries a confirm chip (G8).
2. **Layer check** `[I4]` — once, any channel, intensity ≥ 5, phrased per channel: anger → "sometimes anger guards fear or grief"; sadness → "…guards anger"; fear → "…guards anger or a desire". One layer. Player-initiated descent only.
3. **Threads** `[M6][D3]` — "New blocker or existing thread?" Existing → show last tool + delta; tools with flat/negative deltas on this thread take a −2 rank penalty; the **internal-only ratchet** (3 sessions on one thread with internal-only Show Ups → "this one may be asking for a move in the world — want to look at what's in the way of that?") runs on threads, gently, once.
4. **Crisis** `[D1]` — always-visible "I need more than a practice" affordance; intensity 10 additionally triggers "Do you need support beyond a practice right now?" Yes → region-configured resources card (G10), honorable close, no tool, nothing extra persisted. BARS is a skill practice, not therapy, and is not the trained companion the Focusing lineage recommends for players in active treatment.
5. **Recipient check** `[D5]` — before any external interpersonal option: "Can [recipient] be reached, and is it safe to send this?" → *yes* → render; *power-over risk* → safety branch (internal-first, stakes named, S15); *can't reach* → internal or T10 artifact route.
6. **Ally or target** `[D6]` — asked when the blocker involves identity-based harm, never inferred from wording. Branches:
   - **Witnessed (ally)**: full tool set; external options may address the situation and actors (intervention, repair, amplification).
   - **Received (target)**: no default option directs the player's labor at the harmer (no educate-the-harmer, no repair-toward-harmer); externals default to support people and boundaries; T04 restricted to agency-restoring turnarounds; direct confrontation available only behind an explicit choice, which re-runs the safety fork. (S16.)
   - **Own conduct**: the S3 repair path — acknowledgment without self-flagellation, delivered then released.
7. **Numbness fork** — §3.1; mandatory before Neutrality can carry a Peace target.
8. **Hot-action override** — "Has the charge dropped below a 4, or do you need to act while it's hot?" Asked; hot boundary moves are legitimate, chosen not defaulted.
9. **Capture-only option** — "Work this now, or just get it down?" Journaling-only is a complete session.
10. **Resonance check** `[D4]` — §1.3 step 2b; one redraw, banked card.

Everything else the composer computes and displays *with its reasoning inspectable*, every computed field player-editable.

---

## 9. Residual Risks (post-v3)

The v2 hostile review's structural findings are resolved per the gap analysis; these risks remain true and must be held open-eyed:

1. **Delta gaming.** Intensity is self-reported. Display deltas, never score them; reward logging streaks, never magnitudes (§1.5).
2. **Sadness is still the weakest column.** Structural until G3 closes. The UI should name it ("grief tools are our thinnest — here's the best we have") rather than fake fit.
3. **Anger over-neutralization.** Politeness-normed allyship culture will route Anger → Peace to stay likable. The standing guard question in S2 ships with every Anger→Peace retarget.
4. **Vocabulary debt.** Charge, channel, vector, thread, shape, spirit, stance, part, BAR… No term ships without a glossary entry and one-tap deep link; the §0 collisions get resolved first.
5. **The shape classifier is a soft spot by design** (G8). Computed-and-confirmed is the mitigation, not a solution; watch the edit rate on the confirm chip as the health metric.
6. **Terseness is a clinical boundary, not a style choice.** Over-explained scaffolding activates cognition and defeats the tools (felt-sense praxis). The §5.1 rendering is near the ceiling; resist copy growth.
7. **Sixteen fixtures are necessary, not sufficient.** They pin the mechanics; they cannot pin tone. Playtest transcripts, not fixtures, will reveal whether rendered cards read as practice or poetry.

---

## 10. Implementation Targets (v3)

Per the spec-kit discipline (`.agents/skills/spec-kit-translator/SKILL.md`), each target gets a `.specify/specs/<name>/` kit (spec/plan/tasks) before implementation; targets 2–4 are user-facing and therefore require Verification Quests. API-first: the signatures below are the contracts.

1. **Unified tool registry.** `src/lib/emotional-alchemy/registry.ts` implementing the taxonomy's `EmotionalAlchemyTool` type, seeded T01–T11, reconciling `CANONICAL_TECHNIQUES` and `emotional-first-aid.ts` per the taxonomy mapping table (G4). Adds the v3 fields the composer needs: `hardGuards`, `shapeBonusKeys`, `showUpTemplates {internal, external}`, `operationalChecks`.
2. **`EmotionalVector` + Diagnostic flow.** The §1.2 type plus the full v3 instrument: picker with flat fork and can't-tell, intensity, time, temporal, fuel, visible-editable defaults, layer check, crisis affordance, thread picker, resonance check. `runDiagnostic(): Promise<DiagnosticResult>` — pure UI + one server action; raw text never leaves the client (§1.6).
3. **The composer.** `recommendPractice(card, vector, ctx): Recommendation` — pure, deterministic, implementing §4.1 verbatim, rendering §5 cards from registry protocols + stance question + spirit step + Show Up templates. **Test suite = the sixteen fixtures**, each an input/expected-output pair; guards are individually unit-tested (a T09-at-Anger-8 request must fail loudly). AI tailoring is a separate, optional layer.
4. **321 end-to-end + Show Up artifact.** Wire T01 through the composer into `/shadow/321`; emit typed outputs to existing sinks (`createQuestFrom321Metadata` precedent). `ShowUpArtifact {kind: internal|external, recipient?, date?, doneCheck}` as a first-class type distinct from reflection artifacts, enforcing §1.7; the thread ratchet becomes implementable.
5. **Session log.** `{vector_before, tool, rolePath, output_artifact_id, vector_after, timebox_kept, escalated, exited_gracefully, thread_id}` — structured fields only per §1.6, opt-in raw text. Feeds the 321 doctrine's "session depth signal," the thread demotion rule, and the G9 weight tuning. Deltas displayed, never rewarded.

---

*Everything in this atlas that contradicts play-tested reality loses to reality. Update the weights from session logs, not from taste.*
