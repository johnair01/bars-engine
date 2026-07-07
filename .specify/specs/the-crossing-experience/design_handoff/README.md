# Handoff: The Crossing — campaign → capture → steward dashboard

## Overview

**The Crossing** is a community fundraising/mutual-aid experience inside **BARS Engine** (the product surface of *Mastering the Game of Allyship*). Wendell needs a reliable car to keep showing up; The Crossing turns "I want to help" into one small, concrete **move** that becomes a **BAR** (a kernel with provenance) on a steward's board.

This package documents the **full end-to-end loop**:

1. A supporter lands on the campaign, picks the path that fits what they can offer (six roles, grouped under the four allyship domains).
2. They make one small move and submit it — no account required.
3. The move lands as a BAR on **Wendell's steward dashboard**.
4. The steward follows up with contributors, manages status, watches the car fund fill.
5. The steward marks the car purchased and **broadcasts a thank-you to every contributor**, closing the loop ("a yellow brick is paved").

It also resolves the **`/awaken` double-duty** problem (see *Route Architecture* below): `/awaken` and `/campaign/the-crossing` were both acting as donate/show-up funnels. They are now cleanly separated and cross-linked.

## About the design files

The files in `design_files/` are **design references authored in HTML** (Design Components — `.dc.html`). They are working prototypes that show intended look, copy, states, and behavior — **not production code to ship directly**.

