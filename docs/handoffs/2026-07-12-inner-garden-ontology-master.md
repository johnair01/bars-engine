# Inner Garden × BARS — Master Ontology & Build State

> **Authoritative consolidation.** This supersedes the five working docs from this session
> and is the single source to hand Claude Design. It records where the design actually
> landed (with decisions), maps every concept to the canonical BARS types and to the
> tested code we built, and **explicitly retires** the speculative framing that didn't
> survive scrutiny.
>
> **Folds in / supersedes:**
> 1. `2026-07-12-inner-garden-bars-design-synthesis.md` — the spine & the 7 questions
> 2. `2026-07-12-inner-garden-world-representation.md` — the projection + overlay world model
> 3. `2026-07-12-inner-garden-maturation-ontology.md` — fruit, seeds, lenses, campaigns
> 4. `2026-07-12-inner-garden-domain-recipes.md` — the domain (WHERE) axis
> 5. `2026-07-12-inner-garden-progression-fractal.md` — the scales (⚠ partially retired; see §9)
>
> The five remain as detailed references; this doc is the index of record.

---

## 1. Thesis

The Inner Garden is a **deck-builder for metabolizing a charge into aligned action**; the
garden is the board. Its engine is not new — BARS already implements the spine as typed,
testable OS libraries. The game is a **register** (a spatial skin + a capacity economy)
over that engine. The single most important correction of this session: **a quest is a
capacity gate, not a narrative arc** — the mechanic is a card economy, not story beats.

---

## 2. Foundational stance (what does NOT get rebuilt)

The rules engine already exists (design-synthesis doc §0):

| Subsystem | Path | Role |
|---|---|---|
| Charge metabolism | `src/lib/charge-metabolism/` | present→desired vector → recommended moves → `MoveAttempt` lifecycle |
| Allyship deck | `src/lib/allyship-deck/` | the canonical 120 `MoveCard`s |
| Alchemy graph | `src/lib/alchemy/`, `emotional-alchemy/` | channels, altitudes, metabolize→translate→transcend, 10 primitives, 5 spirits |
| Bridge (kept) | `src/lib/inner-garden/bridge.ts` | the OS ↔ garden contract |

**The OS owns truth. The garden is a projection + a set of write-seams.** Decision **D1**:
replace the old canvas renderer, **keep the bridge**.

---

## 3. The orthogonal axes (the clarification that unlocks everything)

`FOUNDATIONS.md:77`: *"Moves are not faces; neither is a domain."* Reconciliation with Claude
Design (2026-07-12) confirmed **Face = altitude** and surfaced a **fourth axis, Scope** (see
`…-reconciliation-with-claude-design.md` C1).

| Axis | Question | Values | Determines |
|---|---|---|---|
| **Move** (WAVE) | HOW | Wake · Open · Clean · Grow · Show | **the artifact** produced (`OutputBar`, fixed by move) |
| **Face** | **WHAT LEVEL (altitude)** | Shaman → Sage (developmental ladder, prerequisites) | the altitude of the act; the School is the mountain |
| **Domain** (the board) | **WHERE (arena)** | Gather Resources · Raise Awareness · Direct Action · Skillful Organizing | the win-condition **and the plant's fruit type** (C5) |
| **Scope** *(4th, from CD)* | **HOW WIDE** | yourself → the moment → relationship → group → system → whole campaign | whether a meet fruits (at-or-above scope) or grows a slice (below) |

**Fruit vs artifact (C5, adopted from Claude Design):** a plant's **fruit type = its
`allyshipDomain`** (4 fruits = 4 domains, WHERE); the move's `OutputBar`
(`Wake→awareness · Open→experience · Clean→insight · Grow→wisdom · Show→artifact`) is the
**durable artifact banked to the Vault**, *not* the fruit. "Raise Awareness" (domain/fruit)
and "awareness" (artifact) are different axes — that conflation is now corrected.

**Scope's likely home:** the allyship-deck already has a `Subject` enum
(`self · other · group · system · campaign`) that nearly matches CD's scope ladder — scope may
already be canonical as `Subject`. Resolve in the C2 blocker/deck integration handoff.

---

## 4. The object spine (garden noun → canonical type)

