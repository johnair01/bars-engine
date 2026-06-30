# Spec: The Crossing Campaign Landing Page

> **Superseded (experiential layer)** by
> [`the-crossing-experience`](../the-crossing-experience/spec.md), which
> implements the returned Claude Design package — the full CYOA experience +
> steward dashboard that this spec's non-goals deferred. The roles lib, capture
> action, lineage contract, and steward resolution below remain the foundation
> and are reused (not replaced). `DESIGN_HANDOFF.md` is the brief that produced
> that package.

## Status

Implementation spec for the first public shareable slice.

Current MVP status:

```text
Functionally useful, not experientially correct.
```

The next design pass should follow `DESIGN_HANDOFF.md` and shift the experience from form-first support intake to choose-your-own-adventure role selection.

## Purpose

Ship `/campaign/the-crossing` as the public campaign landing page for The Crossing car fundraiser.

The page should let Wendell's existing community understand the ask, pick a useful support role, and submit help as a campaign-captured BAR.

## Relationship to Existing Specs

This implements the EOD slice of:

- `.specify/specs/pick-your-move-invitation-surface/spec.md`
- `The Library/06 Specs/Pick Your Move Invitation Surface Spec v0.1.md`

## Campaign Lineage

The Crossing is a subcampaign of:

```text
mtgoa-barn-raising
```

Meaning:

- `mtgoa-barn-raising` is the community/homies route for people already in Wendell's field.
- `allyship-book` is the newcomer/book route and is not the parent for this page.

Every support BAR created from this page must include:

```text
campaignRef: the-crossing
parentCampaignRef: mtgoa-barn-raising
campaignLineage: [mtgoa-barn-raising, the-crossing]
```

## User Stories

### P1: Understand The Ask

As a visitor, I want to quickly understand that Wendell needs a reliable car and that this sits inside the larger launch + barn-raising field.

Acceptance:

- Page renders at `/campaign/the-crossing`.
- Page includes a visible link back to `mtgoa-barn-raising`.
- Page explains that help can be money, car leads, expertise, introductions, sharing, or encouragement.

### P2: Pick A Useful Role

As a supporter, I want to choose the role that fits my real capacity.

Acceptance:

- Page shows six role cards: Car Scout, Car Person, Connector, Signal Booster, Encourager, Donor.
- Each role has a domain, tiny move, impact statement, and action prompt.
- Non-money roles are visually first-class.

### P3: Submit Help As A BAR

As Wendell, I want every role submission to become campaign evidence instead of disappearing into DMs.

Acceptance:

- Submitting the form creates a `CustomBar`.
- `CustomBar.campaignRef` is `the-crossing`.
- `CustomBar.evidenceKind` is `support_intake`.
- Metadata includes role, contributor details, starter card id, and parent lineage.
- Submission does not require sign-in.

## Data Contract

Support submissions map to `CustomBar`:

```ts
{
  creatorId: stewardPlayerId,
  title: `[${roleLabel}] ${offerSummary}`,
  description: details,
  type: 'vibe',
  reward: 0,
  visibility: 'private',
  status: 'active',
  campaignRef: 'the-crossing',
  allyshipDomain: role.primaryDomain,
  moveType: 'show_up',
  evidenceKind: 'support_intake',
  contextLines: JSON.stringify({ contributorName, contributorContact, role, offerSummary, url }),
  docQuestMetadata: JSON.stringify({ source, parentCampaignRef, campaignLineage, starterCardId, artifact }),
  agentMetadata: JSON.stringify({ sourceType: 'campaign_support_intake' })
}
```

## Steward Resolution

Because `CustomBar.creatorId` is required, unauthenticated public submissions must be administratively owned by a steward.

Resolution order:

1. `THE_CROSSING_STEWARD_PLAYER_ID` env var, if valid.
2. The Crossing campaign `createdById`, if a campaign exists.
3. The `mtgoa-barn-raising` campaign `createdById`, if a campaign exists.
4. Owner/steward membership on the `mtgoa-barn-raising` instance.
5. First available player as a local/EOD fallback.

The actual contributor remains stored in metadata.

## Non-Goals

- Full BARS Engine onboarding.
- Account creation before submitting help.
- New database tables.
- Donation processor rewrite.
- Final visual design. See `DESIGN_HANDOFF.md` for the intended design direction.
- Public dashboard of support BARs.

## Acceptance Criteria

- `/campaign/the-crossing` renders even if the campaign record has not been created yet.
- The page links to `/campaign/mtgoa-barn-raising`.
- Role cards are usable on mobile.
- Support form creates a real campaign-tagged `CustomBar`.
- Created BAR carries `the-crossing` and `mtgoa-barn-raising` lineage.
- Existing campaign pages continue to render normally.
