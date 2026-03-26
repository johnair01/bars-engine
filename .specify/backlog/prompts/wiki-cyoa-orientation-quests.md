# Backlog prompt: Wiki → CYOA Orientation Quests (WCOQ)

> Design + implement per the grammar below. Run `ooo interview` first if scope is still open.
> After `BACKLOG.md` edits: `npm run backlog:seed`.

---

## What this is

Players currently have one way to encounter wiki knowledge: top-down reading at `/wiki/**`.
This feature gives them a second path: entering the same knowledge as a **Wake Up CYOA adventure**
— a branching story where every passage is a wiki section and every choice is a motivated
question that leads deeper.

The two modes co-exist. The wiki page stays. The CYOA is an alternate entry point, not a
replacement. A player who finishes the CYOA and later reads the wiki should feel like
they are re-encountering known territory from a different angle.

**Move type: always `wakeUp`.** Orientation = awareness = Wake Up. No intake routing, no SD
face inference. These quests are explicitly about understanding the system.

---

## Grammar (required reading before any implementation)

The grammar ensures that any CYOA built from a wiki page is **well-formed** — meaning a player
can always proceed, choices are always motivated, and terminal passages always feel like
genuine completion rather than dead ends.

### Unit: the passage

Every wiki section becomes exactly one passage. A passage has:

```
claim        — one sentence. states the core idea. opens the passage.
body         — 2–4 sentences. elaborates the claim. no sub-bullets.
choices[]    — 0–4 authored choices (see terminal rule below).
```

**Terminal passages (relationship type `terminal`):** authored **`choices` is the empty
array** — no in-passage buttons. The passage ends with forward-momentum copy only. This
does **not** trap the player: **return navigation** (e.g. back to a parent hub after
exploring a branch) is **not** modeled as an extra “fake” choice on the terminal. It is
handled by **runner chrome** (prominent **“Return to overview”** / **“Back to [section]”**)
and/or **implicit graph edges** from terminal → parent hub `nodeId` maintained in the
adventure graph. Authors and `validateOrientationGraph` must ensure every terminal either
completes the adventure or has an explicit **return** edge / runner rule so the player is
never stuck.

**Non-terminal passages:** 1–4 authored choices; **“Back to overview”** (or equivalent)
counts as a valid choice when the topology needs it.

**If a wiki section that should be navigable (not a true ending) cannot be expressed with
claim + body + at least one choice *or* an allowed return path — the section is not ready
to be a passage.** This is the canonical failure mode to check before generation.

### Section relationship types

These determine the topology of the adventure graph:

| Type | Wiki pattern | CYOA shape |
|------|-------------|------------|
| `hub` | Page intro / overview | Start node. Choices = one per major section. |
| `sequential` | Numbered phases, procedures | Forced linear chain. No branching. Each node has exactly one "next" choice + optional "back to overview". |
| `branching` | Parallel concepts (e.g. four moves grid) | Hub sub-node. Player picks which branch to explore. Each branch ends at a **`terminal`** node (zero authored choices). **Return to parent hub** uses runner back/return chrome and/or an explicit **graph edge** `terminalNodeId → parentHubNodeId` — not a third “choice” on the terminal passage. |
| `terminal` | Concluding insight, steward callout | **Zero authored choices.** Ends with a forward-momentum sentence ("You have named this. Carry it."). Return to hub (if any) is **outside** the passage choice list — see above. |

### The hub-and-spoke shape (most common wiki page)

```
[start: page overview]
    ├── [section A: sequential chain] → A1 → A2 → A3 → [terminal A]
    ├── [section B: branching hub]
    │       ├── [B.1 concept] → [terminal B.1]
    │       ├── [B.2 concept] → [terminal B.2]
    │       └── [B.3 concept] → [terminal B.3]
    └── [section C: single terminal]

[quest complete: required terminals satisfied]
```

**Completion condition (normative):**

- **Default:** player has visited **every** passage with `relationshipType: 'terminal'`.
- **Configurable subset:** optional field on the orientation template, e.g.
  **`requiredTerminalNodeIds: string[]`** (passage `nodeId`s). When **present and non-empty**,
  only those terminals count toward completion; other terminals are **optional explore**
  paths. When **absent or empty**, all terminals are required.
- Document this field in admin UI copy so GMs know which endings gate “quest complete.”

### Wake Up framing

These passages carry Wake Up energy — awareness, naming, threshold-crossing. Apply this
at the opening and closing passages; individual concept passages should be informational,
not theatrical.

**Start node template:**
> "You are here to understand [X]. That is a Wake Up move — not because it is dramatic,
> but because most people skip this part. [1 sentence on what they will walk away with.]
> Where do you want to start?"

