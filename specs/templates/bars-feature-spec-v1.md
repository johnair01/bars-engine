# BARS Feature Spec Template (v1)

Use this template for most feature implementations.

---

## 0. Feature Name
Short descriptive name.

## 1. Developer-Facing Summary
One paragraph explaining:
- What the feature is in system terms
- What outcome it enables

## 2. Why This Exists
Describe the transformation this supports in the game loop.

## 3. Ontological Role
Define what this object or feature *is* in the system.

Examples:
- BAR = charge container + routing node
- Daemon Seed = BAR-derived capture of recurring process
- Scene Card = atomic unit of contemplative game UI

## 4. Non-Negotiable Rules
- Rule 1
- Rule 2
- Rule 3

## 5. Search the Existing Codebase First
Inspect the repository for:
- schema/models
- services
- routes
- UI components
- prompts
- tests

Search terms:
- [term1]
- [term2]

Avoid creating parallel ontology.

## 6. Existing Structures Found
Fill this out before implementation.

- Relevant files
- Existing models/types
- Existing services
- Existing UI flows
- Recommendation: extend vs. create

## 7. Required User Outcomes
- Outcome 1
- Outcome 2

## 8. Required System Behavior

### Flow A
Description

### Flow B
Description

## 9. Data Structures
Prefer extending existing structures.

Possible entities:
- Entity A

Possible fields:
- field

## 10. Service Architecture
Suggested services:

```
methodName(...)
```

## 11. API / Procedure Changes
- routeA
- routeB

## 12. UI Changes (Minimal v1)
- UI change A
- UI change B

## 13. Lineage / Auditability
System must answer:
- What created this artifact?
- What transformations occurred?
- Where was charge routed?

## 14. Deftness Hooks
```
deftnessService.evaluateX(...)
```

Suggested events:
- eventA
- eventB

## 15. Edge Cases
- edge case A
- edge case B

## 16. Tests
- test A
- test B

## 17. Non-Goals
Feature should NOT:
- overbuild unrelated systems
- create duplicate models
- redesign unrelated UI

## 18. GM Face Routing

Primary Face: [choose one]

Secondary Faces:
- [choose up to 2]

Review Faces:
- [choose up to 2]

## 19. Output Format
Return implementation plan in this order:
1. Existing Structures Found
2. Schema changes
3. Migration notes
4. Service architecture
5. API changes
6. UI changes
7. Deftness hooks
8. Tests
9. Assumptions
