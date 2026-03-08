# Quest Generation Templates

Template loading and constraint resolution for generation.

## Intended Responsibilities

- Load approved template by ID
- Resolve fixed_structure, placeholders, constraints
- Expose forbidden_deviations to validator
- Map template placeholders to generation prompt slots

## Template Input

From [quest-template-api.md](../../../docs/architecture/quest-template-api.md):

- template_id, template_family
- node_pattern, action_pattern, bar_pattern, completion_pattern
- constraints, placeholders
- forbidden_deviations

## Integration

Consumes template data from quest template extraction engine (approved templates only).
