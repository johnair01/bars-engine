# Decision — what carries the mailing list, with Kit closed

> "we need to either reopen this (and then deal with the budget implication) or have a
> workaround in the meantime to use what we already have" — Wendell, 2026-09-15

**Opened:** 2026-09-15 · **Status:** ratified by Wendell, 2026-09-15
**Blocks:** the character-sheet quarterly reminder, the succession and nonprofit updates, and
any sequence. Each is promised on a live page and has no sender.

---

## 0 · Evidence

Pulled from `origin/main` at `bb7950cd`. Each face below cites these rows.

| # | Fact | Where |
|---|---|---|
| E1 | Every capture writes Postgres before it calls Kit. Kit was only ever a copy. | `FunnelSignup` rows in `src/actions/leads.ts` and `launch-leads.ts`; `MythRead` in `myths-read.ts`; `TourIntroduction` in `introductions.ts` |
| E2 | Kit was chosen and left switched off. Every address is still only in Postgres. | Wendell, 2026-09-15; no `KIT_API_KEY` in `.env` or `.env.local` |
| E3 | Resend is live and sends two single emails a reader asks for: Chapter One and the Superpower result. | `src/lib/email/awaken.ts`, `src/lib/email/superpower.ts` |
| E4 | Four promises on live pages have no sender. | see the table below |
| E5 | `sequence:welcome` is a trigger tag with no emails written behind it. Neither the Chapter One form nor the Superpower form says a sequence follows. | `src/lib/esp/list-contract.ts`; `ChapterOneLeadForm.tsx` ("Send me the chapter"); `SuperpowerReveal.tsx` (promises the result and the avoided superpower) |
| E6 | Nothing in the codebase handles unsubscribe or suppression. | grep for `unsubscrib` and `suppress` on `origin/main` |
| E7 | Myths Read asks only to "Save your read," and its client sends `consent: true` on every save. Those addresses are saved reads, outside the list. | `MythsReadClient.tsx` |
| E8 | The six call sites share one seam, `syncSubscriber`, which returns its errors instead of throwing them. The backer rule lives in a pure file. Swapping the provider is one file. | `src/lib/esp/kit.ts`, `src/lib/esp/list-contract.ts` |
| E9 | Kickstarter backers have no capture path on the site. Their ~4 broadcasts a year go through Kickstarter. | no `sourceTag('kickstarter')` call outside tests |
| E10 | Kit was picked on 2026-08-10 because it was free to 10,000 subscribers with one sequence. | `docs/handoffs/HANDOFF_SITE_2026-08-10.md` §T3 |
| E11 | List size is unknown. A read-only count against production was blocked by the permission layer. | this session |

**The promises with no sender (E4):**

| Surface | What the page says | Kind |
|---|---|---|
| `/mastering-allyship/sheet` | "One reminder a quarter, with a blank copy attached. Nothing else." | scheduled, mechanical |
| `/succession` | "One update when there is something real to say. No sequence…" | occasional, first person |
| `/nonprofit` | "I will write when the founding circle meets. No sequence…" | occasional, first person |
| `/introductions` | "I will come back to you before I write to them" | one to one, per lead |

**The budget card (E12).** Checked against each provider's own pages on 2026-09-15.

| Option | Money | What it carries | Source |
|---|---|---|---|
| Kit, free | $0 up to 10,000 subscribers, API included | tags, broadcasts. Kit's pricing table and help article disagree on whether one sequence is included | K1, K2, K3 |
| Kit, Creator | $39/mo at 1,000; $59/mo up to 3,000 | unlimited sequences and automations | K1 |
| Resend marketing, free | $0 up to 1,000 contacts, unlimited broadcasts | segments, topics, broadcasts, a hosted unsubscribe page and headers | R1, R3, R7 |
| Resend marketing, next tier | $40/mo up to 5,000 contacts | the same. Over the limit, broadcasts return 403 until upgraded | R1, R12 |
| Resend transactional, free | 3,000/mo and 100/day | single sends. Attachments work on single sends only, not batch or broadcasts | R2, R13, R14, R15 |
| Resend Automations | 10,000 runs/mo on every plan | event-triggered sequences. The unsubscribe link is added by hand | R5, R6 |

