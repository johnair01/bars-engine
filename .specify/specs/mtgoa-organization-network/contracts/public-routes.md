# Public Route Contract: MTGOA Organization + Campaign Network

## `GET /organization`

**Audience:** Public, no account required.

**Reads:** `getMtgoaOrganizationState()` from the reviewed public configuration module.

**Must render:**

- organization purpose;
- Book Launch outcome and current state;
- current Campaign Steward label;
- links to actual course, book, nonprofit, Book Tour Help, or Ally Campaign routes when configured;
- an honest “bring an offer” route when the receiving campaign has an active steward.

**Must not render:**

- private contact data;
- a public participant list;
- unconfigured partners/events/rewards;
- generic “join” CTA with no defined action or owner.

**Metadata:** Page title and Open Graph description name the organization and a real campaign outcome. They do not imply legal nonprofit status.

## `GET /organization/campaigns/[slug]` (Release 2)

**Audience:** Public, no account required.

**Reads:** public Campaign plus its confirmed public brief and milestone state.

**Must render:** purpose, outcome, current milestone, current steward label, terms, active work summary, and a return/leave route.

**Not found:** missing, non-public, or archived campaigns return `notFound()` rather than leaking drafts.

## `GET /organization/campaigns/[slug]/work` (Release 2)

**Audience:** Public, no account required.

**Reads:** only `MilestoneNeed` records that are open and have valid public work-card configuration.

**Must render per card:** title, why it matters, concrete action, unit, canonical deck card, receipt prompt, and access policy.

**Must not render:** claimed participant identity, steward notes, or contact information.

## Existing action contracts that this feature reuses

| User intent | Existing route / action | Rule |
| --- | --- | --- |
| Explore personal campaign participation | `/ally/[slug]` | Reuse the accountless intake; do not make a duplicate form. |
| Make an unlisted capacity offer | `offerToCollective` / `CollectiveOffer` | Contact is optional and steward-visible only. |
| Claim a configured need | Existing Ally Campaign need-claim path | Public display must honor card status and access policy. |
| View stewards’ operational data | `/campaign/[ref]/allies` | Steward authorization required; never link as public workboard. |
| Book Tour help | `/mastering-allyship/book-tour/help` | Reuse when it is the confirmed endpoint. |
