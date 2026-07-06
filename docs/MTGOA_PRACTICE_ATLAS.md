# Mastering the Game of Allyship — Practice Atlas

**Status**: Design doctrine (v2). Bridges the book, the Allyship Deck, Emotional Alchemy, and bars-engine.
**Canonical tool layer**: [`docs/EMOTIONAL_ALCHEMY_TOOL_TAXONOMY.md`](EMOTIONAL_ALCHEMY_TOOL_TAXONOMY.md) — full protocols, ratings, and completion criteria for the ten tools live there. The Atlas composes them into play; where the two disagree, the taxonomy wins.
**Grounding**: `src/lib/allyship-deck/move-library.ts` (120-card grammar, channels, satisfaction states), `src/lib/technique-library/canonical.ts` (Tier-1 alchemy techniques), `specs/doctrine/emotional-alchemy-321.md` (321 invariant, tension vector), `docs/FELT_SENSE_321_PRAXIS.md` (felt-sense praxis, non-clinical boundary), `src/lib/emotional-first-aid.ts` (EFA tools), `.specify/specs/allyship-deck-literacy/spec.md` (legibility rules).
**Rule for this document**: every practice names a timebox and a recordable output. Anything labeled *(inference)* is a design proposal, not established canon. No book citations are invented; where the codebase attributes a tool to the book, the citation is to the code file, not to a page.

---

## 0. Terminology Bridge

The Atlas uses the play-facing vocabulary. The codebase uses an overlapping but not identical vocabulary. This table is the contract between them.

