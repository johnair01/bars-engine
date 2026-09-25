# Feature Specification: MTGOA Organization + Campaign Network

**Feature Branch**: `codex/mtgoa-first-loop-live-field`  
**Created**: 2026-08-22  
**Status**: Draft — ready for Campaign Steward review  
**Input**: User description: “Create an `/organization` page and a campaign network where organizations have publicly enrollable campaigns, claimable work, consentful matchmaking, and visible ways to work together.”

## Product decision

`/organization` is the public home for Mastering the Game of Allyship as an organization with real campaigns. It makes the campaign field legible, points a person toward an honest next action, and connects to the Ally Campaign system already in BARS.

It is not a replacement volunteer-management product, a chat application, a time bank, a global reputation system, or a second campaign database.

The first public campaign is **Book Launch**. Its organizational outcome is to sell 500 copies of *Mastering the Game of Allyship*. A participant’s five-copy handoff is a possible personal quest; it is not the campaign outcome itself.

## Existing capabilities this feature must reuse

- `Campaign` supports campaign hierarchy through `parentCampaignId`.
- `CampaignMilestone` supports a public outcome with a target and current value.
- `MilestoneNeed` is the existing steward-shaped, claimable work primitive and already includes campaign reference, canonical `cardId`, unit, value, and claim status.
- `CampaignLead` supports accountless participation and optional contact.
- `CollectiveOffer` supports an unshaped “here is what I can offer” pathway.
- `CampaignMembership` supports campaign-specific ownership and stewardship.
- `/ally/[slug]` is the existing low-friction intake route; `/campaign/[ref]/allies` is the existing steward-facing workboard.

The feature MUST compose these capabilities before adding any new model.

## User Scenarios & Testing

### User Story 1 — See the actual organization and campaign field (Priority: P1)

A visitor who has arrived from the book, course, or a shared link can understand what MTGOA is organizing toward, see the Book Launch outcome, distinguish active work from emerging work, and choose one truthful route without creating an account.

**Why this priority**: The course is becoming an onboarding path. Without a public organization surface, a reader has no place to put the work they have prepared themselves to do.

**Independent Test**: Visit `/organization` in a fresh browser session. Identify the Book Launch outcome, current steward label, one current action route, and a route to the book; complete this without sign-in.

**Acceptance Scenarios**:

1. **Given** the Book Launch public configuration is present, **When** a visitor opens `/organization`, **Then** they see the 500-copy outcome, current campaign state, steward label, and at least one confirmed action route.
2. **Given** an emerging campaign has no active brief or owner, **When** a visitor opens `/organization`, **Then** it is not presented as a claimable campaign or open team.
3. **Given** a visitor has not bought the book, **When** they view the Book Launch campaign, **Then** they can reach the verified book purchase route without being told purchase is membership or proof of allyship.
4. **Given** a visitor declines to participate, **When** they leave the page, **Then** no account, email subscription, or follow-up obligation has been created.

---

### User Story 2 — Explore a public campaign and choose work (Priority: P2)

A visitor can open a campaign brief, understand its current outcome and terms, see open work cards, and either take a clearly public action or give a steward permission to contact them about a possible match.

**Why this priority**: Campaign information must lead to something a person can actually do. A campaign card without a real contribution route becomes organizational theater.

**Independent Test**: Seed one open Book Launch work card; visit its public campaign page; choose the public action or submit a consented steward-routed offer; confirm it appears in the existing steward surface.

**Acceptance Scenarios**:

1. **Given** a campaign has open work, **When** a visitor opens `/organization/campaigns/[slug]/work`, **Then** they see only work whose status and access policy permit public display.
2. **Given** a work card is `public`, **When** a visitor selects it, **Then** the card gives them the concrete action and receipt prompt without requiring contact details.
3. **Given** a work card is `steward_routed`, **When** a visitor offers contact, **Then** the system records only the contact and follow-up permission they explicitly supplied and exposes it only to the appropriate steward.
4. **Given** a task is already claimed, paused, or completed, **When** a visitor views the workboard, **Then** they cannot claim it as open work.

---

### User Story 3 — Bring capacity that is not already on the board (Priority: P2)

A person who has a relevant relationship, skill, resource, or idea that does not fit an open card can make a clear offer to the Campaign Steward without being forced to name themselves a volunteer, partner, or member.

**Why this priority**: The organization needs to receive unforeseen capacity, not only distribute predetermined tasks.

**Independent Test**: Submit a Book Launch offer through the organization surface; verify that the resulting `CollectiveOffer` is visible in the existing steward workflow and that no contact becomes public.

**Acceptance Scenarios**:

1. **Given** a visitor has something unlisted to offer, **When** they use “Bring an offer,” **Then** they can identify the relevant campaign, describe the offer, and separately decide whether to share contact information.
2. **Given** an offer is submitted without contact information, **When** a steward sees it, **Then** the steward can evaluate it but cannot contact the person through a newly invented channel.
3. **Given** a steward finds an offer unsuitable or premature, **When** they close it, **Then** the system does not create a public rejection record or diminish the person’s standing.

---

### User Story 4 — Find a partner organization or stewardship route (Priority: P3)

A visitor can see confirmed organizations that MTGOA works with, understand what the relationship is, and offer a partnership or campaign stewardship conversation through an explicit route.

**Why this priority**: This extends participation from individual actions to inter-organizational work, but it depends on truthful public relationship information and is not required to ship the first Book Launch page.

**Independent Test**: Configure one confirmed partner; verify that its relationship type and contact route render. Submit a prospective partnership offer and verify it routes to a steward rather than becoming a public listing.

