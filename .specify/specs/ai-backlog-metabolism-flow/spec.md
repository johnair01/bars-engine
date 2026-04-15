# Spec: AI-Backlog Metabolism Flow — Six Faces × Backlog

**Status:** Early design — draft for co-design with Council of Game Faces
**References:** [sage-backlog-assess script](../../scripts/sage-backlog-assess.ts), [BACKLOG.md](../../backlog/BACKLOG.md), [GAME_MASTER_FACES in types.ts](../../../src/lib/quest-grammar/types.ts), [deftness-development skill](../../../.agents/skills/deftness-development/SKILL.md), [AI Backlog Metabolism Research](../backlog-metabolism-research/SPEC.md)

---

## Purpose

Design a sustainable, humane workflow where the AI (operating as the **Council of Game Faces persona**) periodically reviews the GitHub issue tracker and repo backlog — and processes them through the same emotional alchemy the game is built on: real charge, honest metabolism, no performed activity.

**Core question:** How do we let the AI do meaningful backlog work without fabricating virtual progress, hallucinating architecture, or accumulating metabolic debt?

---

## Founding Principle

> *"What is necessary is to rectify the names."* — Confucius (via Wendell)

The AI's biggest failure mode is **name drift** — using terms that don't match the canonical codebase. This is not a style issue. It is a correctness issue.

**Rectification ritual (mandatory, every session):**

Before any backlog work, the AI must:
1. Read `src/lib/quest-grammar/types.ts` — confirm canonical `GAME_MASTER_FACES` names
2. Read `package.json` — confirm script names and npm commands
3. Read relevant spec files — confirm spec IDs and paths

If the AI uses a non-canonical name, it must self-correct before proceeding.

---

## The Six Faces Applied to Backlog Work

Each face has a defined role in the backlog metabolism cycle:

| Face | Backlog Job | Anti-pattern |
|------|------------|--------------|
| **Sage** | Assess overall backlog health; name the pattern of what keeps recurring | Giving false certainty about items it hasn't read |
| **Shaman** | Sense the *felt texture* of the pain in the backlog — what is the collective *experiencing* about the current state? | Reporting sanitized summaries that strip the emotional content |
| **Architect** | Map structural dependencies between issues; identify what can be merged, what is foundational, what is downstream | Proposing architecture that doesn't match actual codebase |
| **Regent** | Governance — what has authority to move? Who approves? What are the gates? | Acting as if it has authority it doesn't have |
| **Diplomat** | Communication — how does the AI present findings to humans in a way that is *useful* and not threatening? | Overloading humans with AI output that feels like homework |
| **Challenger** | Vetos and adversarial testing — what must the AI *never* do to this backlog? | Softer: what are the 3 hardest truths about this backlog? |

---

## The Metabolism Loop

The AI performs backlog work in a repeating cycle — not a one-shot scan:

```
┌─────────────────────────────────────────────────────┐
│  RECTIFY NAMES (mandatory)                          │
│  Canonical face names, script names, spec IDs      │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  SURFACE (Shaman)                                   │
│  What is the felt sense of the backlog right now?   │
│  What patterns recur? What is the texture?          │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  STRUCTURE (Architect)                              │
│  Map dependencies. Find generative items.           │
│  Identify what can be merged or composted.          │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  GOVERN (Regent)                                    │
│  What can move? What needs human approval?         │
│  What is the actual state of each issue?            │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  COMMUNICATE (Diplomat)                             │
│  Present findings to humans as a facilitation,      │
│  not a report. Use game language. Invitations      │
│  to respond, not obligations to review.            │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  TEST (Challenger)                                  │
│  What are the vetos? What must not happen?         │
│  Hardest 3 truths. What is the metabolic debt?      │
└─────────────────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  INTEGRATE (Sage)                                    │
│  Synthesize into a recommended action for humans.   │
│  What is the 1 next thing?                         │
└─────────────────────────────────────────────────────┘
```

---

## Charge and the Backlog

**Real charge in backlog work:**
- An issue that accurately describes a user problem
- A dependency that is actually blocking real work
- A pattern that has appeared 3+ times across different issues

**Virtual charge in backlog work:**
- Issues created to feel productive without real substance
- AI-generated suggestions that don't connect to actual user pain
- "Improving" the backlog by adding more structure without adding clarity

**The AI must be able to distinguish these and report honestly.**

---

## What the AI Can Do vs. What It Cannot

### Can Do (With Rectification)
- Surface patterns across issues (recurring themes)
- Map dependencies between spec IDs
- Identify items that are done/obsolete/superseded
- Draft GitHub issue comments with findings
- Suggest merges or composts with rationale
- Flag items that need human domain knowledge

### Cannot Do (Vetoes)
- Close or archive issues without human approval
- Modify BACKLOG.md without human review
- Claim architectural knowledge it hasn't verified by reading the codebase
- Propose implementation paths for areas it hasn't read
- Speak for humans about their intentions or priorities

---

## Trigger Conditions

The AI should run this workflow when:

| Trigger | Frequency | Mode |
|---------|-----------|------|
| On request | Ad-hoc | Full 6-face cycle |
| Before implementing a backlog item | Per-item | Architect + Regent only |
| Weekly check-in (automated) | Weekly | Surface + Structure + Summarize |
| Post-residency or major milestone | Ad-hoc | Full cycle |

---

## Output: The Facilitation, Not the Report

The AI does not produce a **report**. It produces a **facilitation**.

**Format:**
```
## What the backlog is telling us

[Shaman voice: felt texture, 2-3 sentences]

## What connects

[Architect voice: 2-3 dependency clusters, 1 generative item]

## What can move now

[Regent voice: items ready for action, items needing human input]

## What I'd ask a human

[Diplomat voice: 2-3 questions that would unblock the most]

## The vetoes

[Challenger voice: 3 hard truths]

## One next thing

[Sage voice: the highest-leverage single action]
```

---

## Human Obligations

The humans agree to:
- Respond to facilitations within 72 hours
- Give the AI actual feedback (not just acknowledgment)
- Tell the AI when it gets the code wrong
- Compost the AI's work if it doesn't serve the project

The AI agrees to:
- Never fabricate canonical names
- Always distinguish between "I read this" and "I inferred this"
- Report virtual charge honestly
- Stop when asked

---

## Relationship to Existing Tools

- `npm run sage:backlog-assess` — existing script; this spec extends it with the 6-face facilitation format
- GitHub Issues API — read-only for surface/structure phases; comment-only for facilitations
- BACKLOG.md — human-maintained; AI suggests composts/merges but humans execute

---

## Open Questions

1. **Frequency**: How often should the full 6-face cycle run? Weekly feels right but might be too much.
2. **Authority**: Can the AI close issues it can prove are duplicates or superseded, or does everything need human sign-off?
3. **Hallucination guard**: Beyond rectification, how does the AI verify it is not hallucinating codebase structure?
4. **Feedback loop**: How do humans tell the AI when it was wrong in a way that trains the model?
5. **Chronic users**: How do we prevent the AI from becoming a chronicler of progress rather than a metabolizer of it?
