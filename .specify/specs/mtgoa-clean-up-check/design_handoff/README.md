# MTGOA Clean Up Check — design handoff

Imported from Claude Design project **Mastering the Game of Allyship Book**
(`b6457c63-114e-44c9-8039-494652c5ce64`) on 2026-08-20.

- `MTGOA Clean Up Check.dc.html` — the reference implementation. It is a **working
  prototype**, not a mockup: copy, flow order, composer clauses, and the 3-2-1 thread
  mechanic are all captured there. When a written note and the reference disagree, the
  reference wins.

The prototype links the design system bundle
`_ds/bars-engine-design-system-af69bae5-49fe-4fcd-a2ac-0382919529e4` (fonts / colors /
typography / spacing / cards). That bundle is **not vendored here** — its repo-side mirror
is [`src/styles/bars-tokens.css`](../../../../src/styles/bars-tokens.css), which is wired
globally through `src/app/globals.css`. The type scale, weight/leading/tracking tokens and
the `.bars-title` / `.bars-prose` / `.bars-label` / `.bars-stat` helper classes the
prototype uses were added to that mirror as part of this import.

## Shipped surface

| Piece | Path |
|---|---|
| Flow component | `src/components/clean-up/CleanUpCheck.tsx` |
| Copy + composer (pure) | `src/lib/clean-up/check-content.ts` |
| Outbound attribution | `src/lib/clean-up/outbound.ts` |
| Aggregate events | `src/lib/clean-up/events.ts`, `src/app/api/clean-up/events/route.ts` |
| Canonical page | `src/app/mastering-allyship/clean-up/page.tsx` |
| Short-link alias | `src/app/clean-up/page.tsx` → `/mastering-allyship/clean-up` |
| Deck draw (shared with `/open-up`) | `src/components/deck/CardDraw.tsx` |

## Shared with the Open Up Check

The draw is the same surface in both checks. `CardDrawRow` and `CardDrawSheet`
live in `src/components/deck/` and are used by `OpenUpCheck.tsx` and
`CleanUpCheck.tsx` alike; the only per-flow value is the accent, because the
element comes from the move (Open Up → liminal, Clean Up → water). Cards render
through `AllyshipCard` in both, and the deck data behind them comes from
`assembleDeck` in both — so a card is authored once and changes everywhere.

Both checks render bare: no nav bar (`Chrome.BARE_ROUTES`) and no site footer
(`footer-surfaces.FOOTER_EXCLUDE_EXACT`). Each is one ask, walked in order, and
names its own exits on the receipt — so the page's own header owns the top of the
viewport and the receipt owns the bottom.

### Divergence from the prototype, on purpose

- **The draw row.** The reference uses an edge-to-edge scroll-snap row at 78%
  width on phones. Shipped instead: the shared `CardDrawRow`, whose tiles are
  capped rather than stretched — an `AllyshipCard` is 5:7, so a tile allowed to
  fill a phone's width becomes ~480px tall with a long empty band inside it. The
  gold threshold, the dark well and the reserved caption slot are kept.
- **The card sheet.** The reference draws its own compact card inside the sheet.
  Shipped instead: `AllyshipCard variant="full"` — the canonical detail card,
  identical to the one `/open-up` shows.

## Invariants (do not change without a new handoff)

- No sign-in, no email gate, nothing persisted server-side. The body reading, channel,
  line, 3-2-1 writing, thread, and draft live in component state only and are never sent.
- Element comes from the move: Clean Up → water (`#1a7a8a` glow, `#2980b9` gem). Purple
  `--bars-liminal` stays the reserved primary-action color. Gold `#C9A84C` is the only
  non-token brand accent.
- Cards render through the canonical `AllyshipCard` / `MovePip` / `FaceBadge` visuals.
  Do not fork the card.
- Both exits stay first-class: "let it settle · come back later" and "this one isn't mine
  to clean". No move is labelled correct; no score, streak, or personality result.
- Receipt copy, verbatim: "closing the tab is also a complete move."
- Free-typed text is never interpolated into the composed draft — only canonical strings.
- Once the visitor edits the draft, stop regenerating it.
