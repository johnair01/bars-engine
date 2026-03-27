# Spec: Unified CYOA graph authoring & validation (invite + campaign + modular)

## Purpose

Align **event invite initiation**, **admin-edited campaign passages**, **Twine/IR publishing**, and **modular charge (CMA) graphs** behind one **directed graph contract** and **authoring story**, so we fix:

1. **Guest outcomes** — invites reliably offer account creation, pre-production involvement, and app literacy.
2. **Admin pain** — choice `targetId` is not a guess; new nodes do not produce **orphan links** that break the player runtime.
3. **Player / modular CYOA** — the same **reachability + defined targets** rules apply so we do not maintain parallel broken paths.

This spec **does not replace** existing specs; it **integrates** them and names **concrete code anchors**.

---

## Artifacts in the repo (name the systems)

| # | Name | Storage / entry | Runtime | Validation today |
|---|------|-----------------|---------|------------------|
| **A** | **Invite doorway JSON CYOA** | `CustomBar.storyContent` (`type: event_invite`) | `EventInviteStoryReader` + `parseEventInviteStory` | Closed graph: `start` ∈ passages; every `choice.next` ∈ passage ids |
| **B** | **Campaign / initiation passages** | `Adventure` + `Passage` (`nodeId`, `choices` JSON) | `CampaignReader` → `GET /api/adventures/[slug]/[nodeId]` | **Weak** at edit time: `upsertCampaignPassage` does not verify targets exist |
| **C** | **Twine IR draft** | `TwineStory.irDraft` → compile to Twee | `parseTwee` / adventure play | `validateIrStory` — missing `next_node` targets fail publish |
| **D** | **CMA modular graph** | Strand / charge JSON (`CmaStory`) | `cmaStoryToIrNodes` → Twee | `validateQuestGraph` — start, ends, choice arms, reachability |

**Player event creation** ([`player-event-creation`](../player-event-creation/spec.md)) owns **EventCampaign / EventArtifact** data, not passage graphs; it **feeds** invite URLs and event context but **shares the same operator problem** if we later attach per-event CYOA — hence **one graph toolkit** avoids a second bespoke editor.

---

## Root cause (why “Could not load this step”)

`CampaignReader` fetches the **next** node by id; if no `Passage` row exists for that `nodeId`, the API returns non-OK and the UI shows **“Could not load this step.”** (see `src/app/campaign/components/CampaignReader.tsx`).

Admins can set `targetId` to any string in `CampaignPassageEditModal` / `upsertCampaignPassage` without **author-time** validation that the target passage exists. That is distinct from **invite JSON**, where `parseEventInviteStory` **rejects** invalid `next` ids (story fails closed → `notFound()` on public invite).

---

## Requirements

### R1 — Canonical graph contract (logical model)

Define a **normalized directed graph** (conceptual; implementation may be adapters):

- **Nodes**: `{ id, bodyText, kind? }`
- **Edges**: labeled choices `{ fromId, toId, label }`
- **Start** id
- **Terminals** (optional): nodes with no outgoing edges or explicit “ending” semantics

**Adapters** (non-exhaustive):

- `EventInviteStory` → nodes = passages; edges = choices; terminals = passages with `ending`.
- `Passage[]` for one `adventureId` → nodes = passages; edges = parsed `choices`.
- `IRNode[]` → existing `validateIrStory`.
- `CmaStory` → existing `validateQuestGraph`.

### R2 — Unified validation API (server + CI)

- **Shared module** (new): e.g. `src/lib/story-graph/validateDirectedGraph.ts` — given nodes + edges + start, report:
  - undefined targets (broken links)
  - unreachable nodes (warnings)
  - missing start
  - invite-specific: terminal / CTA expectations (optional lint rules)

- **Hook points**:
  - On **`upsertCampaignPassage`** (and batch publish): reject or warn when `targetId` ∉ set of existing `nodeId`s for that adventure (policy: **DRAFT warn / block** per env).
  - Reuse or wrap **`validateIrStory`** and **`validateQuestGraph`** internally where possible to avoid three divergent rule sets.

### R3 — Authoring UX (admin first)

- **Graph map** for an adventure: list or visual overview of all `Passage.nodeId`s + incoming/outgoing choice counts.
- **Target picker**: when editing a choice, dropdown or autocomplete of **existing** node ids + **“Create new node and wire”** (implements `linkFrom` / branch wiring from [`admin-cyoa-preview-draft-wizard`](../admin-cyoa-preview-draft-wizard/spec.md)).
- **Better errors**: if player hits missing node, show admin-facing slug + “create passage `{nodeId}` or fix choice target” (dev/admin only).

Non-goal v1: full visual node editor (Figma-style); **table + map + picker** is enough to unblock.

### R4 — Invite content quality

- **Templates** or **generator** (AI or deterministic) that emit **valid** `EventInviteStory` JSON satisfying **R1** and existing schema in `src/lib/event-invite-story/schema.ts`.
- Content must explicitly support the three guest outcomes:
  1. Path to **create account** (link to signup / conclave).
  2. **Pre-production** involvement (how to help before the night).
  3. **Learn the app** (wiki, hub, campaign context).

Wire **ending CTAs** (`endingCtas` / defaults) so the JSON doorway and **Partiful / initiation** buttons stay coherent ([`event-invite-party-initiation`](../event-invite-party-initiation/spec.md)).

### R5 — Merge with modular / player-generated CYOA

- **CMA** graphs already compile through **IR → Twee**; validation is **`validateQuestGraph`**.
- **Policy**: new player-facing graph UIs **reuse** the same validation module and, where stories compile to Twee/passages, **reuse admin graph map** patterns (shared React primitives).

---

## Related specs & docs

| Spec | Relationship |
|------|----------------|
| [`admin-cyoa-preview-draft-wizard`](../admin-cyoa-preview-draft-wizard/spec.md) | **Implements R3** partially: DRAFT preview, `linkFrom`, choice builder — **merge implementation here** |
| [`cyoa-modular-charge-authoring`](../cyoa-modular-charge-authoring/spec.md) | **D** — `validateQuestGraph`, CMA → IR |
| [`twine-authoring-ir`](../twine-authoring-ir/spec.md) / `src/lib/twine-authoring-ir` | **C** — `validateIrStory` |
| [`event-invite-party-initiation`](../event-invite-party-initiation/spec.md) | Invite URL + Partiful + initiation; **R4** content |
| [`player-event-creation`](../player-event-creation/spec.md) | Events data model; **feeds** invites; future per-event graphs consume **R2/R3** |
| [`campaign-branch-seeds`](../campaign-branch-seeds/spec.md) | Player **seeds** on `CampaignReader` nodes; steward **metabolize** must pass the same **B** graph validation as admin saves |

---

## Acceptance criteria

- [ ] Documented **artifact table** (this spec) is reflected in onboarding / runbook for admins (“which CYOA am I editing?”).
- [ ] **Campaign passage** saves cannot leave **dangling `targetId`** without an explicit author warning or block (configurable).
- [ ] Admin UI exposes **node list + target picker** for at least **initiation / campaign** adventures (reuse or extend `CampaignPassageEditModal` + admin passage create).
- [ ] **Invite** stories have a **blessed template or generator** that passes `parseEventInviteStory` and covers the three guest outcomes.
- [ ] **validateIrStory** / **validateQuestGraph** either call into or are documented as **peers** of the shared graph validator (no contradictory rules).
- [ ] `npm run build` and `npm run check` pass after implementation phases.

---

## Non-goals (v1)

- Partiful API sync.
- Real-time collaborative editing of graphs.
- Replacing Twine/SugarCube for all campaign content.
