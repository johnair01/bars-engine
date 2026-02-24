# Task Breakdown: Twine Engine Hardening

## Phase 1: Core Schemas and Helpers
- [ ] Create `src/lib/schemas/twine.ts`.
- [ ] Define `TwinePassageSchema` and `ParsedTwineSchema` using Zod.
- [ ] Implement `getStartPassageId` helper.

## Phase 2: Action Hardening
- [ ] Refactor `src/actions/twine.ts` -> `getOrCreateRun` to use the Zod schema and helper.
- [ ] Review `autoCompleteQuestFromTwine` for similar parsing vulnerabilities.

## Phase 3: UI Hardening
- [ ] Create `src/components/TwineErrorBoundary.tsx`.
- [ ] Update `src/app/adventures/[id]/play/page.tsx` to handle Server-Side parsing errors gracefully.
- [ ] Wrap `PassageRenderer` in the Error Boundary.
- [ ] Update `PassageRenderer.tsx` to use robust passage lookups (checking both `pid` and `name`).

## Phase 4: Verification
- [x] Test the "The Quick Mint" quest to verify it no longer crashes.
- [x] Seed a malformed Twine story and verify the Error Boundary catches it.
