# Core issue discovery and postgame reflection

**Status:** research and product test spec, September 17, 2026. The user confirmed 3-2-1 means the third-person → second-person → first-person shadow process already implemented in bars-engine.

## Research question

For a standard set of good-faith conflicts, what core issue do players discover, and what is the **minimum sufficient disclosure** that lets both understand it and choose a useful next action? More disclosure is not automatically better. A practical constraint may be the core issue; an old wound or unacknowledged fear may also emerge. Neither the game nor a facilitator should presume trauma beneath every disagreement.

The working model is: **surface event → interpretation → present stake → request or constraint → possible repair**. A historical echo is an optional layer that players may name if it actually matters. The core issue is the smallest explanation of the conflict that both players can recognize without denying the facts or either person's stake. It may be asymmetric: each person can be defending a different stake.

This is a study framework, not a diagnostic taxonomy. In a diary study, self-disclosure and perceived partner responsiveness both contributed to reported intimacy, and emotional disclosure mattered more than factual disclosure in one study. Another daily diary study of couples also found unique contributions from both partners' disclosures and partial mediation by perceived responsiveness. These findings support testing **disclosure plus response**, not simply counting confessions. [Laurenceau, Barrett & Pietromonaco, 1998](https://pubmed.ncbi.nlm.nih.gov/9599440/); [Laurenceau and colleagues, 2005](https://pubmed.ncbi.nlm.nih.gov/15982109/). A separate five-study series found that a listener's perception of a speaker's usual negativity changed responsiveness to otherwise comparable negative disclosures, so the same chip sequence may work differently across pairs. [Forest and colleagues, 2014](https://pubmed.ncbi.nlm.nih.gov/25437134/).

## Standard conflict deck

Each card gives facilitators a public event and **two private stakes**. The stakes are hypotheses for testing, never revelations that a player must discover. Before play, each simulated or consenting human player may replace the private stake with one that feels true. Record when the discovered issue differs from the card's hypothesis.

| ID | Public event | Plausible core issue A / B | Heat | Variable to test |
| --- | --- | --- | --- | --- |
| C1 | A shared plan changes without notice | Inclusion and predictability / freedom and spontaneity | 1–2 | One question may reveal the stakes |
| C2 | One person repeatedly handles a household task | Fairness and reliability / unseen work or limited capacity | 2–4 | Recurrent evidence and multiple stacks |
| C3 | The budget cannot cover both priorities | Security / autonomy, with a real resource limit | 3–4 | Understanding without a quick fix |
| C4 | A private detail was shared with someone else | Trust and consent / desire for support | 4–5 | Boundary repair, confidentiality |
| C5 | One person arrives late again | Respect and dependability / overload or different time norms | 2–4 | Pattern versus one event |
| C6 | A message goes unanswered | Reassurance / space and attention | 1–4 | Pursuit and withdrawal |
| C7 | Care work for a relative is divided unevenly | Duty and fairness / capacity and recognition | 3–4 | Present task plus older family roles |
| C8 | A friend cancels a commitment | Priority and trust / limits and honesty | 1–3 | Friendship transfer from couple research |
| C9 | Roommates disagree about noise | Rest and control of space / social connection and use of space | 1–3 | Indirect versus explicit requests |
| C10 | Feedback at work feels personal | Competence and respect / task quality, with unequal authority | 2–4 | Power can suppress honest meters |
| C11 | One person wants closeness during an argument; the other wants time alone | Reassurance / regulation and autonomy | 3–5 | Whether passing can become a real pause |
| C12 | An apology is offered but does not land | Accountability and changed behavior / desire to repair and move on | 2–4 | “Heard” versus “forgiven” versus “resolved” |

Use at least two versions of C1, C3, and C12: a **shallow** case where one clear request suffices, and a **layered** case where an additional meaning emerges. Do not tell players which version they have. This tests whether the game discovers rather than manufactures depth.

## Measuring the disclosure path

Mark the first occurrence of each milestone, with turn number and elapsed time:

1. **Event named:** both know what happened.
2. **First stake named:** at least one player states why it matters now.
3. **Interpretation checked:** a listener asks or paraphrases instead of assuming motive.
4. **Core issue candidate:** both can independently state the likely crux in their own words.
5. **Owner confirmation:** the person whose stake was described says the candidate fits, partly fits, or misses.
6. **Action or honest limit:** a concrete repair is chosen, or both can name the unresolved constraint without pretending resolution.
7. **Follow-through check:** at a later session, ask whether the chosen action occurred and whether the same conflict returned.

