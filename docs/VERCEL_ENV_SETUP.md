# Vercel Environment Variable Setup

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
   - **Value**: `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`
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
