# ChatGPT + Books library — “explain like I’m five”

This doc is the **simple spec**: what this feature *is*, what runs **automatically**, and **exactly what you click/type** to use it in ChatGPT.

---

## The story (real simple)

- Your app has a **bookshelf** (admin books: PDFs, titles, quests the AI made from books).
- ChatGPT **doesn’t live in your browser** and **can’t log in** like you do.
- So we built a **special door** on the internet: **URLs** that answer “what books are there?” and “what quests belong to this book?”
- That door has a **secret password** (`BOOKS_CONTEXT_API_KEY`). Only someone who knows the password can open it.

That’s it. No magic—just a password-protected list your Custom GPT can call.

---

## What is automated vs what you do

| Automated for you | You still do by hand |
|-------------------|----------------------|
| The API routes on the server (`/api/admin/books/...`) | Put the **secret** in Vercel env and **deploy** |
| The smoke script checks that the door works (`scripts/smoke-books-context-api.sh`) | Create a **Custom GPT** and attach **Actions** |
| The OpenAPI file describes the door for ChatGPT (`openapi/books-context-api.yaml`) | Paste the schema, set **Authentication**, and **test** the GPT |

---

## Before you start (one-time)

1. **Know your live site address**  
   Example: `https://bars-engine.vercel.app` (no trailing slash). This is your **`BASE`**.

2. **Make a secret password** (long random string). In Terminal:

   ```bash
   openssl rand -hex 32
   ```

   Copy the output. **This is your secret.** Don’t put it in GitHub.

3. **Put that secret in Vercel**  
   - Vercel → your project → **Settings** → **Environment Variables**  
   - Name: `BOOKS_CONTEXT_API_KEY`  
   - Value: paste the secret  
   - Save for **Production** (and Preview if you use it).

4. **Deploy** so the server actually has that variable (push to main, or “Redeploy” in Vercel).

---

## Step A — Prove the door works (automated check)

This is the **only scripted part** you run on your computer.

1. Open Terminal in the repo folder.

2. Set your real URL and the **same** secret you put in Vercel:

   ```bash
   export BASE=https://YOUR-DEPLOYMENT.vercel.app
   export BOOKS_CONTEXT_API_KEY=paste-the-secret-here
   ```

3. Run:

   ```bash
   bash scripts/smoke-books-context-api.sh
   ```

4. You should see **`OK (200)`** and a JSON snippet.  
   - If you see **`ERROR`** or **`401`**: the secret in Terminal doesn’t match Vercel, or the URL is wrong.  
   - If you see **`503`**: `BOOKS_CONTEXT_API_KEY` is missing on the server—fix Vercel + redeploy.

5. **Optional deeper check** (after you see a book `id` in the JSON):

   ```bash
   export BOOK_ID=paste-one-book-id-from-json
   bash scripts/smoke-books-context-api.sh
   ```

You can also run:

```bash
npm run smoke:books-api
```

(same script—see `package.json`.)

---

## Step B — Give ChatGPT a map (OpenAPI file)

ChatGPT needs a **map** of your URLs. That map is **`openapi/books-context-api.yaml`**.

1. **Open** `openapi/books-context-api.yaml` in an editor.

2. Find the line that says:

   `url: https://YOUR_DEPLOYMENT.vercel.app`

3. **Change it** to your real `BASE` (same as in Step A, **no** trailing slash).

4. **Save** the file. Keep this copy **on your computer**—you’ll upload or paste it in the next step.

---

## Step C — Build the Custom GPT (clicks, in order)

Do this in **ChatGPT** (web), logged in.

1. **Create a GPT**  
   - Your name → **My GPTs** → **Create** (or edit an existing GPT).

2. **Name & instructions** (plain English is fine)  
   Example instruction:  
   *“You can use Actions to read my BARS Engine books list and quests. Prefer compact list first, then details only when I ask.”*

3. **Actions**  
   - Open the **Actions** section.  
   - **Import** → choose **Upload file** or paste schema.  
   - Upload your edited **`openapi/books-context-api.yaml`**.

4. **Authentication** (this is the secret handshake)  
   - Set authentication to **API Key** or **Bearer** (match what OpenAPI says: Bearer).  
   - **API Key / Token value**: paste the **same** `BOOKS_CONTEXT_API_KEY` you put in Vercel.  
   - ChatGPT stores this in a **secret** field—**do not** paste the key into the **Instructions** box (that can leak).

5. **Save** the GPT.

---

## Step D — First chat (prove it works)

In the **preview** of your Custom GPT, try:

1. **“List my books in compact form.”**  
   → Should call `listBooks` with `compact=1`.

2. **“For book id `___`, show draft quests in compact form.”**  
   (paste a real `id` from Step A.)

3. **“Show full metadata for that book, no PDF text.”**  
   → Should call `getBook` without `extractedText`.

If something fails, check:

| Symptom | Usually means |
|--------|----------------|
| “Unauthorized” / 401 | Key in GPT ≠ key in Vercel |
| 503 | Env var not on server—redeploy |
| Empty list | No books in DB yet—upload/analyze in admin first |

---

## Quick reference: npm script

```bash
export BASE=https://YOUR-DEPLOYMENT.vercel.app
export BOOKS_CONTEXT_API_KEY=your-secret
npm run smoke:books-api
```

---

## Where to read more (grown-up detail)

- [BOOKS_CONTEXT_API.md](BOOKS_CONTEXT_API.md) — full API reference  
- [openapi/books-context-api.yaml](../openapi/books-context-api.yaml) — machine-readable map for ChatGPT  

---

## Checklist (copy/paste)

- [ ] Secret generated (`openssl rand -hex 32`)
- [ ] `BOOKS_CONTEXT_API_KEY` set in Vercel + redeployed
- [ ] `bash scripts/smoke-books-context-api.sh` → OK (200)
- [ ] `openapi/servers` URL updated to real `BASE`
- [ ] Custom GPT created, Actions schema imported
- [ ] Authentication configured with same secret (not in Instructions)
- [ ] Preview chat: list books → list quests for one id

When all boxes are checked, the feature is **usable in ChatGPT**.
