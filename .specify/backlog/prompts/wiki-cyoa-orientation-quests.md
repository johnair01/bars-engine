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
choices[]    — 1–4 choices. each is a question a player would genuinely ask.
              "Back to overview" always counts as one valid choice.
              terminal passages have zero choices.
```

**If a wiki section cannot be expressed in this unit — claim + body + at least one
choice — the section is not ready to be a passage.** This is the canonical failure mode
to check before generation.

### Section relationship types

These determine the topology of the adventure graph:

| Type | Wiki pattern | CYOA shape |
|------|-------------|------------|
| `hub` | Page intro / overview | Start node. Choices = one per major section. |
| `sequential` | Numbered phases, procedures | Forced linear chain. No branching. Each node has exactly one "next" choice + optional "back to overview". |
| `branching` | Parallel concepts (e.g. four moves grid) | Hub sub-node. Player picks which branch to explore. Each branch terminates. Returns to parent hub after terminal. |
| `terminal` | Concluding insight, steward callout | Zero choices. Passage ends with a forward-momentum sentence ("You have named this. Carry it."). |

### The hub-and-spoke shape (most common wiki page)

```
[start: page overview]
    ├── [section A: sequential chain] → A1 → A2 → A3 → [terminal A]
    ├── [section B: branching hub]
    │       ├── [B.1 concept] → [terminal B.1]
    │       ├── [B.2 concept] → [terminal B.2]
    │       └── [B.3 concept] → [terminal B.3]
    └── [section C: single terminal]

[quest complete: all terminals visited]
```

Completion condition: player has visited all terminal nodes (or a configurable subset).

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
- No `SpokeSession` created (no gmFace/moveType routing)
- No `AlchemyCheckIn` step (no emotional calibration phase)
- Completion tracked via `PlayerPlaybook` (same as intake)
- `moveType` stored on Adventure as `wakeUp` (fixed, not inferred)
- `campaignRef` optional — orientation quests can be campaign-scoped or global

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
3. **Hand / quests** — orientation quest completions appear as Wake Up quest records in Vault.

Runner: reuse `CyoaIntakeRunner` with a `mode="orientation"` prop that:
- Skips Phase 1 (check-in slider + channel selector)
- Skips Phase 2 (altitude)
- Goes directly to the passage navigation (Phase 3)
- Shows a "Quest complete" terminal instead of "Your adventure is being prepared"
- Awards a `wakeUp` quest completion record (not a `SpokeSession`)

---

## What needs to be built (in order)

### Phase 0 — Schema + grammar validation
- [ ] Add `CYOA_ORIENTATION` to `adventureType` enum in `prisma/schema.prisma`
- [ ] Migration: `prisma/migrations/YYYYMMDDHHMMSS_add_cyoa_orientation_type/migration.sql`
- [ ] Add `CyoaOrientationPassageSchema` to `src/lib/cyoa-intake/types.ts`:
      `relationshipType: 'hub' | 'sequential' | 'branching' | 'terminal'`
- [ ] Validation helper: `validateOrientationGraph(passages)` — checks grammar rules
      (hub has ≥2 choices, terminal has 0, sequential has exactly 1 next + optional back)

### Phase 1 — Admin authoring
- [ ] `CreateAdventureForm`: add `CYOA_ORIENTATION` option
- [ ] `OrientationTemplateEditor` component in `/admin/adventures/[id]/` —
      structured editor presenting grammar template per passage
- [ ] `saveOrientationTemplate` server action (validates graph before save)

### Phase 2 — Player runner
- [ ] `/cyoa-orientation/[id]/page.tsx` — server entry, loads adventure + playbook
- [ ] `CyoaOrientationRunner.tsx` — `CyoaIntakeRunner` variant, skips check-in phases
- [ ] Quest completion record on terminal (PlayerPlaybook + optional WakeUp quest BAR)

### Phase 3 — Wiki CTA
- [ ] `WikiOrientationCta` component — shown at bottom of wiki pages that have a
      corresponding `CYOA_ORIENTATION` Adventure (query by `campaignRef` + `slug` match)
- [ ] Wire into wiki layout or individual pages as applicable

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
- [ ] `/wiki/cyoa-adventure` has a working "Experience as adventure →" CTA when an
      orientation Adventure for that page exists
- [ ] Completed orientation quests appear in player Vault as Wake Up records
- [ ] Wiki page + CYOA mode feel like two lenses on the same knowledge, not duplicates
