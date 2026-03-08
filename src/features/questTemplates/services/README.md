# Quest Template Services

Core extraction and clustering logic.

## Intended Services

- **PatternExtractor** — Extract node/action/BAR/completion patterns from quest flows
- **ClusterService** — Group quests by structural similarity
- **ConfidenceScorer** — Compute confidence for candidate templates
- **TemplateStore** — Persist and query templates (when implemented)

## Extraction Modes

- `analyze_only` — Identify patterns; no persistence
- `propose_candidates` — Generate candidates with provenance

## Clustering

- Exact-match on node_pattern, bar_pattern, completion_pattern
- Fallback: rule-based similarity (e.g., one node type difference)
- Min cluster size configurable (default 2)

See [quest-template-extraction-engine.md](../../../docs/architecture/quest-template-extraction-engine.md).
