# Prompt: Prisma Migrate Deploy — Graceful When DATABASE_URL Missing

**Use this prompt when fixing the `npm run build` failure due to missing DATABASE_URL.**

## Prompt text

> Implement the spec in [.specify/specs/prisma-migrate-deploy-database-url/spec.md](../specs/prisma-migrate-deploy-database-url/spec.md): when DATABASE_URL is not set, `npm run build` should skip `prisma migrate deploy` and still run `prisma generate && next build`, printing a clear warning. When DATABASE_URL is set, run `prisma migrate deploy && next build` as today. Create `scripts/build-with-migrate.ts`; update package.json build script; update docs/ENV_AND_VERCEL.md. Run build and check to verify.

## Checklist

1. Create scripts/build-with-migrate.ts (load .env, .env.local; conditional migrate; exec next build)
2. Update package.json "build" script
3. Update docs/ENV_AND_VERCEL.md with build-without-DATABASE_URL note
4. Verify: DATABASE_URL unset → build succeeds, warning printed
5. Verify: DATABASE_URL set → migrate deploy then next build

## Reference

- Spec: [.specify/specs/prisma-migrate-deploy-database-url/spec.md](../specs/prisma-migrate-deploy-database-url/spec.md)
- Plan: [.specify/specs/prisma-migrate-deploy-database-url/plan.md](../specs/prisma-migrate-deploy-database-url/plan.md)