Sources: R1 resend.com/docs/knowledge-base/what-is-resend-pricing · R2 …/account-quotas-and-limits ·
R3 resend.com/docs/dashboard/audiences/introduction · R5 resend.com/blog/introducing-automations ·
R6 resend.com/docs/dashboard/automations/send-email · R7 resend.com/docs/dashboard/segments/introduction ·
R12 resend.com/docs/api-reference/rate-limit · R13 …/api-reference/broadcasts/create-broadcast ·
R14 resend.com/docs/dashboard/emails/batch-sending · R15 resend.com/docs/dashboard/emails/attachments ·
K1 kit.com/pricing · K2 help.kit.com/en/articles/9053602 · K3 help.kit.com/en/articles/9902901

| # | Fact | Where |
|---|---|---|
| E12 | The budget card above. | provider pages |
| E13 | `sendEmail` has no attachment field today. | `src/lib/email/send.ts` |
| E14 | The quarterly reminder went live on 2026-08-10, so the first one falls due around 2026-11-10. | commit `ac916a9e` |

---

## 1 · Sort

**Type:** BRANCH.

| | |
|---|---|
| value | whether a reader who was promised an email gets it, and can leave |
| charge at open | − (four promises unsent; no way out) |
| charge at close | + under any option that sends with an unsubscribe |
| flips? | yes |

## 3 · Widen

**Options as posed:**
1. Reopen Kit and pay what it costs.
2. A workaround on Resend "in the meantime."

**Vanishing options test.** Take away Kit and Resend both. The addresses are still in Postgres
(E1), and every promise in E4 could still be kept by hand from Wendell's inbox. So:

3. **Postgres stays the list, and no provider holds it.** Personal sends for the first-person
   promises, and a scheduled send for the quarterly reminder.
4. **AND not OR, by sequence.** Keep the seam (E8). Choose the provider once a sequence is
   written and a form discloses it (E5).

## 4 · Cast

```
seed:      20260915
primary:   2 — Supportive Power · Earth over Earth · tone: Receptivity
changing:  1, 4, 5  (one low, two high)
relating:  17 — Inspiring Followers · Lake over Thunder · tone: Leadership through Service
value turn offered:  Receptivity → Leadership through Service
```

The canonical file carries no line texts, so the lines are read from the traditional text:

- **Line 1 · hoarfrost underfoot, solid ice not far off.** Small neglect compounds. Here the
  hoarfrost comes in two kinds: a promise still waiting for its sender, and a list that holds
  readers in. The ice is the first missed quarter, or the first bulk send a reader cannot leave.
- **Line 4 · a tied-up sack; no blame, no praise.** Restraint. Spend nothing new, and pour
  nothing out: the addresses stay where they are until a send is owed.
- **Line 5 · a yellow lower garment; supreme good fortune.** Yellow is the color of the centre,
  and the lower garment is the serving position. Excellence worn modestly, from the ground up.

**Can the decision make that move?** Yes. The list has only received so far: addresses in,
two emails out (E3). The turn is to serve what was promised. Hexagram 17's warning applies
directly: followers won "through force or cunning" produce "movements of resistance." An undisclosed sequence
(E5) and a consent flag that is always true (E7) are both the cunning kind.

One low line and two high lines: the premise needs one correction, and the rest is execution.

## 5 · The faces

**On the table:** Earth (stands on) · Earth (presents as). *Warmth is a function. Welcome is designed.*

### Round 1

| Face | Earth, standing | Earth, presenting | Says | New? |
|---|---|---|---|---|
| 🧙 SHAMAN | Postgres already holds every address (E1) | welcome as a designed act: the send that was promised | Underneath "which vendor" is a list that has taken addresses for five weeks and sent two emails (E3). Falsifiable: an option that misses the reminder due 2026-11-10 (E14), or leaves readers no way out (E6), fails at any price. | yes |
| ⚔️ CHALLENGER | stay on ground you own; refuse a second vendor | guard the gate; refuse to enroll anyone past what the form said | The budget card contradicts the premise. Kit costs $0 up to 10,000 with the API. The money buys sequences, at $39/mo, while the one sequence planned is still unwritten (E5, E12). The move being avoided: stop tagging Chapter One and Superpower readers into `sequence:welcome`, which their forms leave out. | yes |
| 🏛️ REGENT | the sending domain that delivers Chapter One | the backer rule, inherited and load-bearing | Kit commits the season to a second list store that drifts from Postgres and a second sending identity. The date that cannot move is 2026-11-10: line 1's ice. Unsubscribe exists before any list send. The list contract stays. | yes |
| 🏗️ ARCHITECT | the seam, one file (E8) | the smallest form that carries the missing load | Unsubscribe and bulk delivery are the only loads nothing carries today (E6). Resend Contacts, Segments and Broadcasts carry both on the account already live, free up to 1,000 contacts. The change is the body of `kit.ts`. | yes |
| 🌿 DIPLOMAT | six groups are present: backers, introducers, the succession and nonprofit lists, sheet readers, quiz and chapter readers | warmth to each, by what each was told | Membership follows the promise. Four surfaces promised later mail (E4). Chapter One, Superpower and Myths Read readers were promised one email or "save your read" (E5, E7), so they stay in Postgres only. A reply about one lead comes from Wendell's own inbox. A reader's standing changes the day they can leave. | yes |
| 🧠 SAGE | the question as posed: which vendor | the question as owed: what, to whom, by when | Three things are owed: a quarterly reminder with an attachment, a few first-person updates, replies about single leads. None needs automation. The reframe repeats Shaman's. Sage adds the trigger: the provider question reopens once a written sequence has a form that discloses it. | partly; the reframe repeats Shaman |

