# Tasks: Provenance Stamp System

## Phase 1 — Schema + resolver

- [ ] **T1.1** Add `creatorNationKey String?` and `creatorArchetypeKey String?` to `CustomBar`
  model in `prisma/schema.prisma`. These are set at BAR creation and never mutated.
- [ ] **T1.2** In BAR creation server action: populate `creatorNationKey` from
  `player.nation.slug` and `creatorArchetypeKey` from `player.archetype?.slug` at write time.
- [ ] **T1.3** Run `npm run db:sync` to push schema changes.
- [ ] **T1.4** Implement `resolveProvenanceStamp(config: AvatarConfig): ProvenanceStampConfig`
  in `src/lib/avatar-utils.ts`. Returns `{ nationSigilUrl, archetypeMarkUrl, elementColor }`.
  Returns null gracefully when nationKey or archetypeKey is absent.

## Phase 2 — Asset design + generation

- [ ] **T2.1** Design 5 nation sigil glyphs at 24×24px. Pixel art, hard-edged.
  White (#FFFFFF) fill on transparent RGBA background (color applied at render time).
  Validate legibility at 16px before committing.
  Target: `public/sprites/sigils/nation/{pyrakanth,lamenth,virelune,argyra,meridia}.png`
- [ ] **T2.2** Design 8 archetype marks at 16×16px. Same RGBA + white fill convention.
  Target: `public/sprites/sigils/archetype/{bold-heart,...}.png`
- [ ] **T2.3** Add `scripts/validate-sprite-layers.ts` check for sigil files: RGBA, correct
  dimensions, no solid backgrounds. (Extends the validation from LW-9.)

## Phase 3 — BAR card integration

- [ ] **T3.1** In `BarCardFace.tsx`: accept `creatorNationKey` and `creatorArchetypeKey` props
  (passed from the BAR record). Build AvatarConfig from these. Call `resolveProvenanceStamp()`.
- [ ] **T3.2** Render the stamp chip in the bottom-left corner of the card using the returned
  `nationSigilUrl` and `archetypeMarkUrl`. Apply element color via CSS filter.
- [ ] **T3.3** When creator fields are absent (old BARs, anonymous): render nation sigil alone
  if nationKey known, or nothing if both absent.
- [ ] **T3.4** Update all `BarCardFace` call sites to pass creator fields from the BAR record.

## Phase 4 — Trade panel + encounter integration

- [ ] **T4.1** In `TradePanel.tsx` (LW-4): render provenance stamps side-by-side for offered
  and received BARs. Layout: player's stamp left, agent's stamp right.
- [ ] **T4.2** In `IntentAgentPanel.tsx` (LW-4/LW-5): render agent's provenance stamp in the
  encounter panel header alongside name and element ring. Compact format (20px + 14px).
- [ ] **T4.3** In Vault received BAR display: show original creator stamp. Distinguish visually
  from the player's own BARs (e.g. "received from 火◈" label beneath stamp).

## Phase 5 — Quest card integration

- [ ] **T5.1** In quest card components (`QuestThread.tsx`, `QuestPack.tsx`): if quest has
  a source BAR with creator fields, render provenance stamp in card corner.
- [ ] **T5.2** For quests without a source BAR (GM-authored): show the GM's nation stamp if
  the authoring player has nation+archetype set.

## Verification

- [ ] **V.1** BAR card shows correct nation sigil + archetype mark for the creator.
- [ ] **V.2** Received BAR in Vault shows CREATOR's stamp, not the recipient's.
- [ ] **V.3** Trade panel shows two stamps side-by-side — visually distinguishable.
- [ ] **V.4** Stamps render at both full size (card) and compact size (encounter panel).
- [ ] **V.5** All 13 sigil/mark files pass `validate-sprite-layers` checks (RGBA, correct dimensions).
- [ ] **V.6** `npm run build` + `npm run check` pass with 0 new errors after each phase.
