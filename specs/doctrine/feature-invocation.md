# Feature Invocation Guide

How to bring a feature from idea to implementation in BARS Engine.

---

## Workflow

```
Concept → Mini Spec → ooo seed → ooo run → evaluate
               ↑                               ↓
               └──────── Evolutionary Loop ────┘
```

For most features: **BARS mini spec → `ooo seed` → `ooo run`**
For complex/uncertain features: **full BARS spec → `ooo interview` → `ooo seed` → `ooo run`**

---

## Step 1 — Write the Spec

Use `/specs/templates/bars-mini-spec-v1.md` for small features.
Use `/specs/templates/bars-feature-spec-v1.md` for larger ones.

Fill out at minimum:
- Summary (what it is, why it exists)
- GM Face Routing (which face is primary)
- Existing Structures Found (search the repo first — always)
- Must Support (behavioral requirements)
- Non-Goals (what it does NOT do)

---

## Step 2 — Search First

Before proposing anything, search for:
- Existing models in `prisma/schema.prisma`
- Existing actions in `src/actions/`
- Existing UI in `src/app/` and `src/components/`
- Existing lib utilities in `src/lib/`

Do not build a second kingdom.

---

## Step 3 — Route Through GM Faces

Apply the relevant faces from `/specs/doctrine/gm-faces.md`.
At minimum: primary face + Steward review.

---

## Step 4 — Generate Seed or Implement

**With MCP available**: `ooo seed` → `ooo run`
**Without MCP**: `ooo seed` → use `ouroboros:architect` → `ouroboros:hacker` → `ouroboros:evaluator`

---

## Step 5 — Post-Build Review

Check:
- Ontological coherence (no parallel systems created)
- Gameplay impact (does it generate play?)
- UX clarity (gift of context, not noise)
- Deftness hooks (is quality of transformation measurable?)
- Privacy (does any new input need a privacy label?)

---

## Constraints (always)

- Extend existing ontology before creating new primitives
- Preserve lineage and provenance where relevant
- Keep UI scope minimal unless explicitly required
- Name things consistently with existing codebase tone
- Privacy-adjacent inputs get a `/privacy` link (see backlog)
