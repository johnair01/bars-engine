# Family Support Room release

This is the release procedure for the private `/ally/mom` family decision room.
Do not share a production URL until every check below is complete.

## 1. Link the intended Vercel project

From the Bars Engine checkout, run `npx vercel link --yes` only after confirming
the currently selected Vercel team and the correct Bars Engine project. Then
pull the project environment with `npx vercel env pull .env.local --yes`.

## 2. Set production environment values

Set these in the Vercel project for the intended environment(s):

- `DATABASE_URL`
- `FAMILY_ROOM_PASSWORD` — unique, long room passphrase
- `FAMILY_ROOM_SESSION_SECRET` — unique random server secret, distinct from the passphrase
- `FAMILY_ROOM_BLOB_READ_WRITE_TOKEN` — injected when connecting the private family-room Blob store
- `FAMILY_ROOM_BUDGET_BLOB_URL` — printed by the upload script in step 3; set it after uploading

Never put any of these in `NEXT_PUBLIC_*` variables or in the campaign copy.

## 3. Upload the approved workbook privately

With `FAMILY_ROOM_BLOB_READ_WRITE_TOKEN` available locally, upload the reviewed file:

```bash
node scripts/upload-family-budget.mjs \
  /Users/wendellbritt/Documents/Codex/2026-09-23/ok-i/outputs/90-day-parent-support-budget.xlsx
```

The script prints `FAMILY_ROOM_BUDGET_BLOB_URL=...`. Set that value in Vercel for
Production and Preview. The blob is private, so the URL does nothing without the
token, and the room serves the file only after the room passphrase. Do not place
the workbook in `public/` or send the URL to anyone.

## 4. Apply the migration and validate

```bash
npm run db:migrate:deploy
npm run release:family-room:check
npm run db:generate
npx tsc --noEmit --pretty false
npm run validate:routes
```

## 5. Deploy and test with two devices

Use a preview deployment first. On device A and B, use the shared passphrase
but different names. Verify:

1. Both can see decisions, line-item questions/answers, shared syntheses, and shared scenarios.
2. A’s private 3·2·1 answers are invisible to B; B’s are invisible to A.
3. A can share a selected synthesis without exposing source entries.
4. The workbook returns `401` without a room cookie and downloads inside the room.
5. One-week, one-month, 90-day, custom, and no-contribution decisions all save.
6. Volunteer CFO agreement records the $100 threshold and all five rights.

Only then promote the deployment or send the link to Mom and Stepdad.
