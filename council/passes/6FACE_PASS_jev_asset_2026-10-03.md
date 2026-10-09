# Six-face pass: Jev in the asset pipeline, and the numbers for its first trial

**Date:** 2026-10-03. **Called by:** Wendell. **Question, in his words:** "I also would need the game masters to weigh in on 7", where 7 is the brief's last question: what pass mark and sample size count as success for trial 1.

**Copy used:** the repo's `council/faces.yaml`, synced today. **Board read:** 2026-10-03 after the Jev rows went up (version 65). **Daemons:** none sent. **Casts:** `council/iching/cast.py`, one per face.

## Anchor and rulings

The scope brief (`.specify/specs/jev-asset-pipeline-scope/BRIEF_2026-10-03.md`) is the input. Wendell answered its questions in chat on 2026-10-03:

- **Scope:** "Just admin art. This is for the people who will be cocreating the game world."
- **Card art:** "Card art is not. That can more or less be signaled for deprecation." Lore: "Lore stands but we want to make sure it's aligned with what's going on with the sprout game".
- **Licensing:** "Licensing isn't a live concern right now".
- **Sprite backend:** "I don't have an answer to number 4 we are still is early research and development on sprite creation so most things made before August should probably be marked to be thrown out as well but the research should be kept".
- **Images:** "I don't know if Jev accepts images. Let's add that to the backlog to find out".
- **Numbers:** the game masters weigh in on question 7.

These rulings change the trial list. Trial 2 (prompt completeness of the 40 card-art prompts) targets deprecated assets, so it is retired. Trial 3 (provenance notes) waits on licensing, which is not live. Trial 1 (asset docs against code) stays, and a new candidate appears: checking lore against Sprout's world as flags for a reader. Lore is canonical prose, so Jev could only raise a candidate and a person judges it.

Two of trial 1's five known drifts concern sprites, one of them the `playbook_*` against `archetype_*` naming, and sprites made before August are to be marked for discard. How many of the five stay live depends on which sprite items are discarded, so the known positives number between two and five.

## The faces

**Shaman, Hexagram 3 (Sprouting), lines 2, 3 and 5 changing to 11 (Mingling).** The card says this is early and you are reading the mess as a verdict. The Shaman applies it to Wendell's own words about the sprite work: early research, with the old work set down and the research kept. A pass mark chosen now would harden a mess into a standard. The people who will cocreate this world will meet whatever the trial teaches, so the felt sense is that the numbers should be small and the first run should teach, and should not rule on anyone's work. The Shaman recommends a descriptive first run.

**Architect, Hexagram 44 (Serendipity), lines 3 and 5 changing to 64 (Almost).** The card says you are building on one piece of evidence. The evidence is five known drifts found by one reader in one afternoon, and they are all positives. With only positives, no pass mark can distinguish a good flagger from one that flags everything. The Architect says the first requirement is negatives: statements in the docs that agree with the code, labelled by a person. Sample size therefore means the number of agreeing statements, not drifts. The Architect recommends a mark on two numbers together, recall on the known drifts and the share of flags a reader clears as noise.

**Challenger, Hexagram 32 (Endurance), no changing lines.** The card says this exact exchange has happened before, and it has: the quote-to-claim trial left its numbers open, and a rate set after seeing results is a rate fitted to results. The flat claim is that any number set after the first run is chosen by what the run produced. The Challenger recommends fixing the mark before the run, and a smaller one that can fail over a larger one that cannot. It dissents from the Shaman's descriptive-first option on exactly that ground. Its falsification test is whether Jev beats a constant-extraction script on the numeric drifts, since two of the five drifts are plain numbers a script catches.

**Regent, Hexagram 4 (Fog), line 4 changing to 64 (Almost).** The card says you are guessing where you could ask. The Regent notes that both numbers are Wendell's under the Numbers rule, "no number inferred on Wendell's behalf", and that the repo holds no asset number to cite. The Regent lists the obligations around the trial: it touches only non-personal admin art and docs, a Jev flag never closes anything, every call has a fallback, and the lore check sits under the reserved list because lore is canonical prose. The council therefore offers shapes and consequences, and the values are his.

**Diplomat, Hexagram 49 (Molting), lines 2 and 6 changing to 1 (Unbroken).** The card says a skin is coming off you and the new one is soft. The Diplomat asks what the cocreators will accept. The people who will build the world should see the same mark Wendell set, written in plain language, and a flag from the trial should read as a question to them. The Diplomat dissents on scale: a sample large enough to take a week to label would stall the cocreators, so the smallest set that can fail is the kind one.

**Sage, Hexagram 48 (The Well), no changing lines.** The card says what you want is there and your reach is broken. The Sage's synthesis: the Architect supplies the shape (positives and negatives, two numbers), the Challenger supplies the timing (fix before the run), the Shaman supplies the spirit (the first run is early work), the Regent supplies the limits (the numbers are Wendell's, the trial is non-personal), and the Diplomat supplies the size (small enough to label in an evening). Nobody's contribution is dropped. The conflict that remains is the Shaman's descriptive first run against the Challenger's mark fixed before the run. The Sage resolves it as a two-step run, and Wendell decides: a small calibration run on a handful of statements teaches what a flag looks like, and the mark is fixed before the scored run on a separate set.

