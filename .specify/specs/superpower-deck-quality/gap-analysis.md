# Gap Analysis: Superpower Deck Quality

Scope: the six generated superpower decks (360 cards) measured against the **Move Quality Rubric** (spec §). Test campaign: **raise $8,500 for a new car**. Sample loadout: **inner = Escape Artist** (handles the fear/shame of asking for money), **outer = Connector** (the relational workhorse of fundraising).

---

## 1. Current state (aggregate)

Every generated card has: `name`, a templated `essence`, three `steps` (one move-prompt, one aspect line, one shadow-check), and correct tags. That is the entire payload.

**Field coverage vs the gold standard (base `MoveCard`):**

| Anatomy field | Base deck | Superpower cards | Gap |
|---|---|---|---|
| name | ✓ | ✓ | — |
| essence / flavor | ✓ | ✓ (templated) | thin |
| concrete practice (steps) | ✓ (remediation) | ~ (templated) | **weak** |
| primaryQuestion (inner) | ✓ | ✗ | **missing** |
| campaignQuestion (outer) | ✓ | ✗ | **missing** |
| optimizesFor | ✓ | ✗ | **missing** |
| forbiddenMoves | ✓ | ✗ | **missing** |
| failureModes | ✓ | ✗ (only generic shadow) | **missing** |
| remediation | ✓ | ✗ | **missing** |
| working-vs-performed tell | ✓ (book) | ✗ | **missing** |

**Verdict:** all 360 cards sit at **L0–L1**. They name a direction but can't be deployed: a player holding one for the car campaign gets a vibe, not a move.

**Two gaps to close:**
- **Schema gap** — `Technique` can't even *hold* the missing anatomy: no `primaryQuestion`, `campaignQuestion`, `forbiddenMoves`, `remediation`, `tell`. (It has `optimizesFor`, `failureModes`, `contraindications`.) → Phase 1 additive fields.
- **Content gap** — even with fields, the generator emits templates. → Phase 4 enrich profiles to L2 + hand-author hero cells to L4.

---

## 2. Rubric scorecard — a current card

**Card** `sp-connector-OPEN-DIPLOMAT-OUTER` (Connector · Open Up · Diplomat face · outer) — the card a Connector-outer player draws on the base card *OPEN-GR-DIPLOMAT "The Tenderness of Asking"* when working the car fund.

Current content:
- name: *"Receive what each person is reaching for — Bridge"*
- essence: *"For others: relational gravity, across difference and relationship."*
- steps: *Receive it without flinching, across difference… / Offer it to others: what each person is reaching for. / Shadow check: the Overextended Hub…*

Scored against the 12 criteria:

| # | Criterion | Met? |
|---|---|---|
| 1 | Enactable now | ✗ — "receive what each person is reaching for" isn't an action |
| 2 | One clear practice (2–4 real steps) | ✗ — generic prompts |
| 3 | Dual reading (inner felt-sense + outer act) | ✗ |
| 4 | Optimizes for | ✗ |
| 5 | Forbidden moves | ✗ |
| 6 | Failure modes | ✗ |
| 7 | Remediation | ✗ |
| 8 | Working-vs-performed tell | ✗ |
| 9 | Shadow check | ✓ |
| 10 | Body test | ✗ |
| 11 | Token/ticket + consent/placement | ✗ |
| 12 | In-voice & cell-specific | ✗ — template |

**Level: L1 (barely).** Only the shadow check lands.

---

## 3. Worked examples — current vs target (across domains, faces, moves)

### Example A — Outer · Connector · OPEN UP · Diplomat face · Gathering Resources
*Base cell: OPEN-GR-DIPLOMAT. The relational heart of the ask.*

**Target (L4) — "The Warm Ask"**
- **essence**: Open a real ask to someone who'd *want* to help — without turning the relationship into a ledger.
- **primaryQuestion** (inner): *Whose help am I afraid to receive for the car, and what story makes the ask feel like a debt?*
- **campaignQuestion** (outer): *Who in my circle would genuinely want a chance to chip in $50–$500 toward the car — and how do I invite them cleanly?*
- **steps**: (1) List 10 people who'd be glad to be asked. (2) For each, name a specific amount and a true reason ("you know how stranded I've been"). (3) Ask one today, in your own voice, with an explicit no-strings out.
- **optimizesFor**: Resource flow through warmth, not pressure.
- **forbiddenMoves**: Mass-blast the same message; imply obligation; pre-decide their "no" for them.
- **failureModes**: Transactional scorekeeping; shame-leveraging; only asking the people who least mind.
- **remediation**: If it curdles, say "no strings — really," and mean it.
- **tell**: *working* — you feel cleaner after asking, win or lose; *performed* — you're tracking who now "owes" you.
- **example**: Text Aunt Dana: "Saving for a car so I can stop borrowing rides. Would you want to put $200 toward it? Totally fine if not."

