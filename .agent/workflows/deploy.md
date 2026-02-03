---
description: Deploy changes to Vercel production
---

# Deploy to Vercel

This workflow pushes code changes to GitHub, which triggers an automatic Vercel deployment.

## Steps

// turbo-all

1. Check git status:
   ```bash
   cd /Users/test/.gemini/antigravity/bars-engine/web && git status
   ```

2. Stage all changes:
   ```bash
   cd /Users/test/.gemini/antigravity/bars-engine/web && git add -A
   ```

3. Commit with a descriptive message:
   ```bash
   cd /Users/test/.gemini/antigravity/bars-engine/web && git commit -m "fix: <describe changes>"
   ```
   Note: Replace `<describe changes>` with actual commit message.

4. Push to main branch (triggers Vercel auto-deploy):
   ```bash
   cd /Users/test/.gemini/antigravity/bars-engine/web && git push origin main
   ```

5. Verify deployment at: https://bars-engine.vercel.app/

## Notes
- Vercel automatically deploys when code is pushed to `main`
- Check Vercel Dashboard for build logs if deployment fails
- DATABASE_URL is already set in Vercel environment
