# Plan — Card-to-Carousel Brief

## Principle

Prove the generative dependency before investing in the full multi-screen UX:

```text
fixture brief → compiler → composer handoff → return with edits preserved
```

No route UI is implemented until that chain is tested.

## Phase 0 — Contracts and test fixtures

1. Create shared `PostV1` and brief/session schemas.
2. Add a deck-backed fixture spread and compile tests.
3. Implement the pure compiler against real `MoveCard` fields.

**Exit:** A known `BriefPayloadV1` produces a valid editable `PostV1` without
private-data leakage.

## Phase 1 — Shared reading and session seams

1. Extract flavor mapping/scoring from `FindYourPath` into a framework-free
   library module.
2. Refactor the deck reader to consume the extracted module with unchanged
   behavior.
3. Add a versioned browser-session adapter for brief and composer state.
4. Make the composer accept and return `PostV1` through that adapter.

**Exit:** A fixture brief can open the composer and survive return navigation
without server persistence.

## Phase 2 — Steward route and guardrails

1. Add the protected campaign-context route and read-only loader.
2. Add the minimal staged intake: goal, charges/vector, depth, face, CTA, and
   deterministic series tag.
3. Add spread locking, directed swaps, filtered manual pick, and source gate.

**Exit:** A global admin/steward can create a valid locked payload and compile
it; other roles cannot access it.

## Phase 3 — UX parity and accessibility

1. Apply the handoff's Wake → Clean → Grow → Show visual language.
2. Add mobile spread stacking, focus management, live-region announcements,
   keyboard swap/pick controls, and reduced-motion behavior.
3. Add a visible non-media provenance panel when editing the compiled post.

**Exit:** The UX remains usable without color-only cues and on narrow screens.

## Planned files

- `src/lib/raise-awareness/post.ts` — portable post contract.
- `src/lib/card-to-carousel/*` — schema, compiler, fixtures, session adapter.
- `src/lib/allyship-deck/reading.ts` — extracted scoring/selection engine.
- `src/components/deck/FindYourPath.tsx` — consume shared reading engine.
- `src/app/admin/campaigns/[campaignId]/brief/page.tsx` — server access gate and
  campaign context loader.
- `src/components/card-to-carousel/*` — route UI only after Phase 1 exits.
- `src/components/raise-awareness/CarouselComposer.tsx` — portable prefill and
  return seam.

## Explicit exclusions

No Prisma migration, public API route, campaign membership policy change, AI
provider call, scheduled publication, or server-side draft save belongs to this
spec's implementation.
