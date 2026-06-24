# Spec Kit Prompt: Go Deeper (Superpower Funnel)

## Role

You wire the existing superpower technique library into a player-facing "Go Deeper" feature on the Allyship Deck, plus the funnel that feeds it (free quiz → deck purchase incl. inner pack → outer-pack upsell).

## Objective

Implement per [.specify/specs/go-deeper/spec.md](../specs/go-deeper/spec.md). API-first: loadout/entitlement helpers + three server actions before UI. Reuse auth, entitlements, deck UI, technique library. Only schema change = three additive `Player` fields.

## Requirements

- **Loadout**: `Player.superpowerInner/Outer/quizCompletedAt`; `getPlayerLoadout`, `getOwnedSuperpowers`; `saveSuperpowerLoadout` with **deferred inner-pack grant** (on save, if `deck-digital` held, grant `superpower-<inner>-pack`, idempotent).
- **Quiz**: free, anonymous, pair-producing (`scoreQuiz → {inner, outer}`, two sub-scales); result page + "log in to save"; entry points = landing hook + onboarding + lazy at Go Deeper.
- **SKUs**: `superpower-<x>-pack` ×6 + `loadout-bundle` in `offers.ts`/`grants.ts`; capability → Superpower map.
- **Go Deeper**: `getCardGoDeeper(cardId, subject)` → owner content (published, highest level) | citation + upsell | needsQuiz; overlay affordance shown only when a published card exists; non-owners get an inline Paywall upsell (outer pack / bundle).
- **Gates**: login to save loadout; ownership (server-derived from entitlements) to see content; `citeSuperpowerMove` for the locked path (no content leak).
- **Verification quest** `cert-go-deeper-v1` (required UX feature).

## Deliverables

- [ ] `prisma` Player fields + `player_superpower_loadout` migration
- [ ] `src/lib/player-entitlements/loadout.ts`; `BASE_POOL` export
- [ ] `src/actions/superpower.ts` (`saveSuperpowerLoadout`), `src/actions/deck-techniques.ts` (`getCardGoDeeper`)
- [ ] `src/lib/superpowers/quiz.ts` + `src/components/superpowers/SuperpowerQuiz.tsx`
- [ ] `src/lib/launch/offers.ts` + `grants.ts` (packs + bundle)
- [ ] `src/components/deck/GoDeeper.tsx` wired into `AllyshipDeckReader`
- [ ] `cert-go-deeper-v1` Twine + seed; `BACKLOG.md` + `npm run backlog:seed`

## Reference

- Spec/Plan/Tasks: `.specify/specs/go-deeper/`
- Superpower decks + quality: `.specify/specs/superpower-move-decks/`, `.specify/specs/superpower-deck-quality/`
- Deck UI: `src/components/deck/AllyshipDeckReader.tsx`; Auth: `src/lib/auth.ts`; Entitlements: `src/lib/entitlements/*`, `src/lib/launch/*`
- Library: `src/lib/technique-library/` (`resolveTechniques`, `superpowers/pools.ts`, `superpowerDeck`/`publishedDeck`)
