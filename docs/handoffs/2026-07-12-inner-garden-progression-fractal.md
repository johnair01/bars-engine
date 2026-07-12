# Inner Garden — The Progression Fractal & the Two-Layer Deck-Builder

> **Fifth in the handoff set.** Answers the emerging question: *a campaign progresses
> through Kotter stages — what is the correlate for a **quest**, and how does that interact
> with the deck-building mechanics?*
>
> **The finding (already in the grammar):** the same "metabolize a charge" arc repeats at
> three nested scales; only the beat-count changes. And this fractal is exactly what makes
> the deck-builder a **two-layer** game.

---

## 1. The fractal: one grammar, three scales

`src/lib/quest-grammar/types.ts` unifies the arcs as `BeatType = EpiphanyBeatType |
KotterBeatType`, and states it plainly (line 183): *"Personal = Epiphany Bridge (6 beats);
Communal = Kotter (8 stages)."* So:

| Scale | Who | Arc | Beats | Produces |
|---|---|---|---|---|
| **Move** | a person, once | one WAVE move | **1** | one fruit (`OutputBar`) |
| **Quest** | a person's story | **Epiphany Bridge** | **6**: orientation · rising_engagement · tension · integration · **transcendence** · consequence | a keystone artifact + fruit |
| **Campaign** | a community's story | **Kotter** | **8**: urgency · coalition · vision · communicate · obstacles · **wins** · build_on · anchor | an anchored change |

**The correlate you were reaching for:** *Epiphany Bridge is to a quest what Kotter is to a
campaign.* A quest is a **personal transformation story**; a campaign is that **same story
at communal scale.** The commitment beat even lines up across scales — Epiphany
**`transcendence`** ↔ Kotter **`wins`** (both are the `ActionType` / "do the thing" moment,
`types.ts:95`). This is coded now in `src/lib/inner-garden/ontology/progression-scales.ts`.

Why 6 vs 8: a person crosses their own threshold in fewer beats than a community aligns
across one. Same shape, coarser or finer.

---

## 2. Where the seed maturity ladder fits (don't conflate it)

There are two *different* things that both look like "progress," and keeping them distinct
matters:

- **Seed maturity** (`captured → context_named → elaborated → shared_or_acted → integrated`,
  5 phases) = **where a seed is in its life.** A lifecycle.
- **Quest beats** (Epiphany, 6) = **the story you walk when you PLAY the quest.** A narrative
  arc.

They meet at one point: a quest is *grown from* a seed at `elaborated`; *playing* the quest
(walking its 6 beats) moves the seed to `shared_or_acted` and yields fruit → `integrated`.
Maturity is the seed's odometer; beats are the road.

---

## 3. The two-layer deck-builder (how the fractal wires the mechanics)

The fractal is *why* the deck-builder has two layers. There are **two decks at two scales**,
and conflating them was the ambiguity lurking in the earlier docs:

### Layer A — the MACRO deck-builder (the campaign)
- **The deck** = the **domain quest-deck** (`campaign-domain-deck.ts`,
  `getCampaignDomainDeck(domain, stage)`): a pool of quests where `allyshipDomain = domain`.
- **The draw filter** = the campaign's current **Kotter stage** — draw up to 8 quest-cards
  onto the gameboard slots, translated to the stage (`translateQuestForStage`).
- **The "cards" drawn** = **quests** (encounters).
- **Advancing** = complete enough quests at a stage → the campaign advances to the next
  Kotter stage → a fresh hand of quest-cards is drawn.
- *"Each campaign domain is a deck being operated by multiple people toward a common goal"*
  (`campaign-domain-decks` spec).

### Layer B — the MICRO deck-builder (the quest)
- **The deck** = **your move-cards** (your learned Show-Up moves — the deck YOU build at the
  School or by crafting; owned permanently, daily hand-limit).
