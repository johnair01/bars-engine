# Skill: Spec Kit Translator

A powerful bridge between "Vibe-Driven" natural language and "Spec-Driven" Engineering. Use this skill to translate user objectives and feature requests into high-fidelity Spec Kit compatible prompts and implementation plans.

## Purpose
Users often express complex requirements in relative, narrative, or abstract terms. The Spec Kit Translator formalizes these into:
1. **Specs**: Rules, mechanics, and acceptance criteria.
2. **Plans**: Architectural strategy and file impacts.
3. **Tasks**: Step-by-step implementation phases with bash commands and verification markers.

## Protocol: The Interview
When a user provides a high-level request, follow this interaction protocol:
1. **Clarify Objects**: Ask what new models or fields are implied.
2. **Clarify Surface Area**: Ask what UI points are affected.
3. **Clarify Governance**: Ask how admins or systems control this feature.
4. **Draft the Spec**: Compile these into a `.specify/specs/` structure.

## Prompt Template: Natural Language to Spec
When generating a Spec Kit prompt for the agent itself, use this structure:
```markdown
# Spec Kit Prompt: [Feature Name]

## Role
You are a Spec Kit agent responsible for [Objective].

## Objective
[High-level summary of what to build and why.]

## Requirements
- **Surfaces**: [List of pages/components]
- **Mechanics**: [How it works]
- **Persistence**: [Database changes]
- **Verification**: [How to prove it works]

## Deliverables
- [ ] .specify/specs/[name]/spec.md
- [ ] .specify/specs/[name]/plan.md
- [ ] .specify/specs/[name]/tasks.md
```

## Example Translations
| User Says | Spec Kit Prompt Translates to... |
| :--- | :--- |
| "I want to move Vibeulons to instances" | "Implement an Attunement system with InstanceParticipation models and LedgerService atomic moves." |
| "We lost quest filtering!" | "Restore search-based and stage-pill filtering logic in Market page using client-side state." |

## Usage
1. Read the user's natural language request.
2. If ambiguous, initiate the **Interview Protocol**.
3. Generate the **Spec Kit Prompt** as an artifact or code block.
4. (Optional) Run `specify` CLI using the generated prompt.
