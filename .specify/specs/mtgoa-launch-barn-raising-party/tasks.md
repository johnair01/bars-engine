# Tasks: MtGoA Launch + Barn Raising — July Fundraiser Party

> Status: `[ ]` todo · `[x]` done · `[~]` superseded. Coordinator kit.

## Phase 0: Reframe (spec hygiene)

- [x] Add reframe banner to `bruised-banana-residency-ship/spec.md` (residency
      cancelled → substance serves the July party; point to this coordinator).
- [x] Add reframe banner to `bruised-banana-launch-specbar/spec.md` (launch thread
      is now the July party).
- [x] Author this coordinator (spec.md / plan.md / tasks.md).
- [ ] Update `.specify/backlog/BACKLOG.md` (new coordinator row; annotate retired
      residency framing) and run `npm run backlog:seed`.

## Phase 1: Event identity

- [ ] Stand up a fresh **event-mode `Instance`** for the **July 18, 2026** party
      (NOT the retired residency `campaignRef`); copy holds both framings.
- [x] Confirm event **date → July 18, 2026**.
- [ ] Confirm remaining host inputs: RSVP cap, fundraising target, Partiful URL/slug.

## Phase 1b: Milestone BAR (the barn) — design done, build pending

- [x] Brainstorm + design: [milestone-bar-brainstorm.md](./milestone-bar-brainstorm.md).
- [ ] Host decisions: target $, earmark policy, in-kind readout, name consent (§11).
- [ ] Create the `CampaignMilestone` ("the barn") for the event.
- [ ] Extend `CampaignMilestoneStrip` with barn framing + 3-segment + "hands & beams".
- [ ] DSW money path moves the headline; in-kind (OBT) shows as named beams.
- [ ] Tiers: first plank / walls (33·66%) / roof (100% → group BAR with stamps).
- [ ] (Fast-follow) live `/event/barn` kiosk for the 18th.

## Phase 2: Invite + funnel linkage

- [ ] Author the **invite BAR** (per EIP) with Partiful CTA + July date + both
      framings; links to `/pricing`, `/game`, `/handbook`.
- [ ] Verify the invite is discoverable in Vault for the host when the event is active.

## Phase 3: Contribution (barn raising)

- [ ] Confirm `/event/donate/wizard` (DSW) money/time/space/host branches are
      tagged to the event Instance.
- [ ] "Ask" copy names all three goals (move first, then launch, then ongoing work).
- [ ] Verify fundraising **milestone** updates on a completed **money** donation.

## Phase 4: On-site play

- [ ] Decide + wire on-site play: PMEL bingo and/or `/game` kiosk; either stamps a
      participation BAR.

## Phase 5: Go-live gate (before invites)

- [ ] `npm run loop:ready` → GO (build, history reset, core quest config,
      feedback-cap).
- [ ] Verify prod login/signup (resolve Production Database Divergence if blocking).
- [ ] Run pre-launch seeds (party, quest-map, onboarding, cert:cyoa) against target DB.
- [ ] Author + seed `cert-mtgoa-launch-party-v1` verification quest.

## Verification

- [ ] `npm run check` passes.
- [ ] Logged-out invite → `/pricing` / `/game` reachable; DSW money path moves the
      milestone; `loop:ready` GO.
