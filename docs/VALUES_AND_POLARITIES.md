# Values and polarities (canonical)

This document is the **terminology authority** for BARs when we talk about **values** (developmental / worldview layer) versus **polarities** and **tension pairs** (both-and maps). It complements [grid axis derivation](../.specify/specs/creator-scene-grid-deck/POLARITY_DERIVATION.md) (how row labels are computed).

**Player-facing wiki (footnote-friendly):** in the app, **`/wiki/values-and-polarities`** — hash links **`#footnote`** (snapshot), **`#in-the-app`** (journey), **`#terms`** (table). Source: `src/app/wiki/values-and-polarities/page.tsx`.

---

## Why this exists

English overloads **“value”**:

1. **Barry Johnson (polarity thinking)** often calls each **pole** of a map a “value” — two **sibling goods** that stay in tension.
2. **Spiral Dynamics** uses **vMEMEs** as **value-system attractors** — deep containers for what feels legitimate, shameful, or “obviously true.”
3. **BARs product** also has **Prisma `Polarity`**, which names **nation move** tags — unrelated to developmental value systems or grid row labels.

Without separate words, design and code drift into **soup**. This file fixes vocabulary.

---

## Terms

| Term | Meaning in BARs | Not the same as |
|------|-----------------|-----------------|
| **Value system (vMeme layer)** | A **developmental / worldview container**: recurring needs, fears, and legitimacy rules (Spiral Dynamics: vMEME as attractor). Context shifts which system is “up.” | A single word on a grid corner; not Prisma `Polarity`. |
| **Tension pair / polarity (map)** | A **recurring interdependent pair** where **both poles matter**; health is **balance or rhythm**, not picking a permanent winner (polarity thinking / polarity maps). | A vMeme “color” or stage label. |
| **Axis pair (Scene Atlas)** | **Two independent** tension dimensions; **4 row labels** = their combinations. Authored metaphors (e.g. nation element + playbook trigram). See spec kit `creator-scene-grid-deck`. | Prisma `Polarity` rows. |
| **Move polarity (implementation)** | Database tag on **nation moves** (`NationMove.polarityId`). | Grid axes, vMemes, or Johnson poles. |

**Johnson nuance:** In his vocabulary, a polarity *is* a pair of “values.” In **player copy**, prefer **pole** or **good** for map ends, and reserve **value system** for developmental / worldview language — so we do not sound like we are ranking souls.

---

## How you might interact with this in BARs

Use this when writing UI, quests, or wiki text.

1. **Onboarding / nation & playbook**  
   You choose a **Nation** and **Archetype (playbook)**. Those selections **do not** assign a Spiral “color.” They **do** feed **optional derived labels** for **Scene Atlas**’s two axes (metaphorical “stakes” + relational frame).

2. **Scene Atlas (`/creator-scene-deck`)**  
   You see **four rows** (four combinations of two axis pairs). Each row is a **tension mix**, not a vMeme. Writing a BAR into a cell is **mapping your note to a both-and corner** of the workspace — practice, not diagnosis.

3. **Wake Up / orientation adventures (when wired)**  
   An adventure may write **`storyProgress.gridPolarities`**, **overriding** derived row labels with **your chosen tension language**. That is the closest in-product analogue to **naming the polarities you want to steer** (still not the same as declaring a vMeme).

4. **Moves and quests**  
   **Moves** may reference **move polarity** tags for game logic or copy. That taxonomy is **orthogonal** to grid axes and vMemes.

5. **Reading the wiki**  
   If copy says **“polarity pair”** for the grid, it means **axis pair / tension pair**. If we discuss **values** in a developmental sense, we mean **value systems** or **worldview layers**, not Prisma enums.

**Wiki footnote URL:** `/wiki/values-and-polarities#footnote` (short snapshot) and `/wiki/values-and-polarities#in-the-app` (this list in narrative form).

---

## Six Game Master faces (research lenses)

Each face asks a different question of the same distinction. Useful for design review, not required for players.

| Face | Question |
|------|----------|
| **Shaman** | Where is the **felt tug**? Value systems shape what *hurts*; tension pairs describe the **swing** between two goods. |
| **Regent** | What are we **stewarding**? Polarity **management** = neither pole starves. vMemes shape **what counts as legitimate care**. |
| **Challenger** | What **collapses** when we confuse stage conflict with pole conflict, or treat a map as identity? |
| **Architect** | What belongs in **which data concept**? Developmental layer vs tension map vs move tag — **three schemas**, three names. |
| **Diplomat** | What **bridge words** do players need so “values” in Johnson vs Spiral vs everyday speech don’t merge? |
| **Sage** | How do **Integral** frames (levels vs types vs lines) align? vMemes sit closer to **levels / worldview**; tension pairs are **recurring dynamics** to balance, often in Wilber’s “both/and” sense. |

---

## References (external)

