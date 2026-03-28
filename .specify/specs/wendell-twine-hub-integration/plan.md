# Plan — Wendell Twine hub integration

Reference port per [spec.md](./spec.md). **Documentation + content migration** first; **code changes** only where gaps exist.

## Phase 1 — Inventory

1. Parse **Twine** `tw-passagedata` names → **spreadsheet** of passage → **engine route** (add **`INGEST.md`** in spec folder listing Start, Timebank, GoFundMe, …).
2. List **Harlowe features used**: `(set:)`, `(prompt:)`, `(open-url:)`, `(goto-url:)` — mark **DB replacement** for each.

## Phase 2 — Route parity

1. **Audit** `/campaign`, `/event`, `/event/donate/wizard`, `/campaign/[ref]/fundraising` against **Twine** paths — **gaps** → **tasks** or **issues**.
2. Align **OBT** modal + **DSW** branches with **SkilledDonation** / **UnskilledDonation** / **TimebankQuest** flows.

## Phase 3 — Content

1. Export **key passages** to **Twee** in `content/twine/wendell-support/` or attach to **Adventure** slug — **steward decision**.
2. **321 Shadow** Dojo: ensure **existing** adventure ID or **seed** references **IdentifyCharge** paths.

## Phase 4 — Analytics (optional)

1. **`recordHubSpokeSelection`** or **PostHog** event — only if product asks.

## File impact (expected)

| File | Change |
|------|--------|
| `.specify/specs/wendell-twine-hub-integration/INGEST.md` | New — passage inventory |
| `content/twine/...` | Optional Twee import |
| `docs/runbooks/` | Optional short “Wendell ↔ engine” link |
| Code | Only if parity gaps found |

## Out of scope

- Embedding Harlowe runtime in Next.js
- Automatic Twine-to-React transpiler
