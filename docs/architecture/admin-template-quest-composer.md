# Admin Template Quest Composer

## Purpose

Admin workflow for generating quests from approved templates. Enables preview-first composition, validation and simulation feedback, and review actions before persistence. Generation is preview-first, not auto-persisted.

---

## 1. Core Workflow

```
1. Admin selects an approved template
2. Admin fills in generation inputs
3. System generates draft quest flow
4. System validates draft
5. System simulates draft
6. System displays preview + reports
7. Admin accepts, rejects, or revises
8. Accepted quest is saved as draft or published according to policy
```

**Rule:** Generation is preview-first. No auto-persist without explicit admin action.

---

## 2. Required Inputs

| Field | Required | Description |
|-------|----------|-------------|
| template_id | Yes | Approved template ID |
| campaign_id | Yes | Campaign context |
| quest_theme | Yes | Theme or intent |
| source_book | No | Book context |
| target_outcome | No | Desired completion outcome |
| onboarding_flag | No | Default true for onboarding templates |
| actor_capabilities | No | e.g. ["continue", "create_BAR"] |
| tone_guidance | No | Copy tone |
| terminology_rules | No | Allowed/forbidden terms |
| additional_constraints | No | Extra constraints |

---

## 3. Preview Requirements

The admin preview must display:

| Section | Content |
|---------|---------|
| Node sequence | Ordered node types and IDs |
| User-facing copy | Copy per node |
| Action sequence | Action types in flow order |
| BAR interactions | BAR_capture, BAR_validation if present |
| Completion conditions | How completion is reached |
| Expected events | Events in successful run order |
| Validation result | Pass/fail, errors, warnings |
| Simulation result | Pass/fail, path taken |
| Score summary | If scoring available |

Preview must make structural issues visible before acceptance.

---

## 4. Review Actions

| Action | Behavior |
|--------|----------|
| **Accept draft** | Save according to persistence mode |
| **Reject draft** | Store rejection reason; do not persist |
| **Revise inputs and regenerate** | Update inputs; regenerate; preserve template invariants |
| **Request alternate copy** | Regenerate copy only; same template structure |
| **Save draft for later** | Persist as draft; defer publish |

**Regenerate rule:** Structure remains template-bound. Only content/placeholders may change.

---

## 5. Persistence Modes

| Mode | Behavior |
|------|----------|
| **save_as_draft** | Save as draft quest; not published |
| **save_as_candidate** | Save as candidate for review |
| **save_and_attach_to_campaign** | Save and attach to campaign |
| **save_for_review_only** | Save for human review; no publish |

Start conservatively. Default: save_as_draft.

---

## 6. Entry Points

### A. Compose From Template

Admin picks an existing approved template and generates a quest.

1. List approved templates
2. Select template
3. Fill inputs
4. Preview
5. Accept / reject / revise

### B. Create Template From Goal

Admin specifies desired game-state movement and generates a candidate template. See [goal-to-template-creation.md](goal-to-template-creation.md).

---

## 7. Validation + Simulation

For composed quests:

- Run full quest validation (grammar, invariants)
- Run flow simulation
- Optionally run scoring
- Show errors and warnings before save

Quests that fail validation or simulation should not be saveable without explicit override (and warning).

---

## 8. Provenance + Traceability

Generated quests retain:

- admin_actor_id
- source template_id
- campaign_id
- source_book
- generation_mode
- validation_summary
- simulation_summary
- created_at
- updated_at

---

## 9. Constraints

- Prefer approved templates for composition
- Keep template-conditioned generation strict
- No auto-publishing
- Preview-first workflow
- Preserve source lineage
- Compatible with validation, simulation, scoring, template systems

---

## 10. References

- [admin-template-composer-api.md](admin-template-composer-api.md)
- [goal-to-template-creation.md](goal-to-template-creation.md)
- [template-conditioned-quest-generation.md](template-conditioned-quest-generation.md)
- [admin-template-composer-example.md](../examples/admin-template-composer-example.md)
- [goal-to-template-example.md](../examples/goal-to-template-example.md)
