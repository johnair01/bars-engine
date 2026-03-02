# Plan: Book Analysis Schema Fix

## Summary

Change `allyshipDomain` in the analysis Zod schema from `.optional().nullable()` to `.nullable()` so it is required (present in every quest) but may be `null`. This satisfies OpenAI's strict schema requirement.

## Implementation

In [src/actions/book-analyze.ts](../../src/actions/book-analyze.ts), line 21:

**Before**:
```ts
allyshipDomain: z.enum(ALLYSHIP_DOMAINS).optional().nullable().describe('...'),
```

**After**:
```ts
allyshipDomain: z.enum(ALLYSHIP_DOMAINS).nullable().describe('Essential domain (WHERE). When multiple apply, choose the primary one. Null if purely individual with no clear collective context.'),
```

No other changes needed. The `q.allyshipDomain ?? null` at line 121 already handles null/undefined.

## File impacts

| Action | Path |
|--------|------|
| Modify | src/actions/book-analyze.ts (1 line) |

## Verification

1. Run Trigger Analysis on a book with extracted text
2. Confirm no schema error; quests are created
3. Confirm quests with null allyshipDomain are stored correctly
