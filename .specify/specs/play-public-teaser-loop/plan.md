# Plan: Public teaser — `/play` loop

**Spec:** [spec.md](./spec.md) · **Tasks:** [tasks.md](./tasks.md)

## Approach

1. **Single route** `src/app/play/page.tsx`: branch on `getCurrentPlayer()`.
2. **Extract** signed-in markup into a small server component or inline block to avoid duplication — e.g. `PlayLoopSignedIn` vs `PlayLoopPublicTeaser` in `src/components/play/` (new folder) or colocated `PlayTeaser.tsx`.
3. **Public teaser**: static copy + `Link` to `/login?callbackUrl=...` for each step; optional secondary **“Explore Conclave”** → `/conclave` or `/conclave/guided` (pick one primary; see below).

## Join vs login (product default for v1)

- **Recommendation:** Primary = **`/login?callbackUrl=/capture`** for “try charge”; secondary line **“New here?”** → **`/conclave/guided`** (or `/conclave` if softer). Adjust in implementation if PM prefers `/campaign` entry.

## File impacts (expected)

| Area | Files |
|------|--------|
| Play route | `src/app/play/page.tsx` |
| Optional split | `src/components/play/PlayLoopSignedIn.tsx`, `PlayLoopPublicTeaser.tsx` |

## Risks

- **SEO/crawlers** hitting `/play` — public page is fine; no secrets.
- **Callback URL** open redirect — use **path-only** allowed list or Next-safe patterns already used elsewhere; mirror `login` callback handling from existing links.

## Implementation rule

Ship per [tasks.md](./tasks.md) in order.
