# Vercel Environment Variable Setup

## Database and all env vars
For a single place that covers **DATABASE_URL**, **OPENAI_API_KEY**, and how to keep local env in sync with Vercel, see [ENV_AND_VERCEL.md](ENV_AND_VERCEL.md). The rest of this doc focuses on the OpenAI-specific flow.

---

## Issue
When trying to generate I Ching hexagrams on the deployed app, you get an error:
```
Pass it using the apiKey parameter or the OPENAI_API_KEY environment variable
```

## Solution
You need to add the `OPENAI_API_KEY` environment variable to your Vercel project.

### Steps to Add Environment Variable

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your `bars-engine` project

2. **Navigate to Settings → Environment Variables**
   - Click on "Settings" tab
   - Click on "Environment Variables" in the left sidebar

3. **Add the OpenAI API Key**
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (from https://platform.openai.com/account/api-keys)
   - **Environments**: Select all environments (Production, Preview, Development)
   - Click "Save"

4. **Redeploy**
   - After adding the environment variable, you need to trigger a new deployment
   - Option 1: Push a new commit to main (automatic)
   - Option 2: Go to Deployments tab → Click "..." on latest deployment → "Redeploy"

### Verification
After redeployment, the I Ching hexagram generation should work without errors.

## Why This Happened
- Environment variables in `.env` files are only available locally
- Vercel runs in a different environment and needs variables configured in the dashboard
- The OpenAI SDK automatically looks for `OPENAI_API_KEY` environment variable

## "Incorrect API key provided" troubleshooting

If you see this error after adding the key:

1. **Verify the key in Vercel**: Dashboard → Settings → Environment Variables. Confirm `OPENAI_API_KEY` exists and the value is correct (no extra spaces, full key).
2. **Check environment scope**: Ensure the key is set for the environment you're using (Production, Preview, or Development).
3. **Redeploy**: Changes to env vars require a new deployment. Push a commit or use Redeploy from the Deployments tab.
4. **Key validity**: If the key was rotated or revoked, create a new one at [OpenAI API keys](https://platform.openai.com/account/api-keys) and update Vercel.
