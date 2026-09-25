# HANDOFF — masteringallyship.com site work

**Repo:** `github.com/johnair01/bars-engine` · **Written:** 2026-08-10
**For:** whoever writes the code and the copy next
**Companion specs in the project:** `SPEC_CAMPAIGN_SITE_2026-08-10` · `HANDOFF_QUIZ_LEADGEN_2026-08-10` · `SPEC_CHARACTER_SHEET_2026-08-10` · `SPEC_LANE_C_AND_SITE_2026-08-10`

---

## 0. Read these first, in this order

1. `CLAUDE.md`, `AGENTS.md`, `UI_COVENANT.md` at repo root — this repo has real conventions and they're enforced
2. `npm run validate:routes` and `npm run build:registry` are part of `build`. **Every new page needs the route annotation block** (see any existing `page.tsx` for the `@page / @entity / @description / @permissions / @relationships / @agentDiscoverable` format)
3. §1 below — the voice contract. **Do not write copy before reading it.**

---

## 1. The voice contract — non-negotiable

The book this site sells is 383 pages arguing that most allyship marketing is extractive. **Copy that reads like marketing discredits the product on contact.** This is not a style preference; it's the single largest risk in the whole build.

### The register, from the book's own closing page

> *"None of it is required. You can run the rest alone, with this book and whatever your own Forest teaches you, and people do, and it takes longer. I am saying so plainly because you just spent a whole book learning to spot that move when somebody else makes it."*

Write in that. Plain declaratives. Short sentences. Name the cost. Concede the alternative. Never oversell.

### Banned outright

| Banned | Why |
|---|---|
| Countdowns, "limited time", "only X left", "doors closing" | Brand bans urgency. **Every deadline must name the physical thing causing it.** "Ordering the press run Sept 30" is legal. "5 days left" is not. |
| A price that was never charged, used as an anchor | No fake discounts, no "$X value" |
| Exclamation points in body copy | |
| "Unlock", "transform your", "journey", "level up your allyship" | |
| "Join thousands of…" | It isn't true and the reader will check |
| Engagement bait — "comment YES", "tag someone who needs this" | This reader is specifically immunized against being managed |
| Testimonials that only work because Wendell is credible | **Disappearance Test:** would this still convince a stranger with the founder gone? |
| Any ask revealed at the end of a page that didn't disclose it up front | Disclosure ↔ Persuasion |

### Required

- **Name the mechanism.** No vague transformation. Every claim points at a visible move.
- **Beneficiary-centred.** The win is the person helped, never the ally's self-image. No scoreboard language.
- **Disclose early.** If a page has an ask, the ask is visible in the first screen.
- **Read it out loud.** If it sounds like copy it isn't done. If it sounds like Wendell talking it is.

### Where to source copy

**Do not compose cold.** Nearly everything you need is already written in the manuscript in his voice — excerpt and re-aim rather than invent. The book's own front matter, Chapter 1's myths, Chapter 9's *What Comes Next*, and Appendix B's campaign structures are the stock.

---

## 2. Facts ledger — things that are commonly gotten wrong

Verified against the shipped 2026-08-10 trade ebook. **These override any older doc in the repo.**

| Fact | Value |
|---|---|
| Book | 383pp, 9 chapters, Appendices A–H, ebook **live on Gumroad** |
| **The book never mentions an app** | Zero references. Not bars-engine, not "30 days of access". Do not write app copy into any book-facing page until Wendell rules on this. |
| Digital deck | **$22** |
| Physical deck | **$69** |
| Chapter map | 1 Infinite Arcade · 2 Forest · 3 Shaman · 4 Challenger · 5 Regent · 6 Architect · 7 Diplomat · 8 Sage · 9 Player |
| Myths | **Ten.** "Being good" is the master; the other nine are its versions. |
| Kickstarter backers | **371.** Print tier still owed. |
| Social | ~2,098 IG · ~2,130 X |
| Email list | **Does not exist yet** |
| Speaking fees | $2,500 talk · $4,500 half-day · outdoor/experiential priced **per seat**, $95 sliding to $75 |
| Myths Read | **LIVE** at `/mastering-allyship/myths-read` |

---

## 3. Tickets

Priority order. T1–T3 are same-day and mostly deletions.

---

### T1 · Deprecate the finished campaigns

**Status:** the car campaign is complete. The July events are past.

