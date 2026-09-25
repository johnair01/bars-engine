# Tasks: Chapter One Lead Gen V1

- [x] Create focused spec kit.
- [x] Create Claude/design handoff for Chapter 1 lead magnet.
- [x] Add shared Chapter 1 lead constants.
- [x] Replace missing PDF link with live read route.
- [x] Add public read route.
- [x] Add admin lead review/export page.
- [x] Run focused validation and update this checklist.

## Validation Notes

- `npm run validate:launch-funnel` passes after refreshing current Library source hashes.
- `npm run validate:routes` passes with existing warnings.
- `npm run verify:server-action-types` passes.
- `npm run build:type-check -- --pretty false` passes after regenerating Prisma Client.
- `npm run test:chapter-one-lead` passes.
- `npm run test:chapter-one-lead:db` passes after `npx vercel link --yes --project bars-engine` and `npx vercel env pull .env.local --yes`; it creates and deletes a Chapter 1 lead row.
- Local dev server returned `200 OK` for `/mastering-allyship/chapter-1` and `/mastering-allyship/chapter-1/read` while logged out.
