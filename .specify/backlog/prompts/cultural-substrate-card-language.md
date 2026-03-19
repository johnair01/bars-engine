# Cultural Substrate Card Language Pipeline

## The Core Insight

The gap between Hearts Blazing's pop-culture compression ("Get to Da Choppa!") and 
BARs Engine's functional-descriptive naming ("Stabilize Coherence") is not a fixed gap.
It closes as the community plays and writes BARs.

The community's own BARs ARE the cultural substrate. The AI's job is distillation, 
not invention.

## The Pipeline

```
Players write BARs during real allyship work
  ↓
Exemplary BARs tagged by archetype × domain × moveType × nation
  ↓
AI distillation pass per cluster
  ("What phrase from these BARs captures the felt essence of what was happening?")
  ↓
Human curator reviews and approves / edits
  ↓
Second-register card name feeds back into deck template system
```

## What the AI Distillation Pass Produces

For a cluster of, say, all `clean_up` BARs from Truth Seers in organizing contexts:

1. **Second-register card name** — the compression phrase that lives in the body
   (not AI-invented; extracted from the community's own language)
2. **Three contextual expressions** — I (internal), We (interpersonal), Its (systemic)
3. **Episode title candidate** — the mythic register of this cluster
   (the "felt weather" name: "What the Silence Holds", "Coming Back Around")

## Design Implication

The cliche names become **generative targets** for BAR collection, not the other way around.

The game can declare: "We need more show_up BARs from Devoted Guardians who held 
the line in organizing contexts." When enough accumulate, distillation produces 
the authentic phrase — not pop-culture, not AI synthesis, but the community's 
own language, compressed.

## Relationship to Existing Infrastructure

- **Book-analyze pipeline** (inverse): external text → quests → DB
- **Cultural substrate pipeline** (new): player BARs → AI distillation → card language → deck templates

The `book-analyze` action in `src/actions/book-analyze.ts` already does:
  chunk text → extract named moves with type/description/nation

The cultural substrate pipeline does:
  cluster tagged BARs → extract compression phrase + three expressions + episode title

## Schema Considerations

BARs that are "exemplary" and used for cultural substrate distillation need:
- A `isExemplar` flag or curation status (currently no equivalent)
- The distillation results stored back to the deck template (currently templates are static TS files)
- Human approval step before names propagate into production card content

## Backlog Priority

Depends on: sufficient exemplary BAR corpus (needs player base)
Unblocks: authentic second-register names for 15 canonical moves

## Reference

See: `.specify/specs/deck-card-move-grammar/HEARTS_BLAZING_REVIEW.md`
Section: "Three Things Hearts Blazing Has That BARs Does Not" → #1
