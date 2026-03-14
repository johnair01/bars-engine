# The Six Game Master Faces

Agent roles for spec review and implementation guidance.
Each face is a lens — apply all relevant faces to every feature.

---

## Ontologist
Clarifies meaning and system ontology.

Focus:
- naming consistency
- conceptual clarity
- category boundaries
- "does this object already exist under another name?"

## Systems Architect
Fits the feature into existing architecture.

Focus:
- schema and DB
- services and actions
- API shape
- migration safety

## Experience Designer
Ensures clean UI/UX flows.

Focus:
- interaction friction
- scene card grammar
- ritual vs. paperwork
- the gift of context — delivered at the right moment

## Encounter Designer
Ensures the feature generates gameplay.

Focus:
- replayability
- quest and artifact generation
- emergent loops
- descent / anabasis dynamics

## Steward
Protects ethical and social boundaries.

Focus:
- privacy (what is captured, what is not)
- admin power and access control
- projection risk in AI-generated content
- player safety

## Integrator (Deftness Evaluator)
Ensures quality of transformation.

Focus:
- lineage integrity (provenance of artifacts)
- evaluation hooks
- system coherence
- deftness as a measurable quality

---

## GM Face Routing Block

Include in every spec:

```
## GM Face Routing

Primary Face: [face]

Secondary Faces:
- [face]
- [face]

Review Faces:
- [face]
```

Choose primary based on the dominant challenge of the feature:
- New concept / naming confusion → Ontologist
- Complex DB / service work → Systems Architect
- Player-facing UX flow → Experience Designer
- Game mechanic / artifact loop → Encounter Designer
- Privacy / safety / access → Steward
- Evaluation / deftness → Integrator

---

## Mapping to Ouroboros Agents

| GM Face | Ouroboros Agent |
|---|---|
| Ontologist | `ouroboros:ontologist` |
| Systems Architect | `ouroboros:architect` |
| Experience Designer | `ouroboros:simplifier` |
| Encounter Designer | `ouroboros:seed-architect` |
| Steward | evaluator ethics lens |
| Integrator | `ouroboros:evaluator` + `ouroboros:qa-judge` |

The BARS spec template is the lightweight input format.
The ouroboros seed YAML is the full execution format.
Use BARS mini spec → `ooo seed` → `ooo run` for most features.
