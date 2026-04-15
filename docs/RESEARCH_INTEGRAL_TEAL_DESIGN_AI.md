# Research: AI-Augmented Integral Teal Design — Embodied Wisdom at Scale

**Researcher:** Zo (Council of Game Faces persona)
**Date:** 2026-04-14
**Status:** Synthesized — 6 faces confirmed, rectification of names embedded
**Issues:** #57 (Clean Up Technique System), #58 (this doc)

---

## Core Insight

**The biggest failcase for designers doing Integral Teal work:** Remaining ignorant to their own taste at an object level because sensibilities are valuable only when they remain scarce.

Taste kept implicit = taste stays replicable only by the designer = power asymmetry maintained = AI cannot augment it = system doesn't scale.

The antidote: Make taste explicit as a learnable decision framework — not a mysterious gift.

---

## Founding Principle: Rectify the Names

> *"What is necessary is to rectify the names."*
> — Confucius, *Analects* Book XIII, Chapter 3

The Confucian foundational move: **when names are wrong, everything downstream is wrong**. Before you can think clearly, act correctly, or govern well — the words must be right. This is not pedantry; it is the precondition for all other clarity.

In the context of AI-augmented design:

**The biggest systemic failcase for AI is that it forgets to rectify the names.** An AI generates artifacts, references concepts, invents terminology — but if the source-of-truth registry isn't checked at the point of generation, the AI will confidently produce outputs that are category errors. These errors feel fluent but are factually wrong. They propagate because they sound right.

In this session, two face names were hallucinated: "Thunderclap" (for Sage) and "Alchemist" (for Shaman). The descriptions were accurate. The names were not. The canonical names — sage, shaman, challenger, regent, architect, diplomat — exist in `src/lib/quest-grammar/types.ts` as `GAME_MASTER_FACES`. The AI generated names from functional description instead of from the canonical registry.

This is a prototype of the failure mode.

**The rectification ritual:**

> Before any face artifact is published: read `GAME_MASTER_FACES` from `src/lib/quest-grammar/types.ts`, confirm alignment, log the confirmation as provenance.

This turns the registry into a live verification point rather than a static reference. Every artifact that names a face should be able to answer: *how do I know this name is correct?*

**The Confucius principle encoded as workflow:**

1. When generating any artifact that references a canonical name, **read the registry first**
2. Display the canonical name before using it — *"Canonical: [name]"*
3. Log the verification as provenance in the artifact header
4. If the generated name diverges from the registry, treat it as a failed generation, not a creative variant

This applies to: face docs, issue descriptions, spec references, AI persona definitions, game-master prompts.

---

## The Problem Pattern

1. Designers keep taste implicit and scarce because explicit taste = replicable = less competitive leverage
2. AI amplifies execution but not judgment — outputs improve, taste doesn't scale
3. The designer's actual competitive advantage (their specific evaluative lens) stays locked in their head
4. Anyone who tries to learn from them gets the outputs, not the judgment
5. Scale requires: outputs that carry the judgment embedded in them

**The leverage point:** Change the DESIGN from "designer produces outputs" to "designer produces a judgment system that produces outputs."

---

## Key Research Artifact

**Lens Extraction** by Peter Salvato is the most directly applicable framework found.[^1]

A protocol for surfacing hidden evaluative frameworks by:
- Having designers articulate their "taste rules" (not "I like it" but "it scores 7 on scale X because Y")
- Building explicit decision trees from implicit intuition
- Stress-testing those trees against real cases until they break
- Rebuilding until they hold

**Why it matters for BARS:** Lens Extraction provides the MECHANISM for making taste explicit. The 6 faces provide the VOCABULARY. Together they can produce a designer's judgment as a portable, learnable artifact.

---

## The Six Faces as a Design Judgment System

Canonical names confirmed against `GAME_MASTER_FACES` in `src/lib/quest-grammar/types.ts`:
`sage | shaman | challenger | regent | architect | diplomat`

Each face is an irreducible evaluative lens that cannot be collapsed into the others. Together they form a complete judgment system for vetting design decisions.

### 🧠 Sage — Whole

**Role:** Whole
**Mission:** Integration, emergence, flow
**Color:** text-purple-400
**Lens:** What is the whole here? What is the integration that holds the pieces? Where is the emergence?

Design questions:
- What is the whole here?
- Where is the integration?
- What is emerging?
- Is this fragmenting or integrating?

**Core principle:** The whole is not the same as the sum of the parts. The emergence is the point.

