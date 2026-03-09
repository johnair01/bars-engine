# Plan: Transformation Encounter Geometry v0

## Overview

Define encounter geometry—the 3-axis interaction space (Hide↔Seek, Truth↔Dare, Interior↔Exterior) that structures how transformation interactions unfold. The cube provides **encounter classification** independent of moves and templates.

## Phases

### Phase 1: Documentation
- [x] Architecture doc
- [x] Example doc

### Phase 2: Implementation
- [x] types.ts
- [x] encounter-types.ts (8 types, move alignment, nation/archetype biases)
- [x] services.ts
- [x] index.ts
- [x] __tests__/encounter-geometry.test.ts

### Phase 3: Integration (Future)
- [ ] Wire Narrative Transformation Engine to encounter selection
- [ ] Wire quest template selection to preferred geometry
- [ ] Use geometry in assembleQuestSeed flow

## Dependencies

- Transformation Move Registry (FK)
- Nation Move Profiles (EF)
- Archetype Move Styles (EG)
