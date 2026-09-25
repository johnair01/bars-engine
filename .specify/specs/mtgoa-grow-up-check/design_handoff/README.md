# MTGOA Grow Up Check — design handoff (Day 4)

Imported from Claude Design project **Mastering the Game of Allyship Book**
(`b6457c63-114e-44c9-8039-494652c5ce64`) on 2026-08-21.

- `MTGOA Grow Up Check.dc.html` — the reference implementation. Like the Clean Up
  handoff, it is a **working prototype**, not a mockup: copy, screen order, the six
  Game Master gates, the rep vocabulary and the reminder composer are all captured
  there. When a written note and the reference disagree, the reference wins.

Written spec: `04 Quests/Campaigns and Projects/Mastering the Game of Allyship Book
Launch/Launch Assets/Marketing/2026-08-20/DAY_4_GROW_UP_PAGE_SPEC_2026-08-20.md`.

**Status: designed, not shipped.** No route resolves for Day 4 in this repo. The
course spine records this as `status: 'designed'`, so nothing links at it —
see `src/lib/mtgoa-course/course-days.ts`.

## Where it sits in the course

Day 4 of 30. Round 1, fourth move.

| Day | Move | Question | Status |
|---|---|---|---|
| 1 | Wake Up | What is happening? | shipped → `/wake-up` |
| 2 | Open Up | What energy is trying to get through? | shipped → `/open-up` |
| 3 | Clean Up | What move is missing? | shipped → `/clean-up` |
| 4 | **Grow Up** | **Which capacity am I willing to practice?** | **designed (this handoff)** |
| 5 | Show Up | What can another person actually act on? | unauthored |

## Screens

Nine, in order — two more than Day 3's eight:

```text
entry → room → names → belief → draw → bridge → rep → land → receipt
```

`room`, `names` and `belief` do the work Day 3's `charge` / `line` screens do: they
give the draw something to land on. `belief` reuses the same six self-sabotaging
beliefs as Days 1–3, so a reader meets the same six lines a third time — that
repetition is the course, not a copy-paste.

## Verified against the shipped line

Checked on import; all of these already agree with the repo:

| Thing | Reference | Repo source of truth |
|---|---|---|
| Move element | wood — `#4a7c59` frame, `#27ae60` glow, `#2ecc71` gem | `ELEMENT_TOKENS.wood` in `src/lib/ui/card-tokens.ts` |
| Move glyph | `growPath` (4 paths) | `MOVE_ICON_PATHS.grow_up` — byte-identical |
| Face colors | `faceColor` (6 operations) | `FACE_COLOR` — identical |
| Gold edge | `#C9A84C` | `DECK_GOLD` |
| The six gates | `move==='grow' && domain==='aware'` → 6 cards | `GROW_UP_RAISE_AWARENESS_PRACTICES`, ids `GROW-RA-*` |
| Card titles + questions | all six | `AUTHORED` in `src/lib/allyship-deck/move-library.ts` |
| Short alias | `/grow-up` | matches the `/open-up`, `/clean-up` convention |
| Day 5 CTA | disabled, "coming next" | correct — Show Up is unauthored |

## Divergences to resolve before building

1. ~~**`/wake-up` does not exist.**~~ **Resolved 2026-08-21.** The entry screen's
   secondary CTA — "I want to start from the beginning →" — points at `/wake-up`,
   which used to 404 on the shipped line. Day 1 has now been built here
   (`src/components/wake-up/WakeUpCheck.tsx`), so the link resolves. The
   prototype needs no change.

2. **The answer envelope carries names of real people.** `envelope()` emits
   `{ v:2, day:4, … answers: { names, who, … } }`. The course foundation note's
   persistence decision 5 recommends Day 2's outreach names be categorically
   excluded from any future save. That is now enforced in code rather than
   remembered — `createCourseAnswerEnvelope` drops `names`, `people` and `who`
   (`COURSE_ANSWER_EXCLUDED_KEYS`). The prototype's envelope should adopt the
   canonical shape: `schemaVersion: 'mtgoa-course-answer-v1'`, `courseId`, `day:
   'day-4'` — not the ad-hoc `{ v: 2, day: 4 }`.

3. **`reminderText` interpolates free text.** The clipboard string composes
   `s.who` (which may be a typed first name), plus `s.boundary`. Day 3's invariant
   is that free-typed text never reaches a composed draft — only canonical strings.
   The reminder is user-initiated and clipboard-only, which the spec does permit,
   so this is a deliberate narrowing rather than a violation; but it is the one
   place a real person's name leaves the flow's own DOM. Keep it clipboard-only:
   it must never reach a URL, an event payload, or a share link.

4. **No analytics seam.** Days 2 and 3 each have `src/lib/{move}/events.ts` and a
   validating `/api/{move}/events` route with no generic payload field, so typed
   text is structurally unable to be recorded. Day 4 will need the same before it
   ships; the spec's allowed event list is already written.

5. ~~**Day 3 does not hand forward to Day 4.**~~ **Resolved 2026-08-21.** All three
   shipped receipts now read their forward handoff from `nextCourseDay()`. Day 3's
   receipt names Grow Up's question and renders **"Day 4 · coming next"** as a
   non-link, because the spine reports Day 4 as `designed`. **When Day 4 flips to
   `shipped` in `course-days.ts`, that becomes a live link with no edit to
   `CleanUpCheck.tsx`.**

6. **Build it on `CheckKit`.** Day 1 introduced
   `src/components/mtgoa-check/CheckKit.tsx` — the shared shell, buttons, chips,
   rows, private field, deck ribbon and receipt row. Day 4 should be built on it
   rather than forking a fourth private copy of the same primitives.

## Invariants (do not change without a new handoff)

Inherited from the Clean Up handoff, and they hold here:

- No sign-in, no email gate, nothing persisted server-side. Rooms, names, belief,
  rep, support, boundary and the "in my own words" note live in component state only.
- Element comes from the move: Grow Up → wood. Purple `--bars-liminal` stays the
  reserved primary-action / selection color. Gold `#C9A84C` is the only non-token
  brand accent.
- Cards render through the canonical `AllyshipCard` / `MovePip` / `FaceBadge`.
  Do not fork the card. The draw uses the shared `CardDrawRow` / `CardDrawSheet`.
- A reader may skip every field and still meet the Game Master question.
- No verdict, score, streak, readiness label, courage language, or personality result.
- The relationship is never called a lead, an audience, reach, or a resource.
- Round 1 stays tied to Raise Awareness and the book.

Day 4 adds one of its own:

- **The draw is the six gates.** There is exactly one card behind each Game Master.
  Never manufacture a second random draw after a gate is chosen.
