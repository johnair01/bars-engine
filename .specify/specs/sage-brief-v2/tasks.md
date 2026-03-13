# Tasks: Sage Brief v2

## Phase 1: Structured context compiler

- [ ] Define `OpenItem` and `BriefContext` interfaces in sage-brief.ts
- [ ] Implement `getCommitsAheadOfMain()` — `git rev-list origin/main..HEAD --count`, fallback 0
- [ ] Implement `getBuildStatus()` — check `.next/BUILD_ID` mtime; `passing` if < 10 min, else `unknown`
- [ ] Implement `getSchemaDirty()` — `git diff --name-only HEAD -- prisma/` non-empty
- [ ] Implement `parseBacklogItems()` — read `items.json` if present, else parse BACKLOG.md `[ ] Ready` rows into `OpenItem[]`
- [ ] Implement `getRecentlyCompleted()` — BACKLOG.md `[x] Done` rows whose ID appears in recent commit messages
- [ ] Replace `getOpenBacklogItems()` and `getGitContext()` with `compileContext()` returning `BriefContext`

## Phase 2: Structured prompt builder

- [ ] Rewrite `buildPrompt(ctx: BriefContext)` using the structured contract from spec
- [ ] Include explicit WAVE move constraint in prompt
- [ ] Include explicit output section format instruction (`## Do Next`, `## Why`, `## Watch Out`, `## Hexagram Note`)
- [ ] Append `--question` value if provided

## Phase 3: Output formatter

- [ ] Rewrite `formatResponse()` to parse and render structured sections
- [ ] Implement `--format brief` → single-line output
- [ ] Fallback to raw synthesis if sections not found in response

## Phase 4: Verification

- [ ] Run `npm run sage:brief` — confirm output has `## Do Next` / `## Why` / `## Watch Out`
- [ ] Run `npm run sage:brief -- --format brief` — confirm one-line output
- [ ] Confirm discerned_move is one of wake_up / clean_up / grow_up / show_up
- [ ] Run `npm run check` — no new type errors
