# Spec: Push to Main and Vercel Deployment

## Purpose

Define the process for safely pushing today's changes to `main` and deploying to Vercel.

## Scope

- Pre-push automated checks (build, lint, loop:ready)
- Commit strategy (single vs. logical commits)
- Push to `main` and Vercel auto-deploy
- Post-deploy verification (build success, smoke, campaign Edit flow)

## Out of Scope

- Branch strategy (assumes direct push to main; no PR workflow specified)
- Staging environment (single production deploy)
- Database backup/restore procedures (covered elsewhere)

## Reference

- **Runbook:** [docs/DEPLOY_RUNBOOK.md](../../../docs/DEPLOY_RUNBOOK.md) — checklist entry point
- Plan: [plan.md](./plan.md)
- Tasks: [tasks.md](./tasks.md)
- Loop readiness: [docs/LOOP_READINESS_CHECKLIST.md](../../../docs/LOOP_READINESS_CHECKLIST.md)
- Env & Vercel: [docs/ENV_AND_VERCEL.md](../../../docs/ENV_AND_VERCEL.md)
