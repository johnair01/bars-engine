# Admin Template Composer Components

Admin UI components for the composer workflow.

## Intended Components

- **TemplateSelector** — List and filter approved templates; select for composition
- **ComposerInputForm** — Form for generation inputs (theme, campaign, actor capabilities, etc.)
- **QuestPreview** — Display generated flow, node sequence, copy, actions, BAR interactions
- **ValidationReport** — Display validation result, errors, warnings
- **SimulationReport** — Display simulation result, path taken
- **ReviewActions** — Accept, reject, revise, regenerate buttons
- **GoalInputForm** — Form for goal-to-template creation
- **GoalTemplatePreview** — Display proposed template structure from goal

## Workflow

Compose: TemplateSelector → ComposerInputForm → Preview → ValidationReport + SimulationReport → ReviewActions

Goal-to-Template: GoalInputForm → GoalTemplatePreview → Approve/Reject