Count **spoken emotional bids**, **new disclosures** (information not previously known), **paid/free questions**, **paraphrases**, **stack layers**, **turns**, **heat rises and falls**, and **meter releases** before milestones 4–6. Record each player's private rating of whether the disclosure was voluntary and useful. The primary efficiency measure is the number of new disclosures to *owner-confirmed* core issue, with a separate count to an actionable repair. A run can succeed with zero newly disclosed personal history. A player may decline a question and still achieve understanding.

Record false positives: the listener announces a “root cause” the speaker does not endorse; a facilitator interprets every bid as trauma; the meter falls while the owner says the issue remains; or a player discloses more than intended to keep the game moving. No outside observer gets to overrule the owner's account of being heard. At follow-up, a repeated conflict may reveal that the first core-issue hypothesis was incomplete; preserve that revision rather than recoding the earlier run as dishonest.

## Additions to the player and game journeys

- **P3a, curiosity:** was a paid question answered with genuinely new information, clarification, or “nothing more”? The chip transfer alone is not a measure of insight.
- **P6a, core-issue check:** before lowering the private meter, the owner may optionally say what is different now. Speaking it is sufficient; no typed answer during live play.
- **P8a, postgame landing:** either player can leave the board with a named next action, a named unresolved constraint, or a voluntary pause. “Both meters zero” is one state, not the only useful ending.
- **P9, private reflection:** only after live play ends, each person may record what they learned. Reflection is optional and separate from chip movement.
- **P10, pattern review:** after several sessions, show recurring *user-chosen* tags and shifts in hypotheses, without claiming to infer a hidden diagnosis.

## Optional postgame reflection

Offer **Reflect on this game** after a mutually ended or resolved session, with **Skip** equally visible. The screen says that typing happens **after** play, so the live game remains spoken. Each person can record separately:

- The issue we started with; the issue I now think was central; whether that is a guess or something both confirmed.
- What I disclosed that changed understanding; what I heard from the other person that changed mine.
- What helped, what felt pressuring, and what I still do not understand.
- One agreed action, one open question, or “no action yet.”
- Optional pattern tags such as fairness, trust, autonomy, belonging, security, capacity, respect, and practical constraint. Users can create their own tags.

The user confirmed the [3-2-1 Shadow Process](https://integrallife.com/the-3-2-1-shadow-process/): **3** describe the charged person or pattern in third person; **2** address it in second person; **1** speak from it in first person. Put **Explore a deeper pattern with 3-2-1** behind the short insight capture as an optional private exercise. The product should never label the result a discovered trauma or require sharing it with the partner.

**Reuse in bars-engine:** `src/components/clean321/Clean321Flow.tsx` declares itself the canonical 3-2-1 and already persists a `Shadow321Session` through `completeClean321`. It runs as a bottom sheet from the NOW page. On completion it also creates a witness BAR, may put chosen tasks in the Hand, and mints game currency; the Understood handoff must explain that existing behavior. There is also an authenticated `/shadow/321` route with a longer `Shadow321Runner` and a `returnTo` parameter. Understood is currently a static, public Vite bundle, so neither React flow can simply be imported into its board. The likely integration is a small authenticated `/understood/reflect` Next.js route that mounts the canonical flow and returns to Understood; guests need a separate choice to leave the game without creating an account. Do not copy a second 3-2-1 implementation into the static bundle.

## Longitudinal view and data boundary

The useful view is a series of session cards: date, public topic tag, my proposed core issue, whether the other person confirmed it, disclosure count to understanding, heat peak, my resolution at exit, and follow-through later. A pattern chart can show recurring tags and whether the user's understanding changed; it should not rank partners, diagnose attachment or trauma, or make a hidden “conflict score.” Each session must remain editable so later insight can revise an earlier hypothesis.

The current game stores one live session in browser `localStorage` on a shared device, with no accounts or authenticated private profiles. That is not a private longitudinal journal. The bars-engine 3-2-1 requires a signed-in player and persists a personal session. The first Understood handoff should clearly say **Continue privately in BARS (sign-in required)** and pass only an opaque game-session reference or a user-approved, non-sensitive prompt. A guest can keep the short reflection transient and copy or export their own text. Shared summaries should contain only items both players choose to share. Do not save the other person's hidden meter or private reflection into a shared pattern view. `Shadow321Session` is keyed to one `playerId` and currently has no Understood session relationship. Linking sessions or building a recurring-conflict view will need a new, consented relationship in the data model; the existing 3-2-1 record does not encode this game's issue, partner, or disclosure counts.

## Acceptance questions for the next test round

- In how many of the standard cases does the first core-issue hypothesis differ from what players confirm?
- What is the distribution of new disclosures to owner-confirmed understanding, by case, heat, and communication pattern?
- Does asking for “one layer deeper” improve understanding, or create pressure when the issue is already clear?
- How often does a practical constraint remain after both players feel heard?
- Does the optional reflection produce new insight at follow-up, or merely repeat the game narrative?
