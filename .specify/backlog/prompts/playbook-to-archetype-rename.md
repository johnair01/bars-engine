# Prompt: Playbook → Archetype Terminology Rename

**Use when aligning codebase terminology with game language: "archetype" instead of "playbook."**

## Context

The 8 I Ching playbooks (The Bold Heart, The Devoted Guardian, etc.) are presented to players as "archetypes." The codebase uses "playbook" (Playbook model, playbookId, playbookKey, playbook_outfit, playbook_accent). This spec renames all playbook references to archetype for consistency.

## Prompt text

> Implement the playbook-to-archetype rename per [.specify/specs/playbook-to-archetype-rename/spec.md](../specs/playbook-to-archetype-rename/spec.md). Rename Prisma model Playbook → Archetype, table playbooks → archetypes; rename playbookId → archetypeId on Player and related models. Rename playbookKey → archetypeKey in AvatarConfig. Rename PartLayer playbook_outfit/playbook_accent → archetype_outfit/archetype_accent; rename sprite directories. Update all code, actions, API, docs, and specs. Preserve data via migration. Update terminology.md.

## Checklist

- [ ] Prisma migration: Playbook → Archetype, playbooks → archetypes
- [ ] Player.playbookId → archetypeId, Player.playbook → archetype
- [ ] AvatarConfig playbookKey → archetypeKey
- [ ] avatar-parts.ts: playbook_outfit → archetype_outfit, playbook_accent → archetype_accent
- [ ] Sprite dirs: playbook_outfit/ → archetype_outfit/, playbook_accent/ → archetype_accent/
- [ ] Admin actions, world.ts, campaign, onboarding, etc.
- [ ] Docs: SPRITE_ASSETS.md, specs, handbook
- [ ] terminology.md: Archetype canonical

## Reference

- Spec: [.specify/specs/playbook-to-archetype-rename/spec.md](../specs/playbook-to-archetype-rename/spec.md)
- Prisma: [prisma/schema.prisma](../../prisma/schema.prisma)
- avatar-parts: [src/lib/avatar-parts.ts](../../src/lib/avatar-parts.ts)
