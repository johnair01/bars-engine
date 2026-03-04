# Spec: Deftness Development Skill

## Purpose

Create an agent skill that applies spec kit discipline, API-first design, and scaling robustness during implementation—reducing tokens, time-to-implement, and time-to-test.

**Extends**: [AI Deftness Token Strategy](../ai-deftness-token-strategy/spec.md) (product); [Spec Kit Translator](../../.agents/skills/spec-kit-translator/SKILL.md) (process).

## User Story

**As a developer** (or AI agent), when implementing features with persistence, UI, or external surface, I want the system to apply spec kit first, API-first, and scaling robustness checks, so rework and scaling failures are reduced.

**Acceptance**:
1. Skill exists at `.agents/skills/deftness-development/SKILL.md`
2. Skill teaches: spec kit first, API-first, scaling checklist, token economy
3. reference.md provides full scaling checklist and Route vs Action decision tree
4. DEVELOPER_ONBOARDING.md mentions the skill for AI-assisted development

## Functional Requirements

- **FR1**: Skill MUST be invoked when building features with persistence, UI, or API; or when user mentions spec kit, API-first, scaling, token efficiency, deftness.
- **FR2**: Skill MUST encode: implement from spec when one exists; create spec if missing for features with persistence/UI.
- **FR3**: Skill MUST include scaling robustness checklist (filesystem, AI, request body, env, DB).
- **FR4**: Skill MUST reference existing libs (ai-with-cache, getOpenAI); link to reference.md for patterns.
- **FR5**: Skill MUST integrate with Spec Kit Translator, Roadblock Metabolism, Fail-Fix Workflow.

## Reference

- Plan: See conversation/plan for implementation details
- Skill: [.agents/skills/deftness-development/SKILL.md](../../.agents/skills/deftness-development/SKILL.md)