| File | Change |
|---|---|
| `src/components/superpowers/SuperpowerReveal.tsx` ~L230 | Remove *"Wendell needs a reliable car to keep showing up. Every superpower has a way in."* Replace the **object**, keep the mechanic — the new object is the print run and the book tour. |
| `src/components/superpowers/SuperpowerReveal.tsx` L224, L308 | "The Crossing" labels and *"Take this move in The Crossing →"* — re-point once the new object is named |
| `src/components/event/BarnRaisingBar.tsx` L42, L70 | *"The Barn Raising · July 18"* — retire. Mounted on `/launch` and `/event/barn`. |
| `src/lib/mastering-allyship/spoke-funnel-map.ts` | Doc comment says "Spoke → July 18 funnel map". Map is fine; the date reference is stale. |

**Do not delete The Crossing's machinery.** `src/actions/the-crossing-support.ts` contains steward roles, contribution visibility and campaign state — that is the campaign engine T7 needs. Re-point it, don't tear it out.

**Run its ending instead.** `stewardMarkCarPurchased()` and `stewardBroadcastThankYou()` already exist. The campaign should be closed by running the completion flow it was built to have, not by silent deletion.

**Acceptance:** no dead dates anywhere on the site; no personal-hardship ask on the storefront; The Crossing's contributors have been thanked in-product.

---

### T2 · Myths Read chapter stamps *(patch already written)*

`src/lib/mastering-allyship/myths-read.ts` — all ten myths carry chapter references that don't resolve against the printed book. Six say `Ch 0` (no such chapter — the myths are Chapter 1); the other four are each off by one.

Patch file: `0001-Fix-Myths-Read-chapter-stamps-to-match-the-shipped-t.patch`. Apply with `git am`.

**Acceptance:** every stamp resolves to a real chapter that teaches that myth.

---

### T3 · Wire the Myths Read to an email list

**This is the highest-value ticket in the document.** There is no list. The Myths Read is live and is the best acquisition asset on the site, and its email form currently posts nowhere.

- `src/app/mastering-allyship/myths-read/MythsReadClient.tsx` — the email save has a `WIRE ME` comment
- `src/actions/myths-read.ts` — server action exists

**ESP: Kit.** Free to 10,000 subscribers, unlimited broadcasts, one sequence.

**Payload on email submit** (not on quiz completion — completion without submit stays anonymous):

```json
{ "email":"…",
  "tags":["source:myths-read","myth:M5","strength:loud","quiz:taken"],
  "fields":{ "top_myth":"M5","top_myth_name":"…","second_myth":"M8",
             "strength":"loud","taken_at":"2026-08-10" } }
```

Same contract for the superpower quiz: `source:superpower`, `face:<home>`, and **capture the avoided Face too** — Chapter 9 argues the avoided one is the more interesting datum. Anyone with both gets `quiz:both`.

**Existing subscriber → update tags, do not re-enter the sequence.** Retaking is normal.

**Hard rule:** Kickstarter backers who join from the update email get `source:kickstarter` and are **excluded from every sequence**. They were promised ~4 broadcasts a year and no funnel. Breaking that is not worth any conversion rate.

**Acceptance:** submitting the form creates a tagged subscriber; retaking updates rather than duplicates; backers cannot enter a sequence.

---

### T4 · `/mastering-allyship/sheet` — Appendix H's debt

The book says in print: *"Print artwork and the fillable version live at masteringallyship.com."* They don't. Three artifacts are built and attached:

- `MTGOA_Character_Sheet_print.pdf` — one page, B&W-safe
- `MTGOA_Character_Sheet_fillable.pdf` — 29 form fields
- `character-sheet-interactive.html` — the teaching version

**Ungated. Both PDFs, print listed first.** You do not charge an email for something the book already said was there.

The interactive page needs its placeholder links fixed — `/mastering-allyship/book` and `/mastering-allyship/sheet.pdf` are guesses.

**The optional opt-in**, and it's the book's own idea rather than a funnel — Appendix H says *"Date every version. Across a year of play you can watch your face, your shadow and your myths move."*

> **Want the nudge?** The sheet is worth re-filling every few months — that's where you see the movement. I'll send one reminder a quarter with a blank copy attached. Nothing else.

Tag `source:character-sheet`.

**Cross-link both quizzes:** line 1 is the Superpower result, line 3 is the Myths Read. On each quiz result page add *"That's one line of your character sheet. Here are the other twelve."*

---

### T5 · The missing pages

Each is a promise made in print with nothing behind it.

| Route | Pays | Notes |
|---|---|---|
| `/speaking` | *What Comes Next* | Copy is written — see `SPEAKING_KIT_2026-08-10` §4. Two one-sheet PDFs attached (corporate + field/outdoor). Fees visible on the page. |
| `/succession` | Chapter 9 | **Overdue by a printing.** Ch9 puts `wendell@masteringallyship.com` in print attached to certification, with no intake. Needs one honest paragraph on current state + a waitlist. Nothing is sold. |
| `/podcasts` | — | Two directions on one page: *book me* (topics, formats, bio, headshot) and *I'll introduce you* |
| `/mastering-allyship/origin` | Ch9 p309 | The history-face vs. superpower-face page |
| `/igniting-joy` | *What Comes Next* | The other book |
| `/workshop` → Patreon | — | Build-in-public. **One post a week minimum or don't launch it** — this must not become the next unpaid promise. |