| Garden concept | Canonical type | Where |
|---|---|---|
| Charge / Seed | `CustomBar` (`seedMetabolization`, `intensity`, `nation`/element, `gameMasterFace`, `allyshipDomain`, `campaignRef`, `sourceBarId`/`rootId`) | `prisma/schema.prisma:298` |
| Maturity | `captured → context_named → elaborated → shared_or_acted → integrated` | `bar-seed-metabolization/types.ts` |
| Soil | `holding_pen \| thread \| campaign` (personal vs shared) | same |
| Field | `Lens` (+ `LensGoal`) | `schema.prisma:707` |
| The 5 moves | `BasicMove`/`PersonalMoveType` | `allyship-deck/types.ts:10` |
| Card (capability) | `MoveCard` / `ShowUpPrimitive` | `allyship-deck/`, `alchemy/show-up-primitives.ts` |
| Fruit (type × quality) | `OutputBar` × `AlchemyAltitude`; ripe = `SatisfactionSpirit` | `allyship-deck/types.ts:32`, `emotional-alchemy/types.ts:27` |
| Weed / blocker | vector-edge a charge is stuck on (see §7) | — |
| Six faces = altitudes | `GameMasterFace` | `quest-grammar/types.ts:264` |
| Campaign | `Instance` (`kotterStage`, `kernelBarId`, `allyshipDomain`) | `schema.prisma:1933` |
| Hand / daily limit | `HandSlot` | `schema.prisma:484` |
| Vault (owns truth) | a view over `CustomBar` | `vault-queries.ts` |

---

## 5. The maturation loop — fruit is a seed with a decision

A charge climbs `captured → … → integrated`; fruit is produced at `shared_or_acted`.
**Fruit's whole purpose is to carry seed onward**, so the harvest is a *fork* — four fates,
each a real mechanic (maturation doc §3):

| Fate | Grows | Mechanism | Status |
|---|---|---|---|
| Sow inward | more seeds | mint a child `CustomBar` with `sourceBarId`/`rootId` | ⚠ seam (mint-on-harvest) |
| Bank into a Lens | vertical progress | satisfy a `LensGoal`; roll daily→…→vision | ⚠ seam (no writer) |
| Share into a campaign | horizontal progress | `MilestoneContribution` → `currentValue` → Kotter advance | contribution ✅; advance ⚠ seam |
| Water the kernel | **births a campaign** | six-face watering → `promoteCampaignBarToInstance` | ✅ promote built |
| Compost | honest release | `compostedAt` + `releaseNote` | ✅ |

**Two ledgers** (qualitative state-machines by default; whether a counter/progress signal is
shown is governed by the **Calm ↔ Progress polarity map** in `docs/VALUES_AND_POLARITIES.md` —
the blanket "no counters / no shame metrics" absolute is **deprecated**):
- **Vertical (Lens):** a satisfied `LensGoal`, rolling daily→vision. *Personal development.*
- **Horizontal (Campaign):** a met `MilestoneNeed` advancing a Kotter stage. *Collective impact.*

**Campaign birth (grounded, existing):** a BAR matures into a campaign when its charge has
been **watered from all six faces** (`WATERING_FACES` → `promoteCampaignBarToInstance`,
`campaign-bar.ts`) — i.e. metabolized from every altitude, too big to hold from one angle
alone. Born at Kotter stage 1 (urgency); the original BAR is the `kernelBarId`.

---

## 6. Domain recipes — "what makes a successful [domain] campaign?"

A campaign has a domain (`Instance.allyshipDomain`). Success is **staged, not fruited**:
every campaign runs all 8 Kotter stages, each manifesting per-domain via the authored
**Domain × Kotter matrix** (`STAGE_ACTIONS_BY_DOMAIN`, `src/lib/kotter.ts`). Each domain has
a **native move → keystone fruit** and a distinct Anchor (success):

| Domain | Native move → keystone fruit | Deliverable | Anchor = success |
|---|---|---|---|
| Raise Awareness | Wake → **awareness** | truth signal | Embedded in culture |
| Gather Resources | Open + Grow → **experience/wisdom** | resource movement | Sustainable funding |
| Skillful Organizing | Clean → **insight** | agreement structure | Sustainable practices |
| Direct Action | Show → **artifact** | intervention | "You're a player" |

