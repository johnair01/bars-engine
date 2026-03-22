# Demo orientation preview (DOP)

Shareable **anonymous** orientation slices for marketing and demos.

- **Spec:** [.specify/specs/demo-orientation-preview/spec.md](../.specify/specs/demo-orientation-preview/spec.md)
- **Routes:** `/demo/orientation?t=<token>` or `/demo/orientation?s=<publicSlug>`
- **Seed (local):** `npm run seed:demo-orientation` — prints token + slug URLs.

Requires migration `20260318150000_demo_orientation_preview` and `DemoOrientationLink` rows. Production: `prisma migrate deploy`.

## Troubleshooting

- **Preview stops loading after a few steps (“Could not load this step”)** — Node fetches use `/api/adventures/{slug}/{nodeId}`. The Bruised Banana graph is only served when **`slug` is `bruised-banana`** (see `src/app/api/adventures/[slug]/[nodeId]/route.ts`). Demo resolution normalizes slug when `campaignRef` is `bruised-banana`; `npm run seed:demo-orientation` links the adventure with `slug: bruised-banana` when present.
