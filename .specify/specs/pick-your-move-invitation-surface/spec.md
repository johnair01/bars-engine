# Spec: Pick Your Move Invitation Surface

**Status:** Draft spec kit. Preserve the concept before implementation.  
**Library source:** `The Library/06 Specs/Pick Your Move Invitation Surface Spec v0.1.md`  
**Related specs:** `campaign-hub-spoke-landing-architecture`, `mtgoa-launch-barn-raising-party`, `barn-raising-live-data`, `mobility-quest-superpower-campaign`, `campaign-scoped-donation-cta`.

## Purpose

Create a lightweight public-facing invitation surface for The Crossing car fundraiser that lets supporters choose a useful role and take one concrete action before the full BARS Engine product is ready.

This surface belongs on The Crossing campaign landing page itself. The Crossing is a subcampaign of `mtgoa-barn-raising`, the Mastering the Game of Allyship Launch + Barn Raising campaign for Wendell's existing community, so the landing page must link back up to that parent campaign.

The surface should bring people closer to the app by letting them experience the core loop:

```text
Care -> Role -> Move -> Artifact -> Impact -> BAR
```

without requiring them to understand BARS Engine terminology.

All submitted information must be captured as a `CustomBar` tagged to the campaign via `campaignRef`. This is not a parallel lead tracker.

## Problem

People are unlikely to start by thinking, "I am not showing up and I feel bad about it." That is too internal and shame-adjacent for a public landing page.

People are more likely to start from:

- I care about this.
- I want to help.
- I know someone.
- I already donated and want another way to participate.
- I cannot donate, but maybe I can still be useful.
- I do not know what my useful move is.

The landing page needs an inciting event and a tiny action path, not an ontology lesson.

## Product Hypothesis

The first public "BARS Engine" experience can be a role picker attached to a real campaign.

For The Crossing car fundraiser, the current bottleneck is finding the actual car. The page can convert supporter energy into specific help:

- car leads
- listing evaluation
- introductions
- shares
- encouragement
- donations

This creates an early field test of move generation, ally discovery, and BAR capture.

## Campaign Placement and Lineage

The role picker is not a separate microsite or detached intake form.

It should be embedded into the canonical public landing page for The Crossing campaign:

```text
Mastering the Game of Allyship Launch + Barn Raising (`mtgoa-barn-raising`)
-> The Crossing car fundraiser
-> Pick Your Move / support intake
```

Implementation should use the existing campaign hierarchy where possible:

- The Crossing should be represented as a child/subcampaign.
- The parent should be `mtgoa-barn-raising`.
- The page should include a visible parent link such as: "Part of the Mastering the Game of Allyship Launch + Barn Raising."
- The parent link should route to the parent campaign/launch page, not to a generic homepage.

Route distinction:

- `mtgoa-barn-raising` is the community/homies route: the field for people already in Wendell's community who are helping raise the barn.
- `allyship-book` is the newcomer route: the field for people who are new to the work and entering through the book itself.

Do not silently attach The Crossing to Bruised Banana just because older fundraiser specs mention it. The Crossing is part of the current Mastering the Game of Allyship launch field.

## Core Data Decision

Every submission creates a campaign BAR.

```text
Role signup
-> Support details
-> CustomBar
-> campaignRef: "the-crossing"
-> parent campaign lineage metadata: "mtgoa-barn-raising"
-> allyshipDomain from role
-> starter card id in metadata
```

Do not create a separate support-log primitive for the first version.

BARs created from this surface represent "evidence of support entering the field." They may later be upgraded, linked, converted into quests, attached to milestones, or counted in campaign contribution summaries.

## Ontology Upgrade: Campaign-Captured BARs

This spec introduces a distinction the product has not needed clearly before:

```text
Personal BAR
Campaign-captured BAR
```

A BAR does not have to begin in a player's hand or vault.

Some BARs originate in a campaign field:

- a car lead
- a warm introduction
- a time offer
- a money/resource offer
- an encouragement/check-in
- a listing review
- an offline contribution reported by a steward

These are still BARs because they are bounded artifacts of reality with enough shape to carry meaning and future action.

They are not necessarily player inventory.

### Working Model

BARs now have several separable axes:

