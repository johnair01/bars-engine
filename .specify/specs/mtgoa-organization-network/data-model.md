# Data Model: MTGOA Organization + Campaign Network

## Release 1: no migration

Release 1 uses existing campaign records plus a reviewed public configuration module:

`src/lib/mastering-allyship/organization-state.ts`

This module is public, versioned in Git, and read by Server Components. It is not a user-answer store, lead database, or substitute CMS.

```ts
type Availability = 'open' | 'forming' | 'paused' | 'closed'

type PublicCampaignConfig = {
  slug: string
  title: string
  outcome: string
  status: Availability
  stewardLabel: string
  whyNow: string
  href?: string
  purchaseHref?: string
  actions: Array<{
    title: string
    description: string
    kind: 'self_directed' | 'steward_routed' | 'information'
    href?: string
  }>
}

type OrganizationState = {
  updatedAt: string
  nextReviewAt: string
  purpose: string
  campaigns: PublicCampaignConfig[]
  relatedRoutes: Array<{ label: string; href: string; description: string }>
}
```

**Invariant:** an `open` campaign/action has a real URL or an existing steward-owned route. `forming`, `paused`, and `closed` records may explain status but cannot render a participation CTA.

## Existing relational entities

```text
Campaign
  ├─ CampaignMilestone (goal + target/current value)
  │    └─ MilestoneNeed (scoped work card)
  ├─ CampaignMembership (owner/steward/member)
  └─ child Campaign (subcampaign)

CampaignLead (accountless participant)
CollectiveOffer (unshaped capacity for steward review)
```

## Release 2 extensions

Do not add these until public work cards are actually ready to ship.

### MilestoneNeed public-work fields

Add either typed columns or a validated structured configuration owned by the need. The first implementation decision should prefer typed fields where filtering/validation matters.

```ts
type WorkCardPresentation = {
  whyItMatters: string
  concreteAction: string
  estimatedShape?: string
  receiptPrompt: string
  contactAccess:
    | { mode: 'public'; href?: string; label: string }
    | { mode: 'share_with_steward'; consentCopy: string }
    | { mode: 'request_after_quest'; prerequisite: string }
    | { mode: 'steward_routed'; consentCopy: string }
    | { mode: 'private'; explanation: string }
}
```

**Invariant:** a work card is never publicly queryable unless this presentation is complete and `status === 'open'`.

### Deck Weave

A weave is a configuration attached to a need/quest, not a second deck and not a generic completion ladder.

```ts
type DeckWeave = {
  title: string
  purpose: string
  steps: Array<{
    order: number
    cardId: string
    role: 'notice' | 'prepare' | 'contact' | 'repair' | 'return'
    instruction: string
  }>
  concreteAction: string
  receiptPrompt: string
  alternateExit: string
  stewardHandoff?: string
}
```

**Invariant:** every `cardId` resolves in the canonical Allyship Deck. The weave’s real-world action must be stated.

### Partner relationship

Start as reviewed configuration in Release 3. Promote to a model only when partner relationships need their own permissions, campaigns, or history.

```ts
type PartnerRelationship = {
  organizationName: string
  relationshipType: 'active_campaign_partner' | 'current_collaborator' | 'exploring_relationship'
  whyItMatters: string
  publicHref?: string
  contactRoute?: string
  isPublic: boolean
}
```

**Invariant:** a hoped-for relationship is not public partner data.

## Privacy boundary

| Data | Storage / visibility |
| --- | --- |
| Public campaign outcome, work, terms | Campaign + public config |
| Claim / offer identity and voluntary contact | Existing CampaignLead / CollectiveOffer; steward-facing only |
| Private reflection, recipient details, 3-2-1 | Not stored by this feature |
| Steward assessment / routing notes | Existing steward-only operational surface |
| Public results | Aggregate outcome or task status only |
