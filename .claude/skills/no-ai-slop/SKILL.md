---
name: no-ai-slop
description: Load before writing or revising any human-facing text in this repo — page copy, receipts, button labels, error messages, marketing, docs. Strips default LLM phrasing, above all the "not X, but Y" negation pairing. Run scan.py over the diff before calling copy done.
---

# No AI Slop

The house prose rule, inherited from the book. It applies to the website, because
a reader who meets the book's voice on the page and a generic one on the site has
met two different products.

**Canonical copy lives at `~/.claude/skills/no-ai-slop/`**, which loads in every
project. This is the bars-engine mirror so a fresh clone carries the rule too —
edit the user-level one first, then mirror here. The rule was first written for
the book in `The Library/.claude/skills/llm-writing/SKILL.md`.

## The rule that keeps breaking

> Pairing clauses where one half already carries the meaning ("It's not X, it's
> Y"). **Keep the half that carries it.**

This is the single most common failure in generated copy for this repo. It arrives
in a dozen costumes:

| Shape | Example | Fix |
|---|---|---|
| `X, not Y` | "a practice, not a test" | "a practice" |
| `X, never Y` | "an invitation, never a verdict" | "an invitation" |
| `Not X. Y.` | "Not a performance of courage. A rep you can finish." | "A rep you can finish." |
| `Not X, and not Z. Y.` | "Not confidence, and not proof. One rep." | "One rep." |
| `X — not Y` | "real information — not a failing" | "real information" |
| `X rather than Y` | "a Day 1 question rather than a Day 4 one" | "a Day 1 question" |
| `It is not X, it is Y` | "This is not a score, it is a container." | "This is a container." |

### Why it is worth this much attention

The construction feels precise and is usually the opposite. It defines a thing by
what it is not, which leaves the reader holding the wrong idea you just named.
"A card is an invitation, never a verdict" plants *verdict*. One clause of real
description does more work and reads like a person wrote it.

It also compounds. Three of these in a screen and the prose develops a tic the
reader can hear, and every sentence starts to sound like a defensive disclaimer.

### Rewrite it. Do not talk yourself into keeping it.

The standing instruction from Wendell:

> If it can be rewritten it should be. If I determine a negation should be in
> there to sound natural I'll add it myself.

So there is no "this one earns its place" judgement to make. Write the
affirmative and move on. He adds a negation back where one reads better — that
call is his, and it is a cheap edit for him and an expensive habit for you.

This applies to plain negations too, not only the paired kind. "This text is
never sent to us" becomes "This text stays in your browser". "Day 1 does not"
becomes "Day 1 starts with what you notice". The affirmative is almost always
shorter and tells the reader something true instead of ruling something out.

**The only strings to leave alone are the ones the reader owns:**

- The book's six canonical reservations — "I'm not ready", "I'm not worthy".
  These are quoted inner speech and changing them breaks canon.
- Picker options a reader selects as their own answer — "this is not my ask",
  "I am not sure yet", "not sure / skip", "they're not up for it".

Everything else gets rewritten, including copy that has already shipped.

If a rewrite genuinely comes out worse, say so in your summary and leave the
original — but say it out loud rather than silently keeping the negation.

## The rest of the house rules

Same source, same weight:

- Writing to fill a section because it exists. Delete it or merge it.
- Labeling a concept without explaining how it works. Explain the mechanism or cut the label.
- Stating conclusions without evidence. Show it or drop the claim.
- Hiding uncertainty behind confident language. Say what you don't know.
- Softening every claim ("it's worth noting", "it's important to consider"). Say it or don't.
- Repeating yourself in different words, or summarizing the body as a conclusion.
- Transition words standing in for meaning ("Moreover", "Furthermore", "Additionally").
- Writing for the person who commissioned the page instead of the person reading it.

## Words and shapes this repo does not use

- "delve", "tapestry", "testament to", "navigate the landscape", "in today's world"
- "unlock", "unleash", "elevate", "supercharge", "seamless", "robust", "leverage" (verb)
- Em-dash pairs doing the work a comma or a full stop should do
- Rule-of-three lists where two items are real and the third is filler
- Starting a reply or a paragraph with "Ah," or "Great question"

## Workflow

1. Load this skill **before** drafting, not after.
2. Draft.
3. Run the scanner over what you changed:

```bash
python3 .claude/skills/no-ai-slop/scan.py $(git diff --name-only)
```

4. Fix every hit or justify it against "When a negation earns its place" above.
   The scanner over-reports on purpose — it is a prompt to look, not a linter to
   satisfy.
5. Re-read the copy aloud. The tic is audible before it is visible.

## Where the copy lives

Course-day copy is deliberately isolated in pure modules so it can be read as
prose without the JSX around it:

- `src/lib/{wake,open,clean,grow,show}-up/check-content.ts`
- `src/components/mtgoa-check/CheckKit.tsx` — shared shell labels
- `src/components/{move}/{Move}Check.tsx` — the screens

Read the `check-content.ts` files top to bottom as a document. Most tics are
visible that way and invisible line by line.
