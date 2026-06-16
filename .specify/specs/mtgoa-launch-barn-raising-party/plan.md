# Plan: MtGoA Launch + Barn Raising — July Fundraiser Party

## Approach

This is a **coordinator** (SpecBAR), not a from-scratch build. Most mechanics
already exist (event Instance, invite BARs, DSW donation wizard, PMEL bingo, the
public funnel, the playable `/game`). The work is to **reframe** the retired
residency into this event, wire the funnel to the event, and pass the go-live gate.

## Design decisions

- **Reframe in place, don't archive.** The two Bruised Banana specs keep their
  substance (go-live loop readiness; the 6-Unpacking-Questions onboarding kernel);
  only the event framing moves to the July party. Cross-references stay intact.
- **Bruised Banana = venue, not campaign.** The event `Instance` is a fresh
  event-mode instance, not the retired residency `campaignRef`.
- **Two framings, one event.** Launch Party (game/book/deck) + Barn Raising
  (Wendell's move). Invite + `/event` copy must hold both without burying either.
- **The ask is plural.** Money/time/space/host all count; copy names all three
  goals (move / launch / ongoing work) with move first.
- **Date: July 18, 2026** (confirmed by host). RSVP cap + fundraising target still TBD.
- **The Milestone BAR is the centerpiece.** Designed as a "barn raising" — see
  [milestone-bar-brainstorm.md](./milestone-bar-brainstorm.md). v1: one
  `CampaignMilestone`, money headline + in-kind "hands & beams" readout, tiers
  (first plank / walls / roof).

## Sequencing

1. Reframe the two source specs (banners + purpose repoint). *(done on this branch)*
2. Coordinator spec + BACKLOG entry + seed. *(this kit)*
3. Stand up the event `Instance` (event mode) with both-framing copy.
4. Author the invite BAR (EIP) with Partiful + funnel links.
5. Confirm DSW "ask" copy names the three goals; verify milestone on money path.
6. Go-live gate: `loop:ready` GO + prod auth + seeds, then send invites.

## Open questions for the host

- ~~Exact July date~~ → **July 18, 2026** ✓. RSVP cap?
- Fundraising target ($) for the Milestone BAR? (+ earmark / in-kind readout / name
  consent — see milestone-bar-brainstorm §11)
- Partiful URL / event slug? (backlog item **PARV** tracks the integration)
- On-site: PMEL bingo, `/game` kiosk, or both?
