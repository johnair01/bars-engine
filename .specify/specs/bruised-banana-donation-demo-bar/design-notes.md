# Design notes: BB donation demo (implementation v1)

## Section 6 — condensed (enables build)

### No / not yet / exit

- Every step after welcome includes **Back**, **Exit row** (wiki + donate), and neutral copy on the **done** step (“donating, learning, or walking away are all valid”).
- **Done** step: “Clear session & start over”, “Leave — back to wiki”.
- **Ambiguous leave** (tab close): no event — data remains in `sessionStorage` until cleared or tab ends.

### Data

- **Pre-signup:** Charge + 3→2→1 live in **`sessionStorage`** only (`bb-donation-demo-v1`). No server writes from this wizard.
- **Post-signup UGC:** Only **BAR** creation (and normal app flows) persist — link to `/login?returnTo=/create-bar`.

### Wiki IA (v1 decision)

- **Six lens links** on `/wiki/campaign/bruised-banana` — each row maps one canonical **Game Master face** to an existing wiki page (not six new hubs in v1).

### Success matrix (lightweight)

| Signal | Meaning |
|--------|---------|
| Reach `done` | Completed demo arc |
| Click wiki / donate from exit row | Learned or gave without finishing |
| `sessionStorage` cleared | Explicit restart |

## Routes (shipped)

| URL | Role |
|-----|------|
| `/demo/bruised-banana` | Public demo ritual |
| `/demo/bruised-banana/donate` | Public donate (shared `DonatePageView`) |
| `/wiki/campaign/bruised-banana` | Campaign wiki + demo + donate CTA + lens links |
| `/bars/bb-donation-demo-outreach` | Seeded outreach BAR — `npm run seed:bb-donation-demo-bar` |

## Follow-ups (not v1)

- Telemetry (`demo_bb_step`, etc.).
- Optional prefill from demo into signed-in 321 / create-bar.
- Dedicated six hub wiki pages instead of lens links.
