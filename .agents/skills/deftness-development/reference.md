# Deftness Development — Reference

Progressive disclosure for the [Deftness Development](SKILL.md) skill. Read when implementing features with scaling risk or API design questions.

**Ontology**: Integral theory—holocratic stewardship of the ecosystem, generative and productive movement, effective composting (reuse patterns, retire obsolete paths), tight UI-to-component loops.

**Vibes layer**: The I Ching (hexagram system, cast-iching, quest gen) is a built-in vibes layer—emergent wisdom of the sage is included without spending additional energy to weave it in. Leverage it.

**Process artifacts**: Whenever possible, build artifacts that the user can interface with inside the game world—verification quests, campaign metadata, in-game logs—to document the process for future analysis. Prefer in-game legibility over external docs alone.

**Thesis**: Gamification increases deftness in RPG game development and production software. Bruised Banana exemplifies this: the Six Faces of the Game Master surface in campaign content so the game creates itself. **Inspirations**: McGonigal, Yu-Kai Chou, Carse (gamification theory); Stardew Valley, Wikipedia game, RPG Maker, Minecraft (user-created content via game interfaces that metabolize inspiration). The vibes must flow.

## Full Scaling Checklist

| Touchpoint | Risk | Mitigation | Example |
|------------|------|------------|---------|
| **Filesystem** | ENOENT on Vercel (read-only) | Use Blob/S3 for uploads; `content/` at build time only | [book-upload-vercel-enoent](../../.specify/specs/book-upload-vercel-enoent/spec.md) — Vercel Blob instead of `public/uploads` |
| **AI calls** | Rate limits, token cost | Use `generateObjectWithCache`; env for model; feature flags | [ai-with-cache](../../src/lib/ai-with-cache.ts), `BOOK_ANALYSIS_MODEL` |
| **Request body** | 4.5 MB Vercel limit, 1 MB Next default | `serverActions.bodySizeLimit`; client upload for large files | [book-upload-unexpected-response](../../.specify/specs/book-upload-unexpected-response/spec.md) — 20mb limit |
| **Env** | Missing in deploy | Document in spec; add to `docs/ENV_AND_VERCEL.md` | `BLOB_READ_WRITE_TOKEN`, `OPENAI_API_KEY` |
| **DB** | Migrations out of sync | Run `npm run db:sync` after schema changes | `.cursorrules` enforces this |

## Route vs Action Decision Tree

```
Need to expose data or behavior?
├── External consumer (webhook, mobile, third-party)?
│   └── Route Handler: src/app/api/[path]/route.ts
│       - GET/POST: NextResponse.json()
│       - Document in API docs if public
├── Form submission or React useTransition?
│   └── Server Action: src/actions/[name].ts
│       - 'use server' at top
│       - Return { success, error, data }
└── Both?
    └── Route Handler calls Server Action (e.g. /api/library/requests → submitLibraryRequest)
```

## Env Vars to Document

When adding features that require env:

1. Add to spec's "Environment variables" or "Prerequisites" section
2. Add to `docs/ENV_AND_VERCEL.md` if deploy-critical
3. Document default and purpose

| Feature | Env | Purpose |
|---------|-----|---------|
| AI | `OPENAI_API_KEY` | Required for book analysis, quest gen |
| AI | `BOOK_ANALYSIS_MODEL` | Override model (default gpt-4o-mini) |
| AI | `QUEST_GEN_MODEL` | Override model (default gpt-4o) |
| AI | `*_AI_ENABLED` | Feature flags for graceful degradation |
| Upload | `BLOB_READ_WRITE_TOKEN` | Vercel Blob for PDF uploads |

## Code Patterns

**Prefer existing libs:**
- `generateObjectWithCache` from `src/lib/ai-with-cache.ts` for AI calls
- `getOpenAI` from `src/lib/openai.ts`

**Avoid:**
- `writeFile`/`mkdir` to `public/` in serverless (Vercel)
- Direct `generateObject` without cache for repeated inputs
- Hardcoded model IDs; use env