**Terminal node template:**
> "[Claim restated as settled fact.] You have crossed this threshold. [1 forward-momentum
> sentence: what becomes possible now.]"

**Mid-passage voice:** informational, not initiatory. Describe from the player's vantage.
Never leak routing metadata, GM face names, or SD labels into passage text.

---

## Adventure type

New `adventureType` enum value: **`CYOA_ORIENTATION`**

Differs from `CYOA_INTAKE` and `CYOA_SPOKE`:
- No `SpokeSession` created (no gmFace/moveType routing from this flow)
- No `AlchemyCheckIn` step (no emotional calibration phase)
- **`PlayerPlaybook` is the canonical completion artifact** for orientation: when the player
  satisfies the completion rule, set **`completedAt`** (and/or progress fields) on the
  `PlayerPlaybook` row for this adventure — same storage pattern as intake for “player
  finished this CYOA.”
- **Optional Wake Up quest BAR:** if product wants a **visible Vault / quest ledger** line
  item, a separate **`CustomBar` or `PlayerQuest` completion** may be **additionally**
  recorded when orientation completes — **orthogonal** to `PlayerPlaybook`. It is **not**
  required for orientation to function; if used, document which server action writes it.
- `moveType` stored on Adventure as `wakeUp` (fixed, not inferred)
- `campaignRef` **optional** on `Adventure` — see **Wiki ↔ adventure discovery** below.

### Wiki ↔ adventure discovery (CTA query)

Orientation adventures must be findable from wiki pages **without** breaking when
`campaignRef` is null:

- Add a stable **`wikiOrientationSlug`** (nullable `String` on `Adventure`, or reuse a
  dedicated column with the same semantics) when `adventureType = CYOA_ORIENTATION`:
  e.g. `cyoa-adventure` for the page `/wiki/cyoa-adventure`.
- **CTA resolution order** when rendering a wiki page with known slug `S` and optional
  player/campaign context `ref`:
  1. Prefer **`campaignRef = ref` AND `wikiOrientationSlug = S`** (campaign-specific
     override).
  2. Else **`campaignRef IS NULL` AND `wikiOrientationSlug = S`** (global orientation).
- If both exist, (1) wins. If neither exists, hide the CTA.
- Phase 3 implements `WikiOrientationCta` using this query — **do not** require non-null
  `campaignRef` for global orientations.

---

## Generation approach

Two modes; implement Mode A first:

**Mode A: GM-authored with grammar scaffold**
The GM creates a `CYOA_ORIENTATION` Adventure in `/admin/adventures`. The admin UI presents
the grammar template (claim / body / choices / relationship type) as a structured editor.
The GM fills in content derived from the wiki page. The passage graph is manually wired.

This reuses the existing adventure + passage infrastructure with zero new AI calls.
Quality is high. Cost is author time (~30 min per wiki page).

**Mode B: AI-assisted from wiki content (future)**
GM pastes wiki page content (or selects a `/wiki/**` URL). AI generates the passage graph
using the grammar rules above. GM reviews and edits. Generation prompt uses:
- The wiki article text as input
- The grammar rules (hub/sequential/branching/terminal) as structural constraints
- The Wake Up framing templates above
- `SpokeAdventureSchema`-style Zod validation on output

This is the same pattern as `spoke-generator.ts` — `generateObject` with a schema that
enforces the grammar. Add `CyoaOrientationSchema` in `src/lib/cyoa-intake/orientation-generator.ts`.

---

## Player surface

Entry points for orientation quests:
1. **Wiki page CTA** — "Experience this as an adventure →" link at the bottom of any wiki
   page that has a corresponding `CYOA_ORIENTATION` Adventure. Links to `/cyoa-orientation/[id]`.
2. **Campaign landing** — orientation quests listed as "Learn the system" entry points alongside
   the main intake.
3. **Hand / quests** — if optional quest BAR completion is enabled, Wake Up records appear in Vault;
   regardless, **`PlayerPlaybook` completion** is the source of truth for “finished orientation.”

Runner: reuse `CyoaIntakeRunner` with a `mode="orientation"` prop that:
- Skips Phase 1 (check-in slider + channel selector)
- Skips Phase 2 (altitude)
- Goes directly to the passage navigation (Phase 3)
- Shows a "Quest complete" terminal instead of "Your adventure is being prepared"
- On completion: **always** finalize **`PlayerPlaybook`** for this adventure; **optionally**
  also write a Wake Up **quest / BAR completion** if product requires Vault surfacing
  (orthogonal — not a `SpokeSession`)

---

## What needs to be built (in order)