### 🔥 Shaman — Mythic Threshold

**Role:** Mythic threshold
**Mission:** Belonging, ritual space, bridge between worlds
**Color:** text-fuchsia-400
**Lens:** What belongs here that has been excluded? What is the ritual that holds the work?

Design questions:
- What is the ritual here?
- Who belongs, and do they know it?
- What crosses the threshold?
- Where is the bridge broken?

**Core principle:** Ritual is the architecture of belonging. The threshold is where the real work begins.

### 🧠 Architect — Structure and Ontology

**Role:** Blueprint
**Mission:** Strategy, project, advantage
**Color:** text-blue-400
**Lens:** What are the pieces, how do they connect, and is the map accurate?

Design questions:
- What are the fundamental units?
- What is the causal chain from input to output?
- Where are the boundaries and what crosses them?

**Core principle:** The game creates the game. Documentation, verification, and process are legible within the game world.

### ⚖️ Regent — Governance and Accountability

**Role:** Order, structure
**Mission:** Roles, rules, collective tool
**Color:** text-amber-400
**Lens:** Who decides, who is responsible, and when do we exit?

Design questions:
- What decisions is this enabling, and who makes them?
- What is the accountability structure?
- Where does this have hard exits?

**Core principle:** The game separates those who are from those who want to be — not through gatekeeping, but through metabolic honesty.

### ⚠️ Challenger — Adversarial Testing

**Role:** Proving ground
**Mission:** Action, edge, lever
**Color:** text-red-400
**Lens:** How does this break? Where does the virtual player win?

Design questions:
- Where does this design fail under adversarial conditions?
- What happens when someone fakes the charge?
- How does a real player get penalized vs. a virtual one?

**Core principle:** "Fuck them kids" — not designed to save everyone. Designed to serve those who do the work. Virtual players dilute signal, consume collective resources, slow real players. Their collapse clears space.

### 🤝 Diplomat — Community and Onboarding

**Role:** Weave
**Mission:** Relational field, care, connector
**Color:** text-teal-400
**Lens:** How does someone new find their place? How does the system stay legible?

Design questions:
- Is this discoverable by someone with no context?
- Does the language center the community or the system?
- Where does a new player get confused and why?

**Core principle:** Going back is the practice. The village needs you. The forest prepared you. The game rewards return, not retreat.

---

## The Metabolic Core — Where All Faces Converge

### The Energy Equation

```
charge (potential) → metabolism (transformation) → energy (action)
```

- **Charge/Heat** = potential energy stored in the body — exists inside soma, hard to measure externally
- **Energy** = action-taking capacity — the final usable form
- **Vibeulon** = the transformed substance — charge metabolized through quest completion + community appreciation

### Virtual vs. Real Charge

| Signal | Real Charge | Virtual Charge |
|--------|------------|----------------|
| Charge logged | Raw, specific, felt-sense described | Vague, performed, generic |
| 321/EK session | Somatic detail, not cognitive | First answer reached for |
| Output produced | Thing exists, carries the signature of the charge | Nothing or rationalized justification |
| Vibeulons earned | Appreciation given by others who felt it | Hollow appreciation from virtual players |
| Show Up follow-through | Did the thing get made? | "I'm still processing" |

**Virtual charge is metabolic debt with interest.** Faking charge for gains means eventually having to metabolize the charge of self-betrayal PLUS the original dissatisfaction. The authentic player wins because they have one metabolic loop. The faker has two.

### The Collapse Is the Filter

Not cruelty — thermodynamic observation. The game is a metabolometer. It measures whether charge was real by whether output exists. The collapse of a virtual player is the market correcting. The real ones move faster when the pretenders are gone.

### The Only Sustainable Charger

**Appreciation.** Unlike willpower, discipline, or forced enthusiasm — appreciation is inherently renewable because it flows from genuine recognition. The system is designed so that only real outputs earn genuine appreciation.

---

## The Designer's Validated Personal Loop (Lived Evidence)

This is the loop that produces Teal-level design work:

1. **Sensation** — felt in body, charge arises
2. **Metabolization** — over a cigarette, meditation, 321, whatever circuit-breaker
3. **Research as meaning-making** — deep dive into Doc Future, or equivalent
4. **Running with charge** — until a metabolizable artifact is produced
5. **Cleaning up** — leads to skillful and deft showing up

**If the designer is allowed to be their own experimentation space, this is locally validated.** The game's job is to make this loop:
- **Visible** — others can see and learn it
- **Portable** — it travels via the 6 faces
- **Scalable** — AI can help surface and augment it without replacing it