### Example B — Inner · Escape Artist · CLEAN UP · Shaman face · (any domain)
*Base cell: CLEAN-*-SHAMAN read as self. Metabolizing the fear/shame of asking for money.*

**Current (L1)** — *"Sort wise retreat from mere flight — Sense"*; templated steps. Names the right tension but gives no practice.

**Target (L3+) — "Is This Wise Retreat, or Am I Just Scared?"**
- **primaryQuestion**: When I flinch from posting the ask, is the fear protecting something real, or just protecting me from being seen needing help?
- **steps**: (1) Feel the flinch; locate it in the body. (2) Ask the Escape Artist's question: *what is this fear protecting?* (3) Sort: a real reason not to ask (name it) vs. plain exposure-fear (proceed anyway).
- **optimizesFor**: Not abandoning a good ask because needing help feels exposing.
- **forbiddenMoves**: Calling avoidance "discernment"; ghosting the campaign to dodge the feeling.
- **failureModes**: Perpetual "not the right time"; researching instead of asking.
- **remediation**: Set a 10-minute timer; send one ask before it rings.
- **tell**: *working* — you name the fear and move; *performed* — you produce three more reasons to wait.

### Example C — Outer · Connector · SHOW UP · Challenger face · Direct Action
*Base cell: SHOW-DA-CHALLENGER "Make the Move." The actual, edged ask.*

**Target (L4) — "The Direct Ask"**
- **campaignQuestion**: What's the one concrete ask that moves the car fund today — to whom, for how much, by when?
- **steps**: (1) Pick the person and the number. (2) Make the ask plainly, with the deadline ("trying to close the gap by month's end"). (3) Make it easy to say yes (send the link) and easy to say no.
- **optimizesFor**: An actual dollar amount committed, not a softened hint.
- **forbiddenMoves**: Hinting instead of asking; burying the number; apologizing the ask away.
- **failureModes**: The ask that never quite gets sent; vague "anything helps" with no target.
- **remediation**: If you softened it, send a one-line follow-up with the real number.
- **tell**: *working* — there's a specific number on the table; *performed* — you "raised awareness" but asked no one.

---

## 4. The schema/content gap, summarized

| Gap | Where | Fix (phase) |
|---|---|---|
| `Technique` can't hold the anatomy | `types.ts` | Add optional `primaryQuestion`, `campaignQuestion`, `forbiddenMoves`, `remediation`, `tell`, `example`, `qualityLevel` (Phase 1) |
| No way to grade a card | — | `quality.ts` `assessQuality` + `RUBRIC` (Phase 1) |
| Generator emits L1 templates | `grid.ts` / `profiles.ts` | Enrich profiles so generation reaches L2 (Phase 4 FR7) |
| Top campaign cells need real cards | `superpowers/*` | Hand-author hero cells to L4 (Phase 4 FR8) |
| No proof of usability | — | Car-campaign harness + report (Phase 3) |
| Weak cards could ship | — | Guard test: no `published` < L3 (Phase 4 FR9) |

---

## 5. Prioritized remediation (where to spend effort)

For the $8,500 campaign, the highest-value cells are the **Gathering Resources** column for the **outer Connector** (the ask) and **inner Escape Artist** (the fear of asking), across all six faces, plus the **Show Up** row for the close. Recommended order:

1. **Phase 1** schema + `assessQuality` (you can't improve what you can't measure).
2. **Hero cells first** (FR8): the ~12 cells above (Connector-outer × {Open, Show} × {Diplomat, Challenger, Architect, Sage}; Escape-Artist-inner × Clean × {Shaman, Challenger}) — these are what a real fundraiser actually draws.
3. **Profile enrichment** (FR7) to lift the remaining ~348 to a solid L2 floor.
4. **Storyteller-outer** next (the campaign's narrative — "why the car matters"), then **Strategist-outer** (the plan/ladder).

This keeps the work honest: prove the few cells a player will actually use for *this* campaign at L4, raise the floor everywhere to L2, and gate publishing at L3.
