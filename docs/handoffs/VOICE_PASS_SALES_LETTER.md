# Voice pass — `/mastering-allyship`, the long sales letter

**Status: proposed, not applied.** Every other customer-facing surface on the site is
at zero hard findings. This page is the one left, and it is left deliberately.

Two reasons, and the second is the real one:

1. The site handoff says so: *"Nothing here is a reason to rewrite a page that is
   converting; it is a list to work through the next time each surface is touched."*
2. `house-voice/SKILL.md` says so: *"Show the before/after for any edit to copy that
   already shipped. A counter finds candidates; only a person approves them."*

So this is the before/after. Approve the ones you want, and they go in as one commit.

Run the board yourself with:

```bash
python3 tools/voice_lint.py src/app/mastering-allyship/page.tsx -v
```

---

## Do not touch — three groups the counter cannot tell apart from a defect

**Testimonials (L389 and the rest of that array).** These are quotes from real people.
`This part just loves to make me feel guilty` is what somebody said. Editing a
testimonial to satisfy a linter is fabrication, and it fails the Disappearance Test in
the worst available way.

**Parts-work vocabulary (L347, L389).** `the parts of you still loyal to the old rules`
is the technical term, not a placeholder noun. The whole 1:1 offer and the testimonial
that follows it run on the same vocabulary. `src/lib/launch/offers.ts:264` carries the
identical phrase and is excluded for the identical reason.

**Your own history (L282, L288, L291).** `a small room, and a lot of uncomfortable
questions` is a literal space you were literally in. The ban is on the placeholder
sense of the word. This is not that.

Same exception applies to Appendix B's campaign name in
`src/lib/campaigns/twenty-one-day.ts` — the module says so at the top.

---

## Proposed, in page order

| L | Before | After |
|---|---|---|
| 164 | So you did the responsible **things**. | So you did the responsible ones. |
| 174 | Here's the **thing** nobody in that whole lineup will say to you. | Here is what nobody in that lineup will say to you. |
| 198 | a specific **thing** to do on Thursday | a specific move to make on Thursday |
| 201 | And here's the **part** that's harder to say. | Harder to say, so I will say it. |
| 201 | On some level, **quietly**, everyone at that table needs you to still be struggling | Nobody at that table would put it this way, and everyone at it needs you to still be struggling |
| 204 | the **room** agreeing with you is not the same as the **room** helping you | the people agreeing with you are not the people helping you |
| 222 | unseeing it was the only **thing** keeping you in your seat | unseeing it was the only reason you stayed in your seat |
| 225 | your care — the realest **thing** about you | your care, which is the truest fact about you |
| 313 | Three **things**, built to work as one. | Three, built to work as one. |
| 380 | Then there's the **part** I didn't design and can't fully explain. | Then there is what I did not design and cannot fully explain. |
| 380 | **things** start to move | the situation starts to move |
| 380 | End the relationship that was **quietly** costing them everything. | End the relationship that had been costing them everything without ever naming a price. |
| 380 | The **things** blocking a life that actually fits start falling away. | Whatever was blocking a life that actually fits starts falling away. |
| 411 | Not ready to buy a **thing** from a man promising fun. | Not ready to buy anything from a man promising fun. |
| 419 | the private belief **quietly** running your allyship | the private belief running your allyship out of sight |
| 441 | One honest **thing** before you decide | One honest note before you decide |
| 444 | This tends to change **things**. | This tends to change what you do next. |

**L250** — `This is the part of the movie where someone waves a set wall` — flagged by
the counter, and I would leave it. `the part of the movie` names a real referent (a
scene), the idiom is doing work, and the sentence is one of the better ones on the page.

---

## What the numbers say after

The soft counters on this page are already fine — `waste` at 2.50 is the only one over,
and `reference.md` is explicit that marketing copy runs hotter there than book prose
because a landing page points at things. Nothing above is aimed at a soft number. Every
row is a hard finding.

Applying all seventeen takes the page from **49 hard findings to 6**, and the remaining
six are the three do-not-touch groups.

---

## The check that is actually the check

From `reference.md` §5: *"did I run the linter"* is the mechanism. *"does this sentence
say something true that a person can act on"* is the result.

Read the seventeen out loud before approving them. If one sounds like copy, it is wrong
even though the counter went green.
