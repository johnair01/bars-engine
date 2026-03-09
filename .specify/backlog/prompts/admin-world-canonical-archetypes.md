# Prompt: Admin World — Canonical Archetypes Only

Implement per [.specify/specs/admin-world-canonical-archetypes/spec.md](../specs/admin-world-canonical-archetypes/spec.md).

**Problem**: Admin World (`/admin/world`) shows twice as many archetypes. Some are trigram-only (Heaven (Qian), Lake (Dui)); others are correct (The Bold Heart, The Joyful Connector). Only the 8 canonical archetypes should appear.

**Fix**: Filter `getAdminWorldData` playbooks by canonical archetype names. Add `CANONICAL_ARCHETYPE_NAMES` constant; use `where: { name: { in: CANONICAL_ARCHETYPE_NAMES } }` for playbook query.

**Verification**: `npm run build` and `npm run check` pass. Admin World shows 8 archetypes.
