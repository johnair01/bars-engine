---
description: Standard protocol for introducing new features
---

# Feature Introduction Protocol

Standard flow for any new feature work.

## Steps

1. **Request** → User describes need
2. **Plan** → Create `implementation_plan.md`
3. **Review** → User approves plan
4. **Track** → Update `task.md` with slices
5. **Execute** → Implement slices
6. **Verify** → Run `validate-release.ts`
7. **Deploy** → Commit + push (triggers Vercel)
8. **Confirm** → Browser verification of deployed site
9. **Document** → Update `walkthrough.md`

## Guardrails

- Apply compute guardrails (max 2 browser retries)
- If stuck > 3 iterations, escalate to user
- Deploy before testing production features

## Quick Reference

```bash
# Validate locally
npx tsx scripts/validate-release.ts

# Deploy
git add -A && git commit -m "feat: ..." && git push origin main

# Verify deployment
curl -I https://bars-engine.vercel.app/
```
