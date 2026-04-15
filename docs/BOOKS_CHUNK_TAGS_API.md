# Book chunk tags (Sage slice)

Deterministic **character ranges** on `Book.extractedText`, each tagged with a **Game Master face** (six canonical names) and an optional **I Ching hexagram** (1–64). Used so Custom GPT / scripts can **list** and **replace** tags with the same **`BOOKS_CONTEXT_API_KEY`** as the rest of the Books context API.

**Staging:** Point ChatGPT Actions at your **preview/staging** deployment URL and use **staging-only** keys — never reuse production secrets in a staging GPT.

## Auth

Same as [BOOKS_CONTEXT_API.md](./BOOKS_CONTEXT_API.md):

- `Authorization: Bearer <BOOKS_CONTEXT_API_KEY>`
- `X-Books-Context-Key: <BOOKS_CONTEXT_API_KEY>`

## Endpoints

### List tags

```http
GET /api/admin/books/{bookId}/chunk-tags
GET /api/admin/books/{bookId}/chunk-tags?face=diplomat
```

- **`face`** (optional): filter to one of `shaman`, `challenger`, `regent`, `architect`, `diplomat`, `sage`.

Response includes `tags[]` with `charStart`, `charEnd`, `gameMasterFace`, `hexagramId`, optional `metadata`, and timestamps.

### Replace all tags (full sync)

```http
PUT /api/admin/books/{bookId}/chunk-tags
Content-Type: application/json

{
  "tags": [
    {
      "charStart": 0,
      "charEnd": 1200,
      "gameMasterFace": "sage",
      "hexagramId": 24,
      "metadata": { "source": "gpt", "note": "Return — opening" }
    }
  ]
}
```

- **Full replace:** existing rows for this `bookId` are deleted, then the array is inserted (up to **2000** tags per request).
- Duplicate `(charStart, charEnd)` in one body: **last wins**.
- **`hexagramId`:** omit or `null` if unknown; otherwise integer **1–64**.
- **`metadata`:** optional JSON object (stored as `metadataJson`).

Pair with text pulls:

```http
GET /api/admin/books/{bookId}?extractedText=1&startChar=0&endChar=1200&maxChars=500000
```

## OpenAPI

Paths and schemas: [openapi/books-context-api.yaml](../openapi/books-context-api.yaml) (`listBookChunkTags`, `putBookChunkTags`).

## Prisma

Model: `BookChunkTag` → `book_chunk_tags` (see `prisma/schema.prisma`).
