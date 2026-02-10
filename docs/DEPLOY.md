# Deployment Guide

How to deploy the Conclave Engine for a live event.

## 1. Hosting (Vercel)
The easiest way to deploy is via **Vercel**.

1.  Push code to GitHub.
2.  Import project in Vercel.
3.  **Environment Variables**:
    - `DATABASE_URL`: Your production connection string (e.g., Vercel Postgres, Neon, or Railway).
    - `OPENAI_API_KEY`: For the Story Clock AI generation.
4.  **Build Command**: `npx prisma generate && next build` (Standard Next.js).
5.  **Output Directory**: `.next`.

## 2. Database Migration
When deploying to production for the first time or after schema changes:

```bash
# In your local terminal, pointing to the prod DB URL
npx prisma db push
```

## 3. Creating the Public Invite Link
Once deployed, you need to generate the "Golden Ticket" for your Partiful event.

1.  Open your local terminal.
2.  Set `DATABASE_URL` to your **production** database string.
3.  Run the invite script:

```bash
# Usage: <TOKEN> <MAX_USES>
npx tsx scripts/create-invite.ts PARTIFUL2026 500
```

4.  **The Link**: `https://your-app.vercel.app/invite/PARTIFUL2026`

## 4. Updates during Live Gameplay
The user asked: *"It also needs to be able to be updated even while the game is working"*

- **Content Updates**:
    - Most content (Bars, Quests) is in the **Database**. You can update these via the `/admin` panel or direct SQL without redeploying code.
- **Code Updates**:
    - Vercel performs **Atomic Deploys**.
    - When you push new code, Vercel builds a *new* instance.
    - Existing users stay on the old instance until they refresh.
    - New users get the new instance.
    - **Zero Downtime**: The game continues running smoothly.

**⚠️ Caution**: Avoid destructive database schema changes (deleting columns) during the live event. Adding columns (like we just did) is safe.

## 5. Standard QA Flow: Vercel Preview First (No localhost)

To reduce local memory usage and support mobile/iPhone testing, use Vercel Preview URLs as the default QA flow.

### Team Standard
- Do **not** send `localhost` links for QA handoff.
- Every feature handoff should include:
  - Base preview URL
  - Direct route links for the feature
  - If needed, admin route links
- If preview access is protected, testers must authenticate with Vercel first (or disable protection for the preview environment).

### Retrieve the current branch preview URL
1. Push your branch.
2. Open/update the PR.
3. Copy the latest Vercel Preview URL from the `vercel[bot]` PR comment.

Optional CLI helper:

```bash
BRANCH="$(git branch --show-current)"
PR_NUMBER="$(gh pr list --head "$BRANCH" --json number --jq '.[0].number')"
OWNER_REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
gh api "repos/$OWNER_REPO/issues/$PR_NUMBER/comments" --jq '.[] | select(.user.login=="vercel[bot]") | .body' \
  | rg -o "https://[A-Za-z0-9.-]+\\.vercel\\.app" \
  | head -n 1
```

### Example handoff format

```text
Preview Base: https://<preview>.vercel.app
Feature: https://<preview>.vercel.app/emotional-first-aid
Admin: https://<preview>.vercel.app/admin/first-aid
```
