# Plan: Transformation Move Registry v0

## Overview

Create the canonical registry of 8 transformation moves (Observe, Name, Externalize, Reframe, Invert, Feel, Experiment, Integrate) as machine-readable objects. The registry bridges narrative parsing, emotional alchemy, nation/archetype overlays, quest generation, and BAR capture.

## Phases

### Phase 1: Documentation
- [x] Architecture doc (transformation-move-registry.md)
- [x] Example registry entries (Observe, Feel, Experiment)
- [x] Quest seed assembly example

### Phase 2: Implementation
- [x] types.ts — schema types
- [x] registry.ts — canonical 8 moves
- [x] services.ts — filter, render, assembleQuestSeed
- [x] index.ts — public API
- [x] __tests__/registry.test.ts

### Phase 3: Integration (Future)
- [ ] Wire Narrative Transformation Engine to registry for move selection
- [ ] Wire quest generation to assembleQuestSeed
- [ ] Nation/archetype compatibility weighting

## Dependencies

- Narrative Transformation Engine (ED)
- Transformation Move Library (EE)
- Nation Move Profiles (EF)