### Phase 0 — Schema + grammar validation
- [ ] Add `CYOA_ORIENTATION` to `adventureType` enum in `prisma/schema.prisma`
- [ ] Migration: enum value + **`wikiOrientationSlug`** (nullable `String`) on `Adventure`
      (and indexes as needed for CTA query), e.g.
      `prisma/migrations/YYYYMMDDHHMMSS_cyoa_orientation_wiki_slug/migration.sql`
- [ ] **Orientation template types — do not extend `IntakeTemplatePassage`.** Intake templates
      live in `Adventure.playbookTemplate` for `CYOA_INTAKE` only. For orientation, add a
      **separate** discriminated shape, e.g. `OrientationTemplate` + `OrientationTemplatePassage`
      in `src/lib/cyoa-intake/orientation-template.ts` (or beside `types.ts`) with:
      - `templateKind: 'orientation'` and `version: 1` at the root JSON
      - `relationshipType: 'hub' | 'sequential' | 'branching' | 'terminal'` per passage
      - optional `requiredTerminalNodeIds?: string[]` for completion subset
      Store in **`playbookTemplate`** only when `adventureType === CYOA_ORIENTATION` so
      existing intake parsers ignore it by adventure type. **No breaking change** to
      `IntakeTemplate` / `IntakeTemplatePassage`.
- [ ] Zod: `CyoaOrientationPassageSchema` / `OrientationTemplateSchema` mirroring the types above.
- [ ] Validation helper: `validateOrientationGraph(template)` — at minimum:
      - **`hub`:** ≥2 outgoing choices (or document exception for single-spoke pages).
      - **`sequential`:** exactly one “forward” choice to the next node + optional back/overview;
        linear chain must reach a terminal or loop back as designed.
      - **`branching`:** ≥2 branch choices; each branch target must exist; every branch path
        must reach a **`terminal`** node; **terminal → parent return** must be satisfiable via
        explicit return edges in the graph and/or runner back affordance (reject graphs that
        strand the player with no return and no adventure-complete).
      - **`terminal`:** zero authored choices; if not adventure-ending, graph must define
        return to hub or runner must inject return UI.
      - **Reachability:** `startNodeId` exists; all `targetId`s reference defined `nodeId`s
        (align with `src/lib/story-graph` patterns where useful).

### Phase 1 — Admin authoring
- [ ] `CreateAdventureForm`: add `CYOA_ORIENTATION` option
- [ ] `OrientationTemplateEditor` component in `/admin/adventures/[id]/` —
      structured editor presenting grammar template per passage
- [ ] `saveOrientationTemplate` server action (validates graph before save)

### Phase 2 — Player runner
- [ ] `/cyoa-orientation/[id]/page.tsx` — server entry, loads adventure + playbook
- [ ] `CyoaOrientationRunner.tsx` — `CyoaIntakeRunner` variant, skips check-in phases
- [ ] On terminal completion: **PlayerPlaybook** required; optional Wake Up quest BAR (document action)

### Phase 3 — Wiki CTA
- [ ] `WikiOrientationCta` component — resolves adventure via **`wikiOrientationSlug` +
      optional `campaignRef`** (see discovery rules above), renders “Experience as adventure →”
      linking to `/cyoa-orientation/[adventureId]` (or agreed route).
- [ ] **Explicit:** wire CTA into `src/app/wiki/cyoa-adventure/page.tsx` (slug
      `cyoa-adventure`) so acceptance criteria below are implementable; other wiki pages
      opt-in the same component with their slug.
- [ ] Seed or admin-create one `CYOA_ORIENTATION` adventure with `wikiOrientationSlug =
      'cyoa-adventure'` for local/prod verification.

### Phase 4 (optional) — AI generation
- [ ] `orientation-generator.ts` — `generateOrientationAdventure(wikiContent, campaignRef)`
      using `generateObject` + `CyoaOrientationSchema`
- [ ] Admin UI: "Generate from wiki content" button on `OrientationTemplateEditor`

---

## Acceptance criteria

- [ ] A `CYOA_ORIENTATION` Adventure can be created and saved in `/admin/adventures`
- [ ] Player can navigate the orientation adventure at `/cyoa-orientation/[id]`
- [ ] Grammar validation prevents saving malformed passage graphs (no motiveless dead ends)
- [ ] Terminal passages feel like genuine completion, not dead ends
- [ ] `/wiki/cyoa-adventure` has a working "Experience as adventure →" CTA when a
      `CYOA_ORIENTATION` adventure exists with `wikiOrientationSlug = 'cyoa-adventure'`
      (see Phase 3 — page wiring + slug are in scope)
- [ ] Completed orientation quests are reflected in **`PlayerPlaybook`**; optional Vault Wake Up
      quest line item only if explicitly implemented
- [ ] Wiki page + CYOA mode feel like two lenses on the same knowledge, not duplicates
