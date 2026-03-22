# Tasks: Push to Main and Vercel (EO)

Canonical checklist lives in **[docs/DEPLOY_RUNBOOK.md](../../../docs/DEPLOY_RUNBOOK.md)** (kept in sync with this spec).

- [x] Single entry doc (`docs/DEPLOY_RUNBOOK.md`) links to spec + `plan.md`
- [x] Pre-push commands documented (build, lint, smoke, loop:ready)
- [x] Post-deploy smoke list + link to loop readiness

---

**Operational use:** Run the deploy runbook before every `main` push; update `plan.md` only when the release process itself changes (e.g. new mandatory check).