| Axis | Meaning |
|---|---|
| Creator / Steward | Who can administer or edit the BAR record. Current schema requires `creatorId`. |
| Campaign | Which field the BAR belongs to, via `campaignRef`. |
| Player Hand / Vault | Whether the BAR is held as a player-owned playable object. Optional. |
| Maturity | Whether the BAR is raw evidence, active support, completed impact, quest seed, or archived provenance. |

For EOD implementation, unauthenticated support submissions can be steward-owned `CustomBar` records with `campaignRef: "the-crossing"`.

Later implementation may make campaign ownership first-class, but this spec should not block on that schema upgrade.

### Product Implication

Players and campaigns can both capture and mature BARs.

```text
Player captures BAR
-> BAR may enter a campaign

Campaign captures BAR
-> BAR may later enter a player's hand, become a quest, or mature into campaign provenance
```

The Crossing support surface is the first practical test of campaign-captured BARs.

### Current bars-engine Constraint Check

As of this spec, bars-engine allows a BAR to be campaign-scoped without being in a player's hand, assigned quest list, or explicit vault slot.

The current schema does require:

- `CustomBar.creatorId` must reference a `Player`.

The current schema does **not** require:

- `claimedById`
- `PlayerQuest` assignment
- `HandSlot`
- `HandSlot.isCarrying`
- a player-facing vault placement record

Therefore, campaign-captured BARs are allowed today if they are represented as steward-owned `CustomBar` rows with `campaignRef` set.

This is a product-definition expansion, not an immediate schema blocker.

### Definition Expansion Required

The product definition of BAR must expand from:

```text
A player-owned artifact in a vault or hand.
```

to:

```text
A bounded artifact of reality that may be stewarded by a player, carried by a player, or captured by a campaign field.
```

Current schema still uses `creatorId` as administrative ownership. The semantic owner can be the campaign when `campaignRef` is set and metadata marks the BAR as campaign-captured.

### EOD Placement Rule

For the EOD slice:

- create `CustomBar` records
- set `creatorId` to the campaign steward/player id
- set `campaignRef` to The Crossing campaign ref
- include parent campaign lineage metadata for `mtgoa-barn-raising`
- set `claimedById` to `null`
- do not create `PlayerQuest`
- do not create `HandSlot`
- do not require the BAR to appear in a supporter's vault

### Vault Query Caveat

Because current vault queries treat some private active creator-owned BARs as drafts, steward-owned campaign-captured BARs may appear in the steward's vault unless excluded.

For EOD, this is acceptable as a steward inbox.

### Steward Access Rule

If a BAR exists in a campaign you steward, it should be accessible to you from the vault/stewardship surface even if you did not personally "carry" it.

This access does not mean:

```text
This BAR is mine as a personal artifact.
```

It means:

```text
This BAR is in a field I steward.
```

Working access rule:

```text
Personal vault access
= BARs I created / carry / claim

Campaign stewardship access
= BARs attached to campaigns I steward
```

For the first implementation, these may appear together. The UI should eventually distinguish:

- My BARs
- Campaign BARs I steward
- BARs I carry in hand
- BARs awaiting follow-up
- BARs matured into contributions or quests

For the next pass, add a filter or view distinction so `evidenceKind: "support_intake"` / `agentMetadata.sourceType: "campaign_support_intake"` can be shown as campaign inbox rather than personal draft clutter.

## User Stories

### P1 — Choose my useful role

As a supporter, I want to quickly see the different ways I can help, so I can choose a move that fits my actual capacity.

Acceptance:

- Page includes a "Want to help but not sure what your move is?" section.
- Role choices are visible without sign-in.
- Each role has one plain-language description and one tiny move.

### P2 — Help without donating

As a supporter who cannot donate, I want a meaningful non-money way to participate, so I do not feel useless or excluded.

Acceptance:

- Non-donation roles are presented as first-class help, not fallback help.
- Car Scout, Car Person, Connector, Signal Booster, and Encourager all have concrete actions.

### P3 — Continue helping after donating

As someone who already donated, I want another useful move, so my support can continue as momentum.

Acceptance:

- Copy explicitly says that people who already donated can still help by sending leads, making introductions, or sharing.

### P4 — Bring people toward the app

As the campaign creator, I want supporters to experience the BARS Engine promise before the product is ready, so the landing page becomes a bridge into future app use.

Acceptance:

- Page includes a soft explanation: "This is an early version of BARS Engine: a way to turn care into concrete action."
- App bridge copy does not interrupt the primary help flow.

