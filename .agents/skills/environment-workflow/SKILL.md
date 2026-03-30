---
name: environment-workflow
description: Branch context, DB switching, and the fail-fix workflow. Use when developing, testing, or modifying the Prisma schema.
---

# Skill: Environment Workflow

This skill combines the rules for fail-fix verification and branch context to ensure correct cross-platform development and testing.

## Database Management
- **Switch to local**: `npm run switch -- local`
- **Switch to Vercel**: `npm run switch -- vercel`
- **Start Postgres**: `make db-local`
- **Seed test data**: `make db-seed`

## Fail-Fix Workflow
When implementing features, refactors, or migrations:
1. **Verify before moving on**:
   - **Frontend**: `npm run build`, `npm run check` (Lint + type-check)
   - **Backend**: `cd backend && make check`, `make test-agents`
2. **Database Schema Changes**:
   - Run `npm run db:sync` after changing `prisma/schema.prisma` to regenerate Prisma Client.
   - **REQUIRED before commit**: `npx prisma migrate dev --name describe_change` creates migration SQL. Do not rely on `db push` for deployment.
3. **Stop and fix on failure**: Resolve any failed tests or builds before continuing implementation. Do not stack changes on broken code.

## Python Backend
- Check linting with `make check` inside `backend/`
- Make sure `backend/.venv` is activated: `cd backend && uv sync`
