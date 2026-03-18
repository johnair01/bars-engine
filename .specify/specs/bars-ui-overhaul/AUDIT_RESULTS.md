# BARs Audit Results

**Run**: `npx tsx scripts/with-env.ts "npx tsx scripts/audit-bars.ts"`

## Summary

| Metric | Result |
|--------|--------|
| Total type='bar' BARs | 75 |
| Title ≠ first line of description | 73 |
| Invitation BARs | 0 |
| Kernel BARs (Instance.kernelBarId) | Column not in DB |
| QuestProposals | 0 |

## Findings

1. **Title/description mismatch**: 73 of 75 BARs have explicit titles that differ from the first line of content. Per design, we now show `description` as primary in the UI. The `title` remains in the DB for admin, search, merge. **No remediation needed** — content-first is intentional.

2. **Invitation BARs**: None in this DB. When present, they are created by forge flow with specific title/description. Display uses bar fields; no change needed.

3. **Kernel BARs**: `kernelBarId` column not present in this DB (migration may not be applied). When present, kernel BAR display should use `description` for content, `title` for short label if needed.

4. **QuestProposal**: Zero proposals. Bar-quest-generation uses `bar.title` and `bar.description`; both remain populated. Collapse flow will set both when creating BAR from quest.

## Recommendation

- **No migration or remediation** required.
- Continue deriving title from first line for new BARs.
- Display `description` as primary; use `title` only for admin/short labels.