**Splits after round 1:**

- **S1 · The quarterly reminder.** Architect wanted a Broadcast with a link, because Resend runs unsubscribe for free there and Broadcasts cannot attach a file (R13). Regent and Diplomat held to the page: it says "attached," and five weeks of readers signed up under that word.
- **S2 · Who enters Resend.** Architect wanted every capture mirrored through the one seam. Diplomat wanted only people promised later mail.
- **S3 · The welcome sequence.** Challenger wanted the machinery deleted. Regent held that the contract file carries the backer rule.

### Round 2

- **S1 resolved.** Architect found the interface: one suppression store, the Resend contact's `unsubscribed` flag. Broadcasts honor it natively. The quarterly job reads it before each single send, which can carry the PDF (R15). A small site route sets it from a signed link. Regent and Diplomat accept because the page's word is kept. Challenger accepts on scale: the reminder list is small enough to fit the free 100 a day. Shaman: the attachment is the book's own instruction, "date every version," arriving ready to print.
- **S2 resolved for Diplomat.** Architect accepts because the seam stays and three call sites go. The list becomes four segments. Regent's watch item: past 1,000 contacts, broadcasts stop until the $40 tier (R12).
- **S3 resolved.** The contract file stays, and the two call sites stop applying the tag.

### Round 3 · consensus check

Challenger asked whether the reminder job and unsubscribe route are "the meantime" under another name. Sage answered that they are the list, sized to its promises, with nothing temporary in it. No face dissented.

The cast reads through the ruling. Line 4, the tied sack, is its restraint: money stays unspent, so only readers promised mail enter a provider. Line 5, the yellow lower garment, is the vendor already in service. Its sends go out in first person and answer to a human inbox. The value turn is the list moving from receiving to serving.

**They agree on:** every point of the ruling below.
**They split on:** nothing after round 2.
**Abstained:** none. Sage's reframe repeated Shaman's, as noted.

---

## Ruling · the faces', ratified by Wendell

1. **Kit stays closed.** Its free tier costs nothing and carries nothing this list needs until a sequence exists.
2. **Postgres stays the list of record.** Resend Contacts carry four segments, one per surface that promised later mail: character sheet, succession, nonprofit, introductions with consent.
3. **Three surfaces stop syncing:** Chapter One, Superpower and Myths Read. `sequence:welcome` stops being applied. `list-contract.ts` stays, backer rule and all.
4. **One suppression store:** the Resend contact's `unsubscribed` flag.
   - Succession, nonprofit and introductions news goes out as Broadcasts, in first person, with replies going to Wendell.
   - The quarterly reminder goes as single sends with the PDF attached. Each send carries an unsubscribe link and header and skips unsubscribed contacts. The first is due 2026-11-10.
5. **A reply about one lead** comes from Wendell's inbox, one to one.
6. **The provider question reopens** when a sequence is written and its form says so. Resend Automations is the first candidate then, with the unsubscribe added by hand (R6). Kit Creator at $39/mo is the fallback.

## What it costs

- **Money:** $0 while contacts stay under 1,000 and the reminder fits 100 sends a day. Above 1,000 contacts, $40/mo.
- **Build:** swap the body of `kit.ts` for Resend Contacts, remove three call sites, add attachments to `sendEmail` (E13), add one unsubscribe route, and add a quarterly trigger. No database migration.
- **Given up:** Kit's tag-triggered automation. Unsubscribes live in Resend alone, so Postgres stays unaware of them. That is safe only while every list send checks Resend first.
- **Docs out of date:** the `KIT_API_KEY` section of `docs/ENV_AND_VERCEL.md` and handoff §T3 describe a closed decision.

