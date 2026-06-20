# Research: Personality / Archetype Typology Quiz Construction

> Deep-research synthesis (deep-research harness, 5 parallel search angles,
> 2026-06-20) supporting the **Superpower Quiz Design** spec. Scope: a
> deterministic, offline-capable quiz that assigns one of **7 superpowers**
> (Connector · Strategist · Disruptor · Storyteller · Alchemist · Escape Artist ·
> Coach) for a values-driven, anti-extractive allyship/mutual-aid audience.

## TL;DR — what the evidence says to build

1. **Score continuously, label discretely.** Keep an internal continuous score per
   superpower; only resolve to a "type" at the end. Type *labels* are far less
   stable on retest than the underlying scores — the instability is a **binning
   artifact**, not bad items. → report **primary + secondary** with a visible
   margin, never a lone hard label.
2. **Forced-choice, behavioral, quasi-ipsative.** Use situational "what would you
   do" items with options that are **not equally desirable**, each weighting one or
   more superpowers. This reduces acquiescence/social-desirability bias and breaks
   single-axis dominance. Pure ipsative is fine *only* because we assign by
   within-person max — but it inflates ties and cripples later statistical
   validation, so keep options quasi-ipsative and normalize by item count.
3. **Enough items, but honest about the UX tension.** Psychometrics wants ≥3–4
   items of signal **per** superpower (≈21–28 signals); UX wants ≤~10 questions /
   2–3 min before drop-off. Resolve by making each forced-choice **option carry
   weight for multiple superpowers**, so ~10–14 questions yield ≥3–4 signals each.
4. **Refuse the Barnum levers.** Differentiated, **behavioral** descriptions (some
   takers should *reject* a wrong type), **include each type's real shadow** (don't
   equalize favorability), no two-sided hedges, no authority cosplay ("our AI
   divined your soul"), no faux-personalization. Frame results as a **time-bound
   lens, taker is final authority**, disclose the mechanism, never label/limit/gate.
5. **Dignified UX, zero dark patterns.** ~10 questions, mobile-first, **no email
   gate before results**, no confirmshaming, symmetric opt-in/out, accessible
   labels + keyboard + focus management, narrative (heist) framing for intrinsic
   motivation.

> **Ethos alignment:** the manipulation levers the literature flags (flattery,
> authority, faux-personalization, hard binning) are precisely the extractive
> patterns this community rejects. Psychometric rigor and the project's
> "energy is fuel, not judgment / serves development, not exploitation" ethic point
> the **same** direction here.

---

## 1. Item / question design

- **Likert/normative compares people; ipsative (forced-choice) only ranks within a
  person.** Since we assign by each person's *highest* superpower, ipsative ranking
  fits — but raw ipsative scores can't compare takers and bias any later
  validation. [1][2]
- **Pure ipsative distorts reliability/factor structure/validity** (inter-scale
  covariances forced to sum to zero). Avoid pure ipsative if we ever validate
  statistically. [2][3]
- **Quasi-ipsative forced-choice has the best criterion validity** (Salgado 2015
  meta-analysis): pair options of *unequal* desirability rather than perfectly
  balanced pairs. [4]
- **Forced-choice reduces faking/social-desirability bias** (matters less for a
  low-stakes self-discovery quiz, but still curbs "endorse everything"). [3][5]
- **Likert/normative has higher test–retest stability** → better chance of the
  *same* superpower twice (credibility). Trade-off vs. forced-choice. [5]
- **Situational/behavioral items (SJTs) fake less and show smaller subgroup
  bias** than trait self-description — but **measure partly "knowledge of effective
  behavior," not the trait alone**, so use them as the spine, not the sole signal. [7][8]
- **≥3–4 items of signal per type; <3 is "weak and unstable."** For 7 superpowers
  that's ~21–28 signals (achievable with fewer *questions* if options weight
  multiple types). [9][10]
- **Reliability rises with item count (Spearman-Brown).** Target per-type
  α ≈ 0.70–0.90. [10]
- **Balance signal across the 7** (or normalize by item count) so a superpower
  doesn't "win" merely from having more items. [11]
- **Over-generate the item pool 3–4× and trim** (Clark & Watson / DeVellis). [13]
- **One idea per item; avoid double-barreled / near-universal items**; manage
  acquiescence carefully (naive reverse-wording can *lower* reliability). [14][15]

## 2. Scoring & type assignment (deterministic, offline)

- **Additive per-type totals, then normalize percent-of-max** (since per-type item
  counts differ); rank **all 7** internally. [1][12-score]
