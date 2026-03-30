# BAR Forge API (Custom GPT / BAR → quest matching)

Bearer-authenticated endpoints for **matching** a BAR analysis to `CustomBar` quests and **persisting** rows in the system-wide BAR registry (`BarForgeRecord`). No Player session required.

## Setup

1. Generate a long random secret (e.g. `openssl rand -hex 32`).
2. Set **`BARS_API_KEY`** in `.env.local` and in Vercel (Production / Preview as needed).
3. Run migrations so `bar_forge_records` exists: `npx prisma migrate deploy` (or `migrate dev` locally).
4. Never commit the key; never paste it into public Custom GPT **Instructions** — use Actions **Authentication** only.

## Auth

Every request:

```http
Authorization: Bearer <BARS_API_KEY>
```

If the env var is missing on the server, matching/registry routes return **503** with a clear message. Wrong key → **401**.

## Endpoints

### POST `/api/match-bar-to-quests`

Request body:

```json
{
  "bar": "string (required, non-empty)",
  "analysis": {
    "type": "perception | identity | relational | systemic",
    "wavePhase": "Wake Up | Clean Up | Grow Up | Show Up",
    "polarity": ["optional", "string", "tags"]
  },
  "options": {
    "maxResults": 50
  }
}
```

Response:

```json
{
  "primary": { "id", "title", "description", "status", "moveType", "lockType", ... } | null,
  "secondary": [ ... ],
  "debug": {
    "matchedOn": ["wave_phase:Wake Up", "lock_type:emotional_lock", "polarity:trust"],
    "confidence": 0.0
  }
}
```

Matching filters quests to `status` in `active` | `draft`, then keeps rows whose `moveType` matches the requested wave phase, ranks by `analysis.type` → `lockType` heuristic, then boosts by polarity substring hits on title/description/nation/archetype/allyship domain.

### POST `/api/bar-registry`

Persist a BAR + analysis + optional quest links. Quest ids must exist on `custom_bars`.

```json
{
  "bar": "string",
  "analysis": {
    "type": "identity",
    "wavePhase": "Wake Up",
    "polarity": []
  },
  "matches": {
    "primaryQuestId": "cuid optional",
    "secondaryQuestIds": ["cuid", "cuid"]
  },
  "source": "chatgpt",
  "metadataJson": {}
}
```

Response: `{ "id": "<new cuid>" }`

### GET `/api/bar-registry`

List registry rows, newest first (unless `sample` is used).

Query:

| Param | Meaning |
|--------|---------|
| `limit` | Max rows (default **100**, max **500**). **Ignored** when `sample` is set. |
| `sample` | If set (1–500), return that many rows in **random** order (`ORDER BY RANDOM()`). For “give me a random set of BARs.” |
| `includeTotal` | `1` or `true` — include **`totalCount`**: total rows in the table (for “how many BARs are in the registry?”). |

Response: `{ "records": [...], "count": number, "totalCount"?: number }`  
`count` is always the length of `records` in this response; `totalCount` is the full table size when requested.

### Custom GPT: registry + books + quests

Use **two** Action schemas (or one merged OpenAPI): **`BARS_API_KEY`** (BAR Forge) and **`BOOKS_CONTEXT_API_KEY`** (books).

1. **How many BARs?** — `GET /api/bar-registry?includeTotal=1&limit=1` and read **`totalCount`** (ignore `records` length for the global count).
2. **Random BARs** — `GET /api/bar-registry?sample=5` (five random registry rows). Expand **polarities** in chat from each row’s `polarity` array and `bar` text.
3. **Link to book-generated quests** — For each `primaryQuestId` / book context, use **Books API**: `GET /api/admin/books?compact=1`, then `GET /api/admin/books/{bookId}/quests?compact=1` to list library quests. Matching a registry BAR to a book quest is **GPT reasoning** plus optional **`POST /api/match-bar-to-quests`** when you have a BAR string + analysis.

### GET `/api/bar-registry/[id]`

Response: `{ "record": { ... } }` or **404**

## OpenAPI

- Machine-readable: [openapi/bar-forge-api.yaml](../openapi/bar-forge-api.yaml)
- **Custom GPT (recommended import):** [openapi/bar-forge-custom-gpt.yaml](../openapi/bar-forge-custom-gpt.yaml) — same endpoints, plus **`info.x-gm-faces`**, **`tags`** per sect, and optional **`gameMasterFace`** on match/registry bodies (stored in registry `metadataJson`).

### Optional `gameMasterFace`

Requests may include `gameMasterFace`: `shaman` | `challenger` | `regent` | `architect` | `diplomat` | `sage`.

- **POST match** — echoed in `debug.matchedOn` as `gm_face:<name>` when set.
- **POST registry** — merged into `metadataJson.gameMasterFace` (with any client `metadataJson`).

## Custom GPT settings checklist

Do this in **ChatGPT → My GPTs → [BAR Forge] → Edit**:

1. **Vercel** — Set `BARS_API_KEY` for **Production**; redeploy after changes.
2. **Actions → Schema** — Import **`openapi/bar-forge-custom-gpt.yaml`** (or `bar-forge-api.yaml`). Set **`servers[0].url`** to `https://bars-engine.vercel.app` (no trailing slash), or your deployment URL.
3. **Actions → Authentication** — **Bearer**; token = same value as `BARS_API_KEY` in Vercel. **Do not** put the key in **Instructions**.
4. **Books API in the same GPT (optional)** — Import [openapi/books-context-api.yaml](../openapi/books-context-api.yaml) as a second Action, or merge OpenAPI files and use one secret if you unify keys.
5. **Instructions** — Describe when to call: match → optional POST registry → GET list to reconcile. Use paths exactly as in the schema (`/api/match-bar-to-quests`, `/api/bar-registry`, …).
6. **Preview** — Test POST match, POST registry, GET list, GET by id.

## curl examples

```bash
export BASE=https://bars-engine.vercel.app
export BARS_API_KEY=your-secret

curl -sS -X POST "$BASE/api/match-bar-to-quests" \
  -H "Authorization: Bearer $BARS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"bar":"I believe X","analysis":{"type":"identity","wavePhase":"Wake Up","polarity":[]}}'

curl -sS "$BASE/api/bar-registry?limit=10" \
  -H "Authorization: Bearer $BARS_API_KEY"
```

## Relation to in-app BARs

Registry rows are **metadata** about external/analyzed BARs. Playable quests remain **`CustomBar`** rows; linking is via `primaryQuestId` / `secondaryQuestIds` on `BarForgeRecord`.
