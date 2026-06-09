# Tap the Vein — Zo Space Implementation Spec
**Status:** Draft
**Owner:** Architect
**Created:** 2026-04-27
**Pattern:** `write_space_route` — zo.space page + API routes


- [[KEYTERM-TAP-THE-VEIN]]

## 0. What This Is

A daily 750-word shadow practice page at `wendellbritt.zo.space/tap-the-vein`, written as zo.space routes (not a separate Zo Site). The write surface, analytics engine, and recap system all live inside zo.space.

**Key constraint:** The existing Zo Site at `/home/workspace/tap-the-vein/` was built wrong — it was created as a separate project when it should have been a zo.space page. This spec corrects that.

## 1. Architecture

```
wendellbritt.zo.space/tap-the-vein    ← write surface (page route)
wendellbritt.zo.space/tap-the-vein/weekly  ← weekly recap (page route)
wendellbritt.zo.space/api/tap-the-vein/entry  ← POST: submit entry, run analytics
wendellbritt.zo.space/api/tap-the-vein/recap   ← GET: fetch recap by type + date
wendellbritt.zo.space/api/tap-the-vein/entries ← GET: list entries for a date range
```

**DB location:** `~/tap-the-vein/data.db` (workspace path, owned by you)
**Fallback:** `~/.z/tap-the-vein.db` if workspace writes are sandboxed

**Stack:**
- Page routes: React + Tailwind (standard zo.space pattern)
- API routes: Hono (built into zo.space)
- Database: SQLite via `better-sqlite3` (Node.js native binding)
- Analytics: rule-based signal map (in-memory, runs in API handler)

## 2. DB Schema

```sql
CREATE TABLE IF NOT EXISTS tap_entries (
  id TEXT PRIMARY KEY,
  word_count INTEGER NOT NULL,
  session_seconds INTEGER NOT NULL,
  ea_channel TEXT NOT NULL,
  charge_strength TEXT NOT NULL,
  bar_phrases TEXT NOT NULL,
  theme_tags TEXT NOT NULL DEFAULT '[]',
  vibeulon_flag INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_tap_entries_created ON tap_entries(created_at);
```

**Key decision:** Only the analytics output is stored (not the raw text). The write is sacred — raw text is never persisted. Only the extracted signals go to the DB.

## 3. Routes

### 3.1 `/tap-the-vein` — Write Surface
- Full-screen dark write surface
- Word counter: `Words N / 750`
- Session timer (optional)
- Submit button activates at 750+ words
- On submit: POST to `/api/tap-the-vein/entry`, receive analytics, show recap card

### 3.2 `/tap-the-vein/weekly` — Weekly Recap
- EA channel distribution (bar chart — CSS only, no Recharts dependency)
- Charge strength distribution
- BAR phrases collected this week (all entries)
- 7-day writing streak
- Comparison to prior week
- "Begin 321" CTA if strong/intense charge patterns found

### 3.3 `/api/tap-the-vein/entry` — POST
Input: `{ text: string, wordCount: number, sessionSeconds: number }`
Process:
1. Run analytics on text (EA channel, charge strength, BAR phrases)
2. Persist only the analytics output to `tap_entries`
3. Return `{ entryId, eaChannel, chargeStrength, barPhrases, autoSummary }`

### 3.4 `/api/tap-the-vein/recap` — GET
Query params: `?type=daily&date=2026-04-27`
Returns recap data for the requested type and date range.

### 3.5 `/api/tap-the-vein/entries` — GET
Query params: `?from=2026-04-20&to=2026-04-27`
Returns all entries for the date range (for weekly/monthly aggregation).

## 4. Analytics Engine

### 4.1 EA Channel Detection
Rule-based keyword signal map (canonical EA emotions):

| Channel | Keywords (dissatisfied) |
|---|---|
See also: [[KEYTERM-TAP-THE-VEIN.md]]
| metal | loss, sharp, cut, grief, alone, precious, break, irreversible |
| water | heavy, stuck, slow, empty, drain, long, tired, give up |
| wood | expand, see, new, fresh, want, desire, pull toward, interest |
| fire | hot, push, burn, fight, unfair, right, mine, control, angry |
| earth | steady, neutral, wait, still, hold, ground, practical, settle |