- **Require a margin** (top − second ≥ threshold, e.g. ~10% of scale or "3–4 pts")
  before declaring a confident primary; below it, present a near-tie. [2-score][3-score]
- **Surface primary + secondary** (secondary as a "wing", not co-equal). [3-score]
- **Near-tie → don't silently pick;** present both, optionally a deterministic
  pairwise disambiguation item. [4-score]
- **Exact ties → fixed ordered tie-break chain, never random** (reproducible). [5-score]
- **Expose strength/margin** (percentage/band), not just the label (16Personalities
  pattern). [6-score]
- **Keep a continuous internal score even though output is a type** (avoids brittle
  cliffs; makes ties measurable). [7-score]
- **Default fixed-length** for deterministic, explainable, offline scoring; adaptive
  needs a calibrated bank + IRT. If branching is wanted, use **deterministic
  rule-based early-stop** (terminate when a lead exceeds max remaining points). [13-score][15-score]
- **More types stabilizes ipsative ranking** — 7 is better than 3 here. [11-score]

## 3. Validity & reliability of type instruments (and mitigations)

- **Type dichotomies aren't bimodal** — scores are unimodal continua; the boundary
  is an arbitrary cut. [v1]
- **~39–76% get a different MBTI type on retest within weeks** — the binning
  artifact, since underlying continuous scores are reliable (r ≈ .81–.86). [v2][v3]
- **Dimensional (Big Five) measures are far more temporally stable** (r ≈ .80–.90
  over years) → design argument for spectra over bins. [v5]
- **Taxometric reviews find structure is predominantly dimensional, not
  categorical** → "types" are descriptive shorthands for regions of continua. [v6][v7][v8]
- **Enneagram's 9-type structure isn't replicated in factor analyses; wings/movement
  unsupported.** [v9]
- **CliftonStrengths**: acceptable retest (~.73/6mo) but several themes have weak
  internal consistency (α as low as .42) → trust only the top few themes. [v10]
- **VIA**: positively-keyed-only items → response bias/ceiling; collapses to ~3–5
  factors not 24 → "types" not cleanly separable. [v11]
- **Mitigations:** report dimensional scores; avoid hard binning near midpoints;
  show position + confidence band; name types as shorthand for continua; consider
  some reverse-keyed/behavioral items; report (and don't over-interpret) low
  reliability. [v1][v3][v5][v6]

## 4. Barnum / Forer effect & ethical result copy

- **Forer (1948): identical generic profile rated 4.26/5** — high "that's so me!"
  is **not** validity; it's the failure mode to design against. [b1]
- **Flattery inflates acceptance** → don't make every type sound desirable
  (include shadows). [b2]
- **Authority cues inflate acceptance** → no "scientifically-validated AI
  determined…" cosplay (toxic for an anti-extractive audience). [b3]
- **Faux-personalization inflates acceptance** → be honest results are computed
  from a finite item set, not a bespoke soul-read. [b4]
- **Positive AI-generated framing specifically amplifies the bias** (2026 CHI,
  n=238: +36% validity, +42% personalized for upbeat *fictitious* predictions) →
  the precise extraction risk to avoid if AI ever flavors copy. [b5]
- **Two-sided hedges are Barnum bait** ("outgoing but also enjoy solitude") — avoid. [b6]
- **Make descriptions falsifiable** — some takers should reject a wrong type; A/B
  test by showing a *foreign* type's description (if it lands equally, it's
  vacuous). [b7]
