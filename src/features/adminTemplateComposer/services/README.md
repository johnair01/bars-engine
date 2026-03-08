# Admin Template Composer Services

Core service logic for the admin composer.

## Intended Services

- **PreviewService** — Orchestrate template-conditioned generation, validation, simulation
- **PersistenceService** — Save accepted quests (draft, candidate, attach to campaign)
- **RejectionService** — Store rejection reasons
- **RegenerationService** — Regenerate with updated inputs; preserve template invariants
- **GoalToTemplateService** — Derive candidate template from goal input (rule-based)

## Goal-to-Template Derivation

- Map current_state → opening node pattern
- Map required_player_action → action pattern
- Map target_state → completion pattern
- Map bar_requirement → BAR lifecycle pattern
- Map complexity_target → max_nodes, max_branches
- Map onboarding_relevance → stricter constraints

Rule-based; no black-box inference.
