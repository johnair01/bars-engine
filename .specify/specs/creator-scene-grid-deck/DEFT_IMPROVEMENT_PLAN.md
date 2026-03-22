# Deft improvement plan: Scene Atlas (`/creator-scene-deck`)

**Status:** Planning artifact — binds product intent, UI authority, and agent analysis so the next implementation pass is **aimed**, not patchy.  
**Spec:** [spec.md](./spec.md) · **UI authority:** [Wiki UI Style Guide](/wiki/ui-style-guide) (in-app) · **Process:** [Deftness Development](../../../.agents/skills/deftness-development/SKILL.md)

---

## 1. Sage consult (bars-agents MCP) — synthesis

**Tool:** `sage_consult` on Scene Atlas gaps (off-brand UI, white/readability, hostile density, missing CYOA vs attach fork).

**(A) What’s wrong vs goals**

- Visual/interaction **misalignment** with BARS dark surfaces (wiki/dashboard calm).
- **Cognitive overload:** 13 micro-buttons per suit without progressive disclosure.
- **Product gap:** Card click jumps to **full Vault form** instead of a **guided** path that can **compose** a BAR (CYOA) or **attach** from vault/hand.

**(B) Priority user goals**

1. **Brand-consistent** shell (expectations match the rest of Conclave).
2. **Lower cognitive load** — fewer simultaneous choices; modular reveal.
3. **Progressive paths:** explicit choice → attach existing **or** guided creation (not one dumped form).

**(C) Design bridges (concrete)**

- **Layout:** Card-based, **expand-on-interaction** patterns (similar spirit to `/bars` list → detail), not 52 equal-weight tiles at once.
- **Typography & tone:** Dark, calm, concise copy; **guidance-first** language (Diplomat-safe).
- **Modals:** Style guide: **no long single-scroll modals** — use **steps/tabs** for “new BAR” flow.

**(D) Deftness / process artifact (reduce rework)**

- A **short style audit checklist** for this route (and future features): cross-check every new screen against [UI Style Guide](/wiki/ui-style-guide) *before* merge (uncluttered default, collapsible sections, modal rules). Optionally a verification quest or admin checklist row — *legible inside the game world* per deftness skill.

---

## 2. Repo design guide — non-negotiables for this page

From `src/app/wiki/ui-style-guide/page.tsx`:

| Principle | Application to Scene Atlas |
|-----------|------------------------------|
| **Uncluttered by default** | Do not show all 52 cells as primary affordances at full density. Prefer **suit sections collapsed** with counts, or **zoomed suit view**, or **focus row + horizontal rank strip**. |
| **Progressive disclosure** | Summary → expand card → **step 1: choose path** (Attach \| Guided new BAR). |
| **Lists** | Truncate titles; avoid infinite dense grids without grouping. |
| **Modals** | One modal; **wizard or tabs** inside for “new BAR”, not embedded full `CreateBarForm` scroll. |
| **Related** | Align copy with [Voice Style Guide](/wiki/voice-style-guide) where narrative. |

---

## 3. Product goals (page-level, ordered)

1. **Orient:** What is this deck, why 4 rows × 13, what happens when I tap (one sentence + link to wiki).
2. **Act on one cell:** Clear **two-option fork** — **Attach BAR** (from vault / hand per data model) **or** **Answer through a short CYOA** that **materializes** a BAR (then bind).
3. **See progress:** Filled vs empty, daily limit, axis labels — **scannable**, not wall of text.
4. **Trust / safety:** Private-by-default, consistent with spec P3.

---

## 4. Feature design: card click → two paths

| Path | Behavior | Notes |
|------|----------|--------|
| **A. Attach** | Picker of bindable BARs (today: vault); extend to **hand** if product defines hand as source of truth for “in play” BARs. | Keep **one screen**, minimal fields. |
| **B. Guided new BAR** | **Multi-step CYOA** (3–7 nodes): each answer appends to a **draft**; final step shows **composed title + description** + confirm → create + bind. | Do **not** expose full `CreateBarForm` until “advanced” or final polish step. Reuse patterns from [cyoa-modular-charge-authoring](../cyoa-modular-charge-authoring/spec.md) where applicable. |

**Contract (API-first):** Define `SceneAtlasDraft` (steps, answers, generated BAR fields) + server actions `saveDraft` / `commitBarFromDraft` / `bindBar` before rebuilding UI.

---

## 5. Visual / UX fixes (immediate, low ambiguity)

1. **Route shell:** Add `src/app/creator-scene-deck/layout.tsx` with `min-h-screen bg-black text-zinc-200` (same family as `/bars`, `/hand`) so the page never sits on **default white body**.
2. **Modal panel:** Ensure inner surfaces are `bg-zinc-950` / `border-zinc-800`; audit **native `<select>`** / focus rings on iOS (often render light).
3. **Density:** Per suit, default **collapsed** with “13 cards · N filled” and **expand**; or horizontal scroll **rank rail** with larger hit targets (min 44px).

---

## 6. Phased implementation (deft ordering)

| Phase | Outcome | Cuts rework because… |
|-------|---------|----------------------|
| **P0** | Layout + tokens + checklist doc link in UI footer | **Done** — `layout.tsx` canvas; `[slug]/page.tsx` footer → UI + Voice guides + wiki grid; `UI_STYLE_SELF_AUDIT_P0.md`; wiki Style Guide §Scene Atlas; modal `aria-labelledby`, backdrop + Escape close. |
| **P1** | Card modal **step 0:** two big choices (Attach \| Guided) + tertiary full vault; guided = 3 questions + review → `createCustomBar` | **Shipped** — see `SceneDeckCardPanel`, `SceneAtlasGuidedComposer`. |
| **P2** | Richer **CYOA** (branching, modular passages, export) per `cyoa-modular-charge-authoring` | **MVP shipped:** `SceneAtlasGuidedDraft` + `load/save` + 5 answer steps + review; clear on successful `createCustomBar` bind. Branching/modular IR still future per CYOA spec. |
| **P3** | Replace long modal scroll with **tabbed/wizard** new-BAR advanced | **Shipped** — Scene Atlas full vault: `CreateBarForm` Core/Layers/Advanced tabs when `sceneGridBind`; grid: **collapsible suit rows** (filled/total), **≥44px** cell targets, modal body scroll container. |
| **P4** | Optional: hand integration, draw metaphor (spec non-goal until P1–P3 stable) | Avoids conflating deck grid with hand mechanics. |

---

## 7. Composer / multi-model trust — working agreement

- **Before** generating UI for a new route: open **[UI Style Guide](/wiki/ui-style-guide)** and mirror **background, borders, spacing, modal rules** from `/bars` or `/wiki`.
- **After** implementation: run through **§2 table** in this doc (self-audit).
- **Spec kit:** Update [tasks.md](./tasks.md) from this plan; implementation follows tasks, not ad-hoc prompts.

---

## 8. References

- Sage consult output (summary): integrated in §1.
- Existing UI: `src/app/bars/page.tsx`, `src/app/hand/page.tsx`, `SceneDeckClient.tsx`, `SceneDeckCardPanel.tsx`, `CreateBarForm.tsx`.
- CYOA direction: `cyoa-modular-charge-authoring` spec.
