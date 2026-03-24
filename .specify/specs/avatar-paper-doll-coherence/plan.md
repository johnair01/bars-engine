# Implementation plan — Avatar Paper Doll Coherence (PDC)

**Backlog:** 1.42 · **Spec:** [spec.md](./spec.md)

## Spec Kit Translator alignment

This spec kit was **retrofitted** to [.specify/spec-template.md](../../spec-template.md) and [.agents/skills/spec-kit-translator/SKILL.md](../../../.agents/skills/spec-kit-translator/SKILL.md). **New** spec kits in this repo should:

1. Read the **Spec Kit Translator** skill first (interview protocol, game language, verification quests for UX).
2. Scaffold from **spec-template.md** (`Purpose`, `Practice`, `Design Decisions`, `Conceptual Model`, contracts, `Verification Quest` when UI is touched).
3. Keep **spec.md / plan.md / tasks.md** as the implementation authority.

PDC includes a **verification quest** (see spec § Verification Quest) — implement in the same PR train as FR work or immediately after Phase 2, per skill.

## Problem summary

Portrait layers (`Avatar.tsx` + `getAvatarPartSpecs`) stack five PNGs with `absolute inset-0` + `object-contain`. Parts are **already** normalized to **64×64 RGBA** by [`scripts/validate-sprite-layers.ts`](../../../scripts/validate-sprite-layers.ts), but there is **no shared anchor** for *where* the figure sits inside that square. Artists can center the head high and the torso low (or leave grey padding), so the doll reads as **incoherent**.

Walkable sprites are a **separate** pipeline (precomposed 512×64 sheets). PDC focuses on **portrait** unless a walkable asset fails for the same reason (content, not stacking).

---

## Guiding principles

1. **Contract before pixels** — Document the anchor; then fix art or code in that order.
2. **Prefer re-export over offsets** — Per-layer offsets are escape hatches for legacy assets.
3. **One source of truth** — Layer order stays in `avatar-parts.ts`; offsets live beside it or in a small JSON manifest keyed by `layer` + `key`.
4. **CI enforces dimensions** — Already partially done; extend only when we add anchor-sensitive checks (optional Phase 3).

---

## Phase 0 — Anchor contract (design / docs)

**Goal:** Everyone agrees how a correct part sits in the 64×64 portrait cell.

| Deliverable | Description |
|-------------|-------------|
| `docs/PORTRAIT_SPRITE_ANCHOR.md` (or section in `docs/SPRITE_ASSETS.md`) | Diagram or bullet spec: e.g. **ground line** at bottom pixel row, **vertical centerline** at x=32, **head box** vs **torso box** bands (fractions of 64). |
| Reference frame | Optional single `public/sprites/parts/_reference/anchor-guide.png` (editor overlay) for artists. |
| Sign-off | Short note in spec or PR: product/design ack. |

**Exit criteria:** A new part can be drawn to spec without guessing.

---

## Phase 1 — Asset audit and remediation

**Goal:** Know which files violate the contract.

| Step | Action |
|------|--------|
| 1.1 | Inventory: list all PNGs under `public/sprites/parts/{base,nation_body,nation_accent,playbook_outfit,playbook_accent}/`. |
| 1.2 | Visual pass (spreadsheet or checklist): per file, mark **pass / re-export / offset-only**. |
| 1.3 | **Re-export** priority: `base` + `nation_body` first (they set silhouette); then outfit/accent. |
| 1.4 | For files that cannot be re-exported soon, assign **temporary** offsets in Phase 2 manifest (track debt in tasks). |

**Exit criteria:** Zero “unknown” assets; each file has a remediation path.

---

## Phase 2 — Runtime: offsets + rendering

**Goal:** `Avatar` composes layers so they align even when some assets are slightly off.

