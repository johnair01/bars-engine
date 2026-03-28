# Plan: Character Creator v2

## Architecture

Builds on the v1 foundation (branch `ooo/run/character-creator`): `PlayerPlaybook` model already has `shareToken`, `playerAnswers`, `playbookMoves`, `playbookBonds` fields. No new schema migration needed. The key additions are:

1. A **discovery question layer** — shared questions answered before archetype selection, computing resonance scores per named archetype
2. **Trigram exclusion** — queries filter to player-facing archetypes only (`isPlayerFacing: true` or name allowlist)
3. **2-of-4 move picks** — wizard steps for archetype moves (4 stored in template) + nation moves (4 from `NationMove`)
4. **Resonance scoring** — purely rules-based weighted sum; no AI at creation time

The wizard is a multi-step React component at `/character-creator/[archetypeId]/CharacterCreatorWizardV2.tsx`. Discovery questions and archetype weights live in `Adventure.playbookTemplate` JSON (the GM-authored configuration).

## File Impact

### New Files

| File | Purpose |
|------|---------|
| `src/lib/character-creator/resonance-scoring.ts` | `computeResonanceScores(answers, templates): ArchetypeScore[]` — weighted sum per named archetype |
| `src/lib/character-creator/discovery-questions.ts` | `getDiscoveryQuestions(templates): DiscoveryQuestion[]` — merged from active CHARACTER_CREATOR Adventures |
| `src/app/character-creator/DiscoveryQuestionnaire.tsx` | Shared discovery questions UI before archetype grid |
| `src/app/character-creator/[archetypeId]/CharacterCreatorWizardV2.tsx` | Full wizard: discovery confirm → archetype-specific Qs → move picks (2-of-4 archetype + 2-of-4 nation) → complete |
| `src/app/admin/adventures/[id]/CharacterCreatorTemplateEditorV2.tsx` | GM editor: per-answer archetype weights; archetype-specific questions; 4 move texts |

### Modified Files

| File | Change |
|------|--------|
| `src/actions/playbook-cyoa.ts` | Add `getArchetypeResonanceScores`, `getCharacterCreatorDiscoveryQuestions`; update `saveCharacterPlaybook` to include `chosenMoveIds` + `chosenNationMoveIds` |
| `src/app/character-creator/page.tsx` | Add discovery questionnaire before archetype grid; display resonance scores on archetype cards; filter to player-facing archetypes only (no trigrams) |
| `src/app/character-creator/[archetypeId]/page.tsx` | Replace v1 wizard with `CharacterCreatorWizardV2` |
| `src/app/admin/adventures/[id]/page.tsx` | Wire in `CharacterCreatorTemplateEditorV2` for `CHARACTER_CREATOR` adventures |
| `src/app/character/[shareToken]/page.tsx` | Extend to show chosen moves + discovery answers (no PII) |

## Key Patterns

- **Discovery layer before grid**: `/character-creator` renders `DiscoveryQuestionnaire` first. After answering, archetype grid shows with resonance scores overlaid as visual indicator. No hard gates — player can still pick any archetype.
- **Trigram exclusion is a query filter**: Archetypes with player-facing names (Truth Seer, Bold Heart, etc.) are fetched by name allowlist or `isPlayerFacing` flag. Trigrams never returned to player-facing routes.
- **Resonance scoring is pure function**: `computeResonanceScores(answers, templates)` takes discovery answers and question weight configs from `Adventure.playbookTemplate` JSON. Returns sorted `ArchetypeScore[]`. No DB write at score-time.
- **2-of-4 picks stored as IDs**: `saveCharacterPlaybook` receives `chosenMoveIds: string[]` (exactly 2) and `chosenNationMoveIds: string[]` (exactly 2). Stored in `PlayerPlaybook.playbookMoves` JSON.
- **Nation moves require nationId**: If `player.nationId` is null, wizard prompts nation selection before nation move step. Nation moves come from `NationMove` table filtered by nationId.
- **No AI at creation time**: All moves are GM-authored text in archetype templates. Discovery question weights are GM-configured numbers. Fully deterministic.

## Dependencies

- `PlayerPlaybook` model (v1 migration applied — `shareToken`, `playerAnswers`, `playbookMoves`, `playbookBonds` all present)
- `Archetype` records with 8 named archetypes (already seeded in v1)
- `Adventure` model with `adventureType=CHARACTER_CREATOR` + `playbookTemplate` JSON (v1 structure)
- `NationMove` table — 4 moves per nation
- `src/actions/playbook-cyoa.ts` — existing v1 action surface
- `src/lib/auth.ts` — `getCurrentPlayer()`