**`/nonprofit` needs a rewrite, not a new page.** `src/app/nonprofit/page.tsx` exists. The org is **in formation** — not incorporated, no 501(c)(3) determination. The page must say, above the fold: **no tax-deductible donations, no money is being accepted.** It asks for founding circle, board/governance help, incorporation and legal skills, and a first program site. The one paragraph on purpose is Wendell's to write — leave a marked placeholder, do not invent it.

---

### T6 · Book tour help → a campaign, not a volunteer form

`src/app/mastering-allyship/book-tour/help/` and `src/lib/mastering-allyship/book-tour-help.ts` already work. What's missing is the framing.

`BOOK_TOUR_HELP_OPTIONS` maps onto Appendix B's four 21-day campaigns almost exactly:

| Existing key | Campaign | The 21 days |
|---|---|---|
| `host`, `produce` | **Skillful Organizing** — *The Room* | inventory conditions → set terms out loud → build one that outlasts you |
| `connect`, `resource` | **Gather Resources** — *The Introduction* | name what's depleted → move a resource that costs you → track what it freed |
| `promote` | **Raise Awareness** — *The Telling* | choose the form → tell it → track what actually shifted |
| `attend` | — | routes to `/campaigns` |

**Smallest change that alters the meaning:** after someone picks an option, the confirmation names the campaign they just entered, gives the three weeks, and states the unlock. No new routes.

**The unlock:** sign up → pick a domain → run week 1 → post the capture → **the ebook unlocks.** Say this on the signup screen, before they pick — not revealed at the end.

---

### T7 · `/campaigns` index

`src/app/campaigns/` has only `landing/[slug]`. **There is no index**, so the four doors have nowhere to live.

Four cards. Header quote from Appendix B: *"Pick the one that's pulling at you. Not the one you should do. The one that's already calling."*

Three campaigns carry a pre-named launch object. **Direct Action carries an open one** — Week 1 is where its object gets named, and the menu must present at least as many non-launch objects as launch ones, presented first. A menu of one teaches nothing.

**Two rules to enforce in the product:**

- **The capture is posted, the person is not.** What you report is what you did and what it cost — never who they were, never enough detail to identify them. Pinned before anyone enters. Applies hardest to Direct Action.
- **Buying the book is a Gather Resources rep**, not Direct Action. A Direct Action rep costs you something you chose. See `CANON_BUYING_THE_BOOK_2026-08-10`.

**Fund a Copy** — pay for a book that goes to someone who can't buy one. Real named beneficiary, satisfies the campaign's Week 3 (*the copy is in a room, it runs without you*), raises money the pre-order structurally can't reach, and becomes the in-formation nonprofit's first actual program.

---

### T8 · `/go/<audience>` funnel pages

One page = one audience = one ask. No page serves two. Skeleton: **their problem in their words → the one thing this gives them → the proof that lands for them specifically → one ask → one button.** No navigation, no second offer, no link tree.

`/go/backers` · `/go/podcast` · `/go/bookstore` · `/go/org` · `/go/facilitator` · `/go/<name>` for a specific Dream 100 contact.

---

## 4. Site-wide

- **One link per surface, changed by season.** IG bio → the Myths Read (live now). Never a link tree.
- **Chapter stamps.** Any page a book reader is sent to should say so — *"Chapter 1 sent you here."* Cheap, and it makes the site feel like part of the book rather than a shop attached to it.
- **Replies are never automated.** A brand about relational repair that auto-replies has failed its own Disappearance Test in public.

---

## 5. Do not

- Do not write app or redeem-code copy into book-facing pages until the app question is ruled on
- Do not gate `/mastering-allyship/sheet` or `/origin` — they're debts
- Do not put a personal-need ask on the storefront; if one exists it lives at `/support`, footer-linked
- Do not delete The Crossing's actions, steward model, or campaign state
- Do not invent the nonprofit's purpose paragraph
- Do not add a sequence for `source:kickstarter`
- Do not ship copy you haven't read out loud

---

## 6. Suggested order

**Day 1:** T1 (deprecations) · T2 (patch) · T3 (list wiring)
**Day 2–3:** T4 (character sheet) · T5 `/speaking` and `/succession` first
**Week 2:** T6 · T7
**As needed:** T8, built when the Dream 100 list gets named

T3 unblocks everything downstream — the Kickstarter update to 371 backers cannot send without a list to point at, and that update is the only channel to the warmest audience that exists.
