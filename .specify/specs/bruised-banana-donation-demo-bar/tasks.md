# Tasks: Bruised Banana donation demo BAR

## Section 6 — Pre-implementation specification todos

_Synthesized in [design-notes.md](./design-notes.md); sufficient for v1 implementation._

- [x] **No / not yet / exit** — See design-notes + `BbDonationDemoWizard` exit rows and done-step copy.
- [x] **Data sentence** — Session-only storage; spec.md + design-notes.
- [x] **Wiki IA** — Six lens links on BB wiki page (v1).
- [x] **Non-goals** — spec.md (unchanged).
- [x] **Success matrix** — design-notes table (lightweight).

---

## Implementation tasks

- [x] **Demo route** — `/demo/bruised-banana` + `BbDonationDemoWizard` (charge + 3→2→1, `sessionStorage`).
- [x] **Donate route** — `/demo/bruised-banana/donate` (pre-existing `DonatePageView`).
- [x] **Wiki** — BB campaign page: demo link, `CampaignDonateCta`, six face → wiki lens links.
- [x] **Outbound BAR artifact** — `npm run seed:bb-donation-demo-bar` → stable id `bb-donation-demo-outreach` (`/bars/bb-donation-demo-outreach`).
- [ ] **Telemetry** — Optional events for step completion / donate clicks from demo.
- [ ] **Prefill** — Pass demo session into post-login 321 or create-bar (query/hash follow-up).
