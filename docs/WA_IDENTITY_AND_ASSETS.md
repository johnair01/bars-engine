# WorkAdventure identity, characters, and assets

This is the operator guide for the two seams between bars-engine and the
self-hosted WorkAdventure on `box`.

| Seam | Direction | What it settles |
|---|---|---|
| OIDC login | browser → bars-engine | a WorkAdventure player is a bars-engine `Player` |
| Admin API | box → bars-engine | name, tags, editor rights, and the saved woka |
| Asset publish | author → map-storage | a validated world folder reaches the live volume |

Nothing here forks WorkAdventure. It stays on stock `v1.35.0`; the box only
gains configuration and a published world folder.

---

## 1. What a player experiences

1. They open the dojo. WorkAdventure sends them to bars-engine's login
   (`OPENID_CLIENT_ISSUER`).
2. They sign in or create a bars-engine account. `sub` is their `Player.id`.
3. WorkAdventure asks `/api/room/access`. They arrive as their bars-engine name,
   with their tags and visit card.
4. If they have never chosen a look, WorkAdventure opens its own customize
   screen, fed by `/api/woka/list`.
5. Their choice comes back to `/api/save-textures`, which writes
   `Player.avatarConfig` as `{ nationKey, archetypeKey, ... }`.
6. The next room, and every bars-engine portrait or spatial walker, uses the
   same choice. There is no second avatar to keep in sync.

The woka catalog is `public/wa/woka/catalog.json`. Its texture ids are
`wa:<nation>:<archetype>`, so the WorkAdventure selection and bars-engine's
character model are the same fact.

---

## 2. Environment

### bars-engine (Vercel)

Generate the two secrets and the RS256 key once:

```sh
# Admin API token (WorkAdventure sends this raw, not as a Bearer token)
openssl rand -hex 32

# OIDC client secret
openssl rand -hex 32

# OIDC signing secret, used only for short-lived codes and access tokens
openssl rand -hex 32

# RS256 key for ID tokens. WorkAdventure's openid-client requires RS256.
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out wa-oidc-key.pem
```

Add these to the bars-engine Vercel project:

| Variable | Value |
|---|---|
| `BARS_PUBLIC_URL` | `https://bars-engine.vercel.app` (the origin the box can reach) |
| `WA_ADMIN_API_TOKEN` | the admin token from above |
| `WA_OIDC_CLIENT_ID` | `workadventure` |
| `WA_OIDC_CLIENT_SECRET` | the OIDC client secret from above |
| `WA_OIDC_SIGNING_SECRET` | the OIDC signing secret from above |
| `WA_OIDC_PRIVATE_KEY` | the full PEM from `wa-oidc-key.pem` (multiline is fine; `\n`-escaped is also accepted) |
| `WA_OIDC_KEY_ID` | `wa-1` |
| `WA_OIDC_ISSUER` | `https://bars-engine.vercel.app` (no trailing slash) |
| `WA_OIDC_REDIRECT_URIS` | `https://world.masteringallyship.com/openid-callback` |
| `WA_MAP_STORAGE_PUBLIC_URL` | `https://world.masteringallyship.com/map-storage` |
| `WA_DOJO_WAM_URL` | `https://world.masteringallyship.com/map-storage/calrunian-dojo/calrunian-dojo.wam` |
| `WA_EDITOR_PLAYER_IDS` | optional comma-separated player ids that may edit maps |

If a preview host is used, add its callback to `WA_OIDC_REDIRECT_URIS`
(comma-separated) and point `WA_OIDC_ISSUER` at the preview origin.

### The box (`/opt/workadventure/.env`)