**Acceptance Scenarios**:

1. **Given** a partner relationship is confirmed, **When** a visitor views `/organization`, **Then** they see its name, relationship type, why it matters, and the relevant public route.
2. **Given** an organization is only a hoped-for partner, **When** a visitor views `/organization`, **Then** it is not shown as a current collaborator.
3. **Given** a visitor wants to become a Campaign Steward, **When** they choose that route, **Then** they see the campaign purpose, scope, and contact terms before they submit an offer.

### Edge Cases

- The Book Launch campaign exists but no verified purchase URL is configured: render the outcome and other open routes; omit the purchase CTA rather than using a placeholder.
- An open work card is missing a concrete action, receipt prompt, or access policy: keep it steward-only until it is complete.
- A visitor’s capacity fits more than one campaign: present choices with reasons; never auto-enroll or auto-share their data.
- A public campaign has no open work: show its outcome and a “Bring an offer” route only if the campaign has a steward who can receive it.
- A campaign is paused or archived: retain its public historical brief only if explicitly configured; it must not contain action CTAs.
- A person completes an eligibility quest but the steward cannot make a match: record no public failure and supply the task’s stated next/alternate route.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide `/organization` as the public MTGOA organization landing page.
- **FR-002**: The page MUST show a reviewed statement of organization purpose, a campaign map, current campaign status, current steward label, and routes into the book and existing Ally Campaign intake.
- **FR-003**: The Book Launch presentation MUST distinguish its 500-copy organizational outcome from any player-level five-copy quest.
- **FR-004**: The MVP MUST source campaign status, outcome, and links from a single reviewed public configuration module; it MUST NOT create a new database or CMS solely for `/organization`.
- **FR-005**: The MVP MUST omit unconfirmed partners, roles, events, rewards, and campaign actions rather than render placeholders or implied availability.
- **FR-006**: The MVP MUST link into existing `/ally/[slug]`, Book Tour Help, `/nonprofit`, purchase, and campaign routes where those are the truthful action endpoints; it MUST NOT create duplicate intake forms.
- **FR-007**: The system MUST make clear whether an action is self-directed, a steward-routed offer, or information only.
- **FR-008**: A public campaign-work view MUST render only open `MilestoneNeed` records with completed public work-card configuration.
- **FR-009**: Each public work card MUST state why it matters, a concrete action, its unit, a canonical Allyship Deck card, a receipt prompt, and a contact/access policy.
- **FR-010**: The system MUST support these contact/access policies: public, share-with-steward, request-after-quest, steward-routed, and private.
- **FR-011**: Contact information MUST be collected only by explicit user choice; it MUST NOT appear in public campaign pages, a public participant directory, URLs, course analytics, or a global reputation profile.
- **FR-012**: A match MUST be a recommendation or steward decision, never automatic assignment or automatic disclosure of contact information.
- **FR-013**: “Bring an offer” MUST reuse `CollectiveOffer` and the existing steward review workflow.
- **FR-014**: The system MUST retain action, hours, and currency as separate units. It MUST NOT calculate a universal contribution score or exchange rate.
- **FR-015**: A Deck Weave MAY be attached to a work card only when it supports a concrete contribution. It MUST reference canonical Allyship Deck IDs and include a real-world action, receipt, and alternate exit.
- **FR-016**: The system MUST represent the public organization campaign map through existing `Campaign` hierarchy; Book Launch, Book Tour, Speaking + Conferences, and Job Hunt are child campaigns when their briefs and stewards are configured.
- **FR-017**: Partner organizations MUST have a confirmed relationship type, why-it-matters statement, and public route before public display.
- **FR-018**: A Campaign Steward MUST be able to identify new claims and offers using an existing steward-facing surface.

### Key Entities

- **Campaign**: Existing parent/child campaign record. The campaign is the home for outcome, lifecycle, stewardship, and public brief.
- **Campaign Milestone**: Existing measurable step within a campaign. The Book Launch 500-copy goal is a milestone.
- **Milestone Need / public work card**: A bounded piece of steward-shaped work that a person may see, claim, or offer help around; it carries a canonical Deck card and distinct unit.
- **Campaign Lead**: Existing accountless participant identity, including only the contact they choose to provide.
- **Collective Offer**: Existing proposal of capacity that has not yet been shaped into a campaign need.
- **Campaign Membership**: Existing campaign-specific owner/steward/member record.
- **Public campaign configuration**: Versioned, reviewed TypeScript content for what may be shown publicly before a full editorial interface is warranted.
- **Deck Weave**: An ordered configuration near a work card/quest that connects canonical deck moves to a concrete campaign action; it is not a new deck.
- **Partner relationship**: A future explicit relationship record or reviewed configuration entry for an organization that MTGOA currently works with.

## Success Criteria

### Measurable Outcomes

- **SC-001**: In an unauthenticated fresh-session walkthrough, a visitor can identify the Book Launch outcome, an active route, and the book-purchase route in two minutes or less.
- **SC-002**: Every public campaign CTA resolves to either a working route, a configured contact handoff, or no CTA at all; no `#`, placeholder, or unconfigured route is shipped.
- **SC-003**: 100% of publicly rendered work cards include the fields required by FR-009 and pass content validation.
- **SC-004**: A submitted “Bring an offer” appears on the existing steward workboard with no public exposure of participant contact information.
- **SC-005**: Public organization screens do not introduce a global score, leaderboard, public participant list, or blended contribution unit.
- **SC-006**: The P1 `/organization` release requires no Prisma migration and does not duplicate the existing Ally Campaign intake or steward board.
