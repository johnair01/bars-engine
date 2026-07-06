# Tasks: Pick Your Move Invitation Surface

## Phase 0: Spec Capture

- [x] Create Library spec.
- [x] Create Spec Kit `spec.md`.
- [x] Create Spec Kit `plan.md`.
- [x] Create Spec Kit `tasks.md`.

## Phase 1: Static Surface

- [ ] Identify/create the canonical public landing page for The Crossing car fundraiser.
- [ ] Place the support intake on The Crossing campaign landing page, not a detached demo page.
- [ ] Use `mtgoa-barn-raising` as The Crossing parent campaign/ref.
- [ ] Represent The Crossing as a child/subcampaign of that parent where the current data model allows.
- [ ] Add a visible parent link: "Part of the Mastering the Game of Allyship Launch + Barn Raising."
- [ ] Do not attach The Crossing to `allyship-book`; that route is for people new to the work.
- [ ] Create static support role data.
- [ ] Add primary domain to each role.
- [ ] Add secondary domains where needed.
- [ ] Add starter Allyship Deck card ids to each role.
- [ ] Add role boundary copy so Connector does not overlap with Car Scout or Signal Booster.
- [ ] Add "Want to help but not sure what your move is?" section.
- [ ] Add six role cards: Car Scout, Car Person, Connector, Signal Booster, Encourager, Donor.
- [ ] Add one tiny move and one CTA per role.
- [ ] Add one impact statement per role.
- [ ] Define Donor as time, money, expertise, space, or concrete resources.
- [ ] Keep non-donation roles visually equal to donor role.
- [ ] Create server action or route that creates `CustomBar` from support submission.
- [ ] Set `campaignRef` on every support BAR.
- [ ] Store parent campaign lineage on every support BAR.
- [ ] Store role/domain/card/contributor metadata on the BAR.
- [ ] Do not assign support BARs to a public player hand/vault in the EOD slice.
- [ ] Document steward-owned / campaign-captured BAR behavior in code comments near the create action.

## Phase 2: Lightweight Capture

- [ ] Use form as first capture channel.
- [ ] Add "Tell me what you are offering" CTA.
- [ ] Include role context in the capture path.
- [ ] Ensure no sign-in is required for first contact.
- [ ] Use steward/player id as `creatorId` for unauthenticated submissions.
- [ ] Add manual-entry path for already-received car offers and car scout offers.
- [ ] Verify created support BAR has no `PlayerQuest` assignment.
- [ ] Verify created support BAR has no `HandSlot`.
- [x] Decide whether steward vault as support inbox is acceptable for EOD.
- [ ] Verify campaign steward can access support BARs attached to campaigns they steward.
- [ ] Add follow-up task to separate campaign inbox BARs from personal vault drafts if needed.

## Phase 3: App Bridge

- [ ] Add soft BARS Engine bridge copy below role picker.
- [ ] Avoid making ontology explanation primary.
- [ ] Add optional early-circle CTA for people interested in the app.

## Phase 4: Validation

- [ ] Test mobile layout.
- [ ] Test desktop layout.
- [ ] Verify all links/CTAs.
- [ ] Ask at least one person which role they would choose.
- [ ] Record feedback in the Library.