### P4b — Preserve campaign lineage

As a supporter, I want to understand that The Crossing is part of the larger Mastering the Game of Allyship Launch + Barn Raising, so the car fundraiser feels connected to the actual community field instead of like an isolated emergency.

Acceptance:

- The Crossing landing page includes a visible link back to `mtgoa-barn-raising`.
- Copy frames the car fundraiser as a concrete dependency inside the launch campaign.
- Support BARs include parent campaign lineage in metadata.
- The page does not make the parent campaign more important than the immediate car support action.

### P5 — Capture visible impact

As the campaign creator, I want each support submission to become a campaign-tagged BAR, so actions can be followed up, thanked, sorted by role, and later converted into contribution records.

Acceptance:

- Submission creates a `CustomBar`.
- The BAR has `campaignRef` set to the Crossing campaign ref.
- The BAR includes selected role, domain, starter card id, contributor name/contact, and details in structured metadata.
- Every role has an obvious "tell me what you are offering" path.

### P6 — Track existing support

As Wendell, I want to enter existing offers manually, so homies who already offered cars, scouting, money, or support are represented in the campaign record.

Acceptance:

- Admin/steward can create the same kind of campaign BAR manually.
- Existing car offers and car scout offers can be captured without pretending they came through the public page.
- Manual entries use the same role/domain/card model as public submissions.

## Role Model

Roles are campaign-specific expressions of allyship domains. They are not personality labels; they are impact lanes.

Each role answers:

```text
What kind of impact are you trying to create?
```

| Role | Primary Domain | Secondary Domain | Description | Tiny Move | Primary Artifact | Starter Card Pulls |
|---|---|---|---|---|---|---|
| Car Scout | `GATHERING_RESOURCES` | `SKILLFUL_ORGANIZING` | Finds viable cars, listings, and vehicle paths. | Send one promising listing. | Listing lead | `OPEN-GR-ARCHITECT`, `WAKE-SO-ARCHITECT` |
| Car Person | `SKILLFUL_ORGANIZING` | `DIRECT_ACTION` | Evaluates listings, risk, repairs, title issues, and buying strategy. | Sanity-check one listing. | Listing review | `SHOW-SO-ARCHITECT`, `WAKE-DA-CHALLENGER` |
| Connector | `GATHERING_RESOURCES` | `SKILLFUL_ORGANIZING` | Makes warm human introductions to someone who can help. | Make one warm introduction. | Intro | `WAKE-GR-DIPLOMAT`, `SHOW-GR-DIPLOMAT` |
| Signal Booster | `RAISE_AWARENESS` | null | Shares the ask strategically with context. | Share post/thread with one sentence. | Share | `SHOW-RA-DIPLOMAT`, `SHOW-RA-SAGE` |
| Encourager | `DIRECT_ACTION` | `GATHERING_RESOURCES` | Reaches out to Wendell, reflects momentum, and encourages aligned action. | Send one check-in. | Encouragement | `SHOW-DA-REGENT`, `OPEN-GR-DIPLOMAT` |
| Donor | `GATHERING_RESOURCES` | null | Contributes material support: money, time, expertise, space, or concrete resources. | Donate, offer time, or share the donation link. | Contribution | `WAKE-GR-DIPLOMAT`, `SHOW-GR-ARCHITECT` |

### Role Boundary Rules

Connector must stay narrow.

- Car Scout means: "I found a car or vehicle lead."
- Connector means: "I know a person who should talk to Wendell."
- Signal Booster means: "I shared the ask with an audience."
- Donor means: "I contributed material resources, including time or money."
- Encourager means: "I helped keep the person and campaign in motion."

If a role overlaps too much in the interface, prefer the more specific role.

### Allyship Deck Card Pulls

When a supporter chooses a role, the app should eventually pull cards from that role's domain affinity.

MVP behavior:

- show one suggested allyship card per role
- use `campaignQuestion` as the reflection prompt
- translate the card into one car-campaign tiny move

Later behavior:

- role-filtered draw from the full Allyship Deck
- include `domain`, `move`, `operation`, and card id in provenance
- capture completed action as a BAR

Example:

```text
Role: Connector
Domain: GATHERING_RESOURCES
Card: WAKE-GR-DIPLOMAT / Who Holds the Purse
Campaign Question: Who are the givers, gatekeepers, and stakeholders in this ask?
Move: Name one person who could unlock a car lead, then make a warm introduction.
Artifact: Introduction message
```

