# Wiki content write API (Custom GPT / automation)

Use this when the Custom GPT (or another tool) should **read or write** DB-backed Player’s Handbook pages without editing the repo. Public wiki routes under `/wiki/handbook/*` render **published** `WikiPageContent` when present; otherwise they show the static fallback in `src/app/wiki/handbook/`.

## Setup

1. Generate a long random secret (e.g. `openssl rand -hex 32`).
2. Set **`WIKI_WRITE_API_KEY`** in `.env.local` and Vercel (never commit).
3. Import **[openapi/wiki-write-api.yaml](../openapi/wiki-write-api.yaml)** into ChatGPT Actions (or merge into your combined OpenAPI).
4. Same deployment base URL as other APIs (no trailing slash).

## Auth

Send the key in one of:

- `Authorization: Bearer <WIKI_WRITE_API_KEY>`
- `X-Wiki-Write-Key: <WIKI_WRITE_API_KEY>`

If the env var is missing, the API returns **503** with a clear message.

## Allowed slugs

Only slugs starting with **`handbook/`** are accepted (e.g. `handbook/analog-play`). Max Markdown length: **400,000** characters.

## Endpoints

### Get page

```http
GET /api/wiki/content?slug=handbook/analog-play
GET /api/wiki/content?slug=handbook/analog-play&draft=1
```

- Default: returns row only if **`status === published`**.
- `draft=1`: returns latest row including `draft` and `pending_review`.

### Upsert page

```http
PUT /api/wiki/content?slug=handbook/analog-play
Content-Type: application/json

{
  "markdown": "# Title\n\nBody...",
  "status": "pending_review",
  "metadata": { "model": "gpt-4.1", "sourceChunk": "kids-on-bikes-ch-3" }
}
```

`status`: `draft` | `pending_review` | `published` (default `pending_review`).

Path form also works:

```http
PUT /api/wiki/content/handbook/analog-play
```

## curl

```bash
export BASE=https://your-deployment.vercel.app
export WIKI_KEY=your-wiki-write-key

curl -sS -H "Authorization: Bearer $WIKI_KEY" \
  "$BASE/api/wiki/content?slug=handbook/analog-play"

curl -sS -X PUT -H "Authorization: Bearer $WIKI_KEY" -H "Content-Type: application/json" \
  -d '{"markdown":"# Analog play\n\nHello.","status":"published"}' \
  "$BASE/api/wiki/content?slug=handbook/analog-play"
```

## Related

- Books context (read reference PDFs): [BOOKS_CONTEXT_API.md](./BOOKS_CONTEXT_API.md)
- Player’s handbook GPT workflow: [docs/handbook/GPT_PLAYERS_HANDBOOK_INSTRUCTIONS.md](./handbook/GPT_PLAYERS_HANDBOOK_INSTRUCTIONS.md)
