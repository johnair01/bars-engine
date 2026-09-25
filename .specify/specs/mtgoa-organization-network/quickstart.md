# Quickstart: Verify MTGOA Organization Network

## Before implementation

1. Open `src/lib/mastering-allyship/organization-state.ts`.
2. Confirm each `open` campaign/action has a current steward label and a working `href`.
3. Confirm Book Launch names the 500-copy goal.
4. Confirm no partner is listed without a real current relationship.

## Local verification — Release 1

1. Start the existing development server.
2. Open `/organization` in a fresh/incognito browser session.
3. Confirm:
   - organization purpose renders;
   - Book Launch has its correct outcome and steward label;
   - the book route works if configured;
   - current external/internal routes resolve;
   - no sign-in, email gate, contact field, public participant list, or reward claim appears;
   - unconfigured campaigns/actions do not render as available.
4. Test a narrow mobile viewport and keyboard navigation.
5. Run the focused config test and the repository type-check/build command used by the active branch.

## Release 2 privacy verification

1. Seed one public Book Launch work card and one steward-routed work card.
2. Verify the public board shows no claimed participant identity or contact information.
3. Submit a Collective Offer with contact, then verify the offer is steward-visible and not public.
4. Submit a Collective Offer without contact, then verify the steward can see the offer but no contact channel is invented.
5. Confirm a claimed/paused/done need is not available for a new public claim.
