# Claude Design Handoff: `/launch` Redesign

Date: 2026-07-02
Route: `/launch`
Current implementation: `src/app/launch/page.tsx`, `src/app/launch/LaunchOffers.tsx`, `src/lib/launch/offers.ts`

## Goal

Redesign the launch page so visitors understand the offer ladder before choosing from the SKU list. The page should feel connected to the rest of the Mastering Allyship surfaces: dark warm shell, card-table/cultivation-card language, restrained element color, and clear practice-oriented copy.

The core design problem is decision support, not visual novelty.

## Visitor Question

"Which doorway is right for me right now?"

The page should answer this before asking for money:

- Curious: read Chapter 1, then consider the digital book.
- Wants a tool: choose the Allyship Deck.
- Wants an ongoing practice: choose The Game monthly.
- Wants the full shelf and wants to sponsor the launch: choose Founding Ally.
- Wants physical artifacts: choose physical book or physical handbook preorder.

## Current Structure

The implemented page now has:

- Header with breadcrumb, one clear H1, two CTAs: "Help me choose" and "Read Chapter 1 first".
- "How the pieces fit" sidebar explaining Book -> Deck -> Game -> Dojo.
- Quick chooser panel with four intent tiles.
- Offer sections:
  - Founding Ally bundle
  - Digital instant offers
  - Physical preorder offers
- Each offer card includes:
  - Best-for label
  - SKU name and blurb
  - "What this unlocks"
  - Context for why to choose it
  - Price and checkout CTA
- Barn-raising teaser remains below the offers.

## Visual Direction

Use the existing BARS design system:

- Background: `SURFACE_TOKENS.bgBase` / warm near-black.
- Primary surface: `#111110`, `black/30`, zinc borders.
- Product cards: keep `CultivationCard`; do not replace with generic pricing cards.
- Element color should come from `src/lib/ui/card-tokens.ts`, not new arbitrary palettes.
- Purple may remain for primary actions only.
- Emerald is acceptable for orientation/reading CTAs because nearby Mastering Allyship pages already use it.

Avoid:

- A generic SaaS pricing-table look.
- Purple gradient hero washes.
- Explaining every SKU only by price.
- Making the Founding Ally card visually compete with the page header.

## Content Hierarchy

The page should read as:

1. "Here is what this launch is."
2. "Here is how the pieces fit together."
3. "Here is how to choose."
4. "Here are the offers."
5. "Every purchase helps raise the launch wall."

## Interaction Notes

- Quick chooser tiles should deep-link to the relevant section.
- Gumroad URLs may be missing. The card must keep the honest "setup pending" state.
- Pay-what-you-want still sets the final price on Gumroad, not in-app.
- The page is public and must not depend on auth.
- Barn snapshot can fail and should gracefully fall back.

## Open Design Opportunities

- Replace the element sigil art windows with generated product/ritual imagery once assets exist.
- Add a compact comparison strip for "book / deck / game / dojo" if testing shows people still hesitate.
- Consider a sticky mobile "help me choose" jump only after visual QA confirms it does not crowd checkout CTAs.
- Add proof or trust content when real launch/backer stats are ready.

## Acceptance Check

The page succeeds when a new visitor can say, in under 15 seconds:

- "The book teaches the frame."
- "The deck gives concrete moves."
- "The game is the ongoing practice."
- "Founding Ally is the complete patron tier."
- "I know which one I would pick."
