# The concrete-referent rule

Every line a player reads names the thing it is about. Before a line ships, ask of it: **what, specifically?** If the
answer is not a word in the line, rewrite the line until it is, or cut it.

Wendell, 2026-11-17, on board row `sc-crops-copy-look-1`:

> "what was stuck moves" weak and confusing. What was stuck? why does it moving matter? IT means something. What does
> it mean? Why does it meaning something matter. This was the ultimate problme with teh dangling and is that we woudl
> dangle nonsense at the end to pad the wordcount. None fo these add anything and just tkaing away teh and doesn't
> solve the problem, and you can't seem to even see the problem.

The dangling "and" was a symptom. The fault is a line that gestures at meaning ("it means something", "what was stuck
moves", "you can see the whole") and names nothing. Splitting it into short sentences keeps the emptiness. This rule
covers every player-facing surface: the gate walk, the sect intros, the coaching walk, cards, harvests.

## The four questions, asked of each line

1. **What, specifically?** Name the object, person, act or moment. "What was stuck" becomes "the call you kept putting
   off".
2. **What changed?** Say what is different after: "the box shipped", "the frost melts off the seedling's leaves".
3. **What can the player now do or have?** A line that ends on a feeling ends on nothing; end on the act or the thing.
4. **Why does it matter to them?** Answer with their own goal in this walk (supporting him, their own dream), never a
   general truth.

A line that cannot answer question 1 is cut. Padding is the usual source: the last clause of a sentence written to
round it off.

## Worked examples (the crop packet, 2026-11-17)

| Old line | What, specifically? | New line |
|---|---|---|
| You use your power cleanly. A boundary is honoured. What was stuck moves. | nothing named | You push on the thing that blocked you until it gives. You can point to what changed because you pushed: the call made, the box shipped, the no said out loud. |
| You are close to what you care about. It means something. | nothing named | You remember someone who showed up for you once. Now you do the same for someone else: a call, a meal, an hour of your time. |
| Something stands in the bed. Tap the one that is there for you. | "something", "the one" | Five things trouble this bed. Tap the one most like what stops you from doing this. |
| The shadow lifts. The light comes back. | light on what? | The crow flies off. Sun reaches the seedling again. |
| Work with him on the thing that fits you best. | which thing? | Book a coaching session with him on the thing you are stuck on. Pay what feels right. |

Ground a line in his source before inventing one: the feelings' jobs in `src/lib/coaching/coaching-map.ts` (anger's job
is "to find obstacles to be overcome, or boundaries to be created or destroyed"), the six unpacking questions, his
backstory in `src/lib/founder-gate/content.ts` STORY, and the Emotional Alchemy channel table.

## The tools

- `python3 scripts/copy-scan.py --ask <file>` lists every sentence with "what, specifically? ___". Answer each one in
  the look row or the PR beside the line. This is the reader pass; it is the check that can see vagueness.
- `python3 scripts/copy-scan.py` flags the gestures a pattern can catch (vague subjects such as "It means", "What was
  stuck moves", "Something stands"; stock phrases such as "the shape of", "feels alive"; a feeling with nothing it is
  about, such as "You feel settled."). It fails `scripts/local/check.sh`. Passing it does not make a line concrete: only
  the answer to question 1 does.
- A look row that changes copy shows his old line beside the new one, with the answer to "what, specifically?".
