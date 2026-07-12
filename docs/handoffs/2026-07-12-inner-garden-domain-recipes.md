# Inner Garden — Domain Recipes: how the game answers "what makes a successful [domain] campaign?"

> **Fourth in the handoff set.** Extends the maturation ontology
> (`2026-07-12-inner-garden-maturation-ontology.md`) with the missing **WHERE** axis: the
> four allyship domains, and how each defines a *recipe* — which BARs and which fruit must
> be metabolized to grow a successful campaign of that kind.
>
> **The finding:** the recipe is already **authored data** (`STAGE_ACTIONS_BY_DOMAIN` in
> `src/lib/kotter.ts`) crossed with two constants. The game can answer the question today
> by composing three existing pieces; only one small table and one optional mapping are
> genuinely missing.

---

## 1. The clarification that dissolves the question

BARS has **three orthogonal axes** (`FOUNDATIONS.md:77`, *"Moves are not faces; neither is
a domain"*):

| Axis | Question | Values | What it determines |
|---|---|---|---|
| **Move** (WAVE) | HOW | Wake · Open · Clean · Grow · Show | **the fruit** (fixed by move) |
| **Face** | WHAT LEVEL | Shaman … Sage | the altitude of the move |
| **Domain** (the board) | **WHERE** | Gather Resources · Raise Awareness · Direct Action · Skillful Organizing | **the arena + the win-condition** |

The trap in "which fruits make a *Raise Awareness* campaign" is that **"Raise Awareness"
(domain) and "awareness" (fruit) are on different axes.** Fruit is `// fixed by move`
(`allyship-deck/types.ts:47`), so it is **domain-invariant**: *every* campaign metabolizes
the same five-fruit flow, because that flow IS the metabolic path:

```
Wake Up→awareness · Open Up→experience · Clean Up→insight · Grow Up→wisdom · Show Up→artifact
```

So the domain does not pick a *fruit*. The domain picks **what the work is about and when
it's finished.** That "when it's finished" is the recipe — and it's authored.

---

## 2. The recipe = three composable pieces (all but one already built)

To answer *"what must be metabolized to make a successful [Domain] campaign?"* the game
reads three things:

1. **The staged recipe — Domain × Kotter matrix** (`src/lib/kotter.ts:32-73`,
   `STAGE_ACTIONS_BY_DOMAIN`). Every campaign runs all **8 Kotter stages**
   (`urgency→coalition→vision→communicate→obstacles→wins→build_on→anchor`); each stage's
   *action* is domain-specific. **This is authored data — the literal recipe.**
2. **The BARs — the domain deck** (`src/lib/campaign-domain-deck.ts`,
   `getCampaignDomainDeck()`): quests where `allyshipDomain = domain AND kotterStage =
   stage`. So the BARs you metabolize are the domain's quests, drawn one stage at a time.
3. **The fruit — move→OutputBar** (a constant): each BAR, metabolized through a WAVE move,
   yields that move's fruit. All five are needed across a campaign; the **keystone** fruit
   is the domain's *native* move (§4).

**Success** = traversing all 8 stages to the domain's **Anchor** state.

---

## 3. Worked recipe — a successful **Raise Awareness** campaign

Reading `STAGE_ACTIONS_BY_DOMAIN['RAISE_AWARENESS']` (the authored recipe), plus the deck
and move→fruit:

| Kotter stage | RA stage action *(the recipe step)* | BARs to metabolize (domain deck @ stage) | Keystone move → fruit |
|---|---|---|---|
| 1 Urgency | **"People need to know"** | charges about what's unseen / unnamed | Wake Up → **awareness** |
| 2 Coalition | "Who will spread the message?" | charges about allies / messengers | Open Up → experience |
| 3 Vision | "Awareness looks like…" | charges imagining the seen-state | Wake/Grow → awareness/wisdom |
| 4 Communicate | **"Tell the story"** | charges shaped into a shareable telling | Show Up → **artifact** *(the "truth signal")* |
| 5 Obstacles | "What blocks the message?" | charges naming resistance / myths | Clean Up → **insight** |
| 6 Wins | "First cohort reached" | charges of first contact landing | Show Up → artifact |
| 7 Build On | "Amplify" | charges about scaling reach | Grow Up → wisdom |
| 8 Anchor | **"Embedded in culture"** ← *success* | charges that institutionalize the seeing | — |

**So the answer to your exact question:** a successful Raise Awareness campaign is grown by
metabolizing **charges-of-the-unseen** (`allyshipDomain = RAISE_AWARENESS` BARs), stage by
stage, whose **keystone fruit is `awareness`** (native Wake Up) and whose **outer
deliverable is a `truth-signal` artifact** (the story, at Communicate) — with **`insight`**
required to clear the message-blockers at Obstacles. It is *finished* when awareness is
**embedded in culture** (the RA Anchor). The other fruit (experience, wisdom) are produced
along the way because you still run the full WAVE — but awareness is the signature and the
story-artifact is the win.

---

## 4. The keystone table (per-domain recipe at a glance)

Composed from the FOUNDATIONS board (`FOUNDATIONS.md:79-88`), `MOVE_CELL_AFFINITY`
(`canonical-kernel.ts:61-67`), `DOMAIN_ESSENCE` (`domain-context.ts`), domain→element
(`allyship-domains.ts:22-27`), domain→output-field (`show-up-primitives.ts:285-290`), and
the Anchor row of `STAGE_ACTIONS_BY_DOMAIN`:

| Domain | Native move → **keystone fruit** | Element | Outer deliverable | Essence (WHERE) | Anchor = success |
|---|---|---|---|---|---|
| **Raise Awareness** | Wake Up → **awareness** | metal | truth signal | help people see what's possible | *Embedded in culture* |
| **Gather Resources** | Open Up + Grow Up → **experience / wisdom** | earth | resource movement | invite participation; marshal time/skills/presence | *Sustainable funding* |
| **Skillful Organizing** | Clean Up → **insight** | wood | agreement structure | build capacity for the whole; systems/processes | *Sustainable practices* |
| **Direct Action** | Show Up → **artifact** | fire | intervention | doing, and enabling others to do | *"You're a player"* |

Read this as: *"To grow a successful [Domain] campaign, metabolize [Domain]-tagged charges,
leaning on the [native move] (its keystone fruit), producing a [outer deliverable], until
you reach [Anchor]."* That sentence is the game's answer, generable for any domain.

---

## 5. What's actually missing (small, honest gaps)

The recipe is answerable today, but two pieces would make the game state it cleanly:

1. **A `DOMAIN_KEYSTONE` table** — the §4 mapping (domain → native move → keystone fruit →
   outer deliverable) is *implied* across four files but not stated as one registry. Author
   it once so the garden can render "this domain's keystone fruit" without recomputing.
   Cheap; pure data.
2. **Domain → milestone need-units** — *optional and currently absent.* `MilestoneNeed` is
   typed by `superpower + orientation + unit(action|currency|hours)`, **not** by domain
   (`schema.prisma:3933`). If you want the domain to shape *what kind of contribution* a
   campaign asks for (e.g. Gather Resources → `currency`/`hours` needs; Raise Awareness →
   `action` needs like posts/conversations), that mapping must be **authored** — it does
   not exist. Decision below.

Not gaps (already built): the Domain × Kotter recipe, domain decks, move→fruit,
`CustomBar.allyshipDomain`, `Campaign/Instance.allyshipDomain`, `campaignDomainPreference`.

---

## 6. How this threads into the maturation loop

Reconciling with the maturation-ontology doc: when a BAR **matures into a campaign** (the
six-face watering → `promoteCampaignBarToInstance`), the resulting campaign is **stamped
with a domain** (`Instance.allyshipDomain`). From that moment its recipe is fixed: it draws
its domain deck, advances its Domain × Kotter stages, and its milestones are met by
contributed fruit. The domain is therefore the **WHERE** that was latent in the original
charge (`CustomBar.allyshipDomain`) becoming the campaign's identity. The garden should
surface, for any live campaign: *its domain, its current Kotter stage's action, the BARs
its deck offers now, and the keystone fruit that signals the stage is done.*

---

## 7. Decisions that are yours

1. **Author the `DOMAIN_KEYSTONE` table?** (§5.1) *Recommend: yes — one small pure
   registry; it's what lets the garden answer the question in one read.*
2. **Should domain shape milestone need-units?** (§5.2) i.e. does a Gather Resources
   campaign ask for `currency`/`hours` while Raise Awareness asks for `action`? *Recommend:
   yes, as a soft default (author a `DOMAIN_DEFAULT_NEED_UNITS` map) — it makes "successful
   [domain] campaign" mean something concrete at the contribution layer, which today it
   doesn't. Keep it a default a steward can override per need.*
3. **Keystone fruit — gate or flavor?** Does a stage *require* its keystone fruit to
   advance (a gate), or does keystone just weight/theme it (flavor)? *Recommend: flavor for
   v1 (the Kotter stage action is the real gate); promote to a soft gate later if progress
   feels too loose.*

---

### Appendix — evidence trail
- Three axes: `FOUNDATIONS.md:77-88` (the allyship board, domains × inner/outer).
- Domain enum + labels + lens: `allyship-deck/types.ts:20`, `allyship-domains.ts:6`,
  `allyship-deck/move-library.ts:62`. Essence: `domain-context.ts` (`DOMAIN_ESSENCE`).
- Fruit fixed by move: `allyship-deck/{types.ts:47,move-library.ts:30-36,assemble.ts:46}`.
- Domain × Kotter recipe: `src/lib/kotter.ts:32-73` (`STAGE_ACTIONS_BY_DOMAIN`,
  `getStageAction`); warm variants `domain-context.ts:29-70`.
- Domain decks: `src/lib/campaign-domain-deck.ts` (`getCampaignDomainDeck`,
  `translateQuestForStage`); `Instance.domainDeckCycles`.
- Native move (MOVE_CELL_AFFINITY): `quest-grammar/canonical-kernel.ts:61-67`.
- Domain→element: `allyship-domains.ts:22-27`. Domain→output-field:
  `alchemy/show-up-primitives.ts:285-290`.
- Domain on schema: `CustomBar.allyshipDomain:331`, `Instance.allyshipDomain:1950`,
  `Campaign.allyshipDomain:4137`, `Player.campaignDomainPreference:89`, `LensGoal.domain:729`.
- Needs typed by superpower/orientation/unit (NOT domain): `schema.prisma:3933-3960`.
- Specs: `campaign-kotter-domains`, `campaign-domain-decks`, `domain-aligned-intentions`,
  `bruised-banana-allyship-domains`, `campaign-ontology-alignment`.
</content>
