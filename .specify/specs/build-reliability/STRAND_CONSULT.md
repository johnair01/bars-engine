# Build reliability — After Action Report & Strand consult (6 Game Masters)

**Scope:** Persistent errors seen while shipping Events BAR / nested pre-production (Next 16 + Turbopack, Prisma, `'use server'`).  
**Live strand:** Run when the FastAPI backend is up and `OPENAI_API_KEY` is set:

```bash
npm run strand:consult:build-reliability
```

Live runs **write** `STRAND_CONSULT_LIVE.md` in this folder (this file stays the static AAR + desk strand).

**Implemented playbook:** `tasks.md`, `docs/BUILD_RELIABILITY.md`, `npm run verify:build-reliability`, `npm run check`, Husky, `.github/workflows/frontend-check.yml`.

---

## Part I — After Action Report (error inventory)

| # | What you saw | Likely root cause | Fix applied / workaround | Deeper signal? |
|---|----------------|-------------------|---------------------------|----------------|
| 1 | **Build:** `Export EventArtifactListItem doesn't exist in target module` (Turbopack, `bars/[id]/page` actions chunk) | Next treats **named exports** from `'use server'` files as **runtime** re-exports. `export type { X }` **erases** at compile — no JS binding — so the generated server-actions proxy points at nothing. | Stop re-exporting types from server action modules; import types from `src/lib/*-types.ts` (client-safe) only. | **Boundary rule:** *No type re-exports from `'use server'` files.* |
| 2 | **Prisma:** `This line is not a valid field or attribute definition` on `EventArtifact` | **Block comment** `/** ... */` between fields tripped Prisma’s parser (version-sensitive). | Use `//` line comments for field notes. | **Tooling contract:** run `npx prisma validate` (with `DATABASE_URL` via `npm run db:sync` / dotenv) after schema edits. |
| 3 | **Prisma:** `Type "NpcProfile" is neither a built-in type, nor refers to another model` | **Relation fields** on `Player` / `NpcConstitution` referenced a **missing model**; ANC tables not in migrations yet. | Remove dangling relations until ANC ships with model + migration together (or add full model + migration). | **Schema hygiene:** relations must be paired with models + migrations — treat orphan relations as merge-blocking. |
| 4 | **TypeScript:** `parentEventArtifactId` / `parentEvent` not on generated client types | **Prisma Client** out of date vs `schema.prisma` (generate not run, or validate failed before generate). | `npm run db:sync` or `npx prisma generate` after schema changes. | **CI / habit:** `generate` before `tsc` in one script; fail PR if schema changed but client stale. |
| 5 | **`/event` 500 / validation** (from earlier thread) | Mix of **Prisma input validation** vs **raw columns** (`instanceId` / new columns) when DB and client disagree. | Prefer `$queryRaw` for listing when types/columns are in flux; ensure migration applied locally. | **Layering:** when you add columns, **migrate + generate** in the same change set; avoid half-applied schema. |
| 6 | **db:sync:** “Skipping AUTO-PUSH” / prod vs local confusion | Safety guard when environment looks like production. | Use intentional local DB + `migrate dev` / `db push` per docs; don’t assume sync pushed. | **Environment clarity:** one command that prints *what* ran (push skipped vs applied). |

### Pattern summary (what’s “deeper”)

These are **not** random one-offs. They cluster around three **coupled boundaries**:

1. **Next App Router + Turbopack + `'use server'`** — export surface is not the same as a normal module; **types and values diverge**.
2. **Prisma** — schema is source of truth, but **parser rules + generate step + DB state** must stay a **single moving piece**.
3. **Incremental features** (ANC, nested events) — **partial schema** (relations without tables) creates **validation failures** that block *everything* downstream.

That is **handleable deftly** if you treat it as **infrastructure discipline**, not as “fix every bug at point of pain.”

---

## Part II — Strategy for emergent issues (operational)

1. **Pre-merge checklist (short)**  
   - [ ] `npm run check` (or at least `prisma generate && tsc --noEmit`)  
   - [ ] No `export type` / `export interface` from any file with `'use server'` (grep lint or rule)  
   - [ ] Schema change → migration file + `db:sync` on a dev DB  

