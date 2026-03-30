# Database strategy — migrations only

**`prisma db push` is forbidden** for humans and for automated agents. It bypasses `prisma/migrations`, causes drift, and has caused production incidents. See [PRISMA_MIGRATE_STRATEGY.md](PRISMA_MIGRATE_STRATEGY.md).

## TL;DR

| Context | Use |
|---------|-----|
| **Production / Vercel build** | `prisma migrate deploy` (build runs this when `DATABASE_URL` is set) |
| **Local — apply migrations from main** | `npx tsx scripts/with-env.ts "npx prisma migrate deploy"` |
| **Local — you changed `schema.prisma`** | `npx prisma migrate dev --name describe_change` → commit migration SQL → `migrate deploy` → `npm run db:record-schema-hash` |
| **After schema change** | `npm run db:sync` (generates client; **does not** push schema) or `npm run db:generate` |

**Never** run `npx prisma db push` or `npm run db:push` (script exits with a hard error).

## When schema changes

1. Edit `prisma/schema.prisma`.
2. `npx prisma migrate dev --name describe_change` — creates migration folder.
3. Commit `schema.prisma` + `prisma/migrations/...` together.
4. Apply locally: `npx tsx scripts/with-env.ts "npx prisma migrate deploy"`.
5. `npm run db:record-schema-hash` — updates `.prisma_hash` so `npm run db:sync` stops erroring.

## Failed migrations (P3009)

See [ENV_AND_VERCEL.md](ENV_AND_VERCEL.md) and [PRISMA_MIGRATE_STRATEGY.md](PRISMA_MIGRATE_STRATEGY.md).

## References

- [ENV_AND_VERCEL.md](ENV_AND_VERCEL.md)
- [PRISMA_MIGRATE_STRATEGY.md](PRISMA_MIGRATE_STRATEGY.md)
