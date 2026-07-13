# RA Card `applications` — Candidate Pass (voice-forward, general)

> These are candidates for the card's **`applications`** field — the "how this shows up" section
> **every deck owner sees.** They are **general and relatable** (map onto anyone), written in the
> Chapter-0 register — **not your autobiography.** Your personal draws stay as launch content.
> Nothing is written to `move-library.ts` until you ratify these.

**What the edit literally looks like** (added to each card's `AUTHORED` entry in `move-library.ts`):

```ts
'OPEN-RA-SHAMAN': {
  // …existing title, questions, remediation, forbiddenMoves, failureModes…
  applications: [
    { context: 'Before you post about a cause', example: '…' },
    { context: 'A hard conversation', example: '…' },
  ],
},
```

That `applications` array is the whole change. Two entries per card, same shape as the existing
`SHOW-RA-CHALLENGER` ones.

---

## 1. `WAKE-RA-ARCHITECT` "The Story That Could Land" · **Point**
*Move: name the one fact that, if everyone saw it, would change things.*

```ts
applications: [
  { context: 'The cause you brought with you',
    example: "You've been posting fact after fact and the machine hasn't moved an inch. The problem was never that people had too few facts. Find the one that, if they actually saw it, would change the game — and say only that. Ten correct things bounce off. One true thing lands." },
  { context: 'A meeting',
    example: "The room is buried in detail and nothing is getting decided. Name the single fact that reframes the whole thing — 'we're all defending a process no one actually uses' — and watch the argument change shape." },
]
```

## 2. `SHOW-RA-CHALLENGER` "Say the Thing" · **Point** — *already done (the template)*

Its two authored applications ("A meeting" / "Online") are already in-register — the 7/7 card.
**No change.** It's the model the rest are written toward.

## 3. `OPEN-RA-SHAMAN` "What Seeing Costs" · **Witness**
*Move: let the truth land for one breath before you respond.*

```ts
applications: [
  { context: 'Before you post about a cause',
    example: "Before you share the hard story, sit with what it actually cost you to look — the helplessness, the guilt you'd rather skip. Then let that show. People can tell the difference between someone who read the facts and someone who felt them. The felt version is the one that reaches." },
  { context: 'A hard conversation',
    example: "Someone names a harm you had a hand in, and your mouth wants to explain. Take one breath and let it land first — the sting, the defensiveness — before you say anything. The breath is the move. What you say after it will be true instead of armored." },
]
```
*Witness note: these are general scenarios, not a scripted feeling — they show the shape of
letting the cost land, and leave the actual felt content to the player.*

## 4. `GROW-RA-SHAMAN` "The Witness Growing in You" · **Witness**
*Move: name the seeing or speaking capacity one size bigger than today.*

```ts
applications: [
  { context: 'The skill you are mid-rep on',
    example: "Name the capacity you're actually growing right now — not the one you wish you had, the one you're still clumsy at this week. Then say it to someone plainly: 'I'm practicing saying the costly thing instead of keeping the peace.' Naming the rep you're on beats performing a mastery you haven't earned." },
  { context: 'Online',
    example: "Everyone posts their finished convictions. Post the edge instead — the capacity you're still building and keep fumbling. Watching someone practice teaches more than watching someone perform. The fumble is the useful part." },
]
```

---

## The split, held clean (your concern, answered)

| | These candidates (card `applications`) | Your launch content |
|---|---|---|
| Who sees it | every deck owner | your audience |
| Content | **general** scenarios, book's philosophy | **your** Chapter-0 draws |
| Assumes your personal connection? | **No** | Yes — because *you* author it |
| Written to | `move-library.ts` (on ratification) | posts / the slice doc |

Nothing here freezes your private story into the product. The autobiography lives in the posts.

## Next
1. **You:** ratify / tune these six candidate applications (3 cards × 2). Change a word, a context
   label, whatever's off-voice.
2. **Me:** on your OK, write them into `move-library.ts`, run the QA overlay to clear
   `no_quick_example`, then scale to the other ~23 cards that lack applications under this pass.

---

### Source
- Field shape: `src/lib/allyship-deck/types.ts` (`MoveCard.applications`); model:
  `move-library.ts` `SHOW-RA-CHALLENGER`. Voice: `docs/marketing/2026-07-12-voice-guide-and-revoiced-point-slice.md`.
- Registers: `src/lib/allyship-deck/expression-register.ts`.
