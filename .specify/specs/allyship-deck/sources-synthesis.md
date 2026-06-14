# Allyship Deck — Source Synthesis (move library)

Synthesis of the 2026-04/05 design documents (uploaded 2026-06-14) as they bear on the
Allyship Deck and its **move library**. Source docs: MTGOA Editorial Spec, MTGOA Resonance
Pilot, Workshop Extraction Notes, EA-Cradle Forms Integration, Recursive Symbolic Mediation,
Recursive Editorial Skill Stack, Failure Modes + Governance, The Crossing / Fake-Asking,
Wizard Geoff mythology.

## 1. The moves are a developmental arc, not a flat set

The four base moves map onto the reader's transformation arc (MTGOA Editorial Spec):

| Move | Arc phase | Felt shift |
|------|-----------|-----------|
| **Wake Up** | Recognition | "Oh — I'm already playing." See the unconscious mechanics. |
| **Clean Up** | Compassionate Destabilization | "These patterns were adaptive." Metabolize charge without shame. |
| **Grow Up** | Developmental Orientation | "I can grow capacities." Guilt → practice. |
| **Show Up** | Embodied Participation | "Allyship is a way of relating and building." Relational/communal/lived. |

The deck is selling **"recoverable agency inside unconscious social reality"** — not allyship
education, not perfection. Card language = *glitches, unconscious moves, frozen strategies,
inherited scripts, reactive loops, hidden mechanics, emotional aggro, defensive tech*. Avoid
oppression jargon, purity/contamination framing, "bad people," enlightenment rhetoric.

## 2. The 5th move — working hypothesis: **Open Up**

The deep system (EA-Cradle) puts the **Vulnerable Child** at the source (Gate 8): the capacity
that "emerges only after all eight gates are broken," "unarmored honesty," that **opens up** once
there's enough safety. The Crossing / Fake-Asking BAR names the same gesture in relational terms:
*"the asking was fake — asking for rescue, not asking to be changed."* Real asking = unarmored,
willing to change.

→ **Hypothesis:** the 5th move is **Open Up** — unarmored authenticity / real asking / vulnerable
connection — and it "opens up" (becomes available) after the other four are practiced. *Author to
confirm/replace the name + meaning.*

## 3. Card anatomy — borrow the Skill-Stack shape

The Recursive Editorial Skill Stack defines each editorial "pass" with a consistent anatomy. The
same shape makes an excellent **move-library card**:

| Field | From skill stack | On an allyship move card |
|-------|------------------|--------------------------|
| **Primary Question** | "What is structurally happening here?" | the consult prompt — what this move asks you |
| **Optimizes For** | what the pass improves | what the move grows / makes possible |
| **Forbidden Moves** | what the pass may NOT do | the anti-moves / how it goes fake |
| **Failure Modes** | named failure signatures | how this move misfires (e.g. spiritual gloss, false catharsis) |
| **Remediation** | how to recover | the practice / next action |

This gives every card a *spell* shape: a question, what it's for, how it fakes out, and the practice.

## 4. The deep structure (keep LATENT in v1)

EA-Cradle defines a rich engine — **5 channels** (Metal/Fear, Water/Sadness, Wood/Joy, Fire/Anger,
Earth/Neutrality) × **4 forms** (Ruler/Striker/Enforcer/Forger) = a 20-cell matrix; **move types**
Transcend (within a channel) vs Translate (across channels); **8 gates** (Protector → Vulnerable
Child); **canonical Satisfaction states** (Triumph, Poignance, Excitement, Bliss, Peace). 8×5×4 =
a 160-node tech tree.

**This is the latent depth, not the v1 product.** (See §6.) The deck can *tag* cards with channel /
form / move-type so the depth is present and discoverable, without forcing the matrix on a new user.

## 5. Consult vocabulary — already documented

The "consult to solve a problem" index can be seeded directly from documented pains rather than
invented. Workshop Extraction Notes + Editorial Spec give:

- Difficult / emotionally-charged conversations (defensive, reactive, avoidant, performative)
- The productivity-shame spiral (optimization, guilt, paralysis, endless preparation)
- Relational fragmentation / overwhelmed creatives (too many possibilities, emotional backlog)
- Defensiveness during conflict or feedback (protecting identity structures)
- AI / symbolic overwhelm (flooding, recursive possibility-paralysis, dissociation)
- The reader's fears: being bad / fake / unconsciously harmful / never changing; exhaustion with
  purity performance, moral signaling, shame cycles, vague prescriptions.

Each maps to a recommended move (e.g. Defensiveness → Clean Up + 3-2-1; Overwhelm → symbolic
pruning + micro-quest; "fake asking" → Open Up / real asking).

Named practices that live under the moves: **WAVE, 3-2-1, polarity examination, emotional
differentiation, charge metabolization, symbolic compression/pruning, micro-quest selection,
Transcend, Translate.**

## 6. Governance constraint — ship SMALL (this overrides maximalism)

Failure Modes + Governance and the Resonance Pilot are explicit and repeated:

- **Ontological Overdelivery**, **Symbolic DDOS**, **Recursive Infrastructure Addiction**,
  **Premature Scalability Hallucination**, **Avoidance Through Refinement**, **Mythic Dissociation**.
- Heuristics: *Is this metabolizable? Does this increase aliveness? Is this complexity necessary?*
- "The workshops are doorways, not encyclopedias." "The smallest viable transformation is more
  important than complete cosmological explanation." "The deeper architecture remains latent."

→ **Design law for the deck v1:** a small, emotionally legible, *consultable* deck (carrying the
deep DNA latently via tags) beats a complete 160-node system. This argues for the **lean
architecture** (moves as the spine, channels as a second axis) over a full tarot/matrix v1.

## Implications for the spec (proposed, pending author confirmation)

1. **Architecture:** lean — the **5 moves** are the spine; each move has a small set of cards
   (a few per move) tagged with channel / form / domain so depth is latent. Target a *small*
   deck (~25–40 cards), not 52+.
2. **Card schema:** extend `AllyshipCard` with the skill-stack anatomy (`primaryQuestion`,
   `optimizesFor`, `forbiddenMoves`, `failureModes`, `remediation`) + latent tags
   (`channel`, `form`, `moveType`).
3. **5th move:** add `open_up` (placeholder) as the 5th spine move.
4. **Consult index:** seed `deck.problems` from §5.
5. **Guardrail:** resist matrix-completionism; the 160-node tree is a *future* layer, not v1.