---

## Application to Issue #57 — Clean Up Technique System

The spec for the Clean Up Technique Library should be built WITH these principles:

### How Each Face Shows Up in the Spec

| Face | Application |
|------|------------|
| **Sage** | Technique discovery names the whole story — "this is why you're stuck and what you're here to become" |
| **Shaman** | 3-2-1 and EK are ritual crossings, not steps — the threshold that marks transformation |
| **Architect** | Technique = `gateIndex + nationId + steps + moveType` — precise ontology |
| **Regent** | Techniques are earned, not unlocked — hard exit for virtual players |
| **Challenger** | Every technique template stress-tested against "what if someone fakes this?" |
| **Diplomat** | New players discover techniques through the forest, not a menu |

### Design Questions for Spec

1. How are techniques actually discovered (not just selected from a list)?
2. How does the system know if the technique was applied with real or virtual charge?
3. What does earning a technique feel like vs. buying one?
4. How are the 8 Gates of the Forest mapped onto the 8 spokes of the campaign hub?

---

## The Kotter Lens on Design Specs

Using Kotter's 8-stage change model to create powerful design specs:

| Stage | Kotter Meaning | Design Spec Application |
|-------|---------------|------------------------|
| **1. Create Urgency** | Name why NOW. What breaks if this isn't built? | What is the real cost of not doing this? |
| **2. Build Coalition** | Which faces need to agree? Who has veto power? | Which faces must sign off? Which can be overridden? |
| **3. Form Vision** | One sentence: what does success look like? | What does the village look like when this is done? |
| **4. Communicate** | How does every face tell the story differently but consistently? | How does each face describe this? Do they agree? |
| **5. Remove Obstacles** | What has to be removed for this to work? | What virtual behavior does this enable that must die? |
| **6. Create Short Wins** | What can ship in 2 weeks that validates the core loop? | What is the minimum viable proof? |
| **7. Build on Momentum** | What does the second iteration unlock? | What does this make possible? |
| **8. Anchor in Culture** | How does this become "how we do things" not "a thing we did"? | What does a new player learn about us from this? |

---

## Strengthening the Flow

### What Broke

Hallucinated canonical names ("Thunderclap" for Sage, "Alchemist" for Shaman) were generated from functional description instead of from the canonical registry. The descriptions were accurate. The names were not. The error propagated through face docs and GitHub issues before correction.

### The Structural Fix

The Confucius principle: **rectify the names before everything else.**

> Before any face artifact is published: read `GAME_MASTER_FACES` from `src/lib/quest-grammar/types.ts`, confirm alignment, log the confirmation as provenance.

Every artifact that names a face must be able to answer: *how do I know this name is correct?*

### The Six Faces on the Fix

| Face | Recommendation |
|------|---------------|
| **Sage** | Build a RETURN checkpoint — before publishing any face artifact, run a registry verification step |
| **Shaman** | Add "name-call before description" ritual — confirm canonical name at the start of every face reference |
| **Architect** | Pre-check `GAME_MASTER_FACES` before generating any face-related artifact; treat the registry as immutable |
| **Regent** | Governance gate: no face named, no issue referencing faces, no doc published without registry confirmation |
| **Challenger** | Trace the Thunderclap ghost — find where it was generated or referenced in the codebase and neutralize it |
| **Diplomat** | Add a one-sentence confirmation step before publishing: confirm names against registry, log provenance |

---

## Artifacts Created

| Artifact | Path | Status |
|----------|------|--------|
| Vibeulon Economy | `docs/handbook/VIBEULON_ECONOMY.md` | Done |
| Sage Face Doc | `docs/handbook/FACE_SAGE.md` | Done |
| Shaman Face Doc | `docs/handbook/FACE_SHAMAN.md` | Done |
| Challenger Face Doc | `docs/handbook/FACE_CHALLENGER.md` | Done |
| Regent Face Doc | `docs/handbook/FACE_REGENT.md` | Done |
| Diplomat Face Doc | `docs/handbook/FACE_DIPLOMAT.md` | Done |
| Architect Face Doc | `docs/handbook/FACE_ARCHITECT.md` | Done |
| Clean Up Technique Spec | `.specify/specs/clean-up-technique-system/spec.md` | In progress |

---

## References

[^1]: Salvato, P. — Lens Extraction protocol. https://petersalvato.com/research/lens-extraction/
[^2]: Anthony, C. K. — *I Ching* interpretation inform