---

**Ratified:** 2026-09-15 — "ratified, build it" (Wendell)


---

## Amendment 1 · three segments, four lists

**Opened:** 2026-09-15 · **Status:** ratified by Wendell's instruction to build it, 2026-09-15

**What happened.** The first backfill run with `--apply` wrote these results:

| Segment | Created | Already a contact | Failed |
|---|---|---|---|
| character sheet | 66 | 0 | 1 |
| succession | 4 | 33 | 0 |
| nonprofit | 0 | 0 | 47 |

Every nonprofit failure carried the same Resend error: *"Your plan includes 3 segments. Upgrade to add more."* The run created two segments, so a third segment already existed in the account before it. The pricing page and the docs list no segment limit. The API's error is the only source.

**The cast.** Seed 20260916. Hexagram 5, Patience (Water over Heaven), line 5 changing, relating to Hexagram 11, Harmony (Earth over Heaven). The value turn offered: Cultivate Patience → Balance & Prosperity. Line 5 in the traditional text: *waiting at meat and drink; perseverance brings good fortune*, an interval of rest inside the danger. One high line: the ruling's premise holds, and the fix is in execution. Hexagram 11's *"small investments yield big returns"* was argued in the open, below, before it was read as the small code change.

### Round 1

| Face | Says |
|---|---|
| 🧙 SHAMAN | The promise survives this, and its container needs replacing. Falsifiable: a fix that sends a reader mail beyond their page's promise fails, whatever it saves. |
| ⚔️ CHALLENGER | The plan drew a line at three. The avoided move is dropping the character-sheet segment. The cron reads Postgres, so that segment only ever worked as a warning label. Removing it makes "nothing else" structural, since a contact in no segment cannot be picked for a Broadcast. Paying $40 a month to keep 151 contacts in named buckets reads "small investment" backwards. |
| 🏛️ REGENT | Segments are scarce: every future list would spend one. Topics cost no slot. Commit to one segment for everyone promised updates, with one topic per promise. Hexagram 11's order and routine points the same way. Deleting a segment may delete its contacts. Since no one has unsubscribed yet, the only risk is losing contacts, which Postgres can recreate. |
| 🏗️ ARCHITECT | A Broadcast needs a segment, and Resend lets it scope to one topic. An opt-out-default topic reaches only contacts who opted in. So the build is one segment, **mailing list**, plus three topics that signup opts a reader into: succession, nonprofit founding circle, introductions. Resend's hosted preferences page then lets a reader leave one list and keep another. |
| 🌿 DIPLOMAT | 47 people promised a letter when the circle meets sit outside every list. 33 of the 37 succession signups were already contacts from the character-sheet pass, which suggests the same people or test rows. One character-sheet row failed silently. The script must print every failure's reason. |
| 🧠 SAGE | The question as posed, how to fit four segments in three, is the wrong one. For this list a segment does nothing a topic cannot. Leave the third segment alone until someone knows whose it is. Nothing is due until 2026-11-10, and the reminder uses no segment, so line 5's pause is real. Build it properly. |

**Split after round 1.** Challenger's first move, three segments without the character-sheet one, needs the pre-existing slot. Sage forbids deleting a segment nobody here made.

### Round 2

Challenger accepts topics for three reasons: the plan stays free, a segment slot stays open for a future list, "nothing else" becomes structural. Regent's cap question stays open, because the topic limit is unpublished. If a limit exists, the first run will report it the same loud way, and nothing sends by mistake. No face dissents.

### Ruling · the faces', ratified by Wendell

1. **Stay on the free plan.**
2. **One segment, `mailing list`,** holds everyone promised updates. Each promise gets an opt-out-default topic: `succession`, `nonprofit founding circle`, `introductions`. Signup opts the contact into its topic. A Broadcast goes to the segment, scoped to one topic.
3. **Character-sheet readers stay contacts in no segment and no topic.** No Broadcast can reach them. The quarterly cron is unchanged.
4. **Remove the two segments the first run created.** Leave the pre-existing segment alone until its owner is known.
5. **Rerun the backfill after the change.** The script is idempotent, and each failure now prints its reason.

**Cost:** $0. The code changes in the list client, the contract, the script, the tests and the docs. There are two segment deletions in Resend. The topic limit is unverified until the first run.

**Ratified:** 2026-09-15 — "build this" (Wendell)

**Built with one narrowing:** item 4 removes a first-run segment only when its name and its
creation date both match that run. A segment named `succession` could predate it, and a
segment nobody here made stays where it is.
