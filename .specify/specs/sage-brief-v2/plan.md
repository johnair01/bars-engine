# Plan: Sage Brief v2

## Summary

Rewrite `scripts/sage-brief.ts` to feed the Sage structured context instead of raw markdown, include recently completed items, probe build/migration state, constrain move names, and format output into scannable sections.

---

## Phase 1: Structured context compiler

**Modify `scripts/sage-brief.ts`**

Replace `getOpenBacklogItems()` (returns raw markdown rows) with `compileContext()` that returns a structured object:

```ts
interface BriefContext {
  date: string
  branch: string
  commitsAheadOfMain: number
  buildStatus: 'passing' | 'failing' | 'unknown'
  schemaDirty: boolean
  recentCommits: string[]        // last 48h commit messages
  completedItems: string[]       // [x] Done items mentioned in recent commits or backlog
  openItems: OpenItem[]          // parsed from items.json or BACKLOG.md
}

interface OpenItem {
  id: string
  name: string
  category: string
  dependencies: string
}
```

**Context sources:**
- `commitsAheadOfMain`: `git rev-list origin/main..HEAD --count` (fallback: 0)
- `buildStatus`: check `.next/BUILD_ID` mtime < 10 min → passing; else unknown
- `schemaDirty`: `git diff --name-only HEAD -- prisma/` non-empty
- `openItems`: read `.specify/backlog/items.json` if exists, else parse BACKLOG.md `[ ] Ready` rows
- `completedItems`: parse BACKLOG.md `[x] Done` rows that appear in recent commit messages (by ID match)

---

## Phase 2: Structured prompt builder

Replace `buildPrompt()` to produce the structured prompt contract from the spec:

- JSON-like sections (not prose)
- Explicit constraint: "Constrain your discerned_move to one of: wake_up, clean_up, grow_up, show_up"
- Explicit output format instruction: `## Do Next`, `## Why`, `## Watch Out`, `## Hexagram Note`
- Custom question appended if `--question` flag used

---

## Phase 3: Output formatter

Replace `formatResponse()` to render the structured sections:

- Parse `## Do Next` / `## Why` / `## Watch Out` / `## Hexagram Note` from synthesis
- If sections not present in response, fall back to raw synthesis
- `--format brief`: extract first bullet from Do Next + move emoji + Watch Out → single line
- Header bar shows: `SAGE BRIEF | {emoji} {move} | Hexagram {N}`

---

## Phase 4: Flag cleanup

- `--format brief|full` (default: full)
- `--top N` (default: 10)
- `--question "..."` (appends to prompt)
- `--backend <url>` (already fixed)
- Remove dead `question` param from formatResponse (already done)

---

## File Impacts

| File | Action |
|------|--------|
| `scripts/sage-brief.ts` | Rewrite context compiler, prompt builder, output formatter |
| `package.json` | No change needed (sage:brief already wired) |

---

## Dependencies

- `.specify/backlog/items.json` — populated by `npm run backlog:fetch`; script falls back to BACKLOG.md if absent
- Backend running at `NEXT_PUBLIC_BACKEND_URL` or `http://localhost:8000`