- **Frame as a snapshot/lens at a moment, not a verdict/fixed identity.** [b8]
- **Taker is the final authority** — invite disagreement ("Does this fit? try the
  adjacent one"). [b9]
- **Never label/limit/evaluate/gate** the person with the result. [b10]
- **Disclose the mechanism and its limits up front.** [b11]
- **Anchor specificity in behavior/context, not adjectives** ("under deadline you
  tend to X"). [b12]
- **Beware culturally-narrow "universal" descriptions** — write/test for the actual
  audience. [b13]
- **For an anti-extractive audience, treat flattery/authority/faux-personalization
  as a red line**, not a growth tactic; make refusal-to-manipulate visible. [b14]

## 5. Engagement UX without dark patterns

- **~5–10 questions, 2–3 min; aim >80% completion.** [u1]
- **Drop-off climbs past ~7–8 min.** [u2]
- **Perceived length > question count** — vary item types, use imagery. [u3]
- **Progress bars are not a guaranteed win** — help only when the task is genuinely
  short and matches expectations; if used, prefer **fast-to-slow** pacing. [u4][u5]
- **Never gate results behind a forced email/signup** (textbook dark pattern) —
  show results first, then *offer* (not require) capture. [u6]
- **No confirmshaming** on opt-outs. [u7]
- **Affirmative opt-in checkboxes**, no double-negatives. [u8]
- **Symmetric opt-in/opt-out** (anti "roach motel"; increasingly illegal). [u9]
- **Narrative/intrinsic framing > points-and-pressure**; cast the taker as
  protagonist (fits the Wendell heist voice). [u10][u11]
- **Mobile-first** (~60% of quiz traffic). [u12]
- **Accessibility:** explicit programmatic `<label>` (not placeholder), DOM/tab
  order = visual order, full keyboard operability (WCAG 2.1.1), specific error
  messages with focus management; test with real screen readers. [u13][u14][u15]

## Contested / verify-before-citing
- "96% complete a well-designed quiz" — marketing figure, not a verified benchmark. [u]
- Progress-indicator benefit is genuinely mixed in peer-reviewed work — **A/B
  test**, don't assume. [u4][u5]
- Several primary PDFs/journals returned HTTP 403 to automated fetch; exact numbers
  (MBTI ~65% retest, Forer 4.26/5, α bands, CHI percentages) are from search
  extracts/abstracts — directionally reliable, confirm against full text before
  formal publication.

## Sources

**Item design:** [1] frontiersin.org/.../fpsyg.2019.02309 · [2] ncbi.nlm.nih.gov/pmc/articles/PMC10621689 · [3] iresearchnet (normative vs ipsative) · [4] Wiley joop.12098 (Salgado 2015) · [5] talentclick; bryq · [7][8] PLOS One pone.0211884 (SJTs) · [9] Springer s41155-018-0111-2 · [10] ScienceDirect S0895435617302494; PMC2927808; statisticshowto (Spearman-Brown) · [11] frontiersin.org/.../fpubh.2018.00149 · [13] frontiersin.org/.../fpsyg.2024.1494261; Clark & Watson 1995 · [14] PMC11486723; ResearchGate 343170016 · [15] (as 13/11)

**Scoring:** [1-score] simplypsychology.org/the-myers-briggs-type-indicator · [2-score] enneagraminstitute.com/interpreting-your-enneagram-test-results · [3-score][4-score] enneagramuserguide.com/enneagram-test(/type-wing) · [5-score] MBTI scoring (scribd 897620139) · [6-score] soultrace.app/.../16-personalities-test · [7-score] namu.wiki/16 Personalities · [8-score][11-score] en.wikipedia.org/wiki/CliftonStrengths; Gallup CSF 2.0 Technical Report · [13-score] nciea.org/blog/fixed-or-adaptive-tests · [15-score] frontiersin.org/.../fpsyg.2020.574760

**Validity:** [v1] Wiley spc3.12434 (Pittenger; Stein & Swan) · [v2] earlyyears.tv/mbti-test-accuracy · [v3][v5] myersbriggs.org/research-and-library/validity-reliability · [v6] Cambridge Psych Med taxometric review · [v7][v8] PMC10028270 · [v9] cogn-iq.org/blog/enneagram-validity · [v10] Villanova CliftonStrengths technical report · [v11] Springer s40359-025-03141-w (VIA critique) · swanpsych.com SteinSwanMBTITheory_2019

**Barnum/ethics:** [b1][b4][b6] en.wikipedia.org/wiki/Barnum_effect · [b2][b3][b12] vaia.com/.../forer-effect · [b5] dl.acm.org/doi/10.1145/3772318.3791851 (CHI 2026) · [b7] sagepub 10.2466/pr0.1985.57.2.367 (Dickson & Kelly) · [b8] atopcareer.com; prevuehr.com · [b9][b10] myersbriggs.org ethics · [b11] criteriacorp.com · [b13] endominance.com · [b14] theblackandwhite.net · sagepub 10.2466/pr0.2002.90.2.539 (Barnum popularity); PMC7043268 (external validation)

**UX:** [u1][u12] dragnsurvey.com · [u2] surveymonkey.com/curiosity/survey_completion_times · [u3] growthlens.io · [u4] sciencedirect S095354381000024X; soundrocket.com · [u5] researchgate 223956365 · [u6][u8] netsolutions.com (dark patterns) · [u7] captaincompliance.com · [u9] allaboutcookies.org; arxiv 2309.17145 · [u10] medium.com (meaningful gamification); [u11] upskillist.com · [u13] beaccessible.com; tabnav.com · [u14] uxpin.com (WCAG 2.1.1) · [u15] responsly.com