Detection: count keyword matches per channel, divide by word count, multiply by 1000 = score. Highest score wins.

### 4.2 Charge Strength
`charge_strength = min(4, floor(wordCount / 100) + keywordDensity * 10)`
- none: <50 words or no keywords
- mild: 50-200 words, 1-2 keyword matches
- moderate: 200-400 words, 3-5 matches
- strong: 400-700 words, 6-8 matches
- intense: 750+ words, 9+ matches

### 4.3 BAR Phrase Extraction
Rules:
- 1-3 sentences
- Contains game-world-ready image, character beat, or world detail
- No meta-commentary ("I think", "In my opinion", "This shows")
- Surfaces 0-5 phrases per entry
- User can mark a phrase as BAR (future Phase 2)

## 5. Design System

**Aesthetic:** bars-engine — dark, warm, intentional
- Background: `#0c0c0f` (near black)
- Surface: `#161618` (dark zinc)
- Primary text: `#fafafa`
- Secondary text: `#71717a`
- Accent: `#ef4444` (fire-channel red) — used for word count, submit button
- EA channel colors on recap cards (subtle background wash)

**Typography:** System fonts (Tailwind default)

**Layout:** Full-screen write surface, minimal chrome during writing, recap surfaces as card after submit.

## 6. Privacy Model

**What is stored:**
- Entry ID, word count, session duration
- EA channel, charge strength (numeric/enum values)
- BAR phrases (extracted text, user-approved)
- Theme tags
- Vibeulon flag
- Timestamp

**What is NOT stored:**
- Raw write text (never persisted — sacred)
- User identity (Phase 1: single user, no auth)

## 7. Dependencies and Constraints

**Zo.space pre-installed packages:**
- `react`, `react-dom` (19.x)
- `lucide-react` for icons
- Tailwind CSS 4 (`@tailwindcss/vite`)
- `hono` for API routes

**NOT available on zo.space:**
- `recharts` (not installed) — use CSS bar chart instead
- `better-sqlite3` (native binding) — may not work in Bun runtime
- Prisma (requires native bindings)

**DB approach:** In-memory store for Phase 1 (JavaScript Map). Persisted to JSON file at `~/tap-the-vein/entries.json`. This avoids native binding issues entirely and is sufficient for single-user Phase 1.

**Future Phase 2:** SQLite via `better-sqlite3` when deployed as standalone Zo Site with Node.js runtime.

## 8. Implementation Order

1. `mkdir -p ~/tap-the-vein/`
2. `write_space_route` `/tap-the-vein` — write surface page
3. `write_space_route` `/tap-the-vein/weekly` — weekly recap page
4. `write_space_route` `/api/tap-the-vein/entry` — POST handler
5. `write_space_route` `/api/tap-the-vein/recap` — GET handler
6. `write_space_route` `/api/tap-the-vein/entries` — list entries
7. Create analytics utility as module in route code
8. Test: write 750 words, see analytics, view weekly recap

## 9. 321 Integration

When charge is strong or intense, recap card shows:
> "Metal/Fear signal detected (strong). The 321 is recommended."
> **[Begin 321 →](/shadow/321?tapEntryId={entryId})**

Deep-link opens the 321 page with `tapEntryId` query param pre-seeded. The 321 page reads the tap entry analytics and pre-fills the opening charge.

## 10. Phase Scope

### Phase 1 (this build)
- Write surface at `/tap-the-vein`
- Weekly recap at `/tap-the-vein/weekly`
- Analytics: EA channel, charge strength, BAR phrases
- In-memory + JSON file persistence
- 321 CTA on recap card
- bars-engine aesthetic

### Phase 2 (future)
- SQLite DB (native bindings resolved)
- Monthly/quarterly/yearly recaps
- Multi-user auth
- Export BAR phrases to bars-engine
- Theme tag customization
- Calrunia material flagging