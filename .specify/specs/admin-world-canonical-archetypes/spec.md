# Spec: Admin World — Canonical Archetypes Only

## Purpose

Fix the Admin World page (`/admin/world`) showing twice as many archetypes as intended. Some entries display trigram-only names (e.g. "Heaven (Qian)", "Lake (Dui)"); others display the correct archetype names (e.g. "The Bold Heart", "The Joyful Connector"). Only the 8 canonical archetypes with full names should appear.

## Problem

- **Symptom**: Admin World Archetypes section shows ~16 entries instead of 8.
- **Root cause**: Two seed sources populate the `playbooks` table with different naming conventions:
  1. **seed-narrative-content.ts** — Creates playbooks with trigram names: "Heaven (Qian)", "Earth (Kun)", "Thunder (Zhen)", "Wind (Xun)", "Water (Kan)", "Fire (Li)", "Mountain (Gen)", "Lake (Dui)". Description contains archetype name.
  2. **seed-utils.ts** (prisma/seed.ts) — Creates playbooks with archetype names: "The Bold Heart", "The Devoted Guardian", "The Decisive Storm", "The Danger Walker", "The Still Point", "The Subtle Influence", "The Truth Seer", "The Joyful Connector".

- **Result**: Production DB may have both sets. Admin World displays all playbooks, causing duplication and confusion.

## Design Decision

| Topic | Decision |
|-------|----------|
| Display filter | `getAdminWorldData` returns only playbooks whose `name` is in the canonical archetype list. |
| Canonical list | The 8 archetype names from seed-utils / PLAYBOOK_TRIGRAM: The Bold Heart, The Devoted Guardian, The Decisive Storm, The Danger Walker, The Still Point, The Subtle Influence, The Truth Seer, The Joyful Connector. |
| Data migration | Out of scope for this fix. Trigram-named playbooks remain in DB; they are filtered from Admin World display. Future: consolidate seeds or add `isCanonical` field. |

## Functional Requirements

- **FR1**: Admin World page MUST display exactly 8 archetypes: The Bold Heart, The Devoted Guardian, The Decisive Storm, The Danger Walker, The Still Point, The Subtle Influence, The Truth Seer, The Joyful Connector.
- **FR2**: `getAdminWorldData` MUST filter playbooks by canonical archetype names. Use a single source-of-truth constant (e.g. `CANONICAL_ARCHETYPE_NAMES`).
- **FR3**: Other consumers of `getAdminWorldData` (Admin Players, Admin Avatars, AssignAvatarForm, etc.) MUST receive the same filtered list for consistency.
- **FR4**: No schema changes. No migration. Filter at query/application layer.

## Implementation

1. Add `CANONICAL_ARCHETYPE_NAMES` constant (e.g. in `src/lib/game/nations.ts` or new `src/lib/canonical-archetypes.ts`).
2. Update `getAdminWorldData` to filter playbooks: `where: { name: { in: CANONICAL_ARCHETYPE_NAMES } }`.
3. Verify Admin World, Admin Players, Admin Avatars, and AssignAvatarForm all use the filtered list.

## References

- [archetype-key-reconciliation.md](../../docs/architecture/archetype-key-reconciliation.md)
- [iching-alignment.ts](../../src/lib/iching-alignment.ts) — PLAYBOOK_TRIGRAM
- [seed-utils.ts](../../src/lib/seed-utils.ts) — canonical playbook names
- [seed-narrative-content.ts](../../scripts/seed-narrative-content.ts) — trigram-named playbooks
