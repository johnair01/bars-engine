# MTGOA Show Up Check — Day 5

Built 2026-08-21. Route: `/show-up` → `/mastering-allyship/show-up`.

The end of round 1's loop: four days of noticing, opening, clearing and practising
converted into one thing another person can actually receive.

**No design prototype exists for Day 5** — like Day 1. Its authority is
`MTGOA_DAYS_1_TO_5_HOSTILE_REVIEW_2026-08-21.md`, which deliberately settled the
design *before* any page copy was written, and closes: "Approve this Day 5 core
object before page copy or social creative." That core object is now
`SHOW_UP_CORE_OBJECT` in `src/lib/show-up/check-content.ts`:

> One consentful, specific handoff that gives a particular person a truthful
> reason to encounter the book — and leaves them free to decline.

## Shipped surface

| Piece | Path |
|---|---|
| Flow component | `src/components/show-up/ShowUpCheck.tsx` |
| Copy + handoff vocabulary (pure) | `src/lib/show-up/check-content.ts` |
| Outbound attribution | `src/lib/show-up/outbound.ts` |
| Aggregate events | `src/lib/show-up/events.ts`, `src/app/api/show-up/events/route.ts` |
| Canonical page | `src/app/mastering-allyship/show-up/page.tsx` |
| Short-link alias | `src/app/show-up/page.tsx` |
| Shared shell + primitives | `src/components/mtgoa-check/CheckKit.tsx` |
| Deck draw (shared with every other check) | `src/components/deck/CardDraw.tsx` |

Renders bare: no nav bar, no site footer.

## Flow

```text
entry → aim → draw → craft → reason → outcome → comeback → receipt
```

Come Back is **not** a sixth Basic Move — it is reflection after the loop, so it
lives inside Day 5 rather than becoming a Day 5.5.

## The three decisions this page exists to enforce

These are the review's, not inventions. Each is enforced in code with a test, so
none of them can quietly erode into a friendlier version of itself.

### 1. Prepared is not completed

Show Up's canonical output is an artifact someone can receive, not an intention.
A page that congratulates a polished draft teaches exactly the private-clarity
loop the Challenger card exists to interrupt.

Three states, named separately, with their own receipts:

| State | Receipt title |
|---|---|
| `shown_up` | "You made a handoff." |
| `prepared` | "It is built, and still in your hands." |
| `put_down` | "You read the field and held it back." |

The `prepared` copy carries the distinction affirmatively — "still waiting on
you" — per `.claude/skills/no-ai-slop`. A test pins both halves: that the title
never says complete, done or finished, and that the body still says the handoff
is waiting.

### 2. A handoff needs a reason apart from a sale

The review's failure risk 1 is a recommendation package masquerading as help, and
its required change is a *routing* rule: a handoff that cannot say what it gives
the recipient apart from a purchase should send the reader to an earlier move or
another hand instead.

So claiming **"I made it"** requires having named what it gives them. Without one,
the outcome screen replaces that option with:

> **one step back first** — A useful handoff needs one more thing: what it gives
> them apart from a purchase. Go back a step and name it, or take one of the doors
> below. Both are fine answers.

This gates one *claim*, never the reader's progress. Preparing, putting it down,
and reaching the receipt all stay open with every field blank — the course rule
that a visitor may skip everything and still finish is intact.

The six offered reasons are all true whether or not the recipient buys anything;
a test asserts none of them mentions buying.

### 3. No-send is data, not failure

The fork, before any routing:

> Is the next move unclear inside me, or is this not the right hand, relationship,
> or moment?

- **unclear inside me** → the earlier move: Wake Up, Open Up, Clean Up, Grow Up
- **not the right hand** → another person, another artifact, or put it down — and
  the page says plainly that none of those is a failure

The earlier-move list is built from the spine, so it only offers days that
resolve. Today Grow Up renders as **"Day 4 · Grow Up · coming next"**, disabled,
because Day 4 is designed but unbuilt — and it still shows its reason ("I do not
yet have the capacity this asks for") so the reader learns what Grow Up is for.

## Invariants (do not change without a new handoff)

- No sign-in, no email gate, nothing persisted. The room, the sentence, and what
  happened live in component state only.
- **Day 5 composes nothing outbound.** Like Day 1 and unlike Days 2–3, there is no
  share draft. The handoff is the reader's to send from their own tool.
- `parseShowUpAnalyticsEvent` has no generic payload field. The state is recorded
  as a *claim* — the site does not and should not verify a private action.
- The review requires four things stay measured **separately**: action made
  (self-reported), book CTA click, purchase when attributable, and the qualitative
  return signal. Nothing combines them, and nothing scores a reader. A sale is a
  campaign outcome, never evidence about a person.
- Element comes from the move: Show Up → fire (`--bars-fire-glow`, `#f0813a` lift).
  Purple `--bars-liminal` stays the reserved primary-action color.
- Day 5 draws three of the six **Show Up × Raise Awareness** cards, like Day 4.
  Never a Game Master gate that then "reveals" its only card — that is a selection
  wearing a draw's clothes.
- The Diplomat card must keep its correction: with no consented voice to amplify,
  speak only from your own experience and name the source. A promoter cannot
  borrow the authority of people affected by a harm. A test pins this.
- A time, never a deadline. No urgency theater — "say the thing today" must not
  override a reader's actual energy or the relationship's terms.
- The domain rule is **stated, not assumed**: the first three days help a reader
  read their own situation; the last two narrow to this campaign's field.
- Come Back promises no memory it does not have. Re-entry offers "I made the
  handoff" / "I did not make it yet" and says the page does not remember.

## Verification

Walked end to end at 1280×720 and 375×812. Confirmed:

- the reason gate both ways — "I made it" absent without a reason, present with one
- the no-send fork offering Days 1–3 as links and Day 4 as a disabled "coming next"
- the receipt naming Day 6 with **round 2's** question, not round 1's, and not linking
- telemetry over a full run: aggregate events only, no typed text
- no console errors, no horizontal overflow

`npx vitest run` — 751 passed, 3 failed. The 3 failures are pre-existing on this
branch (`alchemy-engine/e2e-arc-dissatisfied-to-epiphany.test.ts`).

## Still open

- **Day 4 is the hole.** Round 1 now ships 1, 2, 3 and 5. Nothing links to Day 5
  yet, because the only page that would is Day 4's receipt.
- Round 2 (Days 6–10, Skillful Organizing) is drafted in
  `MTGOA_WEEK_2_SKILLFUL_ORGANIZING_DAYS_6_TO_10_DRAFT_2026-08-21.md` and now has
  its questions and domain in the spine, but no pages.
- The review's Day 1 changes are not applied: it asks for **"None of these / my own
  words"** on the six reservations, a narrowing prompt on the desired experience,
  and a card bridge after the draw.
