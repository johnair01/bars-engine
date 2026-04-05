# Self-Healing Pages: GM Face Framework

A diagnostic and healing process for broken pages, guided by the **Six Game Master Faces**. No MCP required—runs entirely in Cursor via scripts and agent prompts.

---

## The Six GM Faces (Canonical)

The only faces of the Game Master. **Canonical source: this codebase only.** Reference: [.agent/context/game-master-sects.md](../.agent/context/game-master-sects.md), [src/lib/quest-grammar/types.ts](../src/lib/quest-grammar/types.ts)

| Face | Role | Mission | Healing Lens |
|------|------|---------|--------------|
| **Shaman** | Mythic threshold | Belonging, ritual space, bridge between worlds | Does this page belong? Is the entity in the right place? Correct slug/ID? |
| **Challenger** | Proving ground | Action, edge, lever | Is the page actionable? Clear next step? Auth boundary clear? |
| **Regent** | Order, structure | Roles, rules, collective tool | Schema correct? Roles/permissions? Rules enforced? |
| **Architect** | Blueprint | Strategy, project, advantage | Query optimized? Systems coherent? Error handled? |
| **Diplomat** | Weave | Relational field, care, connector | Who can access? Auth flow correct? Connection between user and page? |
| **Sage** | Whole | Integration, emergence, flow | Does the whole cohere? Failure traceable? Lineage preserved? |

---

## Failure → GM Face Routing

| Failure Type | Primary Face | Secondary | Healing Actions |
|--------------|-------------|-----------|-----------------|
| **404** | Shaman | Sage | Check entity exists; verify slug/ID mapping; add `notFound()` fallback |
| **500** | Architect | Regent | Schema sync; wrap in try/catch; add error boundary |
| **Timeout** | Architect | Challenger | Optimize query; add index; add loading/Suspense |
| **307** (auth redirect) | Diplomat | Regent | Confirm auth required; consider public fallback |
| **Connection refused** | Architect | Regent | Dev server down; DB unreachable |

---

## Self-Healing Workflow

### 1. Run Audit

```bash
npm run audit:pages -- --output audit-report.json
```

### 2. Run Self-Heal (GM Face Recommendations)

```bash
npm run heal:pages -- audit-report.json
```

This produces a **healing report** with:
- Each broken/timeout page
- Primary and secondary GM faces
- Recommended actions per face
- Face-specific questions

### 3. Agent Fix Loop

For each item in the healing report:

1. **Shaman**: Verify entity names, slugs, IDs; fix `notFound()` usage
2. **Architect**: Run `npm run db:sync`; add error handling; optimize queries
3. **Challenger**: Add loading states, Suspense; ensure actionable next step
4. **Regent**: Ensure roles/rules correct; no sensitive data in error responses
5. **Diplomat**: Verify auth flow; who can access
6. **Sage**: Add logging, ensure lineage is preserved

### 4. Re-Audit

```bash
npm run audit:pages
```

---

## Common Healing Patterns

### 404 — Entity Not Found

**Shaman**: Is `[slug]` in `VALID_SLUGS`? Is `[id]` a valid entity type? Does it belong?
**Sage**: Is the entity part of the whole? Is the route coherent?
**Heal**: Add `if (!entity) notFound()` before render.

### 500 — Server Error

**Architect**: Schema drift? Run `npm run db:sync`. Unhandled exception? Wrap in try/catch.
**Regent**: Ensure error page doesn't leak stack traces or internal IDs.
**Heal**: Add error boundary; return generic error UI.

### Timeout

**Architect**: N+1? Add `include`; add DB index. Heavy computation? Move to background.
**Challenger**: Show skeleton/loading immediately; don't block action.
**Heal**: Add `loading.tsx`; use `Suspense`; optimize server component data fetch.

### 307 — Auth Redirect

**Diplomat**: Expected for `/admin/*`, `/dashboard`, `/conclave`. Consider a "Preview" or public teaser.
**Regent**: Admin routes must stay protected.
**Heal**: No change if intentional; document as "auth required."

---

## Doctrine Principles (Healing Constraints)

1. **Shadow work should lead to play** — Fixes should unblock the player, not add bureaucracy.
2. **Preserve provenance** — Log what failed and why; don't swallow errors silently.
3. **Extend ontology before inventing** — Reuse existing models/types; avoid parallel structures.
4. **Route charge into action** — Errors should guide the user to a next step, not dead-end.
5. **Deftness matters** — Quality of the fix is part of gameplay; avoid quick hacks that create tech debt.

---

## Quick Reference: GM Face Checklist

When fixing a broken page, ask:

- [ ] **Shaman**: Names and slugs correct? Entity belongs? Bridge between worlds intact?
- [ ] **Challenger**: Page actionable? Clear next step? Auth boundary clear?
- [ ] **Regent**: Schema synced? Roles/rules correct? No data leakage?
- [ ] **Architect**: Query optimized? Error handled? Systems coherent?
- [ ] **Diplomat**: Who can access? Auth flow correct?
- [ ] **Sage**: Logged? Traceable? Coherent with whole?
