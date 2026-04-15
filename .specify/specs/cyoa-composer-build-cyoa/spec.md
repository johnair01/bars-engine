# Spec: Composer CYOA → `CyoaBuild` persistence

**Status:** Draft — product + technical contract.  
**GitHub:** [Issue #36](https://github.com/johnair01/bars-engine/issues/36) (parent umbrella).  
**Parent:** [cyoa-build-contract-gm-faces](../cyoa-build-contract-gm-faces/spec.md) — DTO, registry, `parseGameMasterFace` (Show Up slice).  
**Relates to:** [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md), [game-master-face-moves](../game-master-face-moves/spec.md), `.agent/context/game-master-sects.md`

## Purpose

Players do not “fill a form” for **`CyoaBuild`**. They play a **composer CYOA**: a **short, authored branchy story** whose **choices accumulate** the fields of `CyoaBuild` (emotional vector ref/snapshot, WAVE move, `gameMasterFace`, narrative template id, campaign context, provenance). At a **terminal passage**, the engine **persists** the build and **hands off** to hub/spoke/GSCP (or redirects to check-in / 321 when a **hard gate** branch fires).

**Core rule:** *Branches build the container; the container is what downstream gameplay reads.*

---

## 1. Six Game Master faces — lens on the composer CYOA

Canonical faces only: **Shaman, Challenger, Regent, Architect, Diplomat, Sage** (`GameMasterFace`).

| Face | Role in the **composer** CYOA |
|------|--------------------------------|
| **Shaman** | **Threshold & ritual** — first passages establish *belonging to the choice* (why we’re naming state before the big CYOA). Emotional vector beats often live here; optional tie to check-in / 321 as *ritual entry*. |
| **Challenger** | **Gate & edge** — branches that enforce **hard gate**: “not yet” → redirect to capture vector; “ready” → continue. Validates energy before the build is **committed**. |
| **Regent** | **Order & period** — passages or macros that **declare campaign legibility**: Kotter stage, gather-resources / domain, spoke index — *rules of the table* merged into `campaignContext`. |
| **Architect** | **Blueprint** — the **accumulator pattern**: each choice **writes** a slice of `CyoaBuild`; terminal node **materializes** the full DTO (Zod-valid). This is the “blueprint” face for the data shape. |
| **Diplomat** | **Weave** — copy and branches that connect **personal** choice to **collective** field (“who else is in this stage?”). UI may surface Diplomat *tone* without a second ontology — still `GameMasterFace` + context. |
| **Sage** | **Integration** — **commit** passage: witness the assembled build, optional **mask** (Sage voice summarizing another face’s lens per face-moves spec). Final **persist** + redirect is Sage-class *synthesis*. |

**Design implication:** Composer passages may **theme** by face without adding enum values — **voice** and **branch labels** map to the table above; mechanics still use **`GameMasterFace`** + `CyoaBuild` fields only.

---

## 2. Product shape

### 2.1 Composer CYOA ≠ main spoke CYOA

- **Composer CYOA** — **Upstream**: produces **`CyoaBuild`** (persisted). Short graph; may live as Twine/adventure slug `cyoa-composer-*` or hub-embedded flow.
- **Spoke / campaign CYOA** — **Downstream**: consumes **stored** `CyoaBuild` + `Instance.campaignHubState` (merge per parent spec).

### 2.2 Branch → field mapping (conceptual)

| Player action (branch) | `CyoaBuild` field(s) |
|------------------------|----------------------|
| Choose narrative template | `narrativeTemplate` (`NarrativeTemplateId`) |
| Choose GM face / Sifu | `gameMasterFace` (+ optional `sifuId` when registry exists) |
| Choose WAVE move spine | `waveMove` |
| Confirm vector source | `provenance` + `emotionalVector` (ref or embedded) |
| Inherit campaign | `campaignContext` (from `Instance`, URL, hub state) |

**Implementation:** passage `metadata` or choice `setState` keys (e.g. `cyoaBuildPatch: Partial<CyoaBuild>`) merged server-side until terminal commit.

### 2.3 Terminal behavior

1. Validate **`cyoaBuildSchema`** (Zod).
2. **Persist** to chosen store (see §3).
3. Redirect: e.g. **`/campaign/spoke/:index/generated?ref=…`** with **session/build id** resolved server-side, or attach build id to player scope.

### 2.4 Hard gate branches

- If vector required and missing: branch to **“Go to check-in”** / **“Open 321”** with **`returnTo`** = composer resume node (or restart composer).
- Aligns with **Challenger** + **Shaman** beats in §1.

---

## 3. Persistence (TBD in implementation tasks)

**Options** (pick one in `plan.md` / tasks):

- `Instance` JSON field e.g. `cyoaBuildByPlayerId` (map) — simple, campaign-scoped.
- `Player` or **`PlayerAdventureProgress`**-like store — player-scoped composer state.
- Dedicated **`CyoaBuildSession`** table — audit-friendly.

**Requirement:** idempotent **commit** at terminal; **read** before spoke generation.

---

## 4. Relation to existing code

- **`CyoaBuild`** / **`cyoaBuildSchema`** — `src/lib/cyoa-build/schema.ts`
- **`resolveNarrativeTemplate`** — `src/lib/narrative-templates/registry.ts`
- **`parseGameMasterFace`** — already on adventure API; composer should **only** emit canonical faces at commit.
- **GSCP** — `cyoaBuildFromGeneratedSpokeInputs` becomes **downstream** of persisted build **or** merge: **prefer stored build** when present.

---

## 5. Non-goals (v1)

- Replacing entire BB hub Twine in one release.
- Full **Option B** revalidate inside composer (composer is short; spoke CYOA uses Option B per hub spec).

---

## 6. Acceptance criteria

- [ ] Composer adventure (or flow) **exists** with at least: template pick, face pick, vector gate branch, terminal **persist**.
- [ ] **One** persistence mechanism chosen and documented in `plan.md`.
- [ ] Hub or spoke entry **reads** persisted `CyoaBuild` when present.
- [ ] Spec linked from [cyoa-build-contract-gm-faces](../cyoa-build-contract-gm-faces/spec.md) §4 follow-ups.