The task is to **recreate these designs in the BARS Engine codebase** ([`johnair01/bars-engine`](https://github.com/johnair01/bars-engine), Next.js 14 / React / TypeScript) using its existing patterns: the cultivation-card primitive (`src/components/ui/CultivationCard.tsx`), the card tokens (`src/lib/ui/card-tokens.ts`), and the existing route structure under `src/app/`. Where this prototype invented data shapes (the BAR/contribution record, the seed data), map them onto the app's real models rather than copying the literals.

The prototype's interaction model (React `useState`, screen routing, localStorage persistence) is illustrative. In the app, contributions should be a real persisted resource and the steward dashboard a real authenticated route.

## Fidelity

**High-fidelity.** Colors, typography, spacing, copy, and interaction states are final and follow the **BARS Engine Design System** (dark "OS that contains glowing element-coded cards"). Recreate pixel-faithfully using the codebase's existing card components and tokens. The one place to treat as lower-fidelity is the **account/auth** and **message-send transport**, which are mocked here (see *What is mocked*).

---

## Route architecture (resolving the `/awaken` double-duty)

The two routes were both funnels for the car fund. They now have distinct jobs and cross-link:

- **`/campaign/the-crossing`** — *the community CYOA car-fund experience.* The supporter-facing campaign documented here. Owns: choose-a-path, make-a-move capture, the BAR confirmation, and (for stewards) the dashboard.
- **`/awaken`** — *the book-launch weekend funnel.* The three July 17–19 gatherings + free Chapter One. Top-of-funnel for the launch, not the car fund.
- **`/superpower`** — the existing Superpower Quiz; used as the soft fallback ("not sure this is your role?") from both the campaign and each role page.

Cross-links already wired in the prototype: the campaign footer → `/awaken`; the quiz fallback → `/superpower`; each role's deep-link hands into the capture flow (below).

---

## The continuous click-through (how the files connect)

```
The Crossing.dc.html  (marketing landing)
      │  role card → "Make an intro →" / "Send a car lead →"
      ▼
The Crossing - Flow.dc.html?role=<roleId>&go=capture   (deep-link)
      │  capture form → submit
      ▼
  "Saved as a BAR"  ──► Steward dashboard (Player/Steward toggle, same file)
      │
      └─ "← Back to The Crossing · pick another path" → The Crossing.dc.html#paths
```

- `The Crossing - Flow.dc.html` reads `?role=` and `?go=` on load (`go=capture|role|steward`) and drops the user on the right screen. In the real app this is just routing (`/campaign/the-crossing/move/<roleId>`), not query-string handoff.
- `Role Detail.dc.html` is a standalone, fully-expanded role page (one prop-driven component renders all six roles). It's the deeper alternative to the landing page's inline accordion.

---

## The six roles & four domains

Every role belongs to one of the four **allyship domains**, which carry the Wuxing element color. Domain is the organizing layer on the landing page (gates), and the element tint follows the role everywhere it appears.

| Role | Domain | Element | Tiny move | Creates |
|------|--------|---------|-----------|---------|
| **Car Scout** | Gather Resources | Earth 土 | Send one promising car listing | Listing lead |
| **Connector** | Gather Resources | Earth 土 | Make one warm introduction | Warm intro |
| **Donor** | Gather Resources | Earth 土 | Donate, lend, or share | Contribution |
| **Car Expert** | Skillful Organizing | Wood 木 | Sanity-check one listing | Listing review |
| **Signal Booster** | Raise Awareness | Metal 金 | Share with one sentence on why it matters | Signal boost |
| **Encourager** | Direct Action | Fire 火 | Send one check-in | Encouragement note |

> Note: "Car Person" from the original MVP was renamed **Car Expert**. Each role references real Allyship Deck move codes (e.g. `OPEN-GR-ARCHITECT`) — these correspond to the deck card system (`AllyshipCard.dc.html`).

---

## Screens / Views

Screenshots are in `screens/`, journey-ordered. Preview/design width is **~900px** (the canvas the screenshots were captured at); the layouts are single-column and mobile-first — content column is **max 620–680px** centered, capture form **560px**, dashboard **840px**.

### 00 · Campaign hero — `00-marketing-hero.png`
**File:** `The Crossing.dc.html`
- **Purpose:** Set the ask plainly, route into the paths.
- **Layout:** Left-aligned hero, 620px column. Eyebrow (mono, purple) → display H1 → 20px subhead → 15px gray body → two CTAs (flex row, gap 11px).
- **Copy:** H1 "The Crossing" (Jost 700, 44px, `-0.03em`). Subhead "Wendell needs a reliable car to keep showing up." Primary CTA **"Choose Your Move →"** (purple gradient `#8b5cf6→#7c3aed`, radius 11px, 13×22 padding). Secondary "Read the full story" (transparent, 1px `rgba(124,58,237,.42)` border). Top-right link "Book-launch weekend →" → `/awaken`.

### 01 · Choose a path (domain gates) — `01-marketing-choose-path.png`
- **Purpose:** Pick a role. Cards grouped under domain gate headers.
- **Layout:** Gate header = element sigil (23px, glowing) + mono domain label (tinted to element `gem`) + 12.5px gray blurb. Below each gate, role cards stack (gap 10px).
- **Role card:** full-width button, 1px element `frame` border, radius 14–15px, background `radial-gradient(135% 130% at 90% -14%, <gf>, <gt> 72%)`, `inset 0 1px 0 rgba(255,255,255,.06)`. Left: 42–46px rounded element-tinted glyph tile. Center: role name (Jost 700, 17–18px, `white-space:nowrap`) + tiny-move (13px gray). Right: "EXPLORE"/"GIVE" + chevron (mono, element `gem`).
- **Interaction:** Click toggles an **accordion** (one open at a time). Expanded panel reveals: description, "Tiny move / Creates / Why it matters" grid, deck-move chips, an embedded **Allyship Deck starter card**, and two CTAs.
- **CTAs in the expanded panel** (both hand into the flow):
  - Primary "<action> →" → `…/Flow?role=<id>&go=capture` (Donor primary = **Send Venmo**, direct).
  - Secondary "Save this as a BAR →" → same capture flow.

### 02 · Role detail page — `02-role-detail.png`
**File:** `Role Detail.dc.html` (prop `role` ∈ the six ids)
- **Purpose:** A dedicated, deeper page per role (the non-accordion alternative).
- **Sections:** Breadcrumb ("← The Crossing" / domain label) → **header card** (element-tinted, large faded sigil bottom-right, domain·Path eyebrow, 42px H1, overview) → **"Do this now"** card (tiny-move + primary CTA in element gradient + "Save this as a BAR") → **Why it matters** (impact + a boundary line on a left rule) → **Moves you can make** (bulleted, element-dot markers).

### 03 · Allyship Deck cards on the role page — `03-role-detail-deck-cards.png`
- **Purpose:** Show the two deck moves the path draws on. Rendered with the real **cultivation card** primitive (`AllyshipCard.dc.html`).
- **Each card:** element-tinted body, move glyph (Wake/Clean/Grow/Show) + face glyph (Architect/Diplomat/etc.), the contemplative question (italic), a **Modifier** box (role's contribution + "MAKE" artifact), domain · `NNN/120` footer with vibeulon count `♦`, and a "Sign in to claim" action bar (signed-out state).
- Below this on the page (not shown): a purple **"Save this contribution · BARS Engine"** account card, then the `/superpower` quiz fallback.

### 04 · Flow — landing — `04-flow-landing.png`
**File:** `The Crossing - Flow.dc.html`
- The flow's own copy of the choose-a-path board (used when navigating inside the app rather than from the marketing page). Persistent top bar: **The Crossing** wordmark + breadcrumb, and a **Player / Steward** segmented toggle (right).

### 05 · Flow — role detail — `05-flow-role.png`
- Compact role view inside the flow: header card, "Moves you can make", the starter Allyship Deck card, and a sticky bottom **"<action> →"** button that advances to capture.

### 06–07 · Make your move (capture) — `06-flow-capture-empty.png`, `07-flow-capture-filled.png`
- **Purpose:** Capture the move as a BAR. **No account required.**
- **Layout:** 560px column. Back link → role. Element glyph + "MAKE YOUR MOVE" eyebrow + role H1. Helper line: "This becomes a BAR on Wendell's board. He'll follow up through the contact you leave — no account needed."
- **Fields:** Your name (text) + Reach you on (select: Text/Email/Instagram/Signal/Venmo) in a 2-col grid → Where to reach you (text) → **[Donor only]** Amount (numeric) → role-specific offer field (e.g. "The introduction") → Link or context (textarea, optional).
- **Inputs:** bg `#111110`, 1px `rgba(255,255,255,.12)`, radius 9px, 11×12 padding, 14px text.
- **Submit:** sticky bottom, element gradient when valid, disabled (`rgba(255,255,255,.07)` / gray text / `not-allowed`) until name + contact + offer are non-empty. Hint line below flips between "Add your name, contact, and what you're offering." and "Goes straight to Wendell's board."

### 08 · Saved as a BAR — `08-flow-saved.png`
- **Purpose:** Confirm + offer next steps.
- Green check disc (`#34d399→#10b981`) → H1 "Your move is saved as a BAR." → a mini BAR card (deck code, **NEW BAR** amber pill, the offer summary, role · domain meta).
- **CTAs:** "Create your BARS Engine account to track this →" (purple), "See where it lands · Steward view →" (routes to dashboard), "← Back to The Crossing · pick another path" (→ `The Crossing.dc.html#paths`).

### 09 · Steward dashboard (Wendell's board) — `09-steward-dashboard.png`
- **Purpose:** Where every BAR lands; the steward's working surface.
- **Header:** earth glyph + "Wendell's board" + "The Crossing · Steward dashboard".
- **Stat row (3 cards):** Contributions (count), **Needs follow-up** (amber, count of `new`), People in the field (green, unique names).
- **Car-fund card:** amber-tinted. "CAR FUND" → `$<raised> of $4,800` → `NN% · N leads in` → progress bar (`#b5651d→#d4a017` fill). Primary **"Mark the car as purchased →"** (purple). *(raised = base $3,225 + sum of donor amounts.)*
- **Filter chips:** All / Needs follow-up / Leads / Intros / Awareness / Care / Donations, each with a count; active chip is purple-tinted.
- **Contribution list:** cards with left element accent rule (3px), element glyph tile, name (`nowrap`) + role pill + **New** pill (amber) for `new` items, truncated summary, and right column: status label (status color) + relative time. `new` items sort to top. Click → contributor detail.

### 10 · Contributor follow-up — `10-steward-contributor.png`
- **Purpose:** Interface with a signup; manage status.
- Header card (element-tinted): name, role · domain, status pill. Body: **Offering** (summary + detail), **Reach via** (contact · channel), **Amount** (for donors, green mono). Optional **Activity** log (left-rule notes). **Follow up** panel: a reply textarea + actions — **Log message** (enabled when draft non-empty; logs to activity and flips `new`→`contacted`), **Mark contacted**, **Accept offer**, **Not needed**. Actions show conditionally based on current status.

### 11 · Car secured — `11-steward-car-secured.png`
- After "Mark purchased", the fund card flips green: car glyph + "CAR SECURED" + "2019 Honda Civic — on the road" + primary **"Thank your contributors →"**.

### 12 · Thank-you broadcast — `12-steward-broadcast.png`
- **Purpose:** Close the loop. One message → every contributor on the channel they left.
- "To · N people" panel with a recipient chip per contributor (name + channel). A prefilled editable message textarea (purple-tinted). Primary **"Send thank-you to N contributors →"**.

### 13 · Loop closed — `13-steward-sent.png`
- Three yellow "brick" marks animate in → H1 "A yellow brick is paved." → "You let **N contributors** know the car is secured. Every move became evidence — and the campaign followed up on all of it." → "The Crossing is complete. The next BAR is already waiting." → "Back to the board".

---

## Interactions & behavior

- **Accordion (landing):** one role open at a time; expanded panel fades up (`xfade`, opacity+8px, ~0.28s). *Implementation note: gate the panel's mount, and don't leave it at opacity 0 if you snapshot.*
- **Deep-link handoff:** `?role=<id>&go=capture|role|steward` sets the entry screen. Replace with real routes in-app.
- **Form validation:** submit disabled until `name && contact && summary` are non-empty (trimmed). Donor amount parsed as `parseFloat` of digits; optional.
- **Status machine** (contribution): `new → contacted → accepted` (or `declined`), terminal `thanked`. Donor submissions start `accepted`; everyone except `declined` becomes `thanked` on broadcast.
- **Logging a message:** appends `You: "…"` to the contribution's activity and advances `new → contacted`.
- **Mark purchased:** sets `carPurchased`; reveals the thank-you path. **Send broadcast:** sets `notified` on all, `thanked`, shows the completion screen.
- **Motion:** quiet, physical. Ease `cubic-bezier(0.16,1,0.3,1)`. Press shrinks (`scale .97`, ~80ms). `satisfied` cultivation cards idle-float. Honor `prefers-reduced-motion`.
- **Toast:** transient bottom-center confirmation on status changes / reset (~1.9s).
- **Reset demo data:** clears localStorage and re-seeds (prototype affordance only — remove in production).

## State management

Prototype keeps everything client-side (`useState` + localStorage key `the-crossing-flow-v1`). In the app:

- **Contribution / BAR record:** `{ id, role, name, contact, channel, summary, detail, status, amount, notified, createdAt, notes[] }`. This is the unit that should be a **real persisted resource**, created by the capture form (unauthenticated allowed) and owned/queried by the campaign steward.
- **Campaign state:** `carPurchased`, `thanked`, fund goal/base.
- **Derived:** raised total, % to goal, unique people, pending (`new`) count, recipient list (unique by name).
- **Routing:** screen + active role + selected contributor id (→ real routes).

## Design tokens

**Surfaces / text** (from the design system; near-black, never pure `#000`):
- Page bg: `radial-gradient(120% 50% at 50% -6%, #16121f 0%, #0a0908 46%)`, base `#0a0908`.
- Card body: `#111110` / `#121210`; hairline borders `rgba(255,255,255,.07–.12)`.
- Signature card inset highlight: `inset 0 1px 0 rgba(255,255,255,.06)` (load-bearing — do not remove).
- Text: primary `#f4f2ec` / `#f1efe9`, body `#cfcdc6` / `#d6d4cd`, muted `#a09e98`, faint `#6b6965`.

**Element palettes** — each `{ frame (border), glow (shadow), gem (accent), gf/gt (gradient stops), sigil }`:
| Element | frame | glow | gem | sigil |
|---|---|---|---|---|
| Earth (Gather) | `#b5651d` | `#d4a017` | `#e0a93b` | 土 |
| Wood (Organizing) | `#4a7c59` | `#27ae60` | `#2ecc71` | 木 |
| Metal (Awareness) | `#8e9aab` | `#bdc3c7` | `#cdd2d6` | 金 |
| Fire (Direct Action) | `#c1392b` | `#e8671a` | `#e8694a` | 火 |
| Water (used on `/awaken` cross-link) | `#1a3a5c` | `#1a7a8a` | `#3a93c8` | 水 |

Tints derive at runtime: `g10 = gem@10%`, `g28 = gem@28%`, `g45 = gem@45%`; button gradient `gemLite = mix(gem, white, .84)` over `gem`, ink `gemInk = mix(gem, #0a0805, .14)`.

**Liminal / action:** purple `#7c3aed` (and `#8b5cf6`, `#a855f7`) — **reserved for action/account/close-the-loop, never an element.**

**Status colors:** new `#d4a017` · contacted `#3a93c8` · accepted `#2ecc71` · declined `#8e7d76` · thanked `#a855f7`.

**Type:** Display **Jost** (titles/chrome, tracking `-0.02em`); Body **Nunito**; Mono **Space Mono** (uppercase, wide letter-spacing micro-labels + tabular numbers). *Brand spec is Futura PT Bold for display — substituted with Jost here; swap if licensed files are available.*

**Radii:** cards 12–16px, buttons/inputs 8–13px, chips 6px, pills 99px, glyph tiles 11–13px, avatars circular.
**Spacing:** section gaps ~24–48px; card padding 14–22px; control gaps 8–13px.
**Fund constants (prototype):** goal `$4,800`, base `$3,225`.

## Assets

- **Wuxing sigils** `火 水 木 金 土` and geometric marks `◇ ♦ ○ ●` — Unicode, rendered in body font, tinted to element `gem`. No emoji on card surfaces.
- **Move / face glyphs** inside the deck cards come from the design system's `MoveIcon` set + `AllyshipCard.dc.html`.
- **Card art** (pixel-art illustrations) — the deck-card system supports them; not required for these screens. Use the app's `card-art-registry`.
- No raster assets are required to build these screens beyond the design-system bundle.

## Files

In `design_files/` (design references — recreate, don't ship):
- **`The Crossing.dc.html`** — campaign landing: hero, story preview, How To Play, domain gates + accordion role cards, `/awaken` + `/superpower` cross-links. Hands into the flow.
- **`The Crossing - Flow.dc.html`** — the stateful end-to-end app: landing → role → capture → saved → steward dashboard → contributor follow-up → mark purchased → broadcast → loop closed. Player/Steward toggle; localStorage persistence; seeded sample data.
- **`Role Detail.dc.html`** — prop-driven role page (all six), with two Allyship Deck cards + account + quiz fallback.
- **`AllyshipCard.dc.html`** — the cultivation/Allyship Deck card primitive used throughout (mirror of the app's `CultivationCard`).

Source of truth for the visual system: [`johnair01/bars-engine`](https://github.com/johnair01/bars-engine) — `src/lib/ui/card-tokens.ts`, `src/styles/cultivation-cards.css`, `src/components/ui/CultivationCard.tsx`.

## What is mocked (decide real implementations)

- **Account / auth** — "Create your BARS Engine account" and "Save this contribution" are placeholders; wire to the app's real auth and BAR-claiming.
- **Message transport** — "Log message" and the thank-you **broadcast** are in-app only; connect to the real channels (text/email/IG/Signal/Venmo) or a notifications service.
- **Donations** — Donor primary is a Venmo deep link (`venmo.com/u/<handle>`, placeholder `wendell-britt`) and an in-app "offer another resource" path; confirm the real handle / payment route.
- **Seed data** — the 10 sample contributions are illustrative; the live board reads real submissions.
- **Fund total** — base + summed donor amounts is a stand-in for the real ledger.
