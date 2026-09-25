# Implementation plan

## Phase 1 — Confirm the canonical destination

1. Inspect the launch offer registry and confirm `book-digital` is the correct offer key.
2. Confirm `NEXT_PUBLIC_GUMROAD_BOOK_DIGITAL_URL` and define the no-URL setup-pending state without a `/launch` fallback.
3. Confirm `/mastering-allyship/chapter-1/read` is the only sample artifact in scope.
4. Confirm `FunnelSignup` plus Resend are the internal capture and delivery path; do not add external audience sync.
5. Confirm the production Resend configuration and sender-domain verification requirements.

## Phase 2 — Update the sales page

1. Replace the page's hard-coded `/launch` purchase destination with the canonical book offer resolver.
2. Change the hero, offer-section, and final proof CTA labels to `Buy the book →`.
3. Make all three purchase CTAs resolve to the live Gumroad URL, with a clear setup-pending state when absent.
4. Add the exact secondary CTA `Read Chapter 1 free →` linking to `/mastering-allyship/chapter-1`.
5. Keep quiz and non-book links intact.

## Phase 3 — Confirm the sample/list path

1. Reuse the existing Chapter One lead form and server action.
2. Confirm the lead is persisted in `FunnelSignup` with `intent: 'chapter'` and source `mastering-allyship-chapter-1`.
3. Add a signed, time-limited reader-access grant that supports both immediate browser access and email-link access.
4. Gate `/mastering-allyship/chapter-1/read` and reject missing, expired, or tampered grants.
5. Update Resend delivery to include the signed reader-access link.
6. Confirm signup success and email-delivery failure states both give the visitor immediate reader access.
7. Add the explicit signup/follow-up disclosure to the form.
8. Add an opt-in Resend smoke test and a launch-readiness check for provider configuration.
9. Do not create a PDF, external audience integration, duplicate list model, or second delivery path.

## Phase 4 — Verify

1. Add focused static or component coverage for the purchase and sample CTAs.
2. Run lead-capture tests and relevant type/build validation.
3. Review the diff to ensure no unrelated worktree changes are included.
