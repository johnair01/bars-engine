# Spec: Dashboard two-channel hub (NOW)

## Purpose

Redesign the dashboard block that today ships as **`ThroughputLanesSection`** on the home (`/`) dashboard: two columns (**Personal** vs **Collective**) with flat text links. Internally the team may still think in terms of *throughput* (keeping creative energy moving); **players** need a name and surface that feel like **the game**, not ops metrics.

**Problem**

- The label **“Throughput”** and the flat link-list pattern **break player-facing tone** and **diverge from UI Covenant** (cultivation-card language, tactile hierarchy).
- The **top** of the dashboard is **well organized** (two channels) but **under-embodied**; the **bottom** sections often feel **more alive** but **less systematically grouped**.
- We want to **meet in the middle**: keep the **two-channel map**, add **instrument-like affordances** (pressable controls, consistent row primitive), and align **chrome** with `cultivation-cards.css` + `card-tokens.ts`.

**Product promise (draft for copy iteration)**

- One alchemical loop, **two bowls**: solo practice vs shared field — same move (*feel it → give it form*), different containers.

---

## Design authority — six Game Master lenses (integration)

These are **non-negotiable checks** during design and implementation; Sage = integration.

| Face | Wisdom | Translates to |
|------|--------|----------------|
| **Shaman** | Body recognizes place before mind parses copy | Territories feel *different* (quiet vs warm); at most **one** ambient motion for the block per UI Covenant |
| **Regent** | Order without collapse | **Two channels only**; cap visible destinations per channel (3–5); overflow = secondary entry |
| **Challenger** | Jargon protects designers from choosing the audience | **No player-facing “Throughput”**; title = outcome or place, not metric |
| **Architect** | One primitive scales | Single **row/control** component maps every destination; Tailwind layout + covenant CSS for mood |
| **Diplomat** | Invitation > instruction | Soft verbs, no grind/score language; collective paths feel welcoming |
| **Sage** | One system, not two UIs stitched | Top block **reuses** the same tactile grammar as strong sections below where possible |

---

## User stories

1. **As a** returning player, **I want** a dashboard hub whose **name and layout** read as “where do I go?” **so** I’m not decoding internal vocabulary.
2. **As a** player, **I want** destinations to look like **controls I can press** (buttons / card-like rows) **so** the hub matches the rest of the app’s game feel.
3. **As a** player, **I want** **Personal** and **Collective** to stay **visually and semantically distinct** **so** I know if I’m in solo practice or the shared field.
4. **As a** player on a small screen, **I want** the hub to stay **readable, tappable (≥44px targets)**, and **without horizontal scroll** **so** mobile matches desktop intent.
5. **As a** steward, **I want** links to **Campaign**, **Event**, **Hand**, **Capture**, **Scene Atlas**, **I Ching**, **Game map**, **Lobby** to remain **correct** (including `campaignHomeHref` and optional `instanceId` on I Ching) **so** behavior does not regress.

---

## Functional requirements

### FR1 — Naming & copy

- **FR1a**: Replace visible **“Throughput”** with a **player-facing section title** (final string in implementation PR; options documented in `plan.md`).
- **FR1b**: Subtitle remains **one sentence** explaining the two-channel idea without the word *throughput* unless user-tested exception.
- **FR1c**: **“Try it →”** (or successor) must **resolve the `/play` vs `/adventures` disconnect** documented in [player-main-tabs-move-oriented-ia/SIX_FACE_ANALYSIS.md](../player-main-tabs-move-oriented-ia/SIX_FACE_ANALYSIS.md) — either one canonical “try the loop” target with copy that matches, or explicit dual CTAs; decision recorded in `plan.md`.

### FR2 — Layout & IA

- **FR2a**: Preserve **two channels**: Personal | Collective (labels may be tuned for tone).
- **FR2b**: Each channel has a **bounded** set of entries; if more are needed later, use **“More in …”** or a secondary drawer — not an unbounded list in v1.
- **FR2c**: **Meet in the middle**: row density and visual weight **closer** to tactile dashboard sections below (reference components named in `plan.md` after audit).

### FR3 — UI Covenant & tactility

- **FR3a**: **Read** [`UI_COVENANT.md`](../../../UI_COVENANT.md) before UI work; **layout** = Tailwind; **game aesthetic** = `cultivation-cards.css` + `card-tokens.ts` (element / altitude / stage).
- **FR3b**: Each destination is a **primary control** (e.g. `button`-styled link or cultivation-card-styled row) with **focus-visible** and **≥44px** min touch target.
- **FR3c**: **Optional v1.1**: a **single** metaphorical “depth” or “mode” control (e.g. stepped control) only if it **binds to real state** or is **purely decorative with reduced motion** — spec the behavior in `plan.md` if shipped.

### FR4 — Engineering

- **FR4a**: Primary implementation locus: [`src/components/dashboard/DashboardTwoChannelHub.tsx`](../../../src/components/dashboard/DashboardTwoChannelHub.tsx).
- **FR4b**: Call site: [`src/app/page.tsx`](../../../src/app/page.tsx) — props (`activeInstanceId`, `campaignHomeHref`) unchanged unless spec amendment.
- **FR4c**: **No Prisma/schema** required for v1 unless a follow-up adds persistence (e.g. collapsed state).

---

## Non-goals (v1)

- Reordering the **entire** dashboard stack above/below this section (separate IA spec if needed).
- Full **skeuomorphic** textures (wood grain, 3D knobs) — target is **instrument-like** controls within covenant.
- Renaming **global lore** terms “4 Moves (Personal Throughput)” outside this dashboard block (optional follow-up; see `content/`, wiki).

---

## Acceptance criteria

- [x] Player-visible **section title** is not **“Throughput”** unless explicitly user-tested and documented exception.
- [x] **Two-channel** structure preserved; all **existing destinations** remain reachable with **same href rules** (campaign home, conditional I Ching query).
- [x] Destinations use **covenant-aligned** chrome + **pressable** affordances; **WCAG**: focus visible, contrast, touch targets.
- [x] **Mobile**: no horizontal scroll for this section at common breakpoints; readable labels.
- [x] **Try it / loop** link behavior aligned with decision in `plan.md` (no silent wrong tab).
- [x] `npm run build` and `npm run check` pass.
- [x] `tasks.md` checked through shipped scope.

---

## Cross-links

- [`play-public-teaser-loop`](../play-public-teaser-loop/spec.md) — logged-out `/play` teaser (no-account loop copy + join/login CTAs).
- [`vault-page-experience`](../vault-page-experience/spec.md) — Hand / Vault tone and caps language.
- [`player-main-tabs-move-oriented-ia`](../player-main-tabs-move-oriented-ia/SIX_FACE_ANALYSIS.md) — Throughput vs PLAY routing note.
- [`scene-atlas-game-loop`](../scene-atlas-game-loop/spec.md) — Personal vs collective throughput framing (lore alignment).
- [`UI_COVENANT.md`](../../../UI_COVENANT.md) — three-channel encoding.

---

## Appendix — Current implementation snapshot

- Component: `DashboardTwoChannelHub` (replaces `ThroughputLanesSection`) — `cultivation-card` rows, `elementCssVars` per channel (wood / fire).
- Props: `activeInstanceId`, `campaignHomeHref`.
