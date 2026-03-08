# Quest Review Dashboard

## Purpose

Specify the information that must be visible in a quest corpus review dashboard. The dashboard presents corpus quality, evolution across normalization passes, and actionable insights for developers and designers. This document defines requirements; it does not prescribe a full UI implementation.

---

## 1. Dashboard Sections

### 1.1 Corpus Overview

**Purpose:** At-a-glance corpus health.

**Metrics to display:**

| Metric | Description |
|--------|-------------|
| Total quests analyzed | Count of quests in current pass |
| Pass count | Quests with status `ready` |
| Warn count | Quests with status `usable` |
| Fail count | Quests with status `needs_normalization` or `broken` |
| Average corpus score | Mean total_score across all quests |
| Most common issues | Top 5 issue codes by frequency |

**Visualization:** Summary cards or compact table. Pass/warn/fail as counts or percentages.

---

### 1.2 Book-Level Breakdown

**Purpose:** Identify books with problematic quest extraction.

**Per-book metrics:**

| Metric | Description |
|--------|-------------|
| Book identifier | source_book slug or title |
| Number of quests | Count per book |
| Average score | Mean total_score for book |
| Pass rate | % of quests with status `ready` or `usable` |
| Most common failure types | Top 3 issue codes for that book |

**Use case:** Books with low pass rate or low average score need extraction or normalization attention.

---

### 1.3 Quest Leaderboard

**Purpose:** Rank quests for prioritization.

**Sections:**

| Section | Sort | Limit |
|---------|------|-------|
| Highest scoring quests | total_score DESC | 10 |
| Lowest scoring quests | total_score ASC | 10 |
| Quests requiring human review | requires_human_review = true | All |

**Columns:** quest_id, source_book, total_score, status, top issue (if any).

---

### 1.4 Issue Heatmap

**Purpose:** Highlight common structural issues across the corpus.

**Dimensions:**

| Dimension | Description |
|-----------|-------------|
| Issue code | From `issues[].code` |
| Severity | error vs warning |
| Frequency | Count per code |
| Affected quests | List or count |

**Common codes to surface:**

- `unreachable_completion`
- `invalid_bar_lifecycle`
- `missing_actor_permissions`
- `confusing_prompts`
- `orphan_nodes`
- `invalid_transitions`
- `placeholder_text`
- `excessive_branching`

**Visualization:** Table or bar chart. Sort by frequency descending.

---

### 1.5 Normalization Pass Comparison

**Purpose:** Determine if normalization is converging.

**Metrics:**

| Metric | Description |
|--------|-------------|
| Score changes | Per-quest delta: pass_N total_score − pass_N-1 total_score |
| Number of normalized quests | Quests whose score increased |
| Unresolved failures | Quests still `broken` or `needs_normalization` after pass |
| New warnings introduced | Warnings in pass_N not present in pass_N-1 |

**Display:** Side-by-side pass comparison. Delta distribution (improved / unchanged / regressed).

---

### 1.6 Corpus Emergence Analysis

**Purpose:** Identify patterns across quests to inform templates and generation.

**Patterns to surface:**

| Pattern | Description |
|---------|-------------|
| Most common node sequences | Frequent (node_type_A → node_type_B) transitions |
| Typical quest arc length | Distribution of node counts |
| Common action types | Frequency of action types (read, choose, create_BAR, etc.) |
| BAR interaction patterns | BAR_capture → BAR_validation sequences |
| Onboarding quest shapes | Node type sequences for onboarding-tagged quests |

**Use cases:**

- Quest templates: Use common sequences as templates
- Generation prompts: Privilege frequent patterns
- Engine priorities: Surface missing or underused node types

---

## 2. Data Sources

| Section | Source |
|---------|--------|
| Corpus Overview | Aggregation of pass-{N}-scores.json |
| Book-Level | Group by source_book |
| Leaderboard | Sort/filter pass-{N}-scores.json |
| Issue Heatmap | Flatten issues[]; group by code |
| Pass Comparison | Diff pass-{N} vs pass-{N-1} |
| Emergence Analysis | Flow structure from quest corpus (nodes, transitions) |

---

## 3. Artifact Paths

| Artifact | Path | Description |
|----------|------|-------------|
| Pass scores | `/reports/quest-corpus/pass-01-scores.json` | Full score array |
| Pass scores | `/reports/quest-corpus/pass-02-scores.json` | Full score array |
| Dashboard summary | `/reports/quest-corpus/pass-01-dashboard-summary.md` | Human-readable summary |
| Dashboard summary | `/reports/quest-corpus/pass-02-dashboard-summary.md` | Human-readable summary |

---

## 4. Dashboard Summary Format

The `pass-{N}-dashboard-summary.md` artifact should include:

1. **Corpus Overview** — Pass/warn/fail counts, average score
2. **Book-Level Table** — Per-book metrics
3. **Top Issues** — Issue code counts
4. **Pass Comparison** (if N > 1) — Score deltas, resolved vs unresolved

Markdown tables preferred for machine and human readability.

---

## 5. References

- [quest-corpus-scoring-rubric.md](quest-corpus-scoring-rubric.md)
- [quest-corpus-score-example.md](../examples/quest-corpus-score-example.md)
