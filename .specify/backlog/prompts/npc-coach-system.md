# Spec Kit Prompt: NPC Coach System

## Role

You are a Spec Kit agent implementing the **NPC Coach System**: library-derived content surfaces as **in-world mentors** (nation + archetype + Game Master Face), while **real-world sources stay hidden provenance** until unlock conditions. Work **API-first** — implement the contracts in the spec before building UI shells.

## Objective

Implement per [.specify/specs/npc-coach-system/spec.md](../specs/npc-coach-system/spec.md).

**Codex (authoring)**: [.specify/specs/npc-coach-system/codex/](../specs/npc-coach-system/codex/) — `npc_codex_seed.json`, `npc_codex_review.md`, `npc_codex_workflow_spec.md` (keep seed + review in sync; import seed → `SourceCoachRecord`).

**Depends on**: [Book-to-Quest Library](../specs/book-to-quest-library/spec.md) (`Book`, `QuestThread`, library threads). Coaches bind via `QuestThread.npcCoachId` and optional admin flows.

## Requirements

- **API-first**: Typed Server Actions for every contract in the spec (`src/lib/npc-coach/types.ts`, `src/actions/npc-coach.ts`). No player-facing surface may expose `SourceCoachRecord.sourceName` before `getProvenancePayload` returns `unlocked`.
- **Persistence**: `SourceCoachRecord`, `NPCCoach`, `PlayerCoachProvenance`, additive `QuestThread.npcCoachId` — see spec tables; run `npm run db:sync` after schema changes.
- **Character names**: `NPCCoach.displayName` is **assigned** in-world names (from codex `npcNamePlaceholder` → approved name); never use real-world `sourceName` as display.
- **Home gates**: `homeAccessRule` + `homeNationKey` / `homeArchetypeId` — coaches for matching nation and/or archetype **or** introduced via **BAR share** to that campaign.
- **Share vs mastery**: Sharing **unlocks introduction** for the invitee; **basic mastery** in the coach’s nation or archetype is required for **full** use (`accessTier`: full vs `shared_intro`) — D&D “know spell vs cast spell” (see spec).
- **BAR share**: Pass `sharedCampaignContext` into coach listing when relevant; resolve mastery server-side.
- **Agents**: In-game content agents must follow the same codex + spec pipeline as human admins when generating this asset class (see spec “Authoring parity”).
- **Canonical GM Faces**: Shaman, Challenger, Regent, Architect, Diplomat, Sage only — validate server-side on write.
- **Routing**: `listNPCCoachesForPlayer` returns a short list (e.g. 2–4), not all sources; use nation, archetype, face, allyship, daemon/charge signals as spec’d.
- **Provenance**: `recordProvenanceUnlock` is the single choke point from quest completion / daemon / vibeulon hooks.
- **Admin**: CRUD for source rows + NPC shells, bind coach to thread, optional batch classify; `simulateCoachRouting` for QA.

## Deliverables

- [ ] Prisma models + migration (`npm run db:sync`)
- [ ] `src/lib/npc-coach/types.ts` (+ Zod where useful)
- [ ] `src/lib/npc-coach/routing.ts`
- [ ] `src/actions/npc-coach.ts` (all contracts from spec)
- [ ] Hooks from quest/thread completion → `recordProvenanceUnlock` (configurable)
- [ ] Minimal admin UI or seed path for codex JSON import
- [ ] Tests: routing + provenance gate (no source name in public responses)

## Game Language

Use: **nations** (emotional alchemy), **archetypes** (canonical list from DB), **GM Face** (six faces), **allyship domains** on quests, **daemon / charge** where gating applies. In-world **display names** for coaches; real names only in admin and in `getProvenancePayload` after unlock.

## Out of scope (v1)

Per spec non-goals: full conversational AI per coach, perfect auto-classification without review, public Route Handlers unless explicitly added to the spec later.