```dotenv
ADMIN_API_URL=https://bars-engine.vercel.app
ADMIN_API_TOKEN=<the same WA_ADMIN_API_TOKEN>
OPENID_CLIENT_ID=workadventure
OPENID_CLIENT_SECRET=<the same WA_OIDC_CLIENT_SECRET>
OPENID_CLIENT_ISSUER=https://bars-engine.vercel.app
OPENID_SCOPE=openid email profile
OPENID_USERNAME_CLAIM=username
OPENID_TAGS_CLAIM=tags
OPENID_WOKA_NAME_POLICY=user_input
# bars-engine names are longer than the starter's 10-character limit
MAX_USERNAME_LENGTH=50

START_ROOM_URL=/_/global/world.masteringallyship.com/~/calrunian-dojo/calrunian-dojo.wam
```

`ADMIN_API_URL` has **no trailing slash**: WorkAdventure concatenates
`/api/...` onto it.

The callback WorkAdventure registers is derived from `PUSHER_URL`, not from
`OPENID_CLIENT_REDIRECT_URL`. With the box's compose file that is
`https://world.masteringallyship.com/openid-callback`.

Optionally force accounts instead of anonymous visitors:

```dotenv
DISABLE_ANONYMOUS=true
```

Then reconcile the stack:

```sh
ssh box
cd /opt/workadventure
cp -a .env .env.bak-$(date +%F)-wa-identity
# edit .env
docker compose up -d back play reverse-proxy
docker compose logs -f --tail=100 play
```

### Verify from the box

```sh
curl -sS -H "Authorization: $ADMIN_API_TOKEN" \
  "$ADMIN_API_URL/api/room/access?userIdentifier=&playUri=https://world.masteringallyship.com/"
curl -sS https://bars-engine.vercel.app/.well-known/openid-configuration
curl -sS -H "Authorization: $ADMIN_API_TOKEN" \
  "https://bars-engine.vercel.app/api/woka/list?roomUrl=https://world.masteringallyship.com/"
```

The first should be `status: "ok"`; the second should advertise
`id_token_signing_alg_values_supported: ["RS256"]`; the third should list the
Calrunia collection.

---

## 3. Editing and GM rights

Tags come from bars-engine roles, not from the browser. A player with an
`admin`, `gm`, or `editor` role (or whose id is in `WA_EDITOR_PLAYER_IDS`) gets:

- the matching tag in `WA.player.tags`;
- `canEdit: true`;
- `editable: true` on the dojo map response, which opens the in-client editor.

Until identity is deployed, `MAP_EDITOR_ALLOW_ALL_USERS=true` still means every
visitor can edit every `/~` world. Once OIDC is live, turn that off and let the
tags do the work:

```dotenv
MAP_EDITOR_ALLOW_ALL_USERS=false
```

---

## 4. Adding assets and publishing worlds

### 4.1 Woka sheets (player characters)

A woka texture is a **96×128 PNG** (3 frames × 4 facings, 32 px cells). Add or
replace one at:

```
public/wa/woka/sheets/<nation>/<archetype>.png
```

Then update `public/wa/woka/catalog.json` (id, name, path, nation, archetype)
and run the asset check:

```sh
python3 public/wa/check_assets.py --woka public/wa/woka/sheets/<nation>/<archetype>.png
```

The provisional 40-sheet catalog is regenerated from the two CC0 dojo walkers:

```sh
npm run wa:woka
```

Replace those palette variants with real ARDS layer sheets when they exist; the
Admin API only reads the catalog and does not care how the art was made.

**CORS for sheets:** WorkAdventure's `WokaImage` loads textures with
`crossOrigin="use-credentials"`. A credentialed image load rejects
`Access-Control-Allow-Origin: *`, so `/wa/woka/*` must reflect the world origin
and send `Access-Control-Allow-Credentials: true` (see `next.config.ts`).
Without this, WA logs "One of your Woka textures is invalid for this world" and
bounces back to the picker even though the PNG returns 200.

**User identifier:** the WorkAdventure pusher mints its JWT with the account's
**email identifier**, not the OIDC `sub`. `room/access` resolves the player by
`Player.id` first, then by contact email — both server-side reads; the browser
is never trusted.

