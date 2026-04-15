# Prompt: Book Quest Targeted Extraction v0

**Use this prompt when implementing targeted book quest extraction with TOC and dimension mapping.**

## Context

Book-derived quests need organization by move, nation, archetype, and Kotter stage. TOC extraction maps book structure to game dimensions. Targeted analysis pulls exactly what's needed—saving tokens and illuminating what the game can metabolize.

## Prompt text

> Implement the Book Quest Targeted Extraction spec per [.specify/specs/book-quest-targeted-extraction/spec.md](../specs/book-quest-targeted-extraction/spec.md). Add TOC extraction (extractTocFromText, heuristic patterns); section→dimension mapping (move, nation, archetype, Kotter keywords); heuristic classifiers (suggestMove, suggestNation, suggestKotterStage, suggestArchetype); parameterized analyzeBook(bookId, options?) with AnalysisFilters; rich metadata schema (nation, archetype, kotterStage, lockType). Skip irrelevant sections when filters + TOC. Admin UI: Extract TOC button, analysis filter controls.

## Checklist

- [ ] Phase 1: TOC extraction (extractTocFromText, chunkBookTextWithToc, Extract TOC button)
- [ ] Phase 2: Section → dimension mapping (mapSectionsToDimensions, keyword sets)
- [ ] Phase 3: Heuristic classifiers (suggestMove, suggestNation, suggestKotterStage, suggestArchetype)
- [ ] Phase 4: Parameterized analysis (analyzeBook filters, targeted prompt, admin UI)
- [ ] Phase 5: Rich metadata and schema (extend Zod, CustomBar, Quest Library filters)
- [ ] Phase 6: Skip irrelevant sections (section filter + heuristic filter)
- [ ] npm run build and npm run check

## Reference

- Spec: [.specify/specs/book-quest-targeted-extraction/spec.md](../specs/book-quest-targeted-extraction/spec.md)
- Plan: [.specify/specs/book-quest-targeted-extraction/plan.md](../specs/book-quest-targeted-extraction/plan.md)
- Tasks: [.specify/specs/book-quest-targeted-extraction/tasks.md](../specs/book-quest-targeted-extraction/tasks.md)
