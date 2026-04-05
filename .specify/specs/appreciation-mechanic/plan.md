# Plan: Appreciation Mechanic

## Summary

Implement `sendAppreciationAction` — transfer vibeulons to player or quest creator with structured appreciation (courage, care, clarity, support, creativity, completion). Optional appreciation BAR for feed. API-first, no new models.

## Approach

1. **Reuse economy layer**: Extract shared transfer logic or call transferVibulons with metadata. VibulonEvent `source: 'appreciation'` for audit.
2. **Single action**: `sendAppreciationAction` does validation, recipient resolution, transfer, optional BAR creation in one transaction.
3. **UI**: Add "Appreciate" to QuestDetailModal; optional wallet action.
4. **CustomBar**: type `appreciation` already in system-bar-interaction-layer; add creation path.

## Dependencies

- economy.ts (transferVibulons)
- CustomBar (existing)
- VibulonEvent (existing)

## Out of Scope (v1)

- getAppreciationFeed (Phase 2)
- Appreciation in Movement Feed (Phase 2)
- Route Handler (no external consumers)
