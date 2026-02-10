---
description: Push branch and verify Vercel preview links
---

# Vercel Preview Deployment Workflow

This workflow pushes branch changes to GitHub, which triggers an automatic Vercel preview deployment.
Use this flow for feature QA and mobile testing.

## Steps

1. Check git status:
   ```bash
   git status
   ```

2. Stage all changes:
   ```bash
   git add -A
   ```

3. Commit with a descriptive message:
   ```bash
   git commit -m "feat: <describe changes>"
   ```
   Note: Replace `<describe changes>` with actual commit message.

4. Push to current feature branch (triggers Vercel preview):
   ```bash
   git push -u origin "$(git branch --show-current)"
   ```

5. Locate preview URL from PR comment:
   ```bash
   BRANCH="$(git branch --show-current)"
   PR_NUMBER="$(gh pr list --head "$BRANCH" --json number --jq '.[0].number')"
   OWNER_REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
   gh api "repos/$OWNER_REPO/issues/$PR_NUMBER/comments" --jq '.[] | select(.user.login=="vercel[bot]") | .body' \
     | rg -o "https://[A-Za-z0-9.-]+\\.vercel\\.app" \
     | head -n 1
   ```

6. Share QA links using preview URL (no localhost):
   - `<preview>/emotional-first-aid`
   - `<preview>/admin/first-aid` (admin-only)
   - Any route under test for the feature

## Notes
- Vercel automatically deploys previews for pushed branches.
- For QA handoff, always send full preview links, not localhost links.
- Check Vercel dashboard/build logs if deployment fails.
