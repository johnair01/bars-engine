# Quest Generation Services

Core generation and validation logic.

## Intended Services

- **TemplateConditionedGenerator** — Build prompt from template + request; call LLM; parse output
- **InvariantValidator** — Check output against template invariants
- **GrammarValidator** — Check against quest/BAR flow grammar
- **SimulationOrchestrator** — Run flow simulator; collect result

## Generation Modes

- `draft` — Generate for human review; no persist
- `validate_only` — Generate + validate; no persist
- `generate_and_propose` — Generate + attach reports
- `generate_and_store` — Persist only if all checks pass

## Dependencies

- Quest template API (approved templates)
- Quest generation prompt contract
- Flow simulator contract
- Quest/BAR validation rules