## Verdicts

| Face | Verdict |
|---|---|
| Shaman | Small numbers; a first run that teaches before it rules. |
| Architect | Needs negatives; judge on recall and the cleared-as-noise share together. |
| Challenger | Fix the mark before the scored run; beat the constant-extraction script. Dissents from a descriptive-only first run. |
| Regent | The numbers are his; the trial stays non-personal and flags never close anything. |
| Diplomat | Smallest set that can fail; flags read as questions to cocreators. Dissents on scale. |
| Sage | Calibration run, then mark fixed, then scored run. Wendell decides. |

**Dissent check:** not unanimous. The Challenger and the Shaman split on a descriptive-only first run, and the Diplomat dissents on scale.

## Positions (resolved without Wendell)

1. **Jev's asset scope is admin art and the docs about it, for the people cocreating the world.** Cited: Wendell, 2026-10-03, "Just admin art."
2. **Card art is marked for deprecation, so trial 2 is retired.** Cited: Wendell, 2026-10-03, "That can more or less be signaled for deprecation."
3. **Lore stands, and a Sprout-alignment check on lore is a candidate trial that raises flags for a reader only.** Lore is canonical prose and so reserved. Cited: Wendell, 2026-10-03, "Lore stands but we want to make sure it's aligned with what's going on with the sprout game".
4. **Licensing is not live, so trial 3 waits and nothing is built for provenance now.** Cited: Wendell, 2026-10-03.
5. **Sprites made before August are marked for discard and the research is kept.** This pass marks records and docs and deletes no file. Cited: Wendell, 2026-10-03.
6. **Whether Jev accepts images goes on the backlog as a research item.** Cited: Wendell, 2026-10-03. Entry `JEVI` in `.specify/backlog/BACKLOG.md`.
7. **The trial's known positives are recounted after the discard marking, and the count is stated before any run.** Reason: two of the five concern sprites.
8. **The trial must beat a constant-extraction script on the numeric drifts to earn its place.** Reason: two drifts are plain numbers a script catches. Same bar as the quote-to-claim trial's baseline.

## Question for Wendell

**Q. What pass mark and sample size for the asset docs-versus-code trial?** Why only he can answer: both are numbers about his tolerance and his time, and the Numbers rule forbids inferring them. Why it was not asked before: the faces had not yet seen the rulings that shrink the known positives. His answer changes what gets built: it fixes the labelling work and the stopping rule.

| Option | Pass mark | Sample (agreeing statements he labels) | Consequence |
|---|---|---|---|
| A | Jev finds every known live drift and clears no fewer than the script does | Small: enough for an evening's labelling | Strict and quick to fail. A single miss ends the trial. Fits the Challenger and Diplomat. |
| B | Jev finds all but one known live drift and adds at least one the script missed | Medium | Allows one miss, and needs a person to confirm any extra flag. Fits the Architect. |
| C | No mark on the first run; a calibration run teaches, then he fixes the mark before the scored run on a separate set | Small for calibration, then medium | Slower and costs two runs. Fits the Shaman and the Sage, and meets the Challenger's rule that the mark is fixed before scoring. |

**Recommended by the Sage:** C, with sizes he names. The faces give no values for the sample sizes.

## Steps only Wendell can take

None are due. The images question is a backlog item and needs no step from him.

## Record block

- **Date:** 2026-10-03. **Question:** question 7 of the asset scope brief, and the rulings on questions 1 to 6.
- **Casts:** Shaman 3→11; Architect 44→64; Challenger 32; Regent 4→64; Diplomat 49→1; Sage 48.
- **Verdicts:** see the table. **Dissent:** yes, Challenger and Shaman on a descriptive first run; Diplomat on scale.
- **Rulings (Wendell, 2026-10-03), in his words:** "Just admin art. This is for the people who will be cocreating the game world." "Card art is not. That can more or less be signaled for deprecation. Lore stands but we want to make sure it's aligned with what's going on with the sprout game" "Licensing isn't a live concern right now" "most things made before August should probably be marked to be thrown out as well but the research should be kept" "I don't know if Jev accepts images. Let's add that to the backlog to find out".
- **Board rows to add:** positions `jev-asset-scope`, `jev-card-art-deprecated`, `jev-lore-candidate`, `jev-licensing-not-live`, `sprites-pre-august-discard`, `jev-images-backlog`, `jev-asset-recount`, `jev-asset-beat-script`; question `jev-asset-numbers` with options A, B and C.
- **Steers (Wendell, 2026-10-03):** on question 5, "Production doesn’t use it I don’t think but this was the goal and purpose of that early experiment with translation". On question 7, "I do think this has me leaning on c". Neither is a ruling on `jev-asset-numbers`; the question stays open until he picks and names the sizes.
- **Ruling on the question (Wendell, board, 2026-10-04):** option C, calibrate first. The mark is fixed in a dated file before a separate scored run. He gave no steer and no sample sizes, so both sizes are unset and are his numbers. Recorded in the home repo as `council/ledger/2026-10-04-board-read-asset-numbers-and-pass11.json`.
