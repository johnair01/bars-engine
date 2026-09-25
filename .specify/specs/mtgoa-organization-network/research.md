# Research: MTGOA Organization + Campaign Network

**Date:** 2026-08-22

## Decision: reuse the existing Ally Campaign system

The current application already contains the core primitives required for a campaign-network MVP:

| Need | Existing implementation | Decision |
| --- | --- | --- |
| Campaign tree | `Campaign.parentCampaignId` | Use it for the MTGOA root and its children. |
| Goal / progress | `CampaignMilestone.targetValue`, `currentValue` | Use it for Book Launch’s 500-copy outcome. |
| Bounded work | `MilestoneNeed` | Use it as the work-card base. |
| Accountless participation | `CampaignLead`, `/ally/[slug]` | Reuse; no sign-in wall for the public entry. |
| Unlisted capacity | `CollectiveOffer` | Reuse; do not create a second offer form. |
| Steward operating view | `/campaign/[ref]/allies` | Reuse; do not expose it publicly. |
| Player/steward roles | `CampaignMembership` | Reuse for campaign-specific accountability. |

## External pattern review

### Time banks

Timebanking systems offer visible asks/offers, personal availability, and a human broker. Timebanking UK describes the broker as handling orientation, matching, coordination, exchange tracking, and problem resolution. Their software can let either a broker moderate exchanges or members record them themselves. [Broker experience blueprint](https://timebanking.org/wp-content/uploads/2025/01/TimebankingTechnologyInterviewsReport-FullDraft-January2025.pdf) · [Time Online 2](https://timebanking.org/timeonline2/)

**Adopt:** asks, offers, self-described capacity, named broker/steward, clear handoff and return.

**Refuse:** a universal time-credit exchange rate. MTGOA already has meaningful separate units—action, hours, and currency—and should keep them separate.

### Volunteer management

Volunteer-management products center scoped roles, onboarding, schedule/availability, tracking, and reporting. The relevant lesson for MTGOA is operational clarity: a person needs to know the task, the time shape, support, and who holds the next decision. It is not a reason to turn participants into a generic labor pool.

**Adopt:** scoped commitments, availability/support, status, completion, and human follow-up.

**Refuse:** task volume as a moral or organizational loyalty score.

### Partner / joint-venture systems

Partner systems emphasize permissioned relationship context, shared opportunities, named owner(s), and a route from overlap to a warm introduction. Crossbeam, for example, explicitly frames partner account mapping as secure/no-raw-data sharing and supports collaboration around shared lists and opportunities. [Crossbeam account mapping](https://www.crossbeam.com/lp/account-mapping-software) · [Crossbeam lists](https://help.crossbeam.com/en/articles/13688795-how-to-use-the-account-mapping-list)

**Adopt:** permissioned connection requests, relationship context, shared outcome, steward-owned next action.

**Refuse:** automatic contact sharing, CRM-like tracking for its own sake, and partner performance rankings as the social center.

### SourceCred and MetaGame

SourceCred’s useful idea is project-scoped, inspectable contribution provenance: Cred is specific to one community, and contribution sources/weights can be reviewed. Its own docs caution that the early system fit smaller, emotionally mature, technically informed communities. [How Cred works](https://sourcecred.io/docs/beta/cred/) · [SourceCred introduction](https://sourcecred.io/docs/)

MetaGame’s published account of SourceCred’s organizational wind-down confirms its deep reliance on SourceCred for XP, leaderboards, and valuation of work. [MetaGame / SourceCred retrospective](https://metagame.substack.com/p/sourcecred-is-dead-long-live-sourcecred)

**Adopt:** public quests, a legible path from curiosity to contribution, contribution provenance, project-scoped history, and many forms of useful work.

**Refuse:** a global reputational score, fungible status currency, leaderboards as belonging infrastructure, and automated human-value judgment.

## Design hypothesis to test

Campaign-specific outcomes + named stewardship + consentful access + actual receipts will keep the real work more central than status, discourse, or speculative incentives. This is a product hypothesis; it does not claim a single provable cause for SourceCred or MetaGame’s organizational outcomes.

## Literal code reuse

SourceCred and MetaGame remain useful reference material. Do not copy source code until the specific repository and dependency licenses are audited. Architectural borrowing does not require a code fork.

## Unresolved questions

1. Where should public configuration live while campaigns are still mostly steward-authored: a typed module, campaign JSON, or a small administrative editor?
2. Which existing campaign should be the MTGOA root / instance anchor?
3. What is the verified Book Launch purchase URL and podcast-guest intake endpoint?
4. Who besides Wendell currently has a real stewardship scope?
5. What response expectation can a Campaign Steward truthfully state for new offers and steward-routed contact?
