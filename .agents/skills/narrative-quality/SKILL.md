---
name: narrative-quality
description: Improves narrative quality by learning from admin feedback. Uses .feedback/narrative_quality.jsonl and KB (Voice Style Guide, emotional-alchemy) to train prompts. Use when generating quest prose, auditing output, reviewing narrative feedback, or updating the style guide.
---

# Narrative Quality Skill

Trains over time from admin feedback. The system audits itself as it learns what admins find acceptable.

## When to Use

- Generating quest prose (compileQuestWithAI, generateQuestOverviewWithAI)
- Auditing generated output before publish
- Reviewing narrative feedback or triaging narrative_quality.jsonl
- Updating Voice Style Guide or KB content
- User mentions narrative quality, story quality, "taste good", engaging prose

## Feedback Loop

```
Generate → Admin reviews (Accept / Needs work / edit) → Feedback logged
→ Skill ingests .feedback/narrative_quality.jsonl + KB
→ Next generation uses learned patterns
```

## How to Use Feedback

### 1. Read Recent Feedback

```bash
tail -n 50 .feedback/narrative_quality.jsonl
```

Parse: `type`, `rating`, `before`, `after`, `tags`, `feedback`.

### 2. Build Prompt Context

- **Accept examples**: Entries with `rating: "accept"` or `type: "edit"` with meaningful `after` — use as few-shot "good" examples
- **Anti-patterns**: Entries with `rating: "needs_work"` or `"reject"` — extract tags (too_corporate, nonsensical, etc.) and feedback text; add to prompt as "avoid"
- **Edit diffs**: `before`/`after` show what was wrong and what admin preferred — strong training signal

### 3. Incorporate KB

- Read [Voice Style Guide](/wiki/voice-style-guide) — presence first, confident, economical
- Read [Emotional Alchemy](/wiki/emotional-alchemy) — ontology for moves and arcs
- KB content + feedback = training corpus for the skill

### 4. Audit Mode

When reviewing generated prose:
- Compare to recent "accept" examples — does it match the tone?
- Check against "needs_work" tags — does it avoid those patterns?
- Flag drift: corporate, therapeutic, over-explanatory, nonsensical

## Logging New Feedback

When admin uses Accept / Needs work / Log as feedback:
- Action `logNarrativeQualityFeedback` appends to `.feedback/narrative_quality.jsonl`
- Schema: see [reference.md](reference.md)

Do not duplicate logging — the UI and updatePassage handle it.

## Reference

- Schema and prompt patterns: [reference.md](reference.md)
- Action: [src/actions/narrative-quality-feedback.ts](../../src/actions/narrative-quality-feedback.ts)
- Doc: [docs/NARRATIVE_QUALITY_FEEDBACK.md](../../docs/NARRATIVE_QUALITY_FEEDBACK.md)