2. **Typed surfaces**  
   - Shared DTOs / list types live in **`src/lib/*-types.ts`** (already used for `EventArtifactListItem`).  
   - Server actions export **functions only**.

3. **Prisma hygiene**  
   - After editing `schema.prisma`: validate with loaded env; avoid block comments **inside** `model { }` unless you’ve confirmed Prisma accepts them.  
   - Never merge **relation fields** without the target **model + migration** (or feature flag the whole ANC block).

4. **CI signal (when ready)**  
   - Job: `prisma generate && npm run build:type-check` on PRs.  
   - Optional: eslint rule or script banning `export type` from `src/actions/**/*.ts` with `'use server'`.

5. **When errors repeat**  
   Ask: *Which boundary failed?* (Next server boundary / Prisma / DB / auth). Answer points to the fix class, not a line-number whack-a-mole.

---

## Part III — Strand consult: all 6 Game Masters (desk synthesis)

*Desk strand = structured advice in each face’s job without waiting on HTTP. Add `npm run strand:consult:build-reliability` for LLM-backed runs that merge these voices with live reasoning.*

### Architect (structure, schemas, API)

Treat **server action modules as ABI surfaces**: exports should be **async functions** with serializable args/returns only. Types cross the boundary via **parallel import paths** (`import type` from neutral modules), not re-exports. For Prisma, **one schema graph per migration era** — incomplete subgraphs (NpcProfile) belong behind a feature branch until the **full vertical slice** (model + FK + migration) lands. **Generative move:** a single `src/lib/server-action-policy.md` + lint script eliminates class (1) permanently.

### Regent (order, governance, risk)

**Governance rule:** “Schema merged = DB migratable + client generated + `check` green.” Partial ANC is **out of order** and correctly blocked the pipeline — that’s healthy. For production DB safety, **explicit** logging when push is skipped prevents “I thought sync meant sync.” Order of operations for any feature: **migration → generate → types → UI**.

### Challenger (boundaries, skepticism)

Not every friction is a bug. Turbopack catching the missing export is **doing its job** — the bug was **assuming** TypeScript exports and runtime exports are the same on server chunks. Challenge: don’t add **more** clever re-exports; simplify export lists. Also challenge **scope creep**: if ANC isn’t shipping, **delete the dangling relations** rather than carrying speculative schema in `main`.

### Diplomat (trust, bridging, communication)

For **collaborators and future you**, document in one visible place: *“Types for shared shapes: `@/lib/…-types`; never from `@/actions`.”* Reduces blame between “frontend broke” vs “backend actions broke” when the real issue is **bundler + types**. For community-facing copy, optional: link from `docs/DEVELOPER_ONBOARDING.md` to this spec.

### Shaman (threshold, invitation, emotion)

Recurring build failures read as **ambient anxiety** on the team: “shipping hurts.” The emotional win is **small repeatable rituals** (`check` before push, one doc) so the threshold to “green main” feels **held**, not chaotic. Metabolize the friction as a **Roadblock Quest** (Clean Up → Grow Up): Clean Up = lint rule + types file; Grow Up = CI; Show Up = predictable releases.

### Sage (integration, synthesis)

**Verdict:** The persistence **is** a signal — of **stack coupling**, not of a doomed architecture. The deft response is **concentrated policy** at three seams (server actions, Prisma lifecycle, feature completeness), not endless local fixes. Integrate **technical** (export rules, generate, migrate) with **social** (checklist, onboarding sentence) so humans and agents don’t reintroduce the same class of error.

**Unified recommendation (one line):**  
*Keep types and server actions physically separate; keep schema, migrations, and generate in one ritual; don’t merge relations without their tables.*

---

## Part IV — Live vs desk

| Mode | When | Output |
|------|------|--------|
| **Desk** (this doc, Part III) | Immediately, offline | Fixed in repo; aligns team lore |
| **Live** (`strand:consult:build-reliability`) | Backend + API key | `STRAND_CONSULT_LIVE.md` — richer, task-specific reasoning |

If live output is shallow, see `docs/AGENT_WORKFLOWS.md` — `OPENAI_API_KEY` must load in the **backend** environment.