| Step | Action |
|------|--------|
| 2.1 | Extend `PartSpec` in [`src/lib/avatar-parts.ts`](../../../src/lib/avatar-parts.ts): optional `offsetX`, `offsetY` (px, integers relative to container top-left), optional `scale` (default 1) if ever needed. |
| 2.2 | Add `getPartLayoutOverrides()` — either **inline map** `(layer, key) → offsets` or **`import portrait-offsets.json`** (git-tracked). Start empty or with Phase 1 debt only. |
| 2.3 | Update [`src/components/Avatar.tsx`](../../../src/components/Avatar.tsx): for each `img`, apply `transform: translate(offsetX, offsetY)` (or Tailwind arbitrary) inside the same `relative` circular clip so **object-contain** behavior stays predictable. |
| 2.4 | **Character creator / previews** — Any component that duplicates layer stacking (`CharacterCreatorAvatarPreview`, `OnboardingAvatarPreview`) should **reuse** the same helper (`getAvatarPartSpecs` + layout) to avoid drift. Refactor to shared `LayeredPortrait` if duplication is high. |
| 2.5 | **Accessibility:** preserve `alt` strategy (empty alt on decorative layers is OK if name is on container `title`). |

**Exit criteria:** Misaligned combos from Phase 1 can be corrected with data (offsets) without another deploy cycle for each PNG (once manifest is wired).

---

## Phase 3 — Validation and hardening

**Goal:** Prevent regression.

| Step | Action |
|------|--------|
| 3.1 | Extend [`scripts/validate-sprite-layers.ts`](../../../scripts/validate-sprite-layers.ts) only if adding **machine-checkable** rules (e.g. min alpha coverage in lower third; optional, may be noisy). **Minimum:** keep existing 64×64 RGBA checks. |
| 3.2 | Document `npm run` or `npx tsx scripts/validate-sprite-layers.ts` in `docs/PORTRAIT_SPRITE_ANCHOR.md` as pre-PR checklist for artists. |
| 3.3 | Manual QA matrix: dashboard `Avatar`, `/character-creator`, `/hand`, campaign onboarding preview — 2–3 nation/archetype pairs + default. |
| 3.4 | If the repo uses screenshot tests, add one golden path for `Avatar` (optional). |

**Exit criteria:** CI still green; QA sign-off on listed surfaces.

---

## Phase 3b — Verification quest (UX certification)

**Goal:** Satisfy Spec Kit Translator requirement for **UX features**.

| Step | Action |
|------|--------|
| VQ.1 | Add Twine story `cert-paper-doll-coherence-v1` with passages matching spec steps (NOW → Vault → optional creator). |
| VQ.2 | Wire idempotent seed in `scripts/seed-cyoa-certification-quests.ts` (or dedicated script) + `package.json` script `seed:cert:paper-doll` (name TBD to match repo conventions). |
| VQ.3 | Frame copy toward **Bruised Banana / residency** readiness (coherent faces for guests). |

**Exit criteria:** Completing the quest in-app marks verification; documented in `tasks.md`.

---

## Phase 4 — ARDS alignment (dependency-aware)

**Goal:** Don’t fork coherence rules.

| Step | Action |
|------|--------|
| 4.1 | When [ARDS](../asset-register-design-system/spec.md) Portrait register lands, **move** offset schema / anchor doc pointers into that register or link bidirectionally. |
| 4.2 | Mark PDC tasks done in backlog; open follow-ups only for walkable-specific art if needed. |

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Offsets accumulate as permanent hacks | Time-box Phase 1 re-exports; manifest entries get `// TODO re-export` or ticket IDs. |
| `object-contain` + translate surprises on resize | Keep offsets in **px** inside fixed aspect container; `Avatar` sizes are discrete (`sm`/`md`/…). Test `lg` and `xl`. |
| Duplicated preview components diverge | Phase 2.4 shared helper or single component. |

---

## Rollout

- **No feature flag** if changes are data-driven offsets + docs (low user-visible risk).
- **Ship order:** Phase 0 doc → Phase 2 plumbing (offsets default 0) → Phase 1 art + manifest entries → Phase 3 QA.

---

## Related backlog

- **1.37 ARDS** — Portrait register; PDC feeds it.
- Prompts: `avatar-stacking-base-preview`, `avatar-gallery-preview-and-stacking` (superseded by PDC tasks where overlapping).