**Query shape:** WA's axios client sends `characterTextureIds[]=...`, not the
bare repeated key. `room/access` reads both (plus comma-separated values) via
`requestedTextureIds` in `src/lib/wa/woka.ts`; otherwise an anonymous pick looks
empty and is rejected with the same message.

### 4.1a Woka layer parts (the native six-tab customizer)

WorkAdventure's **Build your WOKA** screen expects six separate parts, stacked in
this order:

```
body → eyes → hair → clothes → hat → accessory
```

`/api/woka/list` now returns those six parts alongside the full-body `woka`
preset collection. The parts are generated by partitioning the canonical 96×128
dojo walker into pixel-complete layers:

```sh
npm run wa:layers     # writes public/wa/woka/layers/<part>/<slug>.png + catalog.json
npm run wa:assets     # wa:woka + wa:layers
```

The partition gate must report every source pixel in exactly one layer. The
current bridge is 69 sheets: body 4, eyes 5, hair 5, clothes 40 (nation ×
archetype), hat 6, accessory 9.

`POST /api/save-textures` accepts either:

- one id → a full-body preset (`wa:<nation>:<archetype>`), or
- 2–6 ids → ordered layer textures, stored in `avatarConfig.waLayers`.

Mixing presets and layers in one save is rejected. `room/access` returns the
layer ids in order; WA stacks and animates one sprite per id. The bars-engine
builder is `/character/create` (`OUROBOROS_SPRITE`), and `GET
/api/woka/compose?body=...&eyes=...` flattens a selection to one 96×128 PNG for
previews and share cards.

### 4.2 Tiles and props (maps)

1. Put the source sheet in the world folder (`src16/` beside the map).
2. Name it in the design language (`dojo-language.json` → `sheets`).
3. Name each usable region in `stamps` (the generator places names, not gids).
4. Regenerate the map:
   ```sh
   cd public/wa/calrunian-dojo && python3 gen_dojo.py
   ```
   The dojo is editor-owned, so `gen_dojo.py` seeds into a scratch directory
   instead of overwriting the WAM. For generated worlds (lantern, heaven sect)
   the generator writes the map.
5. The generator runs both the WorkAdventure map rules (`wa_export.py`) and the
   asset contract (`check_assets.py`) before it writes anything.

### 4.3 Publish a world to the box

The map-storage upload runs WorkAdventure's own `MapValidator`, so a world that
lands in the live volume has passed both contracts. Publishing **replaces** the
named remote directory; it is not a merge.

```sh
export WA_MAP_STORAGE_TOKEN="$(ssh box 'grep -E "^MAP_STORAGE_AUTHENTICATION_TOKEN=" /opt/workadventure/.env | cut -d= -f2')"

npm run wa:publish -- public/wa/calrunian-dojo
npm run wa:publish -- public/wa/heaven-sect --dir heaven-sect
npm run wa:publish -- public/wa/calrunian-dojo --dry-run
```

`WA_MAP_STORAGE_URL` defaults to
`https://world.masteringallyship.com/map-storage`. The token is the box's
`MAP_STORAGE_AUTHENTICATION_TOKEN`, sent as a Bearer token to the map-storage
upload endpoint.

---

## 5. What this deliberately does not do

- No WorkAdventure fork and no custom image.
- No private data in `WA.state`; room state is shared with everyone in the room.
- No browser claim is trusted: the OIDC `sub` is the only identity, and the
  Admin API re-reads the player from bars-engine on every call.
- No refresh tokens, dynamic client registration, or consent screen. The
  provider implements the profile WorkAdventure uses, nothing more.
- No automatic promotion of a published world to the start room. That remains a
  deliberate `START_ROOM_URL` change.

---

## 6. Rollback

The box change is configuration only:

```sh
cd /opt/workadventure
cp .env.bak-<date>-wa-identity .env
docker compose up -d back play
```

Deleting the bars-engine env variables returns the Admin API routes to `503`
and the OIDC discovery to the HS256 fallback, which WorkAdventure will reject.
Roll back the box first, then the env.