- Barry Johnson / Polarity Map® — [Polarity Partnerships](https://www.polaritypartnerships.com/applications-impact)  
- Spiral Dynamics / vMEMEs — [Wikipedia](https://en.wikipedia.org/wiki/Spiral_Dynamics); [SD and memetics](https://www.spiral-dynamics.com/aboutsd_memetics.htm)  
- Integral polarities — [Integral Life — Polarities](https://integrallife.com/key-concept-polarities/)

---

## Related repo paths

- Grid axis math & vocabulary: [`.specify/specs/creator-scene-grid-deck/POLARITY_DERIVATION.md`](../.specify/specs/creator-scene-grid-deck/POLARITY_DERIVATION.md)  
- Wiki article: `/wiki/values-and-polarities`

---

## Worked polarity: **Calm ↔ Progress** (governs every shame / counter / progress-bar decision)

> **This map is the design principle. The "no shame metrics / not on a counter" language is
> DEPRECATED as an absolute** — it is one pole (Calm), not a law. Do not cite the anti-shame
> slogan to settle a design question; consult this map. Octalysis core drives are more
> fundamental than the anti-shame bias: we *want* Development & Accomplishment (a White-Hat
> drive); we only refuse to deliver it through Black-Hat framing.

**Greater purpose (why hold both):** *sustainable transformation* — growth the user can keep doing.

|                       | **Calm / Acceptance** (the "no-counter" pole) | **Progress / Accomplishment** (the "counter" pole) |
|-----------------------|-----------------------------------------------|----------------------------------------------------|
| **Upside (well-held)** | presence; safe to bring a real charge; intrinsic; sustainable | momentum; agency; *visible* capacity + output growth (Octalysis **CD2 Development & Accomplishment**, White-Hat) |
| **Downside (over-leaned)** | invisible progress; no traction; drift; "nothing's happening" → churn | pressure; streak-anxiety; empty-bar-as-failure; gaming; burnout (**CD6 Scarcity / CD8 Loss-Avoidance**, Black-Hat) |

**Deeper fear (either extreme):** the user leaves — burned out (over-Progress) or drifted away
(over-Calm). The two downsides are the same outcome by opposite roads.

### The lever — *when and why* to show a counter (scope, don't ban)

1. **Mode** — `LensGoal.alignmentType` (`progress | maintenance | recovery`) already carries this:
   *progress* → lead with accomplishment; *maintenance* → gentle consistency; *recovery* → suppress
   the counter, lead with compost / relief.
2. **Register** — a **task** (has a done-state, ladders to a weekly goal) may bear a progress signal;
   a **charge / felt-practice** (emotional metabolization) may not — it is inherently recovery-register.
3. **Framing (always on)** — show what **grew**, never what's **missing**. *"Your capacity grew; 3 seeds
   fruited"* — not *"2/5 incomplete."* Same signal, White-Hat valence.

### Early-warning signs (which way to lean)

- **Over-Progress → lean Calm:** guilt on a missed day; gaming the counter; users report "pressure"; streak-anxiety.
- **Over-Calm → lean Progress:** low return; "I can't tell if I'm growing"; drift; boredom.

**Supersedes:** the absolute reading of `src/lib/bar-seed-metabolization/copy.ts` ("No shame metrics… not
on a counter") and the "ledgers are not counters" framing in the Inner Garden ontology docs. Those remain
true *for the Calm pole / recovery register*; they are no longer a blanket prohibition.

---

## Worked polarity: **Honesty ↔ Craft** (governs the Witness register — expressing inner work as content)

> **This map governs the Witness register** (raising awareness by expressing honest inner
> process — see `src/lib/allyship-deck/expression-register.ts` and
> `docs/ontology/2026-07-12-the-witness-turn-inner-outer-resolution.md`). Do NOT read it as
> "honesty over everything" — that would repeat the anti-shame-absolute mistake. Honesty is the
> **floor**, not the ceiling; you still shape for reach. Both poles are goods.

The deck already half-encodes this: the Raise Awareness cards name **both** shadows —
*"Dumping charge on an audience"* (over-raw) and *"Performing awareness / feeling / care /
growth"* (over-craft). **`CLEAN-RA-ARCHITECT` ("From Outrage to Aim") is this whole polarity in
one card** — its failure modes are literally *"Dumping charge on an audience"* **and** *"Sanitized
into meaninglessness."*

**Greater purpose (why hold both):** *expression that is both true and lands* — metabolized
testimony that actually reaches someone.

|                       | **Honesty / Rawness** (the "rings true" pole) | **Craft / Reach** (the "lands" pole) |
|-----------------------|-----------------------------------------------|--------------------------------------|
| **Upside (well-held)** | authentic; trust-building; **un-fakeable — the AI-allergy moat**; models the real difficulty of the work | legible; reaches the persuadable; shaped for reception; safe to receive |
| **Downside (over-leaned)** | trauma-dump; oversharing; **unmetabolized charge dumped on the audience**; incoherence → repels | **performance**; polish over truth; "performing feeling/care/growth"; purity tone; sanitized into meaninglessness; reads as marketing / AI |

**Deeper fear (either extreme):** the expression fails to raise awareness — it either **repels**
(over-raw) or **doesn't ring true** (over-craft). Same failure by opposite roads (mirrors
Calm ↔ Progress).

### The lever — *metabolize, then express*

1. **Metabolize first.** The inner moves (Open / Clean / Grow) are what turn raw charge into
   expressible truth. Craft on un-metabolized charge = **spin**; rawness without metabolization =
   **dump**. The WAVE order *is* the lever: don't Show Up a charge you haven't Cleaned.
2. **Register.** Witness is where this bites hardest (you *are* the content). Point has a milder
   form — a fact can be rage-posted (raw) or spun (craft).
3. **Honesty is the floor (always on).** Shape for reach above it; never fake below it.

### Early-warning signs (which way to lean)

- **Over-Craft → lean Honesty:** it reads as performance/marketing; "sounds like everyone else";
  the AI-allergy alarm trips; nothing real is at stake.
- **Over-Honesty → lean Craft:** it overshares / trauma-dumps; the audience recoils; charge lands
  *on* people; no one can act on it.

**Gate for the two-context test:** a card's **Witness** application passes only if it can be said
**honestly** (not performed). The fail case is when *only performance is available* — which means
the inner work hasn't actually been done.
