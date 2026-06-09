---
type: spec
aliases:
  - MTGOA Canon Rule
  - Obsidian Canon Rule
tags:
  - mtgoa
  - book-os
  - canon
  - agents
created: 2026-05-08
review: 2026-05-15
---

# Obsidian Canon Rule

## Core Rule

For MTGOA manuscript content and editorial state, Obsidian is canonical.

If Wendell is behind the wheel, canonical manuscript writes happen in Obsidian.

No canonical manuscript write happens without Wendell's conscious approval.

If that approval is absent, the output is a proposal, not canon.

## Environment Roles

| Environment | Role |
|---|---|
| Obsidian | Canonical authoring, editorial state, structural decisions |
| `workspace/The Library/manuscripts` | Export surface, verification surface, git history, build-facing copies |
| Claude / Codex / other agents | Proposal, analysis, transformation |
| zo / app routes | Consumption, capture, or Wendell-approved promotion path |

## Operational Consequences

1. No duplicate writable canon for the manuscript.
2. Downstream exports are derived artifacts unless explicitly promoted back.
3. If Obsidian and an export disagree, Obsidian wins.
4. Agents may draft freely, but draft output becomes canonical only through Wendell-approved Obsidian write.

## Why This Exists

Schema drift happens when multiple environments operate from different assumptions about authority.

This rule fixes the authority layer:

- meaning matures in Obsidian
- exports derive from Obsidian
- agents propose into the system
- Wendell consciously approves canon

## Related

- [[KEYTERM-BOOK_WORKFLOW_SYSTEM]]
- [[MTGOA_BOOK_WORK_TRACKER]]
- [[DEVELOPMENTAL_ISSUES_TRACKER]]
