---
name: deftness-development
description: Applies spec kit discipline, API-first design, and scaling robustness during implementation. Includes generative dependencies—organizing backlog so solving one item eliminates the need for others. Ontology: integral theory—holocratic stewardship, generative movement, effective composting, tight UI-to-component loops. Vibes layer: I Ching wisdom included without extra energy to weave in. Thesis: gamification increases deftness in RPG dev/production software. Builds in-game artifacts (e.g. Bruised Banana + Six Faces) so the game creates the game. Use when building features with persistence, UI, or external surface; when adding uploads, AI, or large payloads; when organizing backlog; or when the user mentions spec kit, API-first, scaling, token efficiency, deftness, or generative dependencies.
---

# Skill: Deftness Development

Teaches the agent to apply spec kit discipline, API-first design, and scaling robustness during implementation—reducing tokens, time-to-implement, and time-to-test.

## Ontology

Deftness relies on **integral theory** as its ontological foundation. This level stewards an ecosystem in a holocratic way: it moves generatively and productively, composts itself effectively (reusing patterns, retiring obsolete paths), and produces tight UI-to-component loops. The skill encodes that stance—intentional, adaptive, ecosystem-aware—into implementation discipline.

**Vibes layer**: Deftness uses the wisdom of the **I Ching** as a built-in vibes layer—the emergent wisdom of the sage is included in the game without spending additional energy to weave it in. The hexagram system (quest gen, cast-iching) carries that wisdom; leverage it rather than re-implementing.

## Process Artifacts

Whenever possible, build an artifact that can be interfaced with the user **inside the game world** to document the process for future analysis. Examples: verification quests, campaign metadata, logs surfaced in the UI, or other in-game surfaces that capture how decisions were made and outcomes flowed. Prefer artifacts the user can see and interact with over external docs alone—so the process becomes legible within the game.

**Example**: The Bruised Banana residency campaign references the Six Faces of the Game Master when developing content—people see how the game is being used to create the game. The thesis: gamification can increase deftness in RPG game development and production software. Inspirations: Jane McGonigal, Yu-Kai Chou, James P. Carse (gamification); Stardew Valley, Wikipedia game, RPG Maker, Minecraft (products that let users create high-quality content via game interfaces that metabolize inspiration). The vibes must flow.

## When to Use

- Building features with persistence, UI, or external API surface
- Adding uploads, AI calls, or large request payloads
- User mentions: spec kit, API-first, scaling, token efficiency, deftness, generative dependencies, backlog organization
- Before implementing when a backlog prompt or spec exists

## Spec Kit First

- **Rule**: For any feature with persistence, UI, or external surface, create or reference a spec before implementing.
- **Shortcut**: If a backlog prompt or spec exists at `.specify/specs/` or `.specify/backlog/prompts/`, implement from it. Do not improvise.
- **Token economy**: Link to existing spec with `[spec](path)`; do not re-explain content.
- **Authority**: Spec Kit is implementation authority. See [Spec Kit Translator](../spec-kit-translator/SKILL.md).

## API-First Development

- **Contract before UI**: Define data shape and route/action signature before building UI that consumes it.
- **Route vs Action**:
  | Use | When | Response |
  |-----|------|----------|
  | **Route Handler** (`/api/*`) | External consumers, webhooks, non-React callers | `NextResponse.json()` |
  | **Server Action** | Form submissions, React `useTransition`, internal flows | `{ success, error, data }` |
- **Documentation**: When adding a new endpoint, document method, path, request body shape, and response shape in plan or spec. Add to `docs/` if public API.

## Scaling Robustness Checklist

Before implementing features that touch these areas, check and mitigate:

| Touchpoint | Risk | Mitigation |
|------------|------|------------|
| **Filesystem** | ENOENT on Vercel (read-only) | Use Blob/S3 for uploads; `content/` at build time only |
| **AI calls** | Rate limits, token cost | Use `generateObjectWithCache`; env for model; feature flags |
| **Request body** | 4.5 MB Vercel limit, 1 MB Next default | `serverActions.bodySizeLimit`; client upload for large files |
| **Env** | Missing in deploy | Document in spec; add to `docs/ENV_AND_VERCEL.md` |
| **DB** | Migrations out of sync | Run `npm run db:sync` after schema changes (per .cursorrules) |

**Rule**: When adding upload, AI, or large-payload features, check this table. Create spec kit if scaling risk is unaddressed.

See [reference.md](reference.md) for full checklist and code examples.

## Token and Time Economy

- **Specs**: Concise FRs; link to existing patterns. Avoid duplicating Spec Kit Translator content.
- **Implementation**: Prefer existing libs (`ai-with-cache`, `getOpenAI`); do not reimplement.
- **Verification**: Run `npm run build` or `npm run check` before declaring done; fail-fix applies per [fail-fix-workflow](../../.cursor/rules/fail-fix-workflow.mdc).
- **Tests**: Add verification steps to tasks.md; run relevant `npm run test:*` when available.

## Scaling Doesn't Break Things

- **Deterministic over AI**: Use rules, regex, or cached responses when possible. See [ai-deftness-token-strategy](.specify/specs/ai-deftness-token-strategy/spec.md).
- **Graceful degradation**: Feature flags (`*_AI_ENABLED`), env-based model selection. Return clear errors when disabled.
- **Observability**: Log `chunksSkipped`, `cacheHits`, `cacheMisses` in metadata for debugging.

## Generative Dependencies and Backlog Organization

**Generative dependency**: Solving one item eliminates or reduces the need for others. This is the opposite of a blocking dependency (A depends on B). A generative item, when done, makes other items obsolete, trivial, or redundant.

**Deftness goal**: Organize backlog so that solving one item eliminates the need for others. Increase deftness = learn to identify and prioritize generative items.

### How to Find Generative Items

1. **Merge candidates**: Two or more items address overlapping concerns. One spec can merge them (e.g. AG merged AF + AC).
2. **Foundation items**: Items that unlock many downstream items (e.g. BY Quest Grammar unlocks CX, CD, CR, DF, DE).
3. **Supersession patterns**: Items marked "Superseded by X" — the superseding item was generative.
4. **Schema/API contracts**: One schema change or API contract that propagates across many features; doing it right eliminates rework.

### Testable Artifacts for Generative Dependencies

When organizing backlog or proposing a generative item:

- **Generate**: A short analysis (e.g. `.specify/backlog/GENERATIVE_ANALYSIS.md` or inline in spec) that lists:
  - Items that could be merged or superseded by solving X
  - Items that become trivial when X is done
  - Items that become obsolete when X is done
- **Test**: The analysis is testable — after implementing X, verify the listed items are indeed marked obsolete or removed from backlog.
- **Artifact**: Document the generative relationship in the spec or in BACKLOG.md (e.g. "Supersedes: AF, AC" or "Solves: X, Y; Z becomes trivial").

### Example

AG (Lore Index + Event-Driven CYOA Onboarding) was generative: it superseded AF (Lore Index) and AC (Event-Driven CYOA). One item solved two. A testable artifact: BACKLOG.md lists AF and AC as "Superseded by AG". Verifying: both are marked; no separate work remains.

See [reference.md](reference.md) for the Generative Dependency Checklist.

## Integration

- **Spec Kit Translator**: Creates specs; Deftness applies them during implementation.
- **Roadblock Metabolism**: Fixes build/type errors; Deftness prevents scaling regressions at design time.
- **Fail-Fix Workflow**: Verify before moving on; Deftness adds design-time checks.