- **The demand** = each Epiphany **beat** of the quest may require a specific move / face
  (the "required mode" gate from the design synthesis — *you can't fake it*).
- **The "cards" played** = **moves**.
- **Resolving** = play the matching move-card to clear each beat → at `transcendence` you
  commit the action → the quest yields its **fruit**.

### How the layers interlock
```
Kotter stage (macro)  ── filters ─▶  which QUESTS are on the board
   ▲                                        │
   │ fruit advances the stage               │ each quest demands
   │                                        ▼
campaign progress  ◀── produces ──  MOVES you play from your hand (micro)
```

**Move-cards resolve quest-beats; quest-cards resolve campaign-stages; the fruit produced
at the micro layer is the currency that advances the macro layer.** That single sentence is
the whole game.

---

## 4. Two decks, said plainly (resolving the earlier ambiguity)

| | **Move deck** (Layer B) | **Domain quest deck** (Layer A) |
|---|---|---|
| Whose | the player's **capability** | the campaign's **content pool** |
| Cards are | Show-Up **moves** | **quests** (encounters) |
| Grown by | learning at the School / crafting | authored + BAR-minted quests tagged to the domain |
| Drawn by | your daily hand-limit | the campaign's Kotter stage |
| Played against | quest **beats** | the **gameboard** slots |

The garden renders **Layer A** (fields of quest-seeds you can walk up to); *entering* a
quest is **Layer B** (play your hand through its 6 beats). "Building your deck" in the
allyship sense = **Layer B** (growing your move repertoire) — which is what makes you able
to resolve harder quest-encounters, which advances campaigns.

---

## 5. What this adds to the stub (already built)

`src/lib/inner-garden/ontology/` now carries:
- `progression-scales.ts` — `QUEST_BEATS` (6), `CAMPAIGN_STAGES` (8), `PROGRESSION_SCALES`
  (the fractal, with commitment beats aligned).
- `domain-recipe.ts` — `DOMAIN_KEYSTONE` + `describeCampaignRecipe(domain)` (composes the
  Domain × Kotter recipe + keystone + a one-sentence answer).
- Tests green: `npm run test:inner-garden-ontology`.

The natural next stub (not yet built) is the **quest-scale** mirror of
`describeCampaignRecipe`: a `describeQuestArc(domain)` that walks the 6 Epiphany beats and
names, per beat, the move/fruit demanded — the Layer-B recipe. Flagged below.

---

## 6. Design implications & open decisions

1. **Beat → move demand.** Which move does each Epiphany beat demand? A natural default:
   orientation→Wake, rising_engagement→Open, tension→Clean, integration→Grow,
   transcendence→Show (the commit), consequence→(reflect/harvest). *This is a clean 5-moves
   → 6-beats fit with the 6th as the harvest.* **Decision:** adopt this default beat→move
   map, or let each authored quest declare its own beat demands? *Recommend: a default map,
   overridable per quest — it makes "play your hand through the quest" legible without
   authoring every quest by hand.*
2. **Stage → beat coupling at the macro layer.** A campaign Kotter stage draws quests; does
   the stage constrain which *beats* those quests emphasize (e.g. an `urgency`-stage quest
   is mostly Wake/awareness)? *Recommend: yes as flavor, not a gate (mirrors the domain
   §7.3 recommendation).*
3. **Where the player's move-deck lives vs. the domain quest-deck.** Confirm the two-deck
   model (Layer A content vs Layer B capability) is the intended mechanic before the
   renderer commits — it changes what "draw a hand" means on each screen.

---

### Appendix — evidence trail
- The fractal: `src/lib/quest-grammar/types.ts:74-93` (`EpiphanyBeatType`, `KotterBeatType`,
  `BeatType`), line 183 ("Personal = Epiphany Bridge (6 beats); Communal = Kotter (8)"),
  line 95 (`ActionType` commitment = transcendence/wins).
- Kotter data: `src/lib/kotter.ts` (`KOTTER_STAGES`, `STAGE_ACTIONS_BY_DOMAIN`).
- Macro deck: `src/lib/campaign-domain-deck.ts` (`getCampaignDomainDeck`,
  `translateQuestForStage`); `campaign-domain-decks` + `campaign-kotter-domains` specs.
- Micro deck (move cards): `src/lib/allyship-deck/*`; design synthesis doc (the card gate).
- Ontology stub: `src/lib/inner-garden/ontology/{progression-scales,domain-recipe}.ts`.
</content>
