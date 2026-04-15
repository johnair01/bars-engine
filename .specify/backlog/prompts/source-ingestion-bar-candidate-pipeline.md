# Spec Kit Prompt: Source Ingestion + BAR Candidate Pipeline

## Role

You are a Spec Kit agent implementing the Source Ingestion + BAR Candidate Pipeline: PDF and long-form documents as inspiration inputs, metabolized into BAR candidates, extension prompts, and quest seeds—with provenance, curation, and deftness hooks.

## Objective

Implement per [.specify/specs/source-ingestion-bar-candidate-pipeline/spec.md](../specs/source-ingestion-bar-candidate-pipeline/spec.md). This is not generic summarization. The system helps convert source material into living BARs, promptable seeds, quest templates, and curated library artifacts—preserving provenance and supporting human curation.

## Requirements

- **Ontology**: Source Document → Source Excerpt → BAR Candidate | Extension Prompt | Quest Seed; lineage edges; metabolizability scoring; genre-aware analysis
- **Surfaces**: /admin/source-ingestion (upload, parse, analyze, review candidates, approve/mint)
- **Persistence**: SourceDocument, SourceExcerpt, BarCandidate, ExtensionPrompt, QuestSeed, SourceLineageEdge
- **Deftness**: Interface + stubs for evaluateExcerptSelection, evaluateCandidateGeneration, evaluateExtensionPrompt, evaluateQuestSeed, evaluateCurationAction, evaluateLineageIntegrity
- **Curation**: Review states; approve → mint CustomBar; save as extension prompt; save as lore; reject

## Deliverables

- [ ] Schema (SourceDocument, SourceExcerpt, BarCandidate, ExtensionPrompt, QuestSeed, SourceLineageEdge)
- [ ] Services: source-document, source-excerpt, bar-candidate, extension-prompt, quest-seed, source-lineage, source-analysis, source-ingestion, curation, deftness
- [ ] Genre profiles (NONFICTION, PHILOSOPHY, FICTION, MEMOIR, PRACTICAL, CONTEMPLATIVE)
- [ ] Admin /admin/source-ingestion page
- [ ] Mint CustomBar from approved BarCandidate with lineage
- [ ] Verification steps

## Game Language

Use: Source Document, Source Excerpt, BAR Candidate, Extension Prompt, Quest Seed, Metabolizability, Lineage, Deftness.
