# Deploy runbook (main → Vercel)

**Spec:** [.specify/specs/push-to-main-vercel-deploy/spec.md](../.specify/specs/push-to-main-vercel-deploy/spec.md) · **Detailed plan:** [.specify/specs/push-to-main-vercel-deploy/plan.md](../.specify/specs/push-to-main-vercel-deploy/plan.md)

Use this as the **single entry point** before pushing to `main`. The plan file has commit examples and rollback; this page is the ordered checklist.

---

## 1. Automated gates (local)

Run in order:

```bash
npm run build
npm run build:type-check
npm run lint
npm run smoke
```

Full loop (includes DB history + feedback-cap test):

```bash
DATABASE_URL="<from .env.local>" npm run loop:ready
```

Quick loop (when `build` already passed):

```bash
DATABASE_URL="<from .env.local>" npm run loop:ready:quick
```

---

## 2. Schema / migrations

- Any change to `prisma/schema.prisma` must have a migration under `prisma/migrations/` for production (`prisma migrate deploy` on Vercel).
- Local iteration: `npm run db:sync` after schema edits (per project rules).

---

## 3. Environment (Vercel)

- `DATABASE_URL` (production Postgres)
- `OPENAI_API_KEY` if AI / agents / strand features are required in prod
- See [ENV_AND_VERCEL.md](./ENV_AND_VERCEL.md)

---

## 4. Push

```bash
git branch --show-current   # expect: main
git status --short
git push origin main
```

Watch [Vercel Dashboard](https://vercel.com/dashboard) → project → Deployments until **Ready**.

---

## 5. Post-deploy smoke (production URL)

```bash
npm run preview:link   # if configured
```

Manual:

- [ ] Home loads
- [ ] `/login` loads
- [ ] `/campaign?ref=bruised-banana` loads
- [ ] Sign-in works
- [ ] Quest completion updates wallet (see [LOOP_READINESS_CHECKLIST.md](./LOOP_READINESS_CHECKLIST.md))

---

## 6. References

- [LOOP_READINESS_CHECKLIST.md](./LOOP_READINESS_CHECKLIST.md) — core player loop
- [ENV_AND_VERCEL.md](./ENV_AND_VERCEL.md) — env and linking
