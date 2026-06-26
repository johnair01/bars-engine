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

| Destination | Is | Contains | Replaces / absorbs |
|-------------|----|----------|--------------------|
| **Observatory** | temporal navigation (planetarium) | the Lens hierarchy: orientation → vision → year → quarter → month → week → **today** | NOW |
| **Garden** | what you've planted, growing | planted BARs (have a `gardenId`), text-free growth | promotes `/bars/garden` |
| **Hand** | what you're actively carrying | the 6 carry slots | promotes the `HandGlance` inside NOW |
| **Vault** | everything held, not planted/carried | charges, drafts, unplanted BARs, quests | VAULT |
| **World** | the outer / allyship game **[ASSUMED — confirm]** | campaigns, events, other players (map lives inside) | EVENTS + PLAY/campaign |

- **Capture is never a destination but always reachable** — a **persistent
  one-tap Capture** affordance (thumb zone), since capture must never be gated.
  **[ASSUMED — confirm]**
- Per UI_COVENANT Law 15, navigation reads as **spatial zones**, not tabs.

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

- Built on shipped **H1** (TTV tasks → BARs) + the planned plant flow + the
  Vibeulon mint (Lens P4 attribution).
- **Daily Reflection** (new closing beat): an end-of-day **satisfaction +
  witness** capture — which of the satisfied states fired today, one line of
  witness — optionally minting a small ♦. Wires the existing **SAT** backlog item
  (Satisfaction Capture). **[ASSUMED — confirm scope/mint]**

## Garden (text-free growth)

The Garden **communicates development without relying on text**. Growth form is
**derived from provenance/activity — not a stored developmental stage** (core
stays stage-agnostic per the Lens spec):

| Visual | Derived from |
|--------|--------------|
| **branches** | the BAR has children (it spawned other BARs) |
| **flowers** | it grew a quest |
| **fruit** | it was harvested / minted ♦ |
| **compost** | it was composted (honored, not hidden) |
| **needs attention** | stale / unworked / blocked (no recent activity) |

**[ASSUMED — confirm]** growth = derived-from-provenance (vs a cosmetic care
meter, vs reusing optional `maturity`). Visual density may reuse the
`CultivationCard` stage channel (UI only — not a developmental level).

## Provenance — the living timeline

Clicking any artifact reveals a **living timeline** the player can feel awe at —
how something became real. The upward walk (extends `getBarProvenance`, Lens P4):

```
Book Chapter → Campaign → Quest → BAR → Tap the Vein → Daily Lens
            → Weekly → Monthly → Quarter → Vision
```

- Walk **up** (lens hierarchy + parent quest + campaign + **Book/Chapter**) and
  **down** (children, resulting artifacts, minted ♦).
- **Book/Chapter become provenance roots [ASSUMED — confirm]** (hook into existing
  book/handbook content) so artifacts can trace to the source material.
- Presentation: a vertical constellation/timeline, not a table.

## Emotional goal (acceptance lens)

Every surface is checked against: **does this reinforce "nothing meaningful is
ever wasted"?** Compost is visible and dignified; abandoned/failed work still
holds its place in the timeline; the Garden shows even compost as feeding growth.

## Integration / phasing (maps onto Lens phases)

- **E1 — Navigation shell**: the five-destination nav + persistent Capture
  (additive scaffolding; routes can be stubs that wrap existing pages).
- **E2 — Observatory UI**: planetarium over Lens (after Lens P1).
- **E3 — Daily Flow + Daily Reflection**: wire TTV → plant → mint → reflection
  (after Lens P2–P3; SAT for reflection).
- **E4 — Garden visual language**: provenance-derived growth (after Lens P3–P4).
- **E5 — Provenance timeline UI**: the living-timeline view (after Lens P4;
  add Book/Chapter roots).

Each phase: `UI_COVENANT` covenant check + a `cert-*` verification quest.

## Open decisions (assumed defaults above — confirm)
1. Garden growth model — **derived-from-provenance** (assumed) vs cosmetic vs maturity-visual.
2. Navigation — **full replacement + persistent Capture** (assumed) vs additive/phased vs Capture-inside-a-destination.
3. **World** = **outer game; map inside** (assumed) vs map-only vs both-as-peers.
4. **Daily Reflection** = **satisfaction + witness, optional mint** (assumed) — exact content + whether it mints.
5. **Book/Chapter** as provenance roots (assumed) — confirm the book content to hook.
6. **Hand** promoted to a first-class destination (assumed) vs a glance inside Observatory/Today.

## Out of scope (now)
Friendship/Guild/Campaign gardens, lens-switching UX, multiplayer World surfaces
beyond what exists, AI generation. Deterministic + text-light first.
