# Google Workspace mirror (Docs + Sheets → Markdown)

Pulls Google Docs and Sheets into a folder of `.md` files plus `manifest.json` and `INDEX.md` so you can open them in Cursor, copy into your docs library, or draft BARs from them.

## Prerequisite: Google Cloud

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable APIs: **Google Docs API**, **Google Sheets API**, **Google Drive API**.
3. Choose **one** auth path below.

### Option A — Service account (automation)

1. IAM → Service accounts → create key (JSON).
2. Set env: `GOOGLE_WORKSPACE_MIRROR_CREDENTIALS=./path/to/key.json` (path relative to repo root is fine).
3. **Share** every Doc and Sheet with the service account email (`…@….iam.gserviceaccount.com`) as Viewer (or Editor).

### Option B — OAuth (your own Google account)

1. APIs & Services → Credentials → OAuth client (Desktop or Web).
2. OAuth consent screen: add scopes for read-only Docs, Sheets, Drive (same as the script uses).
3. Obtain a **refresh token** (one-time OAuth flow with `access_type=offline` and `prompt=consent`). Many guides use a small local script; store the refresh token securely.
4. Set env in `.env.local` (not committed):

   - `GOOGLE_OAUTH_CLIENT_ID`
   - `GOOGLE_OAUTH_CLIENT_SECRET`
   - `GOOGLE_OAUTH_REFRESH_TOKEN`

## Run

```bash
npx tsx scripts/with-env.ts "npx tsx scripts/google-workspace-mirror.ts --start 'https://docs.google.com/document/d/YOUR_ID/edit'"
```

Or with npm:

```bash
npm run mirror:google-workspace -- --start 'https://docs.google.com/spreadsheets/d/YOUR_ID/edit'
```

Flags:

| Flag | Default | Meaning |
|------|---------|---------|
| `--out` | `docs/google-mirror/latest` | Output directory |
| `--max-depth` | `3` | How many link hops to follow |
| `--max-nodes` | `40` | Max files to fetch (safety cap) |

Output is gitignored under `docs/google-mirror/` so private text is not committed by accident. Copy selected files elsewhere (e.g. `docs/`) when you want them in the repo.

## What gets followed

Only links pointing at `docs.google.com`, `drive.google.com`, or `spreadsheets.google.com` are enqueued. Other file types on Drive are exported as **plain text** when the Drive API allows; otherwise a stub Markdown file explains the failure.

## Next steps (your workflow)

1. Review `INDEX.md` and per-file front matter (`google_id`, `title`).
2. Move or duplicate curated `.md` files into a public docs path if appropriate.
3. Use that prose as source for BARs / quests in admin or seeds.
