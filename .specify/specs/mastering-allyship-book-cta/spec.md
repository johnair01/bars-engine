# Mastering Allyship book CTA correction

## Summary

Correct the public `/mastering-allyship` sales page so its purchase CTAs sell the book rather than invite visitors to start the game. Add a clear low-commitment path to the free Chapter 1 reader so visitors can join the internal captured-lead list and keep moving even if they do not buy immediately.

## User story

As a visitor evaluating Mastering Allyship, I want the sales page's primary purchase buttons to clearly offer the book and take me directly to the book's Gumroad checkout, so I do not land on a game-launch page when I intend to buy the book.

As a visitor who is interested but not ready to purchase, I want to request a free Chapter 1 sample in exchange for my email, so I can read the work and receive a thoughtful follow-up path.

## Exact CTA contract

The page currently has three `Start the game →` purchase CTAs. They all become `Buy the book →` and all three resolve to the configured `book-digital` Gumroad URL.

| Existing location | Current behavior | Required behavior |
| --- | --- | --- |
| Hero | `Start the game →` → `#offer` | `Buy the book →` → live `book-digital` Gumroad URL |
| Offer section | `Start the game →` → `/launch` | `Buy the book →` → live `book-digital` Gumroad URL |
| Final proof section | `Start the game →` → `/launch` | `Buy the book →` → live `book-digital` Gumroad URL |
| Secondary sample path | Not present | `Read Chapter 1 free →` → `/mastering-allyship/chapter-1` |

The two quiz cards and their destinations remain unchanged.

## Requirements

1. Update all three purchase CTAs on `src/app/mastering-allyship/page.tsx` according to the exact CTA contract above.
2. Resolve the live destination from the canonical launch offer registry (`book-digital`); do not duplicate a Gumroad URL in the page.
3. When `NEXT_PUBLIC_GUMROAD_BOOK_DIGITAL_URL` is configured, each purchase CTA must link directly to that external URL.
4. When the Gumroad URL is not configured, do not send visitors to `/launch`; render a clear unavailable/setup-pending state for the book purchase action.
5. Preserve the page's existing visual treatment, quiz links, and non-purchase navigation.
6. Add or update focused coverage so the CTA labels and destinations cannot regress.
7. Add the exact secondary CTA `Read Chapter 1 free →` linking to `/mastering-allyship/chapter-1`.
8. Use `/mastering-allyship/chapter-1/read` as the canonical Chapter 1 sample artifact. Do not promise or link to a PDF; `/chapter-one.pdf` is not part of this change.
9. The Chapter 1 path must collect a valid email address and persist the lead in `FunnelSignup` with intent `chapter` and source `mastering-allyship-chapter-1`.
10. Treat the filtered `FunnelSignup` records as the internal captured-lead list. No external marketing-provider audience sync is in scope.
11. Gate `/mastering-allyship/chapter-1/read` so a direct visitor cannot read the sample without a successful Chapter 1 signup. Use a short-lived signed access grant or secure cookie; do not put the email address itself in the URL.
12. After a successful signup, grant immediate reader access in the browser so the visitor is not blocked by email delivery latency.
13. Use Resend, through the existing `sendEmail` service, for the Chapter 1 delivery email. The email must contain a valid access link to `/mastering-allyship/chapter-1/read` that works for the recipient without relying on the original browser session.
14. Add an explicitly opt-in integration smoke test for Resend using a configured test recipient. The test must verify that Resend accepts the message and returns a message identifier; it must never run against arbitrary addresses during unit or CI tests.
15. Verify production email readiness separately: `RESEND_API_KEY`, `EMAIL_FROM`, and sender-domain verification must be present before the flow is considered launch-ready.
16. If Resend delivery fails, preserve the captured lead and immediate reader access, show an honest on-page message, and log enough context for operator follow-up without logging the email body or access token.
17. Tell the visitor that signup provides Chapter 1 and occasional book, deck, Dojo, and practice updates, and include the existing reply-to-human expectation.
18. Add an explicit signup disclosure that submitting the form adds the visitor to the Chapter 1 captured-lead list and sends the stated follow-up messages.

## Data/schema impact

No new database schema or external audience integration is required. Reuse the existing `FunnelSignup` model, `intent: 'chapter'`, and source `mastering-allyship-chapter-1` as the internal list. Reuse Resend through the existing email service for delivery. Add a signed, time-limited reader-access mechanism without storing raw access tokens or requiring a new user account. The existing `LaunchOffer` registry and `book-digital` offer are the source of truth for the book destination. The canonical sample artifact is the existing Chapter 1 reader route; no PDF work is included.

## Acceptance criteria

- [ ] The hero, offer-section, and final proof purchase CTAs are all labeled `Buy the book →`.
- [ ] All three purchase CTAs use the configured `book-digital` Gumroad destination.
- [ ] No purchase CTA on `/mastering-allyship` falls back to `/launch`.
- [ ] Quiz links and other sales-page links remain unchanged.
- [ ] `/mastering-allyship` visibly offers `Read Chapter 1 free →` linking to `/mastering-allyship/chapter-1`.
- [ ] A valid signup reaches `/mastering-allyship/chapter-1/read` and is persisted in `FunnelSignup` with the specified intent and source.
- [ ] A direct visit to `/mastering-allyship/chapter-1/read` without a valid access grant is redirected to the signup page or shown an equivalent signup gate.
- [ ] A successful signup grants immediate reader access without waiting for Resend.
- [ ] The delivery email uses Resend and contains a valid signed access link to the same reader route.
- [ ] An explicit Resend smoke test verifies provider acceptance and records a message ID for the designated test recipient.
- [ ] Launch readiness fails when required Resend configuration or sender-domain verification is missing.
- [ ] Signup confirmation remains useful when outbound email is unavailable, and the reader remains accessible in that browser.
- [ ] Invalid, expired, or tampered reader-access grants are rejected.
- [ ] Invalid email input is rejected without creating a lead.
- [ ] The form includes the signup/follow-up disclosure.
- [ ] Focused tests and the relevant type/build validation pass.
