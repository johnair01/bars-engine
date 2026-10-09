## The cast
Hexagram 49 Molting (lines 1 and 6 changing) becoming 33 Retreat. A new skin is soft, so I weigh the trial's early result as untrusted until it survives a second look. Retreat means any advice to withdraw from Jev has to be orderly and specific, not a rout.

## Wake Up
- The pass rule is "beats the baseline" and "misses fewer constructed mismatches". Neither names the real problem, which is the face reading mismatched pairs cold. The spec never measures reading time saved or mismatches the face still reads cold.
- The Noul docs say the primitive is for yes/no questions and "does not measure the degree" [1]. "Does the quote support the claim" is partly a degree question.
- The citation-check cookbook uses a three-way Choice (supports, contradicts, says_nothing) after an exact string match [2]. The spec drops Choice and keeps only yes/no.
- The docs I opened do not state latency, cost, input limits or accuracy [1]. llms.txt shows a Legal page and an API page that I could not confirm cover limits [4]. I did not open them.

## Open Up
Possible moves: add a Choice arm; add a fuzzy-match baseline; blind Wendell's labels; hold out a test split; use only real mismatches as the pass test; time the face's reading; have a second labeller; open the Legal page for data terms.

## Clean Up
- **Constructed mismatches are too easy.** A quote swapped within the same report is lexically distant, so the baseline's shared-key-terms check will catch most of them. Beating the baseline on them shows little.
- **The real failure is harder.** The board record says real papers were linked to the wrong claims. Those quotes are on-topic and verbatim. That kind of mismatch is probably only in set 1, which has four cases and two mismatches. Ten constructed pairs can pass the trial while that failure stays unsolved. This is my inference, not something the docs say.
- **Set 2 may be tiny and one-sided.** The window is passes 5 and 6 plus one test. Most real pairs are probably matches, so the labelled set may hold few true mismatches.
- **The threshold is tuned on the data it is scored on.** Wendell sets the threshold and the pass mark while labelling the same sample. Confidence guidance says to "test with your own data, and adjust" [3], which invites that overfit.
- **Jev sees less than the baseline.** Input is only `{claim, quote}`, so Jev cannot tell whether the quote is real on the page. The baseline sees the page. The comparison is unequal.
- **The cookbook's string check is brittle.** It marks truncated or lightly reworded quotes as fabricated [2]. FR3 and FR4 inherit that, so correct paraphrased quotes could be labelled "no, by: source".

## Grow Up
Read the Legal page for data terms. Measure how many of the face's real missed mismatches the baseline already catches. Read the cookbook's Choice example as the likely better design.

## Show Up
1. Make the pass test the real mismatches only, with constructed pairs reported separately.
2. Split the labelled set. Fix the threshold on one half and score the other.
3. Add a Choice arm (supports, contradicts, says_nothing) alongside the Noul, per [2].
4. Count the true mismatches in the set before spending any money. If there are too few, widen the window.
5. Record the face's reading time per pair, since "saves reading" is the stated aim.

## For the Player
This protects Wendell from paying for a trial that passes on easy cases. It makes the later result worth trusting when he sees the table.

## Your questions
1. How many true mismatches exist in the reports on record, beyond the two known cases?
2. Does the Legal page restrict sending report text to TypeSafe?

## Where you would overreach
I would keep auditing the labels and the trial's standing until nothing could pass, so stop me once the five moves are done.

## Sources
1. https://docs.typesafe.ai/primitives/noul.md — "If the question is really about degree, the value does not measure the degree."
2. https://docs.typesafe.ai/cookbooks/citation_check.md — "a quote that is truncated or lightly reworded comes back as `fabricated`."
3. https://docs.typesafe.ai/confidence.md — "Start with conservative thresholds, test with your own data, and adjust as you observe results."
4. https://docs.typesafe.ai/llms.txt — lists a Legal page (https://docs.typesafe.ai/legal.md) and an API page, which I did not open.

The `dm-quote-the-source` board record is unlinked: I did not open it.