Built: `describeCampaignRecipe(domain)` composes the matrix + `DOMAIN_KEYSTONE` into a
one-sentence answer (e.g. *"To grow a successful Raise Awareness campaign, metabolize
Raise-Awareness charges — leaning on Wake (awareness) — through the 8 Kotter stages,
producing a truth signal, until 'Embedded in culture'."*).

---

## 7. The quest economy (the core mechanic — this is the heart)

**A quest is a capacity gate.** It exists because you lacked a technique; its reward is that
technique. Grounded in the Technique Library (`clean-up-technique-system`: gate confrontation
is the core learning path; techniques = permanent slots).

```
blocker (a MULTI-CHANNEL set of threads, each a vector-edge; see spec
`inner-garden-blocker-route-hand` — implemented, over-grant bug fixed)
  → own the capacity?  yes → a TASK  (Clean Up)
                       no, but a card exists → Quest via SCHOOL
                       no card at all        → Quest via CRAFT
  → complete by DEMONSTRATING (right evidence kind + edge crossed)
  → earn the technique into a permanent slot
  → the whole CLASS of that blocker is now a Task, forever (economy C)
```

- **Grow Up = the move of gate confrontation** (converting "I can't metabolize this" into
  "I'll learn/forge the technique that can").
- **Required capacity is derived from the blocker's signature** (decision): the vector-edge
  `metabolize:<el>` / `transcend:<el>` / `translate:<from>-><to>`, mirroring
  `VECTOR_MOVE_FAMILIES`. Gates are legible puzzles, not arbitrary.
- **The "good quest" contract** (enforced by type): trigger · target capacity · win-condition
  · reward · return. Missing any → it's content, not a quest.

**The demonstration bar** (why completing a quest grants *real* capacity — two teeth,
grounded in charge-metabolism FR2 "Recommendation Is Not Completion" + the Integration
Check technique):
1. **Evidence of the right kind** — constrained by the move's role (`ROLE_EVIDENCE`):
   metabolize→`traced_practice`, translate→`reflection`, transcend→`artifact`/`action`. You
   cannot read your way to an action card.
2. **The edge was crossed** — pre-state matches the gate, post-state reaches the target.
   Falling short is *data, not failure* (no card yet).

**Move crafting** (grow the library at the speed of need). When no card exists, forge one:
- **Grammatical by construction** — the gate stamps role/channels/wave-move/fruit/evidence/
  key; the human authors only **baseAct + name**. So an ill-formed move is impossible.
- **AI drafts full candidates, player ratifies + names** (decision). The LLM call is a typed
  seam (`MoveDraft`), not free text into the library.
- **Anti-rot** — structural validation, entry as a private `candidate`, **earned** promotion
  (`demonstrated reuse → adoption/teaching → GM review → canonical`), and dedup (existing key
  → School, never re-forge; alternatives allowed).

**Designed vs user quests** — the *same* loop, split by trigger + reward source:
- **Designed (rule-teachers):** staged gate, canonical technique, guided (School/NPC). The
  tutorial IS the game (structurally identical to a real quest).
- **User-generated:** real gate, emergent technique **crafted** and named. Runs the loop on
  real material.

---

## 8. The world representation (how the board is rendered without hardcoding)

A farm is a **pure function, not a stored map** (No Man's Sky model):
```
renderedFarm = applyOverlay(overlay, projectFarm(seed, osState))
               └── stored, tiny ──┘   └──── derived, never stored ────┘
```
- **Base** = `projectFarm(seed, os)` — deterministic projection of OS truth (fields=Lenses,
  seeds=BARs, weeds=blockers), id-stable `fnv32` placement, **zero stored maps** → scales to
  1000+ farms. Reuses the existing `spatial-world` grid-scene contract (`FarmScene` = `tilemap`
  + `anchors`; garden meaning in `anchorType` + JSON `config`; **no schema change**).
- **Overlay** = a sparse `FarmOverlay` of player edits (move/reskin/decorate) — the only thing
  stored, keyed by OS id. **The OS owns *what exists*; the overlay owns *where it sits & how it
  looks*.** A player can't rearrange away a weed — weeds die by Cleaning.
- **Shared farms = Both** (decision): campaign commons (`projectSharedFarm` over campaign data)
  + a small fixed set of global commons; LOD (density tiles) for large commons.
- **Visuals are token-derived** (element→tint, altitude→glow, stage→frame via `card-tokens`) —
  a new BAR never needs new art.
- **Renderer** (Claude Design) is a thin, swappable client of `FarmScene` + `visualSpecFor`;
  holds no truth. Mobile-first: grid + `TILE_SIZE`, viewport culling, atlas, tap-to-walk A\*.

---

## 9. ⚠ RETIRED framing (do not build to this)

- **The Epiphany-Bridge 6 beats are NOT the quest mechanic.** A quest is a capacity gate
  (§7); the beats are, at most, an optional *narrative wrapper* on a quest. Dressing a story
  in beats does not gamify it — this is why the earlier quest layer stalled.
- **The speculative beat→move map** (`orientation→Wake, tension→Clean, …`) is **dropped.** It
  was pattern-matching, not a mechanic.
- The fractal (move → quest → campaign) is still a true *observation* about scale, and the
  **two-deck** distinction it surfaced is real (see below) — but the quest's identity is its
  gate, not its beat-count.

**The two decks (still valid, from the fractal doc):** the player's **move-deck** (capability
— what you build via School/craft) is played *against* the **domain quest-deck** (content pool,
drawn by Kotter stage). "Building your deck" = growing your move repertoire.

---

## 10. Decisions log

| # | Decision | Choice |
|---|---|---|
| D1 | Renderer vs bridge | Replace renderer, **keep bridge** |
| — | Shared farms | **Both** (campaign commons + small global commons) |
| — | Farm persistence | **No Man's Sky** (projection + sparse overlay; no stored maps) |
| — | Campaign birth | **Six-face watering** (existing `promoteCampaignBarToInstance`) |
| — | Gate → required capacity | **Derive from the blocker's signature** |
| — | Demonstration bar | Evidence-kind-by-role **+** edge-crossed (Integration Check) |
| — | Crafting AI latitude | **Full AI drafts, player ratifies + names** |
| — | Crafted-card lifetime | Permanent (enter as private `candidate`, earn promotion) |

Recommendations still open (from synthesis D2–D7 / domain §7): append-only field layout;
strict School ladder; Open Up = next-water multiplier now (community gate later); community
via campaigns first (neighbor-garden propagation later); mint new BARs only on a deliberate
gesture; optional domain→need-units mapping.

---

## 11. What's built vs. what's still a seam

**Built & tested** (`src/lib/inner-garden/`, all green via `npm run test:inner-garden-world`
+ `test:inner-garden-ontology`):

| Module | Provides |
|---|---|
| `world/{scene,project,visuals,hash}.ts` | `FarmScene` IR, `projectFarm`/`projectSharedFarm`/`applyOverlay`, `visualSpecFor`, `fnv32` |
| `ontology/domain-recipe.ts` | `MOVE_FRUIT`, `DOMAIN_KEYSTONE`, `describeCampaignRecipe` |
| `ontology/progression-scales.ts` | `QUEST_BEATS`, `CAMPAIGN_STAGES`, `PROGRESSION_SCALES` — **descriptive scale constants only** (the beats are narrative wrapper, NOT the quest mechanic; §9). The mechanic is the capacity economy. |
| `ontology/gate-confrontation.ts` | `BlockerSignature`, `deriveRequiredCapacity`, `resolveBlocker`, `earnCapacity` |
| `ontology/demonstration.ts` | `ROLE_EVIDENCE`, `runIntegrationCheck`, `completeQuest` |
| `ontology/move-crafting.ts` | `buildCraftSkeleton`, `resolveGatePath`, `validateGrammaticalMove`, `craftMove`, `promoteTier` |

**Unbuilt seams (the real remaining work):**
- **Return loop:** mint-on-harvest (child seed), Lens roll-up writer, completion→Kotter advance.
- **Harvest→fruit** as a first-class object; **myth→weed** injection.
- **AI seams:** `MoveDraft` generation (LLM); firmer demonstration attestation (AI/social witness).
- **Bridge extension:** payloads from Shaman-only → all 5 moves + campaign scope (`bars-inner-garden.v2`).
- **Renderer:** the mobile pixel-farm client (Claude Design).

---

## 12. For Claude Design (the brief)

Build the **mobile pixel-farm as a thin client of the ontology + bridge**, not a new system:
1. Render from `FarmScene` + `visualSpecFor` (§8); hold no truth; every action is a bridge call.
2. Stage the **quest economy** (§7) as the core interaction: walking to a weed triggers
   `resolveBlocker`; a gate stages Task / School / Craft; the demonstration bar is the
   completion UI; crafting is the AI-drafts-you-ratify Council modal.
3. Use §4's mapping as the vocabulary contract and §3's three axes as the conceptual frame.
4. Do **not** build the retired beat-mechanic (§9).

---

### Appendix — evidence & code map
- Ontology code: `src/lib/inner-garden/ontology/*` (+ tests). World code: `src/lib/inner-garden/world/*`.
- Canonical types: `charge-metabolism/`, `allyship-deck/`, `alchemy/`, `emotional-alchemy/`,
  `bar-seed-metabolization/`, `kotter.ts`, `spatial-world/`, `quest-grammar/types.ts`,
  `prisma/schema.prisma`.
- Existing bridge & birth: `inner-garden/bridge.ts`, `campaign-bar.ts`
  (`promoteCampaignBarToInstance`, `WATERING_FACES`).
- Specs leaned on: `clean-up-technique-system`, `charge-metabolism-move-attempts`,
  `campaign-kotter-domains`, `campaign-domain-decks`, `fifth-move-open-up`,
  `bar-seed-metabolization`, `core-game-loop-audit`.
</content>
