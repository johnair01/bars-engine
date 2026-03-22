# P0 self-audit: Scene Atlas vs [UI Style Guide](/wiki/ui-style-guide)

**Date:** 2026-03-21  
**Route:** `/creator-scene-deck/[slug]`  
**Authority:** `src/app/wiki/ui-style-guide/page.tsx`

## Checklist

| Style guide theme | Expectation | Scene Atlas status | Evidence / notes |
|-------------------|-------------|--------------------|------------------|
| **Uncluttered by default** | Calm, scannable | **Pass** | Collapsible suit rows with filled/total; orientation copy in a single card; grid hidden until row expanded. |
| **Progressive disclosure** | Summaries → expand | **Pass** | Suit headers; card modal step 0 (Attach / Guided / vault tertiary); guided = steps; vault = tabs when `sceneGridBind`. |
| **Vault-style counts** | Badges / collapsible sections | **Partial** | Counts on rows and header `filled / 52`; not identical to `/hand` “strip” pattern — acceptable for this surface. |
| **Lists / feeds** | Truncate, avoid infinite dense grid | **Pass** | `line-clamp-2` on cell titles; 52 cells only after per-row expand. |
| **Modals — no cascade** | One overlay at a time | **Pass** | Single dialog for cell flow. |
| **Modals — dense content** | Tabs / steps / accordions, not one long scroll | **Pass** | Path chooser + guided wizard + vault tabs (P3); attach form short. |
| **Canvas / tokens** | Dark surfaces, wiki-adjacent | **Pass** | `layout.tsx` `min-h-screen bg-black text-zinc-200`; panels `zinc-900`, borders `zinc-800`. |
| **Modal a11y** | Focusable, labeled, dismissible | **Pass (P0 pass)** | `aria-modal`, `aria-labelledby` → visible title `id`; backdrop click + Escape close. |

## Follow-ups (non-blocking)

- **P4 / hand:** Style guide “Vault depth” metaphor — optional link-out to `/hand` (DEFT P4).
- **Formal quest thread:** Phase 4 optional teach-all-players CYOA — separate spec.

## Sign-off

Audit performed against in-app UI Style Guide sections: *Uncluttered*, *Lists*, *Modals*. Scene Atlas is **aligned** for P0 with the items above verified in code.
