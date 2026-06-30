# Spec: Living-World Experience (Observatory navigation + feel)

> **Source**: a player-experience design brief ("walking through an observatory
> overlooking a living world" — Pokémon PC / Harvest Moon / Rune Factory / BotW,
> **not** Notion/ClickUp/Jira). This spec **integrates** that brief with the
> in-flight work and serves as the **Claude Design hand-off**.
>
> Several choices below are marked **[ASSUMED — confirm]** (the interview tool was
> unavailable). They reflect the recommended defaults and are cheap to change.

## Purpose

Make the whole app *feel* like a living world rather than productivity software.
This is the **experience + navigation layer** over the Lens-driven model: it
defines the five primary destinations, the Observatory metaphor, the daily flow,
the Garden's text-free growth language, the provenance "living timeline," and the
single emotional throughline — **"nothing meaningful is ever wasted."**

**Practice**: Deftness Development. UI work is governed by
[`UI_COVENANT.md`](../../../UI_COVENANT.md) + `src/lib/ui/card-tokens.ts` (read
first). Tailwind for layout; `cultivation-cards.css` for aesthetic.

## Relationship to existing specs (read first)

| Existing | How this relates |
|----------|------------------|
| [lens-integration-refactor](../lens-integration-refactor/spec.md) | This is its **experience/UI layer**. Observatory = the planetarium UI over the `Lens` hierarchy; the daily flow = TTV + plant + mint; provenance UI = `getBarProvenance`. |
| [core-game-loop-audit](../core-game-loop-audit/spec.md) | The five destinations resolve **H2** (unified inventory) by splitting inventory into clear containers (Garden/Hand/Vault/World). The loop moves (3·2·1, grow, charge) live on the artifact. |
| [tap-the-vein-tier-2](../tap-the-vein-tier-2/spec.md) | The **Daily Flow** is the home of TTV; "Daily Reflection" is a new closing beat. |

## Design Intent (the feel)

- **Aspire to**: Pokémon PC · Harvest Moon Journal · Rune Factory Calendar · BotW Quest Log.
- **Avoid**: Notion · ClickUp · Jira. No spreadsheets, no folder trees, no "tasks" chrome.
- **Posture**: the player is an observer of a living world they tend — calm,
  spatial, seasonal, text-light. One ambient motion per screen (UI_COVENANT Law 12).
- **Core feeling (every interaction reinforces it)**: *Nothing meaningful is ever
  wasted.* Insights, blockers, failed attempts, abandoned quests, relationships,
  artifacts — all become **compost for future growth**. Compost is never deletion;
  it is visible, honored, and feeds the Garden.

## Five primary destinations (navigation)

Replaces the current authed nav (NOW / VAULT / EVENTS / PLAY / + BAR) with:

**Four primary destinations** + Hand (glance-in-NOW that expands to a page) +
persistent Capture (decided via the Six GM analysis):

| Destination | Is | Contains | Replaces / absorbs |
|-------------|----|----------|--------------------|
| **Observatory** | temporal navigation (planetarium) | the Lens hierarchy: orientation → vision → year → quarter → month → week → **today** | NOW |
| **Garden** | what you've planted, growing | planted BARs (have a `gardenId`), text-free growth | promotes `/bars/garden` |
| **Vault** | everything held, not planted/carried | charges, drafts, unplanted BARs, quests | VAULT |
| **World** | the **instance** — the narrative flavor of the world | the player's instance(s); campaigns **inside** (instance-flavored) **or outside** (standalone) an instance; events; other players. Map lives inside. | EVENTS + PLAY/campaign |

- **Hand** is **not** a primary tab: the `HandGlance` stays in NOW/Observatory and
  **expands to a `/hand` page**. (Decided — keep Hand in NOW + an expandable page.)
- **Capture is never a destination but always reachable** — a **persistent
  one-tap Capture** affordance (thumb zone); capture must never be gated.
- **World = instance.** An **Instance** is the narrative flavor of the world.
  Every player has a **personal Instance**; a campaign "outside" a shared instance
  simply belongs to the personal one. `Campaign.instanceId` stays **required** (no
  nulls — decided via the GM panel; avoids null-handling across the codebase). World
  surfaces the player's instance(s) + their campaigns.
