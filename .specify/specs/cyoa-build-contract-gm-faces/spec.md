# Spec: CYOA build contract, GM faces, Sifu alignment, hub/spoke

**Status:** Wake Up ✓ · Clean Up ✓ · Grow Up ✓ · **Show Up** — core types + registry + `parseGameMasterFace` wired (see §4). Branch: `feature/rpg-handbook-gpt-pipeline`.  
**GitHub:** [Issue #36](https://github.com/johnair01/bars-engine/issues/36)  
**Relates to:** [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md), [game-master-face-moves](../game-master-face-moves/spec.md), `.agent/context/game-master-sects.md`, `.agent/context/emotional-alchemy-interfaces.md`

## Purpose

Unify **player-composed CYOA intent** (emotional vector, four-move spine, GM face, narrative template, campaign/Kotter context) behind **one contract** and **one ontology** (`GameMasterFace`, template registry, Sifu → `portraysFace`), with **Option B** mid-spoke persistence (checkpoint + revalidate on resume).

Delivery uses **WAVE** internally (see issue #36): Wake Up → research; Clean Up → throughput; Grow Up → faces + Kotter; Show Up → implementation.

---

## 1. Wake Up — research (current repository state)

*Goal: what we know today; what knowledge must remain in-repo for implementers; gaps before Clean Up.*

### 1.1 CYOA / campaign entry surfaces (inventory)

| Surface | Role | GM face / template / vector |
|--------|------|------------------------------|
| `/campaign/hub` | Portal selection, milestone CTAs; BB may redirect to spatial octagon | Hub passages reference emit roots (`passage_*_Emit`); not a unified build DTO |
| `/campaign/spoke/[index]` | Spoke entry; default redirects to **`/campaign/spoke/:index/generated`** (GSCP) | Legacy `?portal=1` uses `Instance.portalAdventureId` + Twine; passes `hexagram`, `face` query params when `campaignHubState` matches Kotter |
| **GSCP generated spoke** | `generated-spoke-cyoa` + `generateAndPersistGscpAdventure` | **`GeneratedSpokeInputs`** already includes `gmFace`, `moveFocus`, `chargeText`, `kotterStage`, hub hexagram — **strong partial contract** for this pipeline only |
| `/campaign` (legacy) | Twine / grammatical initiation for BB | `CampaignReader` local state includes `active_face`, per-face completion flags — **stringly** vs enum at edges |
| `/adventure/[id]/play` | Twine passage player | Query params can carry `face`, `kotterStage`, `spoke` — **ad-hoc** |
| `/shadow/321` | **321 emotional process**; Cultivation Sifu choice | **`NPC_GUIDES`** in `src/lib/cultivation-sifu-guides.ts` — **explicit `face: GameMasterFace`** (good pattern); emotional current/desired in `Shadow321Runner` phases `alchemy` / `alchemy_feeling` |
| Dashboard / capture | Check-in, charges | `getTodayCharge`, alchemy actions — **vector** sources not yet merged into a single **CyoaBuild** |
| `POST /api/quests` | Generated quest registry (BAR-forge) | **`CreateQuestSchema`** — quest catalog, **not** the same as CYOA session build |
| `quest-grammar` / `compileQuest` | Grammar compilation | `questModel` `personal` → `epiphany_bridge`, `communal` → `kotter`; **`EVENT_PRODUCTION_GRAMMARS`** = `kotter` \| `epiphany_bridge` only |
| **Modular CYOA / CMA** (`clb-coaster-v0`) | Story generator template + graph validation | **Roller-coaster arc** lives here (`coasterTag`, `validateQuestGraph` “grammatical coaster”), **not** in `questGrammar` string — see §1.9 |

### 1.2 Persistence & hub state (inventory)

| Mechanism | Location | Notes |
|-----------|----------|--------|
| **Campaign hub draw** | `Instance.campaignHubState` JSON | **`CampaignHubStateV1`** in `src/lib/campaign-hub/types.ts`: 8 spokes, each `hexagramId`, `changingLines`, **`primaryFace: GameMasterFace`**; invalidated when `kotterStage` ≠ state |
| **GSCP run bundle** | `GscpProgressBundle` + adventure/passage persistence | Tracks `gmFace`, `moveType`, `chargeText`, `kotterStage`, spoke — **does not** unify with 321 session id |
| **321 session** | `persist321Session`, charge metabolism | Emotional narrative captured; **not** the same persistence shape as spoke CYOA |
| **Option B** | Spec intent | **Not** centrally implemented as “resume passage + revalidate branches from current alchemy” in one module — **gap** |

### 1.3 Sifu ↔ face (inventory)

- **`NPC_GUIDES`** — single source for **321** guide names; each row has **`face: GameMasterFace`** — **reference pattern** for “named NPC → canonical face.”
- **Future:** nations / schools / multiple NPCs per face — **not** in schema as first-class; issue #36 tracks spec only.

### 1.4 Gaps (Wake Up conclusion)

1. **No single `CyoaBuild` (or equivalent) type** consumed by hub, 321, GSCP, and Twine — **three parallel partial contracts** (`GeneratedSpokeInputs`, 321 answers, Twine query params).
2. **Narrative templates** are **split**: quest compile uses **epiphany_bridge** / **kotter**; **roller coaster** exists as **`clb-coaster-v0`** modular graph (§1.9). **No single registry** ties event grammar + quest grammar + coaster template ids.
3. **Check-in / vector → CYOA** policy is **fragmented** (threshold encounter, wiki copy, dashboard) — no one **gate** API.
4. **Option B** persistence is **specified** at product level but **not** one implementation path across spoke stores.
5. **`AdventurePlayer` URL `face=`** — **not** validated against `GAME_MASTER_FACES`; unknown values still display (see §1.6). Twine depth / `gm_set_` paths **are** constrained by node id regex.

### 1.5 Knowledge that must live in-repo (for Clean Up onward)

- [x] This **spec** (Wake Up inventory + deltas as we go).
- [x] **Bridge table** — §1.7 (321 → quest/CYOA); refine into ADR in Grow Up if needed.
- [x] **Template registry** — `src/lib/narrative-templates/registry.ts` (Show Up).
- [ ] **OpenAPI / Zod** for any new public API — **Show Up**.

### 1.6 Audit — `active_face` / `face` validation (Twine vs adventure player)

| Path | Validation | Risk |
|------|------------|------|
| **`/api/adventures/.../depth_*_{face}`** | Face **must** be one of `shaman\|challenger\|regent\|architect\|diplomat\|sage` (regex on `nodeId`). Writes `storyProgress.state.active_face`. | **Low** — typos impossible from URL. |
| **`gm_set_{face}`** nodes | Same six faces via regex on `nodeId`. | **Low**. |
| **`getAlignmentContext`** (`iching-alignment.ts`) | Reads `active_face` from `storyProgress` as **string**, lowercases; **`FACE_TRIGRAM_PREFERENCE[activeFace]`** — unknown key → **no sect score** (silent). | **Medium** — corrupt state yields weaker alignment, not errors. |
| **`AdventurePlayer`** (`portalFace` / `pickedFace`) | Casts to `GameMasterFace` for **`FACE_META` label** only; **`FACE_META[key]?.label ?? raw`** shows **raw** string if not a canonical key. | **Medium** — bad query params still propagate to API. |
| **`CampaignReader`** (legacy `/campaign`) | Local `campaignState.active_face` string; `<<complete_active_face>>` macro uses whatever is set in Twine state. | **Medium** — depends on authored passages. |

**Recommendation (Grow Up):** single `parseGameMasterFace(input: string): GameMasterFace | null` used at API boundary for `face` search param and optional normalization when persisting `storyProgress`.

### 1.7 Trace — 321 → quest wizard / CYOA draft

| Step | What happens |
|------|----------------|
| **`stashQuestWizardPrefillFrom321`** | Writes **`QuestWizardPrefill321V1`** to **sessionStorage** (`QUEST_WIZARD_PREFILL_321_KEY`): `metadata` (`Metadata321`), `phase2` (`UnpackingAnswers` + `alignedAction`), `phase3` (`Phase3Taxonomic`), optional `shadow321Name`, `displayHints`. Consumed when player opens quest flow — **client-only bridge**. |
| **`createCyoaDraftFrom321`** | Server action: creates **`CustomBar`**, **`persist321Session`** with phase2/phase3 snapshots, then **`createCyoaDraft`** with **`templateId: 'clb-coaster-v0'`** (mandatory M1 **coaster** template per `seed-m1-template.ts`), `mission` from `phase2.alignedAction` or `'Direct Action'`. |

**Implication:** 321 already fans out to (a) **quest wizard prefill** and (b) **modular coaster CYOA draft** — **not** to `GeneratedSpokeInputs` or `questGrammar` compile in one step. Unified **`CyoaBuild`** should **reference** these outputs (ids + template kind), not duplicate them.

### 1.8 Index — `questModel` / `questGrammar` / `EVENT_PRODUCTION_GRAMMARS`

**`EVENT_PRODUCTION_GRAMMARS`** (`src/lib/event-campaign/domains.ts`): `kotter` \| `epiphany_bridge` — validation for event/campaign domain authoring.

**`questModel` → `questGrammar`** (`src/actions/quest-grammar.ts`): `communal` → `kotter`, else `epiphany_bridge`.

**Compile / generation:**

- `src/lib/quest-grammar/compileQuestCore.ts` — `questModel` selects Kotter vs Epiphany beat sets.
- `src/app/admin/quest-grammar/GenerationFlow.tsx`, `UnpackingForm.tsx`, `useGenerationFlowState.ts` — admin UI.
- `src/lib/creation-quest/*`, `src/lib/onboarding-cyoa-generator/*` — creation intent, onboarding CYOA.
- `packages/bars-core/src/quest-grammar/*` — parallel package copies.
- `src/lib/agent-client.ts` — `quest_grammar` payload.
- `scripts/seed-cyoa-certification-quests.ts` — seed content (naming collision with “quest grammar” as product).

**Not in this list:** modular **coaster** graph (`src/lib/modular-cyoa-graph/*`) — separate template family.

### 1.9 Roller coaster — where it lives today

- **Quest grammar / BAR compile:** only **epiphany_bridge** and **kotter** (plus `questModel` personal/communal).
- **321 → CYOA:** **`clb-coaster-v0`** template (`scripts/seed-m1-template.ts`, `createCyoaDraftFrom321`) — **coaster** as **modular graph** with `coasterTag` / LIFT ↔ STATION validation.
- **Grow Up decision:** whether “narrative template = roller coaster” **unifies** under one registry that points to **either** modular CYOA keys **or** a future third `questGrammar` branch — **not** blocked on absence of a string in `compileQuest`; the work is **cross-subsystem naming + registry**.

---

## 1.10 Wake Up sign-off

- **Date:** 2026-04-06  
- **Scope:** §1.1–1.9 accepted as baseline inventory + audits.  
- **Commit (initial spec kit):** `4db62e2` on `feature/rpg-handbook-gpt-pipeline`  
- **Next:** Clean Up — emotional throughput and check-in gate language (§2).

---

## 2. Clean Up — emotional throughput

*Clean Up names **where we are** vs **where we want to be** for this initiative, ties work to **emotional alchemy** (dissatisfaction → satisfaction, WAVE moves, optional 15-move mapping), and states the **single check-in gate rule** so implementation serves **throughput**, not only correctness.*

**North star:** translate **code activity** (contracts, registry, validation) into **emotional resolution** for players and builders: less dissociation between “named Sifu,” “canonical face,” and “what the engine does.”

### 2.1 Frames (from `.agent/context/emotional-alchemy-interfaces.md`)

- **WAVE** = Wake / Clean / Grow / Show as **worldview for impact** on the same belief or channel.  
- **15 moves** have **primary WAVE** leanings; any move can appear in multiple stages with different emphasis.  
- This spec’s **Clean Up** phase (delivery process) should **mirror** player **Clean Up** where relevant: metabolize confusion, **stabilize coherence** between pipelines, **reopen** honest choice after fragmentation.

### 2.1b Three layers of “moves” (do not conflate)

| Layer | Role | Tie to this initiative |
|-------|------|-------------------------|
| **Belief-relief moves** | Per shadow belief, per **WAVE column** in alchemy doc §1 (e.g. “I’m not good enough” → Clean up *unlivable standards*). They **relieve or challenge** the belief at that stage. | Our shadow row: **“I’m not good enough”** + **“the app isn’t capable”** — Clean Up work **dissolves incoherent standards** (many pipelines, no contract) and **grounds** capability in one honest integration path. |
| **WAVE spine** (Wake / Clean / Grow / Show) | **Player journey** through a CYOA: which beat of the story we’re in. | **Ordered beats** through a CYOA (plus emitted BARs/quests) are the **adventure**; WAVE labels **where** we are in that arc. |
| **Game Master face moves** | Per-face tools / flavor ([game-master-face-moves](../game-master-face-moves/spec.md)). | **Which Sifu/face** is active — not the same enum as belief-relief or WAVE, but **must resolve** to `GameMasterFace`. |

**Emerging product insight:** belief-relief moves, WAVE progression, and GM face moves can be **composed in order**; that composition is the **CYOA adventure**, and **BARs/quests** are what **emerge** from nodes (emit, wizard, registry) — specs should keep the three layers **legible** in `CyoaBuild` and downstream generators.

### 2.2 Capture — product emotional vector *(2026-04-06)*

| Prompt | Answer |
|--------|--------|
| **Current state** | **Frustrated, anxious** — *dissatisfied* **anger** and **fear** that this basic feature is not yet running. |
| **Desired state** | **Triumph, excitement, bliss** — *satisfied* anger, fear, and **joy** when the unified path lands. |
| **Shadow / belief row** | **“I’m not good enough”** paired with **“the app isn’t capable”** (alchemy doc §1: good enough + capability columns). Same table’s **moves** address the belief **per stage**; they are **not** the same as WAVE spine labels or GM face moves — see §2.1b. |
| **Delivery WAVE for this section** | **Clean Up** stage only — we are **not** re-running a full WAVE for the team; we **reference** Wake / Grow / Show where they clarify **stakes** and **maturity** (§2.5). |
| **Check-in gate** | **Hard gate.** The app’s main function is to **take in emotional data**; the CYOA generator may read it from **multiple sources** (check-in, 321, persisted alchemy), but **must not** run a build that **requires** a vector **without** resolving one through an allowed path. |

### 2.3 Player-facing throughput

Players experience **fragmentation** as “the story doesn’t remember me” or “the teacher isn’t the same as the menu.” **Clean Up** in product terms: one **emotional vector** (current → desired) **feeds** the CYOA composer when a spoke or generator **requires** it — **hard gate**: no anonymous myth-making when the ritual demands truth. **Option B** (checkpoint + revalidate) keeps **honesty** when feelings shift mid-path: the engine **re-checks** branches against **current** alchemy instead of trapping the player in a lie. Triumph/bliss show up when **face**, **template**, and **campaign phase** **cohere** with what they already named in check-in or 321.

### 2.4 Check-in gate — normative rule *(single sentence)*

**If a CYOA build or spoke entry requires an emotional vector, the player must complete an allowed capture path (e.g. daily check-in or full 321 alchemy phases that yield vector fields) before the build proceeds; multiple sources may satisfy the gate if they produce the same contract fields.**

### 2.5 What’s still left to **Wake Up** inside this Clean Up — and campaign maturity

- **Wake** (insight not yet owned): fragmentation **is** the tax — not laziness. The Wake Up doc already **named** the pipes; Clean Up **chooses** integration despite discomfort.  
- **How this Clean Up matures the campaign:** metabolizing duplicate template strings and orphan `face` params lets **Kotter stage**, **hub draw** (`campaignHubState`), and **321/Sifu** speak **one language** — **Regent** gets legible rules, **Architect** gets one blueprint registry, **Diplomat** gets a weave that doesn’t drop players between surfaces. That is **campaign maturity**: change stage and collective field stay **legible** to personal CYOA.

### 2.6 Advised 15-move pairings *(from alchemy primary WAVE + Wake Up audit logic)*

Heuristic: pair **Clean-leaning** moves to **integration** work; **Wake** to **naming**; **Grow** to **capacity** of the contract; **Show** to **shipping** PRs.

| Canonical move (alchemy doc §2) | Primary WAVE | Pair to deliverable / risk |
|---------------------------------|--------------|----------------------------|
| **Stabilize Coherence** | Control / Clean | **Single template registry** (quest + event + coaster ids) — ground enthusiasm into one structure. |
| **Consolidate Energy** | Control / Clean | **`CyoaBuild` DTO** + merge rules for hub + 321 + GSCP — gather scattered energy. |
| **Reopen Sensitivity** | Control / Clean | **`parseGameMasterFace` at API boundary** — soften rigid/wrong `face` strings without shaming the player. |
| **Temper Action** | Control / Clean | **Option B** persistence — reassess risk when alchemy changes on resume. |
| **Reclaim Meaning** | Transcend / Clean | **Sifu `portraysFace`** — correct distortion between NPC name and canonical face. |
| **Reveal Stakes** | Generative / Wake | **Wake Up §1** inventory — already done; keep as reference when scope creeps. |
| **Integrate Gains** | Generative / Grow | **Grow Up** slice: after registry exists, **fold** BAR/quest emission into one pipeline story. |
| **Declare Intention** | Generative / Show | **Show Up**: PRs that trace to spec tasks — momentum into visible action. |

*Not every move needs a ticket* — use this table in **Grow Up** when assigning face + Kotter links to design choices.

### 2.7 Exit criteria for Clean Up

- [x] §2.2 table completed.  
- [x] §2.3–2.4 player throughput + gate rule.  
- [x] §2.5 Wake-within-Clean + campaign maturity.  
- [x] §2.6 pairings advised.  
- [x] Team review → **Grow Up** (§3) drafted.

---

## 3. Grow Up — six faces, Kotter maturity, contracts

*Grow Up expands **capacity**: one ontology across subsystems, explicit **face ownership** of deliverables, and **campaign change** (Kotter) that stays legible when personal CYOA composes. Spiral / Integral mapping: see `.agent/context/game-master-sects.md` (faces ↔ developmental levels); design must not **dissociate** a level or conflict surfaces there.*

### 3.1 Principle — all levels honored

- **Six faces** = six **sect lenses**; **Sage** integrates and may **mask** as another face per [game-master-face-moves](../game-master-face-moves/spec.md).  
- **CyoaBuild** and related APIs should make **face** and **template** **explicit** so no pipeline silently pretends to be “neutral.”  
- **Kotter** = **collective change maturity** (`Instance.kotterStage`, hub draw invalidation). Personal CYOA must **read** the same stage and **resource** context so **Regent** / **Diplomat** beats (rules + weave) are not orphaned.

### 3.2 `CyoaBuild` — conceptual fields *(Zod/OpenAPI in Show Up)*

Single DTO name **TBD** (`CyoaBuild`, `CyoaSessionIntent`, etc.); fields **conceptually**:

| Field | Purpose |
|-------|---------|
| `emotionalVector` | Ref or embedded snapshot: current → desired (from allowed sources per §2.4). |
| `waveMove` | Four-move spine: Wake Up / Clean Up / Grow Up / Show Up (aligned with `GscpMoveFocus` / product wording). |
| `gameMasterFace` | `GameMasterFace` — canonical; Sifu/NPC via `portraysFace` or `sifuId` + lookup. |
| `gmFaceMoveId` | Optional; ties to face-moves spec when applicable. |
| `narrativeTemplate` | **Registry key** — see §3.3 (not raw duplicate strings). |
| `campaignContext` | At minimum: `campaignRef`, `kotterStage`, hub spoke index if relevant, `gatherResources` / domain flags as product requires. |
| `provenance` | Which source satisfied the vector gate (`check_in`, `shadow_321`, `persisted_alchemy`, …). |

**Merge rule:** **`GeneratedSpokeInputs`**, 321 exports, and Twine query bundles **map into** this shape at boundaries; **do not** fork the enum set.

### 3.3 Narrative template registry *(decision)*

**Decision:** introduce a **single module** (e.g. `src/lib/narrative-templates/registry.ts`) exporting:

- **`NarrativeTemplateId`** — `enum` or union: at minimum `epiphany_bridge`, `kotter`, `modular_coaster` (maps to `clb-coaster-v0` and future coaster ids).  
- **`resolveNarrativeTemplate(id)`** → `{ kind: 'quest_grammar' \| 'event_grammar' \| 'modular_cyoa'; questGrammar?: …; eventGrammar?: …; modularTemplateId?: string }`.  
- **Consumers:** quest compile, event campaign domains, 321 → `createCyoaDraft`, GSCP (if it needs a template label).  

**Rationale:** Wake Up §1.9 split is **real**; registry **names** the third path without forcing `questGrammar` to add `roller_coaster` until compile path needs it.

### 3.4 `parseGameMasterFace` *(boundary)*

- **Signature:** `parseGameMasterFace(input: string | null | undefined): GameMasterFace | null` (normalize: trim, lowercase).  
- **Call sites (first slice):** `AdventurePlayer` / server handler for `face` query param; optional normalization when writing `storyProgress.state.active_face`.  
- **Invalid:** return `null`; caller **must not** persist garbage — **Challenger** move: block or re-prompt (“Not yet” to invalid face).

### 3.5 Face ownership of Grow Up deliverables

| Face | Primary ownership in this initiative |
|------|----------------------------------------|
| **Shaman** | Ritual **gate** UX copy and flow: vector before threshold; 321 as threshold experience. |
| **Challenger** | **Hard gate** enforcement — reject builds without vector; **flag blocked** pipelines. |
| **Regent** | **`campaignContext.kotterStage`**, hub **`campaignHubState`** merge rules; **invalidation** when stage changes. |
| **Architect** | **`CyoaBuild` DTO**, **template registry**, compile hooks from grammar + modular CYOA. |
| **Diplomat** | **Weave** between hub, spoke, 321, dashboard — same contract fields across surfaces. |
| **Sage** | **Masking** semantics (`portraysFace` vs runtime `effectiveFace`); **synthesis** when a feature must touch multiple faces. |

### 3.6 Kotter — how unified contract **matures** the campaign

| Stage (abbrev.) | What the contract unlocks |
|-----------------|---------------------------|
| **1–2 Urgency / Coalition** | Named **vector** + **face** make “why now” and “who with” **legible**; hub draw **aligns** with stage. |
| **3–4 Vision / Communicate** | **Template** + narrative spine **match** epiphany vs Kotter vs coaster **explicitly** — no silent mismatch. |
| **5–8 Obstacles → Anchor** | **Option B** + **revalidate** support honest **progress** when emotions shift; **BARs/quests** emitted from **same** build record. |

*Not every stage needs a new ticket* — **Grow Up** ensures **one** `kotterStage` + **one** build snapshot drive **spoke** and **downstream** together.

### 3.7 Sage / NPC

- **`portraysFace: GameMasterFace`** on Sifu/NPC rows; **display name** is not authoritative.  
- **Sage mask:** runtime `effectiveFace` when Sage “runs as” another face — document in ADR if prompts diverge from `portraysFace`.

### 3.8 Exit criteria for Grow Up

- [ ] §3.3 registry **location + file name** agreed (or PR stub).  
- [ ] §3.2 field list **frozen** for first Show Up slice.  
- [ ] §3.4 **parse** implemented or ticketed with file list.  
- [ ] §1.5 **template registry** checkbox satisfied (move to Show Up for code).  
- [ ] Team ready for **Show Up** (implementation checklist §4).

## 4. Show Up — implementation checklist

*Execute after §3.8. Track PRs in `tasks.md`; **OpenAPI / Zod** for any new public route per §1.5.*

**Composer CYOA → persistence (how players “fill” the container):** Not a separate form — a **composer CYOA** whose **chosen branches** accumulate **`CyoaBuild`** fields and **commit** at a terminal passage. Spec: **[cyoa-composer-build-cyoa](../cyoa-composer-build-cyoa/spec.md)** (six faces lens §1, branch→field §2, persistence §3).

---

## References (file-level)

- `src/lib/campaign-hub/types.ts` — `CampaignHubStateV1`, `CampaignHubSpokeDrawV1`
- `src/lib/generated-spoke-cyoa/types.ts` — `GeneratedSpokeInputs`, `GscpProgressBundle`
- `src/actions/generated-spoke-cyoa.ts` — GSCP wizard + persist
- `src/app/campaign/spoke/[index]/page.tsx` — spoke routing, legacy portal
- `src/lib/cultivation-sifu-guides.ts` — `NPC_GUIDES` ↔ `GameMasterFace`
- `src/app/shadow/321/Shadow321Runner.tsx` — 321 phases, alchemy / desired feeling
- `src/lib/quest-wizard-prefill.ts` — `QuestWizardPrefill321V1`, sessionStorage bridge
- `src/actions/cyoa-generator.ts` — `createCyoaDraftFrom321`, `clb-coaster-v0`
- `src/app/adventure/[id]/play/AdventurePlayer.tsx` — portal face URL / display
- `src/app/api/adventures/[slug]/[nodeId]/route.ts` — `depth_*`, `gm_set_*`, portal face
- `src/lib/iching-alignment.ts` — `activeFace` from `storyProgress`
- `src/actions/quest-grammar.ts` — `questGrammar` epiphany vs kotter
- `src/lib/event-campaign/domains.ts` — `EVENT_PRODUCTION_GRAMMARS`
- `src/lib/modular-cyoa-graph/*`, `scripts/seed-m1-template.ts` — coaster template
- `src/lib/quest-grammar/parseGameMasterFace.ts` — boundary parse
- `src/lib/narrative-templates/registry.ts` — template ids → subsystem
- `src/lib/cyoa-build/*` — `CyoaBuild` Zod + GSCP mapper
- `.specify/specs/cyoa-composer-build-cyoa/spec.md` — composer CYOA → persist `CyoaBuild`