## UX Contract

Recommended section order:

1. Parent campaign link: "Part of the Mastering the Game of Allyship Launch + Barn Raising."
2. Story: what happened and why the car matters.
3. Momentum: fundraising is moving.
4. Need: now we need to find the actual car.
5. Pick Your Move: role picker.
6. Take One Action: role-specific CTA.
7. Optional Capture: "Tell me what you did."
8. Soft App Bridge: early BARS Engine explanation.

Primary headline:

```text
Want to help but not sure what your move is?
```

Secondary copy:

```text
Pick the kind of help that feels natural.
```

Avoid:

- diagnosing people as not showing up
- making helpers learn the ontology first
- implying money is the only meaningful help
- overexplaining BARS Engine before they act

## Data Contract

For MVP, role definitions can be authored static content. Submissions should persist as `CustomBar` records.

Future structured model:

```ts
type SupportRole =
  | 'car_scout'
  | 'car_person'
  | 'connector'
  | 'signal_booster'
  | 'encourager'
  | 'donor'

type SupportMove = {
  role: SupportRole
  primaryDomain: 'GATHERING_RESOURCES' | 'RAISE_AWARENESS' | 'DIRECT_ACTION' | 'SKILLFUL_ORGANIZING'
  secondaryDomains?: Array<'GATHERING_RESOURCES' | 'RAISE_AWARENESS' | 'DIRECT_ACTION' | 'SKILLFUL_ORGANIZING'>
  label: string
  description: string
  tinyMove: string
  artifact: string
  ctaLabel: string
  ctaHref: string
  starterCardIds: string[]
}
```

### BAR Write Contract

MVP submission creates:

```ts
type SupportBarInput = {
  campaignRef: 'the-crossing'
  parentCampaignRef: 'mtgoa-barn-raising'
  role: SupportRole
  name: string
  contact: string
  offerSummary: string
  details: string
  url?: string
  starterCardId: string
}
```

Maps to `CustomBar`:

```ts
{
  creatorId: stewardPlayerId,
  title: `[${roleLabel}] ${offerSummary}`,
  description: details,
  type: 'vibe',
  visibility: 'private' | 'public',
  status: 'active',
  campaignRef: 'the-crossing',
  allyshipDomain: primaryDomain,
  moveType: 'show_up',
  evidenceKind: 'support_intake',
  contextLines: JSON.stringify({
    contributorName: name,
    contributorContact: contact,
    role,
    starterCardId,
    url
  }),
  docQuestMetadata: JSON.stringify({
    source: 'pick_your_move_support_page',
    parentCampaignRef,
    campaignLineage: [parentCampaignRef, 'the-crossing'],
    artifact: roleArtifact,
    secondaryDomains
  })
}
```

Note: public unauthenticated submissions still require a `creatorId` because `CustomBar.creatorId` is required. For the EOD version, use the campaign steward/player id as the creator and store the actual contributor in `contextLines`. Later, authenticated users can create their own BARs directly.

## Non-Goals

- Full BARS Engine onboarding.
- User account requirement.
- AI-generated move generation.
- Complete donation infrastructure rewrite.
- Replacing existing donation wizard or campaign hub.
- Final public copy.
- A separate non-BAR lead database.

## Acceptance Criteria

- Supporter can choose a role within 10 seconds.
- Supporter can take one useful action without knowing what a BAR is.
- Page presents non-money help as meaningful.
- Page makes the app connection without making the app the main ask.
- Page links The Crossing back to the Mastering the Game of Allyship Launch + Barn Raising campaign.
- Every submitted role produces a campaign-tagged BAR.
- Every submitted role preserves campaign lineage back to the parent launch campaign.
- Existing offers can be manually entered as campaign-tagged BARs.
- At least one role produces trackable evidence: listing, intro, share, message, contribution, or check-in.

## Open Questions

- What visual treatment makes role picking feel alive rather than like a utility menu?
- Should role CTAs route to DMs, forms, email, or in-app capture for the first live version?
- Should "Tell me what you did" be optional after each role or a single footer CTA?
- Should the page ask for name/contact on raised hands, or keep the first iteration frictionless?
- Which roles should be visible on mobile without scrolling?
