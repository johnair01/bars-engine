# Plan: Go Deeper (Superpower Funnel)

> Implement per [.specify/specs/go-deeper/spec.md](spec.md). API-first: the loadout + entitlement helpers and the three server actions ship before UI. Reuse auth, entitlements, deck UI, and the technique library; the only schema change is three additive `Player` fields.

## Strategy

Five slices, each shippable. Slice 1 (loadout + deferred grant + BASE_POOL) is pure server/data and unblocks everything. Slice 4 (Go Deeper) is the payoff but depends on 1–3. The quiz (Slice 2) is the one genuinely new sub-feature and the riskiest content-wise — keep its scoring pure and authorable. Ship behind the existing entitlement gates so nothing leaks.

## File impacts

```
prisma/schema.prisma                         # +Player.superpowerInner/Outer/quizCompletedAt  (Slice 1)
prisma/migrations/…player_superpower_loadout # additive migration                            (Slice 1)
src/lib/player-entitlements/loadout.ts       # getPlayerLoadout, getOwnedSuperpowers          (Slice 1)
src/lib/technique-library/index.ts           # export BASE_POOL (canonical base pool)          (Slice 1)
src/actions/superpower.ts                     # saveSuperpowerLoadout (+ deferred inner grant) (Slice 1)
src/lib/superpowers/quiz.ts                   # QUIZ_QUESTIONS + scoreQuiz (pure)              (Slice 2)
src/components/superpowers/SuperpowerQuiz.tsx # anon quiz + result + log-in-to-save           (Slice 2)
  (+ entry points: landing hook, onboarding step, lazy at Go Deeper)
src/lib/launch/offers.ts                      # superpower-<x>-pack ×6 + loadout-bundle        (Slice 3)
src/lib/launch/grants.ts                      # SKU→capability; capability→Superpower          (Slice 3)
src/actions/deck-techniques.ts                # getCardGoDeeper                                (Slice 4)
src/components/deck/GoDeeper.tsx              # overlay affordance (content | upsell | quiz)   (Slice 4)
  (+ wire into AllyshipDeckReader card overlay)
scripts/seed-cyoa-certification-quests.ts (or sibling) # cert-go-deeper-v1                    (Slice 5)
__tests__/                                    # loadout, scoreQuiz, getOwnedSuperpowers, getCardGoDeeper
```

## Key decisions for the implementer
- **Deferred inner-pack grant** lives in `saveSuperpowerLoadout`: after persisting the loadout, `if (await hasCapability(playerId, 'deck-digital')) grantEntitlement({ playerId, sku: superpowerPackSku(inner) })`. Idempotent — safe to call on every save/retake.
- **`getOwnedSuperpowers`** = map the player's active entitlement capabilities to `Superpower[]` (one capability per pack SKU). This is the single source the resolver/citation consume; never trust client.
- **`BASE_POOL`** = the canonical base techniques (substrate + operation techniques), explicitly excluding `superpowers`-tagged pack cards (keep the isolation invariant). `poolWithSuperpowers(BASE_POOL, owned)` composes owned packs in.
- **Published-only + highest level**: `getCardGoDeeper` resolves over the owner's pool but filters to `status:'published'` and returns the highest-`assessQuality` card at the coordinate; if none published → `available:false` (hide the affordance). Non-owners get `citeSuperpowerMove` (coordinate only).
- **Anon path**: `getCurrentPlayer()` may be null → return `needsQuiz`/`needsLogin` variants; never throw in the overlay path.
- **Upsell** = inline Paywall variant; `upsellSku` is the outer pack (or `loadout-bundle`); link to the existing Gumroad funnel — no in-app checkout.
- **Quiz scoring**: two independent sub-scales (inner-axis questions, outer-axis questions); each tallies the six superpowers; `inner = argmax(innerScores)`, `outer = argmax(outerScores)`; deterministic tie-break by `SUPERPOWERS` order.

## Risks / mitigations
| Risk | Mitigation |
|------|------------|
| First Go Deeper paywall-slap | Deck includes inner pack (deferred grant) — self cards always pay off. |
| Thin included content | Gate Go Deeper to published cells; coordinate to publish inner hero cells (superpower-deck-quality Phase 5) for all six before launch, or accept L2 floor. |
| Client claims ownership it lacks | Ownership derived server-side from entitlements only. |
| Quiz feels arbitrary | Author the question→axis mapping deliberately; keep `scoreQuiz` pure + unit-tested; allow retake. |
| Pack cards leaking into base | `BASE_POOL` excludes `sp-*`; existing base-isolation test still guards `CANONICAL_TECHNIQUES`. |

## Verification
- `vitest` — loadout round-trip, deferred-grant logic, `getOwnedSuperpowers` mapping, `scoreQuiz`, `getCardGoDeeper` (owned / locked / needsQuiz).
- `tsx` smoke for `getCardGoDeeper` across a sample loadout.
- `npm run check` + `npm run build` before merge (DB for `db:generate`).
- Verification quest `cert-go-deeper-v1` implemented (Slice 5) — required for the UX feature.
