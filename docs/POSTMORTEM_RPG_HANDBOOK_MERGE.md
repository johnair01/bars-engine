# On Merging Safely — Post-Mortem Notes

> Written 2026-04-14 after a 3-hour sprint trying to merge the rpg-handbook branch.

## What Happened

PR #34 (`feat/rpg-handbook-gpt-pipeline`) sat unmerged for ~6 weeks. When we finally tried to merge it, we discovered it had deleted:
- ~20 action files (campaign CRUD, quest templates, composer system, alchemy engine)
- ~15 page routes (entire `campaign/[ref]/` route group)
- ~10 component directories (alchemy-engine, campaign themes, composer)
- `vitest.config.ts`

The branch had great **additions** — wiki CMS, bar quest links, emotional alchemy APIs, game master quest engine — but the deletions made it non-mergeable without gutting main.

## What Documentation Would Have Caught This Faster

### 1. **PR Diff Hygiene Check** (before opening PR)

A required checklist in the PR template:

```
## Deletions
List every file you're deleting and why it was safe to delete:
- [ ] FILE: reason it's safe

## Schema Changes
List every model added/removed/modified:
- [ ] ADD: ModelName — what it does
- [ ] REMOVE: ModelName — what used it, whether it was migrated
- [ ] MODIFY: ModelName.field — what changed, whether it breaks existing queries
```

**Why this would have helped:** The rpg-handbook PR had zero explanation for why it was deleting campaign CRUD, the composer system, and the alchemy engine. Someone reviewing it would have immediately asked "where did these go?"

### 2. **Dependency Map at Point of Branch**

When branching from main, snapshot what your branch depends on:

```bash
# Run before writing any code
git log --oneline -1 > .branch-base-commit
echo "Branch base: $(cat .branch-base-commit)" >> CLAUDE.md
```

**Why this would have helped:** We could see the branch was based on an old commit (3153307, not 5cc7f91) but the diff didn't make clear how much main had changed since the branch was created.

### 3. **"What I'm Not Touching" Declaration**

Explicit list of namespaces the branch will not modify:
- campaign/* — not refactoring, leaving in place
- alchemy-engine/* — not touching

**Why this would have helped:** The deletions weren't accidental — they looked intentional ("we're replacing narrative-template with book-chunk-tags"). But if the intent was to replace, the replacement needed to cover all the same surface area.

### 4. **Schema Impact Statement**

Required for any PR touching `prisma/schema.prisma`:

```bash
# Before opening PR, run:
echo "=== MODELS ADDED ===" && grep "^model " prisma/schema.prisma > /tmp/models-after.txt
echo "Review /tmp/models-after.txt and explain each one"
```

**Why this would have helped:** The rpg-handbook branch had 5 new models (BarQuestLink, CampaignDraft, WikiPageContent, BookChunkTag, GeneratedQuestRegistry) plus deleted 10+ from main. The deletion-to-addition ratio should have triggered a conversation.

### 5. **Cross-Reference Check**

Before merging, a bot or pre-commit check:
```bash
# For each deleted file, verify there's a replacement:
DELETED=$(git diff origin/main..HEAD --name-only --diff-filter=D | grep "^src/")
for file in $DELETED; do
  # Check if functionality moved to new location
  basename $file | sed 's/.ts$//' | grep -q $(git diff origin/main..HEAD --name-only | grep -v "prisma/" | grep -v ".specify/") && echo "OK: $file" || echo "STRAY DELETE: $file"
done
```

**Why this would have helped:** The alchemy-engine components were deleted but the new system didn't provide equivalent coverage. This check would have flagged every stray deletion.

## The Actual Lesson

The branch was built in **exploration mode**. Exploration is valid. But exploration branches need a **consolidation step** before merge:
1. What stays from exploration
2. What gets discarded
3. What main already had that should not be touched

The rpg-handbook branch did great work. It just didn't know what it was yet — and that's fine. The hygiene issue was not knowing the answer to "is this ready to merge?" while still in exploration.

**Rule:** If a branch is older than 2 weeks and hasn't been flagged as ready for review, treat it as archival research, not mergeable code.
