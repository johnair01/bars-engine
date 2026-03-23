# Scrum intake — ChatGPT output template

**Why:** When the intake doc is generated in ChatGPT, a **fixed markdown shape** makes triage, parsing, and handoff to BARS artifacts (event copy, hub, quests) much faster.

**Related:** [.specify/specs/campaign-hub-spoke-landing-architecture/TEST_PLAN_PARTY_AND_INTAKE.md](../.specify/specs/campaign-hub-spoke-landing-architecture/TEST_PLAN_PARTY_AND_INTAKE.md) §5.

---

## Instructions to paste at the top of a ChatGPT session

> You are formatting notes from a scrum or planning call for a creative tech residency (BARS Engine).  
> Output **only** valid markdown. Use **one block per takeaway**, repeating the template below.  
> No preamble or closing essay. Use `event_copy` when the item should change `/event` or invite language.

---

## Per-item template (repeat)

```markdown
## ITEM
### Quote_or_note
### Role
### Decision_or_blocker
### Suggested_artifact
(event_copy | hub_copy | quest_stub | bar_stub | admin_task | defer)
### Priority
(P0_party | P1 | defer)
```

---

## Example

```markdown
## ITEM
### Quote_or_note
"We need the flyer to say both nights but one link only."
### Role
Producer
### Decision_or_blocker
Single canonical URL `/event`; two sections Apr 4 vs Apr 5.
### Suggested_artifact
event_copy
### Priority
P0_party
```
