# Plan: Allyship Deck Practice Page

## Phase 1: Product Access Resolver

Create a single product access boundary so deck ownership and deeper BARS access do not get conflated.

Impacted files:

- `src/lib/entitlements/product-access.ts` new
- `src/lib/entitlements/__tests__/product-access.test.ts` new
- existing entitlement helpers as needed

Implementation:

1. Define `ProductAccessState = 'anonymous' | 'deck_owner' | 'bars_player' | 'admin'`.
2. Implement `resolveProductAccess()`.
3. Use `deck-digital` for deck access.
4. Use `app-access` for deeper BARS access.
5. Preserve admin bypass.
6. Add tests for all product access states.

## Phase 2: Deck-Only Shell and Route Boundary

Prevent deck-only users from entering the full app while keeping the deck usable.

Impacted files:

- root layout / nav access wiring
- `src/components/deck/DeckOnlyShell.tsx` new or equivalent
- `src/app/deck/layout.tsx`
- route-boundary helper or component for blocked deeper app routes

Implementation:

1. Add deck-only shell for users with `deck-digital` but no `app-access`.
2. Hide global BARS nav for deck-only users.
3. Show deck-local navigation: Draw, Browse, Find Your Path, Practice, Redeem/Account.
4. Add "BARS integration coming soon" notice.
5. Enforce deck-only route allowlist.
6. Show a friendly boundary page when deck-only users manually visit deeper BARS routes.

## Phase 3: Pure Helper

Add deterministic card-to-tool affinity logic.

Impacted files:

- `src/lib/allyship-deck/tool-affinities.ts` new
- `src/lib/allyship-deck/__tests__/tool-affinities.test.ts` new

Implementation:

1. Define `EmotionalAlchemyToolId`, `ToolRating`, and `DeckCardToolAffinity`.
2. Encode move-to-tool ratings from `generic-tool-taxonomy.md`.
3. Encode operation-to-tool affinity.
4. Encode domain-to-tool affinity.
5. Implement `getDeckCardToolAffinities(card)`.
6. Add test coverage for all 120 cards.

## Phase 4: Practice Recommendation Contract

Create the service boundary without committing to UI complexity.

Impacted files:

- `src/lib/allyship-deck/practice-recommendations.ts` new
- `src/lib/allyship-deck/__tests__/practice-recommendations.test.ts` new
- optionally bridge to `src/lib/charge-metabolism/recommendation-service.ts`

Implementation:

1. Define `DeckPracticeMode = 'quick' | 'deep'`.
2. Define `DeckPracticeRecommendationInput`.
3. Define `DeckPracticeRecommendation`.
4. Rank tool candidates using card affinity + emotional vector + blocker.
5. Return selected tool, protocol, expected output kind, and completion criteria.
6. Preserve the rule that emotional vector is supplied by intake, not inferred from the card.

## Phase 4B: Move Card Practice Copy Contract

Create the copy boundary that turns a structured recommendation into playable language without mass-generating full card copy yet.

Impacted files:

- `src/lib/allyship-deck/practice-copy.ts` new
- `src/lib/allyship-deck/__tests__/practice-copy.test.ts` new
- `.specify/specs/allyship-deck-practice-page/move-card-practice-copy-contract.md` new
- `.specify/specs/allyship-deck-practice-page/move-card-practice-copy-samples.md` new

Implementation:

1. Define `DeckPracticeCopy` as the structured copy contract.
2. Infer satisfaction spirit from desired satisfied channel when present.
3. Compose situation summary, vector, tool rationale, protocol intro, step copy, expected output, completion criteria, and public-safe save/share summary.
4. Add review flags for missing vector, missing blocker context, next-tier tools, and internal/external Show Up.
5. Generate a small hostile sample set before attempting full card copy.
6. Fix contract bugs exposed by samples before expanding generation.

## Phase 5: Practice Page Route

Add the standalone practice surface.

Impacted files:

- `src/app/deck/practice/[cardId]/page.tsx` new
- `src/components/deck/DeckPracticePageClient.tsx` new
- `src/components/deck/DeckPracticeModeChooser.tsx` new
- `src/components/deck/DeckPracticeResult.tsx` new

Implementation:

1. Load card by id.
2. Render missing-card state.
3. Render card identity and mode chooser.
4. Quick mode: minimal blocker + orientation intake.
5. Deep mode: current dissatisfaction + desired satisfaction + optional blocker/story.
6. Render recommended tool and executable protocol.
7. Capture output/reflection locally in component state.
8. Allow completion without BARS persistence.

## Phase 6: CTA Reframe

Update deck actions so the deck hosts practice before persistence.

Impacted files:

- `src/components/deck/AllyshipDeckReader.tsx`
- `src/components/deck/WorkThisCardButton.tsx`
- `src/components/deck/SendToBarsButton.tsx`
- `src/components/deck/FindYourPath.tsx`

Implementation:

1. Add "Help me take action" CTA linking to quick mode.
2. Add "Go deeper" CTA linking to deep mode.
3. Demote immediate "Send to BARS."
4. Show Save to BARS only after output exists.
5. For deck-only users, Save to BARS shows coming-soon copy.
6. Preserve existing Send to BARS behavior for full BARS users until replacement is validated.

## Phase 7: Export and Copy

Make export/copy the real v1 save path for deck-only users.

Impacted files:

- `src/components/deck/DeckPracticeImageExport.tsx` new
- `src/components/deck/DeckPracticeCopyResult.tsx` new
- image/export helpers as needed

Implementation:

1. Add card-only image export.
2. Add card+public-safe summary export.
3. Add copyable practice text.
4. Exclude private reflection text by default.
5. Make private detail inclusion opt-in only.

## Phase 8: Optional Save to BARS

Keep BARS as downstream integration, not the deck's required persistence layer.

Impacted files:

- `src/components/deck/DeckPracticeSaveToBars.tsx` new or extend existing action
- `src/actions/send-deck-card-to-bars.ts` extend only if needed

Implementation:

1. For `bars_player` users, allow save to existing BARS surfaces where supported.
2. For `deck_owner` users, render disabled/waitlist-style coming-soon state.
3. Snapshot card id, mode, selected tool, vector if present, output, and reflection when saving is supported.

## Phase 9: Product Validation

Run design and smoke tests.

Validation:

1. Anonymous users can see public deck routes and cannot open gated deck app.
2. Deck-only users can use deck routes and cannot enter deeper BARS routes.
3. Deck-only users see deck-only shell.
4. All 120 cards return viable tool affinities.
5. One card from each move can render quick and deep page modes.
6. Export does not include private reflection by default.
7. Existing `/deck` draw/browse flows still work.
