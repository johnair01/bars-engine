# Plan: Pick Your Move Invitation Surface

## Implementation Strategy

Phase 0 is complete when the concept exists as a spec in both the Library and bars-engine Spec Kit.

Implementation should proceed in small slices:

1. Author static content and role definitions.
2. Add the support intake to The Crossing campaign landing page.
3. Wire role submissions to create campaign-tagged `CustomBar` records.
4. Add a steward/manual entry path for existing offers.
5. Later, convert selected support BARs into contribution records, quests, or milestone progress.

## Campaign Placement

The Crossing support intake belongs on the campaign landing page itself, not on a detached demo page.

The campaign relationship should be:

```text
Mastering the Game of Allyship Launch + Barn Raising (`mtgoa-barn-raising`)
-> The Crossing car fundraiser
```

Implementation should use `Campaign.parentCampaignId` when the canonical parent is represented as a `Campaign`. If the active launch surface is still represented as an `Instance` or static `/launch` page, use the best available parent ref/link for the EOD slice and leave a follow-up to normalize it into the campaign hierarchy.

Parent rule:

- Use `mtgoa-barn-raising` as the parent ref for The Crossing.
- Treat `mtgoa-barn-raising` as the community/homies route for people already in Wendell's field.
- Do not use `allyship-book` as this parent. `allyship-book` is the newcomer/book route for people entering the work fresh.

The Crossing page should include a clear upward link:

```text
Part of the Mastering the Game of Allyship Launch + Barn Raising
```

Every support BAR should preserve that lineage in metadata.

## Ontology Note

This implementation should treat support submissions as **campaign-captured BARs**.

They are not required to appear in a supporter/player hand or vault.

Current schema still requires `CustomBar.creatorId`, so the MVP should use a campaign steward/player id as administrative owner while setting `campaignRef: "the-crossing"` to mark where the BAR belongs.

Do not add player-vault assignment as an EOD requirement.

## bars-engine Legality

Allowed today:

- `CustomBar.creatorId` references the steward/player account.
- `CustomBar.campaignRef` marks the campaign field.
- `claimedById` remains null.
- No `PlayerQuest` is created.
- No `HandSlot` is created.

Definition expansion:

- Current database uses player `creatorId` as administrative ownership.
- Product semantics should distinguish administrative steward from campaign belonging.
- Campaign-captured BARs are valid BARs even if they are not in a public supporter's hand or vault.

Known caveat:

- A steward-owned private active BAR can appear in the steward's vault as a draft under current vault queries.
- EOD can accept this as an inbox behavior.
- Follow-up should split campaign inbox BARs from personal vault BARs.

Access rule:

- BARs in a campaign you steward should be accessible from vault/stewardship surfaces.
- This is stewardship access, not necessarily personal ownership.
- Initial implementation may expose them in the same surface; later UI should split "my BARs" from "campaign BARs I steward."

## File Impact Candidates

Likely landing surfaces:

- campaign landing/hub surfaces under `src/app/campaign/*`
- likely `src/app/campaign/[ref]/page.tsx`
- likely `src/app/campaign/[ref]/CampaignLanding.tsx`
- possible parent launch surface: `src/app/launch/page.tsx`
- possible event parent surface: `src/app/event/page.tsx`

Potential library/content files:

- `src/lib/campaign-share-url.ts`
- static role definition file such as `src/lib/the-crossing-support-moves.ts`
- server action: `src/actions/the-crossing-support.ts`

Spec/library anchors:

- `The Library/06 Specs/Pick Your Move Invitation Surface Spec v0.1.md`
- `The Library/04 Quests/Personal/The Crossing - Fundraiser Momentum Move Packet.md`
- `.specify/specs/pick-your-move-invitation-surface/spec.md`

## Phase 1: Static Role Picker

Goal: Put the lightweight role picker in front of people and persist submissions as campaign BARs.

Work:

- Resolve the parent link/ref for `mtgoa-barn-raising`.
- Render the support section on The Crossing campaign landing page.
- Include a visible parent campaign link above or near the campaign story.
- Define six support roles as static data, including primary domain, secondary domains, and starter allyship card ids.
- Add a "Want to help but not sure what your move is?" section.
- Make each role show description, tiny move, and CTA.
- Make each role show its impact lane in plain language.
- Optionally show one starter card title/prompt pulled from its role domain.
- Add a public form that creates a `CustomBar` with `campaignRef: "the-crossing"`.
- Use campaign steward as `creatorId` for unauthenticated submissions.
- Store contributor name/contact, role metadata, and parent campaign lineage in BAR metadata fields.

Validation:

- Page is readable on mobile.
- Page reads as The Crossing's campaign landing page, not a separate support utility.
- Page links back to the Mastering the Game of Allyship Launch + Barn Raising parent.
- Non-donation roles feel first-class.
- CTA copy is clear.
- Connector is not confused with Car Scout or Signal Booster.
- Donor includes time and money, not only cash.
- Submitting the form creates a `CustomBar`.
- Created BAR has `campaignRef: "the-crossing"`.
- Created BAR has parent campaign lineage metadata.
- Created BAR has correct `allyshipDomain` and starter card id metadata.
- Created BAR does not need to appear in any public player's hand or vault.
- No `PlayerQuest` or `HandSlot` row is required for support intake BARs.
- Steward can access created support BARs through the campaign/stewardship workflow.

## Phase 2: Raised-Hand Capture

Goal: Let helpers self-identify without making them sign up while preserving the BAR primitive.

Work:

- Add "I can help with this" capture path per role.
- Write public submissions to `CustomBar`.
- Add steward/manual-entry route or script for existing support already received.

Validation:

- Wendell can see who raised a hand and for which role.
- Helpers understand what will happen next.
- Existing car offers and car scout offers can be entered as BARs.

## Phase 3: BAR Bridge

Goal: Convert support action BARs into campaign progress, gratitude, and next moves.

Work:

- After action, ask: "What happened?"
- Update or create follow-up BARs using Before / Action / Result.
- Include selected role and selected allyship card id in the BAR metadata.
- Later: convert accepted/completed support BARs into `ContributionRecord` or milestone progress.

Validation:

- At least one support action can become a BAR.
- The system can thank people and show momentum honestly.

## Design Notes

The page should feel like being welcomed into useful participation, not being sorted by a personality quiz.

Role cards should be compact and action-oriented.

The app bridge belongs after the role picker, not before it.

## Risks

- Too much ontology too early.
- Role picker feels like a menu, not an invitation.
- CTAs create follow-up burden without capture discipline.
- Donation and non-donation paths compete rather than reinforce.

## Verification

Before implementation is considered done:

- View page at mobile and desktop widths.
- Confirm text does not overflow role cards.
- Confirm all role CTAs work.
- Confirm donation CTA remains available.
- Ask one tester: "Which role would you pick?" and "What would you do next?"
