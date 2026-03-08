# Quest Generation (Template-Conditioned)

Subsystem for generating quest flows using approved templates as structural scaffolds.

## Spec

- [Template-Conditioned Quest Generation](../../../docs/architecture/template-conditioned-quest-generation.md)
- [Template-Conditioned Generation API](../../../docs/architecture/template-conditioned-generation-api.md)

## Structure

| Directory | Purpose |
|-----------|---------|
| `api/` | API entry points, route handlers |
| `services/` | Generation, validation, simulation orchestration |
| `templates/` | Template loading, constraint resolution |
| `__tests__/` | Unit and integration tests |

## Integration

- **Upstream:** Approved templates from [questTemplates](../questTemplates/)
- **Downstream:** Validator, flow simulator, scoring, quest creation

## Pipeline

```
select approved template
→ build generation request
→ generate quest flow JSON
→ validate (invariants + grammar)
→ simulate
→ score
→ accept / reject / flag
```