| Atlas term | Meaning | Codebase term | Where |
|---|---|---|---|
| **Move** | The emotional transformation needed (e.g., Anger at 8 → Triumph) | The channel transformation; `CapabilityDef` dissatisfied → satisfaction | `move-library.ts` `CAPABILITIES` |
| **Move role** | How the tool serves the move: **metabolize** (digest the charge), **translate** (route it to another channel), **transcend** (lift it to its channel's satisfaction state) *(role definitions are inference; the ratings are canonical in the taxonomy)* | Taxonomy Compact Matrix 2 | `EMOTIONAL_ALCHEMY_TOOL_TAXONOMY.md` |
| **Submove** | One WAVE phase: Wake Up, Open Up, Clean Up, Grow Up, Show Up | `BasicMove` | `move-library.ts` `MOVES` |
| **Tool** | A named, timeboxed protocol that performs a submove (T01–T10) | `Technique` / EFA tool / taxonomy tool | taxonomy; `technique-library/`; `emotional-first-aid.ts` |
| **Card** | Submove × Operation × Domain (120 total) | `MoveCard` | `assemble.ts` |
| **Emotional vector** | `{channel, intensity, altitude, target}` — see §1.2 | *(not yet a type — implementation target #2)* | — |
| **Satisfaction spirit** | The target state: Peace, Triumph, Poignance, Bliss, Wonder — it inflects how a tool is run (each taxonomy tool has per-spirit variations, item 18) | `CapabilityDef.satisfaction` | `move-library.ts` |
| **Playable recommendation** | emotional vector + move role + submove + tool + satisfaction spirit + blocker/story/domain context | *(implementation target #3)* | — |

⚠ **Naming collisions to resolve before shipping UI copy:**

1. The codebase calls Submove × Operation a "submove" (30 of them, in `SUBMOVES`). The Atlas calls the WAVE phase a submove. Pick one; recommendation: WAVE phase = **submove**, submove × operation = **stance** *(inference)*.
2. `tech-wave` in `canonical.ts` is a one-breath tool (**W**elcome, **A**cknowledge, **V**alidate, **E**xhale), and `emotional-first-aid.ts` has a WAVE placeholder. The Atlas uses WAVE for the five-phase arc. Same name, different things; onboarding will suffer. Recommendation: keep WAVE for the arc, fold the breath tool into T07 Return to the Body as one of its reset modes *(inference)*.
3. The deck's Clean Up × Architect stance asks "Transcend, Translate, or **Neutralize**?" while the taxonomy's move roles are metabolize / translate / **transcend**. These two triads overlap but are not identical. Proposed mapping *(inference, needs a canon decision)*: deck "Neutralize" ≈ role "metabolize" (digest in place); "Translate" = "translate"; "Transcend" = "transcend". One triad should win in UI copy.

**Channel constants** (already canonical in `move-library.ts` — the Atlas does not modify these):

| Channel | Element | Dissatisfied emotion | Capability | Satisfaction |
|---|---|---|---|---|
| Anger | Fire | Anger | Agency — "I can act." | **Triumph** |
| Sadness | Water | Sadness | Connection — "I can connect." | **Poignance** |
| Fear | Metal | Fear | Exploration — "I can explore." | **Wonder** |
| Joy | Wood | Joy (stuck) | Participation — "I can participate." | **Bliss** |
| Neutrality | Earth | Neutrality | Rest — "I can rest." | **Peace** |

The channel gives the **default** satisfaction target. A player may aim a charge at a different destination — that is the translate move role, and it is exactly the Clean Up × Diplomat stance ("Choose destination: which channel would better serve this situation?"). Cross-channel routing is a feature, not an error, but it must be a **player choice**, never an app inference (§8).

---

## 1. From Card to Recommendation

### 1.1 The core law

> A tool without a move is inert. A move without a tool is too abstract.
> A recommendation is **playable** only when it binds:
> **emotional vector + move role + WAVE submove + tool + satisfaction spirit + blocker/story/domain context**
> …and names one inspectable output.

### 1.2 The emotional vector, operationally

"Emotional vector" is not a mood. It is four fields:

```
EmotionalVector {
  channel:    anger | sadness | fear | joy | neutrality
  intensity:  0–10           // player-rated, asked not inferred
  altitude:   dissatisfied | neutral | satisfied
  target:     peace | triumph | poignance | bliss | wonder   // defaults from channel, player may override
}
```

The vector plus target implies the **move role**: same channel at higher altitude → transcend; different channel → translate; charge digested where it stands → metabolize *(inference, see §0 collision 3)*. The 321 doctrine already produces the vector's qualitative twin — the tension vector (`maskName`, `desire`, `fear`, …) — so the two compose: the emotional vector routes the session; the tension vector is what a deep session emits.

### 1.3 The pipeline (player-facing, ≤3 questions before a recommendation)

1. **Draw** — the player draws an Allyship Deck card (or is dealt one by a spread/path). The card fixes the **WAVE submove**, the **stance question** (e.g., Clean Up × Challenger: "What story am I believing?"), and the **domain** context.
2. **Name the blocker** — one sentence of situation. Free text. Stored verbatim. Per the felt-sense praxis, the capture prompt invites a pause first ("Notice where in your body the charge lives") — location optional, never required.
3. **Diagnose the vector** — three taps, never inferred: channel ("mad / sad / scared / flat / bright-but-stuck / **I can't tell**"), intensity (0–10), time available (2 / 10 / 30 min). "I can't tell" is a first-class answer that routes to T02 Find the Felt Thread before anything else. Altitude defaults to *dissatisfied* when intensity ≥ 4.
4. **Capture the story** — "What are you telling yourself about the blocker?" One sentence. The story is raw material for Clean Up tools and is stored separately from the blocker (situation ≠ interpretation — the whole engine turns on that distinction).
5. **Resolve** — a deterministic composer picks the tool and assembles the protocol:
   `recommendPractice(card, vector, fuel, time) → { tool, moveRole, timebox, protocol, internalShowUp, externalShowUp, output }`
   Selection logic: the card's submove filters tools by the taxonomy's Tool × WAVE ratings (§2); the vector's channel filters by Tool × Channel fit (§4); the target's move role filters by Tool × Move Role; intensity and time gate what's safe and possible (intensity ≥ 7 → T07 Return to the Body first; 2 minutes → capture/reset tools only). The satisfaction spirit inflects the protocol text (each taxonomy tool declares per-spirit variations).
6. **Play** — the player runs the tool inside its timebox and records the named output (Taxonomy Compact Matrix 4 declares each tool's BAR-loggable output).
7. **Show Up check** — the app offers one internal and one external Show Up option (§1.4). The player picks, schedules, or declines — declining is logged, not shamed.
8. **Close the loop** — re-rate intensity 0–10. The delta is the session's honest score. Output artifacts route to existing sinks: BAR, quest seed, daemon, board item, commitment.
9. **Graceful exit, always available** — per the felt-sense praxis: "this feels too big for a quest right now — that's useful signal too." Exiting mid-protocol is a logged, honorable outcome, not an abandonment.

AI is additive at steps 5–7 (tailoring language to the situation); the deterministic path is first-class per the deck-literacy dual-track rule.

### 1.4 The Show Up distinction (load-bearing)

- **Show Up ≠ external.** Show Up means *the charge becomes embodied*: a commitment, artifact, communication, ritual, boundary, ask, quest seed, or action.
- **Internal Show Up** is still a move: a rehearsed line spoken aloud, a signed self-contract with a date, a 24-hour vow, a ritual performed (T10). It is not another journal entry. Every taxonomy tool declares both an internal and an external Show Up example (item 17) — the output schema must support internal commitment artifacts as first-class (taxonomy gap 5).
- **External ≠ Show Up.** Venting at someone is external and is not Show Up; it's a leak.
- **Reflection artifacts (journal text, insight notes) are Clean Up outputs.** They only become Show Up when bound to a recipient, a date, or a public artifact.
- **Gate**: external Show Up options are offered only when intensity has dropped below ~4 or the player explicitly overrides ("I need to act while it's hot" is legitimate for boundary moves — but it's a choice, asked, not defaulted).

---

## 2. The Tool Roster and Matrix A: WAVE Submove × Tool

### 2.0 Tool roster (digest — protocols live in the taxonomy)

| ID | Tool (BARS name) | Generic name | Native submoves (strong) | Timebox | Output | Signature misuse |
|---|---|---|---|---|---|---|
| T01 | **321 Charge Dialogue** | Structured Part Dialogue | Wake Up, Clean Up, Grow Up | 7–15 min (mini: 3) | Part name + part quote + owned-energy sentence + optional quest seed | Over-identifying with a part; making external claims from internal dialogue |
| T02 | **Find the Felt Thread** | Felt-Sense Tracking | Wake Up, Open Up, Clean Up | 3–8 min | Body location + felt handle + fit signal + one sentence | Forcing an answer too quickly (the felt sense needs its 20–30 s) |
| T03 | **BAR Capture** | Reflective Capture | Wake Up, Grow Up | 5–10 min (quick: 90 s) | BAR seed + named blocker + next artifact | Writing around the move instead of producing an output |
| T04 | **Story Turnaround** | Belief Inquiry | Clean Up, Grow Up | 8–15 min | Belief + cost + turnarounds + replacement + experiment | Arguing the player out of legitimate desire, threat, or grief |
| T05 | **Put It On The Board** | Field Mapping | Wake Up, Grow Up | 10–20 min (fast: 5) | Field map + classified blocker + next-move location | Mapping as avoidance |
| T06 | **Clean Line** | Clean Ask / Boundary Script | Grow Up, Show Up | 5–12 min | Ask/no/offer/limit/repair script + outcome | Premature confrontation before the signal is clean |
| T07 | **Return to the Body** | Regulation Reset | Open Up | 1–5 min | Before/after activation rating + reset mode + next signal | Calming down to avoid truth |
| T08 | **One True Next Move** | Command Bridge | Show Up | 3 min to choose + ≤10 to execute | Mission sentence + chosen action + completion note | Forcing action before metabolization |
| T09 | **Happy Apples** | Appreciation / Resource Scan | Open Up | 2–5 min | Three apples + one received + share/log choice | Premature positivity |
| T10 | **Make It Real** | Ritual Container | Open Up, Show Up | 5–15 min | Ritual sentence + symbolic action + integration note | Performance without contact |

Notes against the original eleven-tool list:

- **IFS Parts Dialogue** is folded into T01 (Structured Part Dialogue covers parts work and 3-2-1 in one protocol; `3-2-1 Mini` is its short form).
- **Focusing / Felt Thread** → T02 **Find the Felt Thread**; **Journaling / BAR Capture** → T03 **BAR Capture** (canonical names).
- **Return to the Body (T07)** is new to the roster and closes what v1 of this atlas flagged as its worst gap (no somatic option for hot charge). It wraps the existing Grounding Sequence, Grounding Cord, Breath Reset, and Basic Qi Gong Reset.
- **Make It A Game** is **not in the taxonomy**. Two scenarios below (S6, S10) depend on it. Proposal *(inference)*: add it as **T11 Game Reframe** (general lineage: gamification/deliberate-practice design; core mechanic: recast a blocker or practice edge as win condition + reps + score; native submove Grow Up; misuse: gamifying grief or real physical risk). Until canonized, treat it as an Atlas extension.

### Matrix A — Tool × WAVE submove (canonical ratings; source: taxonomy Compact Matrix 1)

| Tool | Wake Up | Open Up | Clean Up | Grow Up | Show Up |
|---|---|---|---|---|---|
| T01 321 Charge Dialogue | strong | medium | strong | strong | medium |
| T02 Find the Felt Thread | strong | strong | strong | medium | weak |
| T03 BAR Capture | strong | medium | medium | strong | medium |
| T04 Story Turnaround | medium | weak | strong | strong | medium |
| T05 Put It On The Board | strong | medium | medium | strong | medium |
| T06 Clean Line | medium | weak | medium | strong | strong |
| T07 Return to the Body | medium | strong | medium | medium | weak |
| T08 One True Next Move | medium | weak | weak | medium | strong |
| T09 Happy Apples | medium | strong | weak | medium | medium |
| T10 Make It Real | weak | strong | medium | medium | strong |

Read the columns honestly: **Show Up has exactly three strong tools** (Clean Line, One True Next Move, Make It Real) — the whole embodiment end of the engine rests on them. And Grow Up's five "strong" ratings all produce *reflection or single acts*; nothing yet produces a **rep structure** (§7 G1, §9.1).

---

## 3. Matrix B — Emotional Channel × Basic Transformation Need

| Channel | What the charge is reporting | The question it asks | Basic transformation need | Satisfaction | Signature bypass (what fake-processing looks like) |
|---|---|---|---|---|---|
| **Anger** (Fire) | A boundary is crossed or a desire is blocked | "What do I want, and what's in the way?" | Clean force: a boundary held, a decisive act, an intervention made without collateral damage | **Triumph** | Suppressing into politeness (leaks as resentment/sarcasm) — or venting (discharge without a move) |
| **Sadness** (Water) | Something cared-for is lost or distant | "What did I love, and where did it go?" | Grieve fully; honor what mattered; restore flow to the care that has nowhere to go | **Poignance** | Cheer-up, busyness, premature meaning-making ("everything happens for a reason") |
| **Fear** (Metal) | An unassessed threat or risk | "What exactly is the danger, and what protects me?" | Orient: separate real risk from imagined; build protection; then explore the edge | **Wonder** | Reassurance-seeking, avoidance — or bravado that skips the risk assessment |
| **Joy** (Wood) | Aliveness wants participation and isn't getting it (stuck joy) | "What wants to be played, shared, celebrated?" | Express, share, participate; let the win land; convert aliveness into engagement | **Bliss** | Deferral ("celebrate after the next milestone"), guilt about feeling good while others suffer |
| **Neutrality** (Earth) | The system wants order, clarity, rest — **or** it is numb and mislabeled | "What needs sorting, and is this actually peace?" | Structure and balance if genuine; if flat/numb, *diagnose what froze* before treating it as Earth | **Peace** | The biggest one in the system: calling numbness "peace." Flat affect is often frozen Fear or Sadness (§8, §9.2) |

---

## 4. Matrix C — Tool × Emotional Channel Fit

Canonical ratings from taxonomy Compact Matrix 3, plus the Atlas's enforcement guards (the guards are resolver rules, not footnotes — §9.2).

| Tool | Anger | Sadness | Fear | Joy | Neutrality | Guard (resolver-enforced) |
|---|---|---|---|---|---|---|
| T01 321 Charge Dialogue | strong | strong | strong | medium | medium | Intensity ≥ 7 → run T07 first ("too activated to keep perspective") |
| T02 Find the Felt Thread | medium | strong | strong | medium | strong | Never when immediate safety/logistics are needed; the numbness disambiguator (§8.4) |
| T03 BAR Capture | medium | strong | medium | medium | strong | Same sentence 3× = rumination; stop and switch tools |
| T04 Story Turnaround | strong | medium | strong | weak | medium | **Blocked on fresh grief** — inquiry that argues a player out of loss is self-gaslighting |
| T05 Put It On The Board | strong | weak | strong | weak | strong | Every board item needs a dated next move or the map is avoidance |
| T06 Clean Line | strong | weak | strong | weak | strong | Blocked while the player is punishing, recruiting guilt, or controlling an outcome |
| T07 Return to the Body | strong | weak | strong | weak | strong | Not a complete sadness move; not a substitute for needed anger or action |
| T08 One True Next Move | strong | weak | medium | medium | strong | Blocked on early sadness — grief doesn't need a next action, it needs room |
| T09 Happy Apples | weak | weak | medium | strong | strong | **Blocked at Anger/Sadness intensity ≥ 5** (toxic-positivity paint) |
| T10 Make It Real | medium | strong | weak | strong | medium | Not for urgent fear/anger logistics; requires a metabolized charge as input |
| (T11 Game Reframe, proposed) | weak | ⚠ | medium | strong | medium | **Never gamify grief; never gamify real physical risk** (protest safety is a risk inventory, not a game) |

**Selection heuristic** *(inference, encodes the matrices for the composer)*:
`intensity ≥ 7` → T07 before any Transform tool. `time = 2 min` → T03 quick capture or T07 only. `channel = "I can't tell"` → T02 before routing. `submove = show_up ∧ intensity ≥ 4` → internal option first. Move role narrows further: metabolize → T01/T02/T04; translate → T01/T05; transcend → T02/T09/T10 (per taxonomy Matrix 2).

---

## 5–6. Twelve Golden Scenarios

Format per scenario: want → blocker → story → feeling → vector (with move role) → deck practice (real card grammar: Submove × Operation × Domain) → tool → internal Show Up → external Show Up → inspectable output. These twelve are also the acceptance fixtures for the recommendation composer (§10, target 3).

---

### S1 · The Interrupted Colleague — Anger → Triumph

- **I want** to intervene when Maya gets talked over in meetings **so I can feel Triumph** — clean action taken where it counts.
- **I am blocked by** my freeze response in rooms with senior people.
- **The story I'm telling** is "It's not my place — I'd just make it about me."
- **I feel** angry (at the room, and at myself for staying quiet). Intensity 6, dissatisfied.
- **Vector**: Anger 6 → Triumph · role: **transcend**.
- **Deck practice**: Show Up × Challenger × Direct Action — "Create intervention: what must change?"
- **Tool**: **T06 Clean Line** (script type: ask; 5–12 min, read aloud once, then 3 rehearsals).
- **Internal Show Up**: the line — "I want to hear Maya finish her point." — spoken aloud three times; a 24-hour rule signed: *at the next interruption, I say it*; the meeting calendared.
- **External Show Up**: say the line in the meeting, then log what happened within 24h.
- **Inspectable output**: the written line + the post-meeting log (sent/held/practiced + outcome). Re-rate intensity.

### S2 · The Invisible Labor Ledger — Anger → Peace (cross-channel, player-chosen)

- **I want** the mutual-aid group's work distributed **so I can feel Peace** — I choose Peace over Triumph because I want structure, not victory.
- **I am blocked by** being the only one who does logistics, again.
- **The story I'm telling** is "If I don't do it, nobody will, and everyone's fine with that."
- **I feel** resentful (anger, slow-burn). Intensity 5, dissatisfied.
- **Vector**: Anger 5 → Peace · role: **translate**.
- **Deck practice**: Clean Up × Challenger × Skillful Organizing — "Challenge interpretation: what story am I believing?"
- **Tool**: **T04 Story Turnaround** (8–15 min) — "I cannot stop doing everything because nobody will step up": is that completely true? Who was never actually asked? Follow-on: **T08 One True Next Move**.
- **Internal Show Up**: turnaround sheet done; the testable replacement ("people do what's structured, not what's implied") adopted for 24 hours.
- **External Show Up**: bring the rotation proposal to Thursday's meeting as an agenda item, not a complaint.
- **Inspectable output**: belief + cost + turnarounds + replacement + the experiment (the submitted agenda item).

### S3 · Called In — Anger (masking) → Peace

- **I want** to repair after being called in for a microaggression **so I can feel Peace** — the charge resolved without self-flagellation or defensiveness.
- **I am blocked by** the hot defensive flare every time I replay the moment.
- **The story I'm telling** is "They think I'm one of the bad ones now."
- **I feel** angry-defensive. Intensity 7, dissatisfied. *(Diagnostic note: layered charge — fear of exile likely underneath; the app asks one layer-check question, no more: §8.)*
- **Vector**: Anger 7 → Peace · role: **metabolize, then translate**.
- **Deck practice**: Open Up × Challenger — "Allow discomfort: what am I avoiding feeling?"
- **Tool**: **T07 Return to the Body** first (intensity 7; 2 min, longer-exhale rounds, re-rate), then **T01 321 Charge Dialogue** on the part called "The Judge" (7–15 min): what is it protecting? Speak as it; write the owned-energy sentence.
- **Internal Show Up**: owned-energy sentence captured; draft a one-sentence acknowledgment with zero self-flagellation and zero defense ("You were right about the impact; thank you for telling me directly.").
- **External Show Up**: deliver the sentence to the person within 48h, then stop talking (no reassurance-fishing).
- **Inspectable output**: before/after activation + part name + part quote + owned-energy sentence + the sent acknowledgment with 48h check-off.

### S4 · After the Ballot Measure Failed — Sadness → Poignance

- **I want** to honor eighteen months of volunteer work that lost **so I can feel Poignance** — the grief carrying the love, not replacing it.
- **I am blocked by** a flat heaviness that makes even opening the campaign Slack feel impossible.
- **The story I'm telling** is "It was all wasted."
- **I feel** sad. Intensity 6, dissatisfied.
- **Vector**: Sadness 6 → Poignance · role: **transcend**.
- **Deck practice**: Open Up × Sage × Direct Action — "Witness experience: what happens when I stop fighting it?"
- **Tool**: **T02 Find the Felt Thread** (3–8 min): 20–30 s pause first; locate the heaviness; test three handles against the body; keep the one that fits; write "What this whole thing feels like is ___." *(T04 Story Turnaround is guard-blocked here — §4.)*
- **Internal Show Up**: the handle sentence becomes a BAR; a small **T10 Make It Real** ritual — light a candle, read the volunteer roster aloud once (3 min), log what changed.
- **External Show Up**: post a public thank-you naming what the campaign built that survives the loss — relationships, lists, skills — by Sunday.
- **Inspectable output**: body location + felt handle + shift sentence + ritual note + the posted thank-you link. Re-rate.

### S5 · The Ruptured Friendship — Sadness → Poignance

- **I want** to decide what this friendship is now, after he defended the thing I stood against **so I can feel Poignance** — clear about what was real even if it changes.
- **I am blocked by** two parts at war: one wants to cut him off, one misses him.
- **The story I'm telling** is "If I still love him, I'm betraying my values."
- **I feel** sad (with anger's edges). Intensity 5, dissatisfied.
- **Vector**: Sadness 5 → Poignance · role: **metabolize**.
- **Deck practice**: Grow Up × Diplomat — "Relate growth: how does this affect others?"
- **Tool**: **T01 321 Charge Dialogue**, run twice (7–15 min each, or minis): once with The Gatekeeper (protects values), once with The One Who Misses Him (protects love). Each part gets named, quoted, and asked what it protects; each yields an owned-energy sentence.
- **Internal Show Up**: both owned-energy sentences on paper; write the decision both parts can live with (boundary + door: "I won't discuss X with you, and I'm not leaving").
- **External Show Up**: send the two-truth message — the boundary and the care, both stated plainly (a **T06 Clean Line** repair-type script).
- **Inspectable output**: two part names + quotes + owned-energy sentences + the decision line + sent/not-sent status with a date.

### S6 · First Workshop Terror — Fear → Wonder

- **I want** to facilitate my first allyship workshop **so I can feel Wonder** — at the edge of my capability instead of behind it.
- **I am blocked by** fear of saying something harmful in front of the people I want to serve.
- **The story I'm telling** is "One wrong sentence and I'm disqualified forever."
- **I feel** afraid. Intensity 6, dissatisfied.
- **Vector**: Fear 6 → Wonder · role: **transcend**.
- **Deck practice**: Grow Up × Architect × Raise Awareness — "Amplify capacity: what capability wants strengthening?"
- **Tool**: **T11 Game Reframe** *(Atlas extension — §2.0)*: design "Recovery Reps" (15 min) — the win condition is not a flawless workshop, it's *one clean recovery from a mistake*. Rep 1: a practice segment with two friends instructed to throw one curveball each.
- **Internal Show Up**: game card written (rule, win condition, rep dates); rep 1 on the calendar.
- **External Show Up**: run rep 1 this week; log the curveball and the recovery.
- **Inspectable output**: game card + rep 1 log (curveball, recovery, what it taught).

### S7 · The Ask I Keep Not Making — Fear → Wonder

- **I want** to ask three lapsed donors to fund the winter drive **so I can feel Wonder** — discovering what's actually on the other side of asking.
- **I am blocked by** the imagined "no" and what I've decided it would mean.
- **The story I'm telling** is "Asking again makes us look desperate and burns the relationship."
- **I feel** afraid. Intensity 5, dissatisfied.
- **Vector**: Fear 5 → Wonder · role: **metabolize → transcend**.
- **Deck practice**: Open Up × Challenger × Gather Resources — the authored card **"The Ask You're Avoiding"**: "What resource am I afraid to ask for — and what am I avoiding feeling about needing it?"
- **Tool**: **T01 321 Charge Dialogue** on the part called "The Donor Who Says No" (7–15 min): what is it protecting, wanting, refusing? Speak as it; own the clean energy (usually: care about the relationship).
- **Internal Show Up**: owned-energy sentence + draft the real ask (the thing actually needed, not the safe smaller thing) as a **T06 Clean Line** ask-type script.
- **External Show Up**: send one ask by Friday. One, not three — T08 sizing.
- **Inspectable output**: part name + quote + owned-energy sentence + the sent ask + the actual answer logged next to the imagined one.

### S8 · Before the March — Fear → Peace (cross-channel, player-chosen)

- **I want** to attend Saturday's march with my eyes open **so I can feel Peace** — fear converted into protection and a clear role, not suppressed.
- **I am blocked by** a swirl of undifferentiated danger: arrests, doxxing, crowd crush, all at once.
- **The story I'm telling** is "If I'm scared, I shouldn't go; if I go, I shouldn't be scared."
- **I feel** afraid. Intensity 7, dissatisfied.
- **Vector**: Fear 7 → Peace · role: **translate**.
- **Deck practice**: Clean Up × Shaman × Direct Action — "Identify channel: which channel is active?" then the risk sort.
- **Tool**: **T05 Put It On The Board** (10 min, fast version): facts in the field box, interpretations in the blocker box; mark each item fact / story / threat / resource; every *real* threat gets a mitigation with an owner; circle where the move is possible now. *(T11 is guard-blocked — physical risk is never gamified: §4.)*
- **Internal Show Up**: board complete; choose a role sized to the assessed risk (buddy pair, support car, remote comms are all legitimate).
- **External Show Up**: confirm the buddy pair and share the safety plan with them by Thursday.
- **Inspectable output**: the map (facts vs stories, threats + mitigations) + the chosen role + the buddy message.

### S9 · The Win Nobody Toasted — Joy (stuck) → Bliss

- **I want** to actually celebrate that the Ramirez family got housed **so I can feel Bliss** — letting the win land instead of sliding to the next crisis.
- **I am blocked by** the reflex that celebration is self-indulgent while the waitlist is still 200 deep.
- **The story I'm telling** is "Feeling good now means I've stopped caring."
- **I feel** joy that can't land (stuck joy). Intensity 5 (as agitation), dissatisfied.
- **Vector**: Joy 5 → Bliss · role: **transcend**.
- **Deck practice**: Show Up × Sage × Gather Resources — "Create legacy: what artifact remains?"
- **Tool**: **T09 Happy Apples** (2–5 min): name the current charge honestly first; three real goods ("keys in Rosa's hand, her kid picked his room…"); receive one for a full 30 seconds; choose share/use/log.
- **Internal Show Up**: three apples logged; a permission slip written ("celebration is fuel, not defection").
- **External Show Up**: post the win in the org channel with the volunteers named; call a 20-minute celebration at the next meeting — timeboxed so the grind-guardians can tolerate it.
- **Inspectable output**: three apples + the received apple + the posted celebration.

### S10 · The Grim Duty Problem — Joy (starved) → Bliss

- **I want** my organizing life to have play in it again **so I can feel Bliss** — participation that feeds me instead of only costing me.
- **I am blocked by** a calendar where every commitment is heavy and none are alive.
- **The story I'm telling** is "Serious problems require a serious person; play is for after the revolution."
- **I feel** stuck joy presenting as dull dread. Intensity 4, dissatisfied.
- **Vector**: Joy 4 → Bliss · role: **transcend**.
- **Deck practice**: Grow Up × Shaman — "Identify emerging capacity: what wants to grow?"
- **Tool**: **T11 Game Reframe** *(Atlas extension)*: take the dreariest recurring task (data entry after canvassing) and redesign it — pairs, timer, absurd team names, score kept in Happy Apples. 15 min design.
- **Internal Show Up**: game card written; one solo round played tonight.
- **External Show Up**: recruit one playtest partner for the next canvass debrief (a **T08 One True Next Move**-sized invite).
- **Inspectable output**: game card + round-one score + partner's name and date.

### S11 · Three Orgs, Zero Sleep — Neutrality → Peace

- **I want** a commitment load I can actually carry **so I can feel Peace** — order restored, rest legitimate.
- **I am blocked by** seventeen standing commitments across three organizations and no criteria for choosing.
- **The story I'm telling** is "Stepping back from any of it means abandoning people."
- **I feel** flat, foggy, overloaded — genuine Earth overload (verified by the §8 numbness fork: it's clutter, not frozen grief).
- **Vector**: Neutrality 6 → Peace · role: **transcend**.
- **Deck practice**: Wake Up × Regent × Skillful Organizing — "Notice stewardship: what deserves attention?"
- **Tool**: **T05 Put It On The Board** (10–20 min): every commitment as one item, classified; mark **keep** (max 5), **hand off**, **end**; circle where the first move is possible. Follow-on: **T08 One True Next Move** for the first hand-off.
- **Internal Show Up**: the board done; a rest block placed on the calendar with the same standing as any meeting.
- **External Show Up**: send the two step-back messages — with a named successor or a clean end date, not a fade-out.
- **Inspectable output**: the board (17 items, each marked) + 2 sent messages + the calendar rest block.

### S12 · The Nothing — Neutrality (suspected frozen charge) → true reading first

- **I want** to know whether my flatness about the news is peace or a freeze **so I can feel** whatever is actually true — Peace if it's genuine rest, or the first thaw toward Poignance/Wonder if something froze.
- **I am blocked by** feeling nothing where I used to feel everything.
- **The story I'm telling** is "I've finally developed healthy detachment." *(Maybe. That's the question.)*
- **I feel** neutral — unverified. Intensity: unratable, which is itself the signal (the "I can't tell" branch of §1.3 step 3).
- **Vector**: Neutrality ? → *diagnose before targeting* · role: undetermined until the channel is verified. The app must not accept "Peace" as the target until then (§8, §9.2).
- **Deck practice**: Wake Up × Shaman — "Notice the signal: what is here?"
- **Tool**: **T02 Find the Felt Thread** (3–8 min): 20–30 s pause; find where "the nothing" sits; test handles — including "rest" and "wall" — against the body; keep what fits. Then **T03 BAR Capture** (90-second quick capture) for whatever thawed. "No handle has formed yet" is a valid completion per the taxonomy.
- **Internal Show Up**: a BAR naming the verdict ("the nothing is a wall in my chest; behind it, grief about the deportations") — or an honest verdict of genuine rest, which is a legitimate, celebrated result.
- **External Show Up**: if a frozen channel surfaced: one re-engagement act sized to actual fuel (read one article and tell one person one feeling about it). If genuine rest: tell an accountability partner "I'm resting on purpose until [date]" — rest made legible is Show Up.
- **Inspectable output**: body location + handle + the verdict BAR (frozen-X vs genuine rest) + the sized act or the declared rest window.

---

**Coverage check**: channels 3 Anger / 2 Sadness / 3 Fear / 2 Joy / 2 Neutrality; all five WAVE submoves as the drawn card; all four domains; all five satisfaction spirits including two player-chosen cross-channel destinations (S2, S8); all three move roles; all ten taxonomy tools appear as primary or follow-on, plus proposed T11 twice (S6, S10).

---

## 7. Gaps in the Current Tool System

- **G1 — Grow Up has ratings but no rep structure.** Five tools rate "strong" for Grow Up, yet each produces reflection or a single act. "Who must I become?" without reps, rungs, and evidence is Clean Up wearing Grow Up's badge. Missing: a **Rep Ladder** mechanic (capability, current rung, next rung, rep schedule, evidence log) — proposed T11 Game Reframe covers part of this; the ladder itself is still uninvented *(inference)*.
- **G2 — No dyadic/relational tool.** Every protocol is solo, but allyship is relational. Clean Line is one-way transmission; T01 is internal dialogue (its own misuse note warns against making external claims from it). Missing: a **repair-conversation rehearsal** tool (script both sides, practice *receiving* the hard response) and a feedback-receiving protocol. S3 and S5 currently exit the tool system exactly where the hardest move begins.
- **G3 — Sadness-native flow tool** (taxonomy gap 4). T10 Make It Real is the closest, and T04 is guard-blocked on grief. Sadness needs a dedicated restoring-flow protocol for care-at-a-distance that isn't cognitive, action-oriented, or regulation-oriented — S4's candle-and-roster ritual, standardized *(inference)*. This is also taxonomy research question 5.
- **G4 — Three tool registries.** The taxonomy (T01–T10), `CANONICAL_TECHNIQUES` in `technique-library/canonical.ts` (W.A.V.E., Rose Tool, Contract Burning, Conscious Complaining, Fuel Check, Ember Breath, Charge Diagnostic…), and `emotional-first-aid.ts` (Grounding Sequence, Boundary Shield, Command Bridge…) overlap heavily under different names. The taxonomy's mapping table is the reconciliation plan; it must land in code as **one registry** (§10 target 1) or the UI ships three vocabularies.
- **G5 — No completion check wired in.** T07 is the only tool whose protocol includes before/after rating. The taxonomy declares completion criteria per tool; nothing yet *records* them. Before/after intensity re-rating should be a required field of every session (§1.3 step 8, §10 target 5).
- **G6 — Make It A Game is orphaned.** In the original tool list and two golden scenarios, absent from the taxonomy. Decide: canonize as T11 Game Reframe or cut and re-route S6/S10 (both could limp along on T08, losing the rep structure).
- **G7 — No fuel/time gating in tool selection.** Fuel Check exists in `canonical.ts`; timeboxes exist per tool; nothing consults them at recommendation time. A 20-minute tool recommended to a depleted player at 11pm is a failure the system currently can't prevent.

---

## 8. Ask, Don't Infer

Points where the app must present a question rather than compute an answer:

1. **Channel.** Never classify emotion from the blocker text. One tap: *mad / sad / scared / flat / bright-but-stuck / **I can't tell***. "I can't tell" routes to T02 Find the Felt Thread — per the felt-sense praxis, pre-focusing players genuinely cannot label yet, and the interface should slow down rather than force a pick. Free text is stored; it never overrides the tap.
2. **Layer check — exactly one.** After Anger, offer once: "Sometimes anger guards fear or grief. Want to check underneath? (Fine to say no.)" One layer, player-initiated. Recursive auto-excavation is both invasive and unreliable.
3. **Intensity (0–10) and fuel (depleted/steady/charged).** Both self-report. Both gate tool choice (§4 heuristic, G7).
4. **The numbness fork.** When channel = flat: "Does this feel like rest, or like a wall?" — the S12 question. The app must never map flat → Earth → Peace automatically; that's the system's single largest bypass vector.
5. **Target satisfaction state.** Channel supplies the default; the player confirms or redirects (S2, S8). Cross-channel routing is the translate role and belongs to the player.
6. **Ally or target?** Whether the player *witnessed* harm or *received* it changes every recommendation. Never infer from wording; ask when the blocker involves identity-based harm.
7. **Safety and power before any external Show Up.** "Does acting on this involve your boss, your housing, your safety, or someone with power over you?" Yes → internal options first, external framed as opt-in with stakes named. The app never infers that confrontation is safe.
8. **Readiness for external.** "Has the charge dropped below a 4, or do you need to act while it's hot?" — asked, with hot-action legitimate for boundary moves, chosen not defaulted.
9. **Time available (2/10/30).** Asked every session; it's the cheapest question with the highest routing value.
10. **Whether transformation is wanted at all.** Sometimes the player needs capture only. "Work this now, or just get it down?" Journaling-only is a complete, honorable session.
11. **The graceful exit, offered not buried.** Per the felt-sense praxis non-clinical boundary: if intense material surfaces, the app says "this feels too big for a quest right now — that's useful signal too," logs the exit, and does not press. BARS is a skill practice, not therapy, and is not the trained companion Gendlin recommends for players in active treatment.

This set is also the working answer to taxonomy research question 3 (minimum player input): **three taps + free-text blocker + story sentence**, with forks 2/4/6/7 appearing only when triggered. Everything else — tool, move role, timebox, output type, Show Up options — the composer computes and shows *with its reasoning inspectable*, and every computed field is player-editable.

---

## 9. Hostile Review

### 9.1 Where it's handwavy

- **"Emotional vector" was vibes until §1.2.** No repo type exists for it. If it isn't `{channel, intensity, altitude, target}` in code, every downstream promise ("the vector routes the session") is decoration. Ship the type or drop the word.
- **The move-role triad is undefined at the definition level.** The taxonomy rates every tool for metabolize/translate/transcend but never defines the roles; the deck uses a *different* triad (Transcend/Translate/Neutralize). §0 collision 3 proposes a mapping — until someone canonizes it, "move role" is a column of ratings pointing at an unnamed thing.
- **"Satisfaction spirit" now does real mechanical work** — every taxonomy tool declares per-spirit protocol variations (item 18), which answers v1's complaint. But those variations are one sentence each; the protocol composer (§10 target 3) has to render them into actual prompt text, and nobody has verified that "poignance asks what care is underneath" composes coherently with every stance question. Playtest before authoring 50 spirit-variant strings.
- **Grow Up makes a developmental claim with no measurement** (G1). Ratings say five tools are "strong" for Grow Up; outputs say otherwise — every output is a sentence or a single act. Without reps and evidence, the engine has four working phases and one aspiration.
- **"Charge" intensity is self-reported and gamable.** Fine — but then the system must never *reward* high deltas (no XP for intensity drops) or players will learn to inflate the before-number within a week.

### 9.2 Where it bypasses sadness, fear, anger

- **The numbness→Peace slide** (S12, §8.4) is the biggest structural bypass: Neutrality is the only channel whose dissatisfied and satisfied states *feel similar from inside*. Without the rest-or-wall fork, the system will certify frozen grief as achieved Peace.
- **Sadness is the weakest column in the canonical channel matrix.** Six of ten tools rate weak for Sadness; the two strong non-capture options (T01, T02) are both inward-facing, and the taxonomy itself names the gap (its question 5). Until a sadness-native flow tool exists (G3), the system structurally under-serves grief — say so in the UI rather than routing grief to a mediocre fit silently.
- **Allyship culture pressure will over-neutralize anger.** In a politeness-normed community, players will route Anger → Peace by default to stay likable. The translate choice needs a standing guard question: *"Neutralizing because it's complete — or because anger is unwelcome here?"* Anger that should become a boundary and instead becomes acceptance is the specific failure mode of nice activists.
- **T09 and T11 are bypass instruments when mistimed** (§4 guards). The composer must hard-block Joy tools at Anger/Sadness intensity ≥ 5, not merely deprioritize them. Likewise T07's own misuse note — "calming down to avoid truth" — means regulation is a *gate* to transformation, never a substitute for it.
- **T04 on grief is self-gaslighting** and the taxonomy's misuse note agrees ("arguing the player out of legitimate desire, threat, or grief"). Contraindication must be enforced in the composer, not footnoted in a doc.
- **Fear gets two seconds of respect and then a productivity plan.** T08 and T05 are excellent for paralysis, but S8's protest fear is *information about real danger*. The system must honor fear's protective intelligence (risk inventory with mitigations) before converting it to action, or it's training players to override their own alarms.

### 9.3 Where it confuses reflection with action

- **The BAR pipeline makes reflection feel like completion.** Capturing an insight produces a satisfying artifact — which is precisely why the system must refuse to count it as Show Up. Enforced rule (§1.4): no recipient, no date, no public artifact → it's a Clean Up output. The 321 doctrine already states the collapse condition ("becomes journaling rather than psychotechnology"); the taxonomy generalizes it — every tool's misuse note is its collapse condition, and the composer should surface it in-protocol.
- **T05 is where charges go to feel handled.** A board item without a dated next move is deferred avoidance with good UX. The board tool must refuse to close without dates.
- **T01's misuse note names the subtlest confusion**: "making external claims from internal dialogue." A 321 session about your co-organizer is *your* material; it licenses an owned-energy sentence, not a diagnosis of them. The internal Show Up is a vow about your own conduct; the external one goes through T06's no-blame filter.
- **Internal Show Up will be abused as the comfortable default.** It's legitimate (rehearsal, vow, ritual, 24-hour rule) — and it needs a ratchet: an internal option that repeats across 3 sessions on the same blocker without an external step triggers a gentle escalation question, not silence. (This is the working answer to taxonomy research question 4: internal artifacts are first-class *and* counted, so the pattern is visible.)

### 9.4 Where it overcomplicates the player experience

- **The playable recommendation now binds seven components** (vector + role + submove + tool + spirit + blocker/story + domain); a dissatisfied human can hold about two. The player path must be: draw → three taps → one tool → one output. The full tuple lives in the data model and the inspectable session record, never in the player's working memory.
- **Vocabulary debt is already at the redline.** Charge, channel, vector, altitude, spirit, mask, part, BAR, daemon, submove, stance, operation, domain, move role — the deck-literacy spec exists precisely because of this. Standing rule: no new term ships without a glossary entry and a one-tap deep link, and the three naming collisions (§0) get resolved before any of this reaches UI copy.
- **120 cards × 10 tools × 5 channels × 3 altitudes × 3 roles is combinatorially honest and experientially crushing.** The matrices are for the composer. The player sees one recommendation and an "offer me a different tool" button. Depth on demand, defaults everywhere else.
- **Three tool registries (G4) means three vocabularies in the UI** the day someone wires them together. Reconcile before, not after.
- **The non-clinical boundary is a UX requirement, not a disclaimer.** Per the felt-sense praxis: scaffolding copy invites the pause, never explains it at length; over-explanation activates cognition and defeats the tool. The composer's rendered protocols must stay terse — the taxonomy's step lists are already close to the ceiling.

---

## 10. Next Five Implementation Targets for bars-engine

1. **The unified tool registry — `EmotionalAlchemyTool`.** Implement the taxonomy's proposed type (id, genericName, barsName, waveRatings, moveRoleRatings, channelRatings, outputKind, protocolTemplate, completionCriteria, whenNotToUse) in `src/lib/emotional-alchemy/` and seed it with T01–T10. Reconcile `CANONICAL_TECHNIQUES` and `emotional-first-aid.ts` against it per the taxonomy's mapping table (G4): existing tools become entries or reset-modes (Grounding/Breath Reset → T07 modes; Boundary Shield/Rose Tool → T06 lineage). One source of truth for book, deck, and app.
2. **`EmotionalVector` type + Charge Diagnostic flow.** `{channel, intensity, altitude, target}` plus the three-tap diagnostic (channel with "I can't tell" / intensity / time) and the §8 forks (numbness check, layer check, safety check, graceful exit) as a reusable component wired into the deck draw and `/capture`. Turns `tech-charge-diagnostic` from prose into software; depends on nothing, unblocks everything.
3. **The protocol composer.** `recommendPractice(card, vector, fuel, time)` → `{tool, moveRole, timebox, protocol, internalShowUp, externalShowUp, output}` as a pure deterministic function over the registry's ratings plus the §4 guards (T04 blocked on fresh grief; T09 blocked at Anger/Sadness ≥ 5; T07-first at intensity ≥ 7; no gamified physical risk). It renders taxonomy protocol steps + stance question + satisfaction-spirit inflection into one terse practice card. **The twelve golden scenarios are its test fixtures** — each is an input/expected-output pair in `__tests__`. AI tailoring layers on top per the dual-track rule; the composer is the always-on baseline.
4. **321 Charge Dialogue as the first typed tool end-to-end** (the taxonomy's recommended first implementation). Wire T01 through the composer into the existing `/shadow/321` surface: accept a composed recommendation in, emit the typed output (part name, part quote, owned-energy sentence, optional quest seed) out, routing through the existing sinks (`createQuestFrom321Metadata` precedent). Alongside it, the **Show Up commitment artifact**: `{kind: internal|external, recipient?, date?, doneCheck}` as a first-class output type distinct from reflection artifacts — enforcing §1.4 and making the §9.3 ratchet (3 internal-only sessions on one blocker → escalation question) implementable.
5. **Session log with before/after re-rating.** Every tool run records `{vector_before, tool, moveRole, output_artifact_id, vector_after, timebox_kept, exited_gracefully}`. Closes G5, feeds the 321 doctrine's planned "session depth signal," answers taxonomy research question 1 in practice (the typed fields above become `MoveAttempt` fields; everything else stays freeform BAR metadata), and gives the matrices ground truth for tuning. Guard from §9.1: deltas are displayed, never scored or rewarded.

---

*Everything in this atlas that contradicts play-tested reality loses to reality. Update the matrices from session logs, not from taste.*
