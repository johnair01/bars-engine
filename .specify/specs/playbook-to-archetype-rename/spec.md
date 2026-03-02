# Spec: Playbook → Archetype Terminology Rename

## Purpose

Rename "playbook" to "archetype" throughout the codebase so terminology aligns with game language. The 8 I Ching playbooks (The Bold Heart, The Devoted Guardian, etc.) are presented to players as "archetypes"; the codebase currently uses "playbook" as the technical term.

## Rationale

- **Game language consistency**: Handbook, UI, and narrative use "archetype." Code and schema use "playbook," causing confusion for contributors and inconsistency in docs.
- **User-facing alignment**: Admin Sprite Assets, docs, and specs should use "archetype" where the concept is described to humans.
- **Lower priority**: Non-urgent refactor; no functional change. Defer until higher-priority work is done.

## Scope

### In scope

| Area | Current | Target |
|------|---------|--------|
| Prisma model | `Playbook` | `Archetype` |
| Prisma table | `playbooks` | `archetypes` |
| Player relation | `playbookId`, `playbook` | `archetypeId`, `archetype` |
| AvatarConfig | `playbookKey` | `archetypeKey` |
| PartLayer | `playbook_outfit`, `playbook_accent` | `archetype_outfit`, `archetype_accent` |
| Sprite paths | `playbook_outfit/`, `playbook_accent/` | `archetype_outfit/`, `archetype_accent/` |
| API/actions | `playbookId`, `playbookKey`, etc. | `archetypeId`, `archetypeKey`, etc. |
| Docs/specs | "playbook" in prose | "archetype" |
| UI labels | "playbook outfit", "playbook accent" | "archetype outfit", "archetype accent" |

### Out of scope

- Story node IDs (e.g. `BB_SetPlaybook_*`) — optional; can keep for backward compatibility or rename in a follow-up
- External references (LPC, third-party docs)

## Migration Strategy

1. **Schema**: Rename `Playbook` → `Archetype`, `playbooks` → `archetypes`; rename `playbookId` → `archetypeId` on Player and other models. Prisma migration.
2. **Sprite directories**: Rename `playbook_outfit/` → `archetype_outfit/`, `playbook_accent/` → `archetype_accent/`. Move or symlink existing assets.
3. **Code**: Global find-replace with manual review for context (playbook → archetype, Playbook → Archetype, playbookKey → archetypeKey, etc.).
4. **Docs/specs**: Update prose to use "archetype."
5. **terminology.md**: Document Archetype (user-facing) = Playbook (legacy); after rename, Archetype is canonical everywhere.

## Functional Requirements

- **FR1**: Prisma schema MUST use `Archetype` model, `archetypes` table, `archetypeId` on Player.
- **FR2**: AvatarConfig JSON MUST use `archetypeKey` (not `playbookKey`).
- **FR3**: PartLayer MUST include `archetype_outfit` and `archetype_accent`; sprite paths MUST use `archetype_outfit/` and `archetype_accent/`.
- **FR4**: All code, actions, and API references MUST use archetype terminology.
- **FR5**: Docs and specs MUST use "archetype" in prose; technical identifiers may be `archetypeKey`, `archetypeId`, etc.
- **FR6**: Migration MUST preserve existing data; no loss of player-archetype associations.

## Non-Functional Requirements

- Idempotent migration; safe to re-run seed scripts after migration.
- Update `.agent/context/terminology.md` with canonical Archetype usage.

## Reference

- terminology.md: [.agent/context/terminology.md](../../.agent/context/terminology.md)
- avatar-parts: [src/lib/avatar-parts.ts](../../src/lib/avatar-parts.ts)
- Prisma schema: [prisma/schema.prisma](../../prisma/schema.prisma)
