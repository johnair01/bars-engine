# Deftness Development — Reference

Progressive disclosure for the [Deftness Development](SKILL.md) skill. Read when implementing features with scaling risk or API design questions.

## Spec Checklist (Before Implementation)

When drafting or reviewing specs for persistence, UI, or API features:

- [ ] **API Contracts** section exists — define input/output shape before FRs
- [ ] **Route vs Action** documented — Route Handler (external) or Server Action (internal)
- [ ] **Practice: Deftness Development** (when applicable) — spec kit first, API-first, deterministic over AI
- [ ] **Scaling checklist** (when AI, upload, filesystem) — reference Full Scaling Checklist below

Template: [.specify/spec-template.md](../../../../.specify/spec-template.md)

**Ontology (product)**: Integral theory—holocratic stewardship, generative movement, effective composting, tight UI-to-component loops.

**Ontology (development, BARs codebase)**: Deftness = ship more complexity per token by cutting **rework tax**—one-shot slices, then **choose aligned options** and **integrate one path**; when the foundation mismatches shifted ontology, prefer **replace/rebuild of the thin slice** over layered renovation. Spec kit bounds first implementation so it is not load-bearing wrong work.

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

## Yellow Brick Road Lens

The Yellow Brick Road is a meta-metaphor that unifies the game's mechanics into a single navigable image. Use it when translating context between frameworks.

| YBR Element | Maps To | Translation |
|-------------|---------|-------------|
| The Road | Quest arc (Epiphany Bridge or Kotter) | Each quest is a stretch of road from Point A to Point B |
| Yellow Bricks | BARs (kernels) | Seeds with provenance, metabolized and paved into road |
| The Vehicle | Bars-Engine | Carries individuals and groups; powered by alchemy |
| Fuel | Vibeulons | Energy generated by transmuting blockers into bricks |
| Blockers → Bricks | Emotional Alchemy (fromState → toState) | Dissatisfied state becomes satisfied state through transmutation |
| Speed Limit | Clean Up move throughput | Can only move as fast as blockers are metabolized |
| Forking Road | BAR forking / divergence | No wrong turns — wherever it leads is where you want to go |

**Cross-metaphor translation examples:**

- Kotter Stage 5 (Obstacles) → blockers on the road; Stage 6 (Wins) → bricks laid
- 321 Shadow Process → Phase 3 prospects raw material, Phase 2 breaks it down, Phase 1 fires the brick
- Roadblock Metabolism → the vehicle's maintenance cycle; blockers processed before they reach the shared road
- Wake Up → see the road; Clean Up → make bricks; Grow Up → upgrade the vehicle; Show Up → travel

When generating specs, quest prose, or design docs, prefer the metaphor that makes the current context most legible. The deftness is in moving fluently between them.

## Quest Grammar Patterns

| Pattern | Use | Avoid |
|---------|-----|-------|
| **Action node** | `isActionNode` + `actionType` — campaign-agnostic commitment moment | `isDonationNode` — donation is one specific action |
| **Campaign mapping** | `campaignId` → `actionType` (bruised-banana → donation, onboarding → signup) | Hardcoding donation-only logic |
| **Spec** | [quest-grammar-action-node](../../.specify/specs/quest-grammar-action-node/spec.md) | |

---

## Generative Dependency Checklist

When organizing backlog or proposing a new spec, ask:

- [ ] **Merge check**: Can this item absorb one or more other Ready items? (e.g. AG merged AF + AC)
- [ ] **Supersession check**: Does solving this make other items obsolete? Document "Supersedes: X, Y" in spec or BACKLOG.
- [ ] **Foundation check**: Does this unlock many downstream items? Prioritize it.
- [ ] **Testable artifact**: Can we verify the generative relationship? (e.g. after X is done, Y and Z are marked superseded)
- [ ] **Backlog update**: When a generative item is done, update BACKLOG.md to mark superseded items and remove redundant work.

**Testable artifacts** for generative dependencies:
- A short analysis file or spec section listing: items merged, items superseded, items that become trivial
- BACKLOG.md status changes (Superseded by X) that can be verified
- Post-implementation check: the listed items are indeed obsolete or removed

**Historical examples** (from BACKLOG.md):
- AG superseded AF, AC
- FF (Fundraiser Landing Refactor) superseded T
- CQ (Quest Grammar Action Node): one schema change unlocked Campaign Quality Automation
