# Custom GPT — point Actions at staging (safe testing)

## Like you’re five

Imagine your **robot helper** (Custom GPT) needs to **call your app’s kitchen** to get cookies (books) and put notes on the fridge (wiki). You must tell the robot **which house** is the **practice house** (staging), not your real house (production). You also give the robot a **secret password** so only *your* robot can open the door. You write the **address** and **password** in the robot’s **settings**, not out loud in the chat where anyone could hear.

---

## Step by step (technical)

### 1. Have a staging deployment

- A Vercel **Preview** or a dedicated **staging** project, with its own URL, e.g. `https://bars-engine-staging.vercel.app` (example only).
- That deployment must have **staging** env vars: `DATABASE_URL`, `BOOKS_CONTEXT_API_KEY`, `WIKI_WRITE_API_KEY`, etc. (values **different** from production).

### 2. Open your GPT in the editor

1. ChatGPT → **Explore GPTs** (or **My GPTs**) → select your BARS / handbook GPT → **Edit**.
2. Go to **Configure** (or the tab that has **Actions**).

### 3. Import or update the OpenAPI schema

1. **Actions** → **Create new action** or **Edit** existing.
2. **Import from URL** or paste the contents of **`openapi/books-context-api.yaml`** (and merge **`openapi/wiki-write-api.yaml`** if you use a second action, or combine into one schema).
3. **Critical:** In the YAML, find **`servers`**:

   ```yaml
   servers:
     - url: https://your-staging-host.example.com
   ```

   Set **`url`** to your **staging** base URL **with no trailing slash**.

4. Save the action.

### 4. Set Authentication (secrets)

1. In the same Action, open **Authentication**.
2. Choose **API Key** or **Bearer** as your OpenAPI describes (Books + Wiki write use **Bearer**).
3. Paste the **staging** secret(s):
   - For Books: value of **`BOOKS_CONTEXT_API_KEY`** from **staging** Vercel env.
   - Wiki write often needs a **second** Action or a merged schema with a second security scheme — use **`WIKI_WRITE_API_KEY`** from staging.

ChatGPT stores these as **encrypted secrets**; they are **not** copied into the **Instructions** text.

### 5. Instructions (no secrets here)

In the GPT **Instructions** / system prompt, say *what* to call (e.g. “use `listBooks`, then `getBook` with `extractedText`…”) but **never** paste API keys. Keys live only under **Authentication**.

### 6. Test

Use the GPT **Preview** panel: ask it to list books. If you get **401**, the Bearer token doesn’t match staging. If you get **503**, the key isn’t set **on the staging server** (Vercel env).

### 7. Production GPT (later)

Duplicate the GPT or duplicate the Action, set **`servers[0].url`** to **production** URL, and use **production** keys — keep **two separate GPTs** or two Actions to avoid mixing.

---

## Parallel: verify the API without ChatGPT

Use this while you fix Actions URL or auth—you isolate **server + key** from **GPT quirks**.

1. Set **`BOOKS_CONTEXT_API_KEY`** in `.env.local` (same idea as Vercel: long random secret).
2. Terminal A: `npm run dev`
3. Terminal B: `npm run smoke:books-api:local` — hits `listBooks`, optional `getBook` / quests / chunk-tags (same Bearer auth as the GPT).

Against a **preview** host instead of localhost:

```bash
BASE=https://your-preview.vercel.app npm run smoke:books-api:local
```

Put the **preview** key in `.env.local` for that run, or export `BOOKS_CONTEXT_API_KEY` in the shell so it matches **Preview** in Vercel for that URL.

Remote smoke (bash, explicit `BASE` + key): see `npm run smoke:books-api` and [BOOKS_CONTEXT_API.md](./BOOKS_CONTEXT_API.md).

---

## Troubleshooting (HTTP codes)

| Code | Typical cause | What to do |
|------|----------------|------------|
| **401** `Unauthorized` | Bearer token wrong or ChatGPT not sending it | Match **Actions** token to **`BOOKS_CONTEXT_API_KEY`** on the **same** deployment as `servers[0].url`. |
| **503** + message about key not set | Env missing on that deployment | Vercel → **Preview** (or relevant env) → add **`BOOKS_CONTEXT_API_KEY`** → **redeploy**. |
| **404** / HTML | Wrong base URL | No trailing slash; must be the deployment root (`https://….vercel.app`), not a path. |
| Request fails / connection | Dev server down or bad `BASE` | For local: `npm run dev`. For preview: confirm URL from Vercel **Deployments**. |

Quick manual check:

```bash
curl -sS -w "\nHTTP %{http_code}\n" -H "Authorization: Bearer $BOOKS_CONTEXT_API_KEY" \
  "$BASE/api/admin/books?compact=1"
```

---

## Related docs

- [BOOKS_CONTEXT_API.md](./BOOKS_CONTEXT_API.md)
- [WIKI_WRITE_API.md](./WIKI_WRITE_API.md)
- [BAR_FORGE_API.md](./BAR_FORGE_API.md)
