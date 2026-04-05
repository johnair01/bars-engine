# Books context API (ChatGPT / low-token dev)

Use this when you cannot open the admin UI but need **the same catalog, book metadata, and generated library quests** the app uses at `/admin/books`.

## Setup

1. Generate a long random secret (e.g. `openssl rand -hex 32`).
2. Set **`BOOKS_CONTEXT_API_KEY`** in `.env.local` and in Vercel (Production / Preview as needed).
3. Never commit the key; never paste it into public Custom GPT instructions—use **Secrets** in Actions or paste per-session.
4. **Deploy** so the env var is live on the URL you will give ChatGPT.

## Auth

Every request must send the key in **one** of these ways:

- `Authorization: Bearer <BOOKS_CONTEXT_API_KEY>`
- `X-Books-Context-Key: <BOOKS_CONTEXT_API_KEY>`

If the env var is missing on the server, the API returns **503** with a clear message.

## OpenAPI schema

- File: [openapi/books-context-api.yaml](../openapi/books-context-api.yaml)
- Replace `https://YOUR_DEPLOYMENT.vercel.app` in `servers[0].url` with your real deployment base URL (no trailing slash).

## Book chunk tags (Sage slice)

Tag deterministic slices of `extractedText` with **Game Master face** + optional **hexagram (1–64)** for GPT pipelines. Same auth key.

See **[BOOKS_CHUNK_TAGS_API.md](./BOOKS_CHUNK_TAGS_API.md)**.

## Endpoints

### List books (no full PDF text — token-efficient)

```http
GET /api/admin/books
GET /api/admin/books?compact=1
```

- Default: `id`, `title`, `author`, `slug`, `sourcePdfUrl`, `status`, `metadataJson`, `createdAt`, `updatedAt`, `threadId`
- **`compact=1`**: only `id`, `title`, `author`, `slug`, `status`, `threadId` — smallest payload for indexing

### Single book

```http
GET /api/admin/books/<bookId>
```

Metadata only (no `extractedText`).

```http
GET /api/admin/books/<bookId>?extractedText=1&maxChars=80000
```

- **`extractedText=1`**: includes extracted PDF text, truncated to **`maxChars`** (default `80000`, max `500000`).
- **`startChar`** / **`endChar`** (optional): slice the extracted text to that character range **before** applying `maxChars` (deterministic TOC chunks; see `src/lib/book-toc-slices.ts`).
- Response includes `extractedTextTruncated` when truncation applied.

### Generated quests (book analysis → CustomBars)

Same linkage as admin review: `completionEffects` contains `source: library` and `bookId`.

```http
GET /api/admin/books/<bookId>/quests
GET /api/admin/books/<bookId>/quests?status=draft
GET /api/admin/books/<bookId>/quests?status=active
GET /api/admin/books/<bookId>/quests?status=all
GET /api/admin/books/<bookId>/quests?compact=1
```

- **`status`**: `draft` | `active` | `archived` | `all` (default `all`)
- **`compact=1`**: only `id`, `title`, `status`, `moveType`

## curl examples

```bash
export BASE=https://your-deployment.vercel.app
export KEY=your-books-context-api-key

curl -sS -H "Authorization: Bearer $KEY" "$BASE/api/admin/books?compact=1"

curl -sS -H "Authorization: Bearer $KEY" "$BASE/api/admin/books/cmk123..."

curl -sS -H "Authorization: Bearer $KEY" \
  "$BASE/api/admin/books/cmk123...?extractedText=1&maxChars=20000"

curl -sS -H "Authorization: Bearer $KEY" \
  "$BASE/api/admin/books/cmk123.../quests?status=draft&compact=1"
```

## Using this in ChatGPT (Custom GPT + Actions)

What you need on your side:

| Step | Done when |
|------|-----------|
| 1. Env on server | `BOOKS_CONTEXT_API_KEY` is set in Vercel for the environment that serves your public URL. |
| 2. Deploy | Latest code with these routes is deployed; smoke-test with `curl` + Bearer key. |
| 3. OpenAPI file | Copy [openapi/books-context-api.yaml](../openapi/books-context-api.yaml), set `servers[0].url` to your real `https://….vercel.app`. |
| 4. Create / edit Custom GPT | Configure **Actions** → **Import from URL** or paste schema; or upload the YAML. |
| 5. Authentication | In Actions, set **Authentication** to **API Key** or **Bearer** and map it to the same value as `BOOKS_CONTEXT_API_KEY` (ChatGPT stores it as a secret—do not put the key in Instructions). |
| 6. Test in GPT | Ask it to list books (`compact=1`), then fetch quests for one `bookId`. |

If something fails:

- **401** — Secret in ChatGPT does not match `BOOKS_CONTEXT_API_KEY` on the server, or header not sent.
- **503** — Env var not set on that deployment; re-check Vercel env + redeploy.
- **404 on /quests** — Book id wrong, or no generated quests yet for that book.

**Low tokens:** `GET .../books?compact=1` → pick id → `GET .../books/{id}/quests?compact=1` → only use `extractedText=1` when you need raw PDF text.

## Relation to admin UI

- List matches `listBooks()` in `src/actions/books.ts` (no `extractedText` on the list).
- Quests match `getBookDraftQuests` / `getBookApprovedQuests` filters in `src/actions/book-quest-review.ts` (same `bookId` in `completionEffects`).
