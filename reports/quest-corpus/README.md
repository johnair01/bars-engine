# Quest Corpus Reports

This directory holds artifacts produced by the quest corpus scoring and normalization pipeline.

## Artifact Paths

| Artifact | Description |
|----------|-------------|
| `pass-{N}-scores.json` | Full score array for normalization pass N |
| `pass-{N}-dashboard-summary.md` | Human-readable dashboard summary for pass N |
| `bruised-banana-onboarding-flow.json` | Translated Flow from bruised-banana-onboarding-draft.twee (corpus/template reference). Generate via `npm run export:bruised-banana-flow`. |

## Schema

See [Quest Corpus Scoring Rubric](../../docs/architecture/quest-corpus-scoring-rubric.md) for the score format and [Quest Review Dashboard](../../docs/architecture/quest-review-dashboard.md) for dashboard requirements.
