# Spec: Avatar Paper Doll Coherence (PDC)

## Purpose

Make **portrait** avatars (layered PNGs in `Avatar.tsx`) read as a **single coherent figure** by defining a shared **anchor** within the existing 64×64 cell, optional **per-layer offsets** for legacy assets, and CI/docs so art and code stay aligned. Improves **recognition at human scale** (WHO) wherever the player’s face appears — Vault, NOW dashboard, character creator, campaign previews.

**Practice** (persistence / UI): Deftness Development — spec kit first, API-first where data crosses boundaries (offset manifest is a versioned contract before UI tweaks), deterministic validation over ad-hoc fixes.

**Problem:** Layers use `absolute inset-0` + `object-contain` with **no shared anchor**. Parts can look like floating pieces (head vs torso vs grey base). **Walkable** map sprites use a **separate** precomposed sheet pipeline (`getWalkableSpriteUrl`); PDC focuses on **portrait** stacking unless walkable art fails for unrelated reasons.

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| Canvas size | Keep **64×64 RGBA** per existing `validate-sprite-layers.ts` rules; fix **alignment inside** the cell, not a new resolution in v1. |
| Anchor | Document in `docs/PORTRAIT_SPRITE_ANCHOR.md` (ground line + centerline + head/torso bands). |
| Offsets | Optional `offsetX`/`offsetY` on `PartSpec` or sidecar JSON keyed by `layer` + `key`; prefer **re-export** over permanent offsets. |
| Runtime | `Avatar.tsx` applies transforms inside the circular clip; shared helper if previews duplicate stacking. |
| Walkable | Out of scope for v1 compositing; remains precomposed sheets per `docs/WALKABLE_SPRITES.md`. |

---

## Conceptual Model

| Dimension | Mapping |
|-----------|---------|
| **WHO** | Player identity at **conversation scale** — nation + archetype (playbook) layers must read as one person, not stacked stickers. |
| **WHERE** | Surfaces: Vault (`/hand`), NOW (`/`), character creator, onboarding/campaign previews — anywhere `Avatar` or layered previews render. |
| **WHAT** | Not BAR/quest content; this is **presentation** of identity. |
| **Energy / moves** | N/A for this spec. |

See [.specify/memory/conceptual-model.md](../../memory/conceptual-model.md).

---

## Data Contracts (API-first, static v1)

> No new Server Action required for v1 if offsets ship as **git-tracked JSON** or inline map. Define shapes before UI so tooling and ARDS can adopt the same schema later.

### `PortraitLayerOverride` (optional manifest)

```ts
/** px from container top-left; integers */
export type PortraitLayerOverride = {
  layer: 'base' | 'nation_body' | 'nation_accent' | 'archetype_outfit' | 'archetype_accent'
  key: string
  offsetX: number
  offsetY: number
}
```

### `portrait-layer-overrides.json` (optional)

- **Location:** e.g. `src/lib/avatar-portrait-overrides.json` or `public/sprites/parts/manifest.json` (team choice in implementation).
- **Input:** list of `PortraitLayerOverride`.
- **Output:** consumed by `getAvatarPartSpecs` or a thin resolver that merges overrides into `PartSpec`.

### Route vs Action

- **None** for v1 unless admin UI edits offsets later (then Server Action + validation).

---

## User Stories

### P1: Coherent face in the Vault

**As a** player, **I want** my avatar to look like one character in the Vault and on the dashboard, **so** I trust the app’s representation of my identity.

**Acceptance:** With a standard nation+archetype combo, no visible “floating” head or bare placeholder block in the circular portrait at `md` size.

### P2: Artists can follow one contract

**As a** contributor, **I want** a single anchor document and optional offset list for legacy files, **so** I know how to export or fix assets.

**Acceptance:** `docs/PORTRAIT_SPRITE_ANCHOR.md` exists; `validate-sprite-layers.ts` still passes for 64×64 RGBA.

### P3: Verification (certification)

**As a** maintainer, **I want** a short cert quest that walks a tester through visible avatar checks, **so** we don’t regress alignment after ship.

**Acceptance:** Verification quest section below satisfied; seed idempotent.

---

## Functional Requirements

### Phase 1 — Contract + assets

- **FR1:** Publish anchor doc (and optional reference overlay PNG).
- **FR2:** Audit `public/sprites/parts/**`; track re-export vs offset debt.

### Phase 2 — Implementation

- **FR3:** Extend `PartSpec` and `Avatar` (or `LayeredPortrait`) with optional offsets from manifest/map.
- **FR4:** Deduplicate layer stacking in character creator / onboarding previews if they diverge from `Avatar`.

### Phase 3 — Quality

- **FR5:** Manual QA matrix on key pages; CI still runs `validate-sprite-layers.ts`.

---

## Non-Functional Requirements

- **Backward compatibility:** Default offsets `0`; existing players see improvement as assets/manifest update, not breaking changes.
- **Perf:** No extra network round-trips; manifest bundled or static import.
- **A11y:** Container `title` / name unchanged; decorative layers keep empty `alt` where appropriate.

---

## Verification Quest

Per [.agents/skills/spec-kit-translator/SKILL.md](../../../.agents/skills/spec-kit-translator/SKILL.md) and [.specify/specs/cyoa-certification-quests/](../cyoa-certification-quests/).

- **ID:** `cert-paper-doll-coherence-v1` (deterministic; idempotent seed).
- **Narrative frame:** Preparing a trustworthy **player identity** surface for Bruised Banana / residency demos — guests should see coherent faces in the app.
- **Steps (draft):** (1) Open NOW with a test player that has nation+archetype. (2) Confirm circular avatar shows aligned layers (no floating head / grey slab). (3) Open Vault; repeat. (4) Optional: character creator preview if unlocked.
- **Implementation:** TwineStory + system BAR; extend `scripts/seed-cyoa-certification-quests.ts` or sibling pattern; npm script e.g. `seed:cert:paper-doll` — **exact wiring in** [plan.md](./plan.md) / [tasks.md](./tasks.md).

---

## Non-goals (v1)

- Live compositing of walkable layers in Pixi (future ARDS alignment).
- 3D rig.

---

## Dependencies

- **ARDS** (1.37) — Portrait register; avoid duplicating coherence rules long-term.
- **avatar-parts.ts**, **Avatar.tsx**, **scripts/validate-sprite-layers.ts**

---

## References

- [.specify/spec-template.md](../../spec-template.md)
- [plan.md](./plan.md) · [tasks.md](./tasks.md)
- `docs/SPRITE_ASSETS.md`, `docs/WALKABLE_SPRITES.md`
- Backlog: [BACKLOG.md](../../backlog/BACKLOG.md) row **1.42 PDC**