- **Covenant reconciliation [Architect/Regent finding]**: `UI_COVENANT.md` Law 15
  names nav as **six GM spatial zones** (Shaman/Challenger/Regent/Architect/
  Diplomat/Sage). The six faces are a **role/lens** system, **distinct** from these
  **place** destinations. Law 15 must be updated to say so, or it will mislead UI
  work. (Task: amend the covenant when E1 lands.)

## Observatory

Visual metaphor: **planetarium · timeline · constellations**. Every **Lens is a
telescope**; the player **zooms through time** (orientation ↔ vision ↔ year ↔ … ↔
today) rather than drilling through folders. Each level is independently
navigable. BARs grown under a Lens appear as stars/constellations bound to it.
**Today** is the daily entry point.

## Daily Flow

```
Enter Today → Tap the Vein → charge generated → five BARs selected
   → BARs planted → Garden updates → Vibeulons minted → Daily Reflection
```

- Built on **H1 (lazy)** — TTV tasks become BARs on a deliberate keep/plant/upgrade
  (not on every commit) — + the plant flow + the Vibeulon mint (Lens P4).
- **Daily Reflection** (new closing beat): an end-of-day **satisfaction + witness**
  capture — which satisfied state fired today, one line of witness — and it
  **mints** (white-hat acknowledgment of the day's metabolization). Wires the
  existing **SAT** backlog item. The plant step earlier captures the **EA triad**
  (desired outcome + current dissatisfaction + desired satisfaction).

## Garden (text-free growth)

The Garden **communicates development without relying on text**. Growth form is
**derived from provenance/activity — not a stored developmental stage** (core
stays stage-agnostic per the Lens spec):

| Visual | Derived from |
|--------|--------------|
| **sprouting** | charged / tended (has charge or activity) |
| **leafing** | a 3·2·1 was done on it; EA arc moving (dissatisfaction→satisfaction) |
| **branches** | the BAR has children (it spawned other BARs) |
| **flowers** | it grew a quest |
| **fruit** | it was harvested / completed / minted ♦ |
| **carried** | pushed forward across days |
| **compost** | it was composted (honored, not hidden) |
| **needs attention** | stale / unworked (no recent activity) — gentle, not a guilt badge |

**Decided**: growth = **derived-from-provenance/activity** — broadened to signals
the *common* BAR actually accrues (charge, 3·2·1, EA arc, carried, completed), so
quiet plants still differentiate, not just the rare child/quest case. To avoid
N+1, **precompute a cheap `gardenSignal` on write** (when those events change),
read it on render. No stored developmental stage.

## Provenance — the living timeline

Clicking any artifact reveals a **living timeline** the player can feel awe at —
how something became real. The upward walk (extends `getBarProvenance`, Lens P4):

```
Book Chapter → Campaign → Quest → BAR → Tap the Vein → Daily Lens
            → Weekly → Monthly → Quarter → Vision
```

- Walk **up** (lens hierarchy + parent quest + campaign/instance) and **down**
  (children, resulting artifacts, minted ♦).
- **BAR seed-source (player-guided) [decided]**: a BAR enters from one of three
  seeds — the **Allyship Deck**, the **Book**, or the player's **own charge**.
  Source is **declared by the player, never inferred**. Model a light
  `seedSource ∈ { deck, book, charge, … }` (+ optional `seedSourceRef`, e.g. a deck
  card id or chapter id) so the timeline can show "this began as a deck card / a
  passage from Chapter 3 / a morning charge."
- **Book/Chapter as a provenance root — deferred, not built now.** The handbook
  *is* already broken into chapters, so book-as-root is a cheap future plug-in:
  when shipped, **book-sourced** BARs (`seedSource = 'book'`, player-declared) carry
  the chapter as their topmost root. Rationale to keep it on the roadmap: it's
  valuable for the creator, and a planned **book draft will intelligently funnel
  readers into the app**, where they declare a passage as the seed of a BAR. Until
  then, keep the root **extensible** and do **no book-modeling**.
- Presentation: a vertical constellation/timeline, not a table.

## Emotional goal (acceptance lens)

Every surface is checked against: **does this reinforce "nothing meaningful is
ever wasted"?** Compost is visible and dignified; abandoned/failed work still
holds its place in the timeline; the Garden shows even compost as feeding growth.

## White-hat gamification (decided — embraced)

Streaks, building, visible progress, mastery, and celebration are **in** —
**building the streak should be fun, enjoyable, and impactful**, and is a genuine
motivator (especially for **Architects** and **Challengers**). The product already
speaks this language ("steady accumulation is the form," "a yellow brick is
paved"). The Daily Reflection **mints**; progress is celebrated.

The only line held is **white-hat vs black-hat** — motivate, don't manipulate:
- ✅ progress, streaks, mastery, accomplishment, epic meaning, celebration.
- ❌ manufactured scarcity, manipulative loss-aversion / guilt, dark patterns.

This is honesty, not a handicap. (Reverses the earlier "anti-treadmill" stance.)

## Integration / phasing (maps onto Lens phases)

- **E1 — Navigation (strangler)**: add **Observatory + Garden** alongside the
  current nav + persistent Capture; migrate authed destinations incrementally;
  **don't touch the unauth launch/paywall funnel** until last. Routes can wrap
  existing pages.
- **E2 — Observatory UI**: planetarium over Lens (after Lens P1).
- **E3 — Daily Flow + Daily Reflection**: wire TTV → plant → mint → reflection
  (after Lens P2–P3; SAT for reflection).
- **E4 — Garden visual language**: provenance-derived growth (after Lens P3–P4).
- **E5 — Provenance timeline UI**: the living-timeline view (after Lens P4;
  add Book/Chapter roots).

Each phase: `UI_COVENANT` covenant check + a `cert-*` verification quest.

## Decisions (Six GM panel, 2026-06-26 — final)
1. **Garden growth = derived-from-provenance/activity**, broadened to common signals
   (charge, 3·2·1, EA arc, carried, completed) + **precomputed `gardenSignal`** to
   avoid N+1. No stored stage, no cosmetic meter. "Needs attention" = gentle.
2. **Navigation = strangler / additive-first** (reverses "full replacement now"):
   add **Observatory + Garden** alongside the current nav, migrate authed
   destinations incrementally, **leave the unauth launch/paywall funnel untouched
   until last**. End state: **Observatory / Garden / Vault / World** + Hand
   glance-in-NOW → `/hand` page + persistent Capture.
3. **World = the player's instance** (narrative flavor). Every player has a
   **personal Instance**; "outside an instance" = the personal one; `Campaign.instanceId`
   stays **required** (no nulls). World surfaces instance campaigns + personal ones.
4. **Daily Reflection = satisfaction-state + witness on today's Lens, and it MINTS**
   (white-hat acknowledgment). Wires **SAT**.
5. **Hand**: glance in NOW + expandable `/hand` page; not a primary tab.
6. **BAR seed-source = deck | book | charge, player-declared**. Book/Chapter
   provenance root **deferred** (cheap future plug-in; chapters already exist as data).
7. **Plant gate preserves the unpacking EA triad** (desired outcome + current
   dissatisfaction + desired satisfaction) — load-bearing for alignment + EA moves;
   reuse `unpacking-constants` vocab. (Reverses "drop the Unpacking reuse.")
8. **White-hat gamification embraced** (streaks/progress/celebration; reflection
   mints). Only black-hat manipulation is avoided. (Reverses "anti-treadmill.")
9. **H1 = lazy** task→BAR promotion (keep/plant/upgrade), atomic + compost-sync.
10. **Vibeulon attribution = additive, loop/harvest-only** (no broad refit).
11. **First slice** (Lens spec): daily Lens + lazy planted BAR + minimal Garden —
    ship and feel it before the full chain.

## Still open (non-blocking)
*(all design questions resolved; revisit Book/Chapter provenance root when scheduled.)*

## Out of scope (now)
Friendship/Guild/Campaign gardens, lens-switching UX, multiplayer World surfaces
beyond what exists, AI generation. Deterministic + text-light first.
