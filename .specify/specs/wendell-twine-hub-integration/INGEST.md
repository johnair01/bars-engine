# Wendell Support Quest — passage → bars-engine map (inventory)

Source: Harlowe Twine export (`cpq9dpsx.html`), title **Wendell Support Quest**.  
**Status:** Initial inventory for [tasks.md](./tasks.md) **T1** / **T3** — extend as passages are ported.

## Variable mapping (Harlowe → engine)

| Twine variable | Intended bars-engine equivalent |
|----------------|----------------------------------|
| `$timebankCredits` | Player ledger / timebank balance (TBD: `VibeulonLedger` metadata vs dedicated field) |
| `$pendingUnskilledHours` | Pending until **quest completion** — align with DSW **time** activation + [OBT](../offer-bar-timebank-wizard-modal/spec.md) |
| `$skilledHours` (prompt) | **Skilled** donation path → immediate credit (mirror in Instance/campaign rules) |
| `$isDJ` | Event participation flag — `EventParticipant` or player metadata JSON |

## Passage name → surface / feature

| Passage name | bars-engine target (v1) |
|--------------|-------------------------|
| Start | `/campaign/hub`, `/event`, or instance landing — [CHS](../campaign-hub-spoke-landing-architecture/spec.md) |
| GoFundMe | `/campaign/[ref]/fundraising`, GoFundMe URL on `Instance` |
| Timebank | `/event/donate/wizard` time branch + timebank copy blocks |
| Timebank Explanation / Contribution / Offers / Withdrawal | DSW + [OBT](../offer-bar-timebank-wizard-modal/spec.md) + external forms (admin URLs) |
| SkilledDonation / UnskilledDonation / TimebankQuest | DSW tiers + quest-gated activation |
| discover your contribution | DSW “guided” branch copy |
| Books / Book Igniting Joy / Book Mastering | Book library + Gumroad / admin links |
| Allyship Quests + Quest * roles | Quest templates or seeded BARs; superpower alignment [EH](../superpower-move-extensions/spec.md) |
| Allyship Dojo / Shadow Work / IdentifyCharge… | Existing 321 / shadow **Adventure** — `content/twine` or Passage |
| Keeping Warm / Dance Event | `EventArtifact` + Partiful ([EIP](../event-invite-party-initiation/spec.md)) |
| Podcast / Promotion / Guests | Content / event blocks — lower priority |
| Greasing the Wheels | Campaign-specific page or event — optional |

## External URLs captured in Twine (verify per deploy)

- GoFundMe, Gumroad, Google Docs (book), Google Forms (timebank), Partiful, spreadsheets — **must** live in **Instance** / **Event** / env-backed config for production.
