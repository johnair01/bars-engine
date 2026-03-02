# Spec: Book Analysis — Fix "required" Schema Error

## Purpose

Fix the OpenAI structured-output error when running Book analysis (Trigger Analysis):

```
Invalid schema for response_format 'response': In context=('properties', 'quests', 'items'), 
'required' is required to be supplied and to be an array including every key in properties. 
Missing 'allyshipDomain'.
```

This blocks the Book-to-Quest Library Phase 2 certification flow.

## Root cause

OpenAI's structured output (response_format) enforces strict JSON Schema: when a property exists in `properties`, it must also appear in the `required` array. The current Zod schema uses `allyshipDomain: z.enum(...).optional().nullable()`, which produces a schema where `allyshipDomain` is in properties but not in required. The API rejects this.

**Reference**: [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)

## User story

**As an admin**, I want to run "Trigger Analysis" on an extracted book, so quests are created from the content without schema validation errors.

**Acceptance**: Trigger Analysis completes successfully; quests are created with moveType and allyshipDomain (or null when not applicable).

## Solution

Change `allyshipDomain` from optional+nullable to **required but nullable**:

- **Before**: `z.enum(ALLYSHIP_DOMAINS).optional().nullable()` — property can be omitted
- **After**: `z.enum(ALLYSHIP_DOMAINS).nullable()` — property must be present but can be `null`

The AI will return `null` when no domain applies; the downstream code already handles `q.allyshipDomain ?? null`.

## Functional requirements

- **FR1**: The analysis schema MUST produce valid JSON Schema for OpenAI structured output.
- **FR2**: `allyshipDomain` MUST be present in every quest object; value may be `null` when not applicable.
- **FR3**: Downstream logic (CustomBar creation) MUST continue to accept `null` for allyshipDomain.

## Out of scope

- Changing other schema fields
- Migrating to a different structured-output approach

## Reference

- [src/actions/book-analyze.ts](../../src/actions/book-analyze.ts) — analysisSchema, analyzeBook
