# SPEC: Bridge zo.space/321 → bars-engine/BAR-seed
**Version:** 1.0
**Date:** 2026-04-27
**Status:** Draft — for author approval

---
See also: [[KEYTERM-BOOK]]


- [[KEYTERM-SHADOW-PROCESS]]

## The Gap

The `/shadow/321` page ends with: *"Take it into bars-engine."* But zo.space and bars-engine are separate deployed products. No data flows between them.

Current flow:
```
zo.space/shadow/321 → "Continue in bars-engine" (manual link) → user opens bars-engine.vercel.app → re-enters what they wrote → BAR seed created manually
```

**The problem:** The 321 output (the shadow seed text) lives in the zo.space browser session storage. It never reaches bars-engine. The user has to copy-paste their own work across products — which breaks the somatic momentum of the practice.

---

## The Bridge — Two Options

### Option A: Deep Integration (API-to-API)
zo.space POSTs the 321 output to a bars-engine endpoint. bars-engine creates the BAR seed. User gets a notification in bars-engine that their 321 is ready.

**Pros:** Seamless, automated, impressive
**Cons:** bars-engine is a separate Vercel deploy — requires CORS, auth, endpoint maintenance. More fragile. Could block on bars-engine dev capacity.

### Option B: Light Bridge (Shared State via Obsidian)
zo.space saves the 321 output as a file in a synced Obsidian folder. bars-engine reads from that folder. OR: zo.space opens a pre-filled bars-engine URL with the 321 text as a URL parameter.

**Pros:** No API coupling, works with current architecture, leverage existing Obsidian sync
**Cons:** Less magical, URL params have length limits

---

## Recommendation

**Option B (light bridge) is the right first move.** Here's why:
- bars-engine is actively being built — API integration can wait until it's more stable
- Obsidian sync is already working — the 321 output can live in the user's second brain
- URL param prefill works for short-to-medium text and requires zero backend change

**Future:** Option A can be revisited once bars-engine has a stable API and the user wants a more seamless flow.

---

## Option B Implementation

### Path 1: Pre-fill URL (immediate)
1. Modify `shadow/321` page → on "Continue in bars-engine" click, build a URL:
   ```
   https://bars-engine.vercel.app/shadow/321?seed=<encoded_321_output>&from=zo
   ```
2. bars-engine `/shadow/321` route reads `seed` param and pre-fills the BAR seed form
3. User reviews, edits, confirms → creates BAR seed in bars-engine

**Limitation:** URL params have ~2KB limit. 321 output can be longer. Use first-person + belief fields only for the prefilled seed, not the full 3-2-1.

### Path 2: Obsidian capture (most reliable)
1. Add a step to `/shadow/321` → before "Continue in bars-engine", save output to a local file
2. File lives in a synced folder: `The Library/07 Book OS/SHADOW_SEEDS/<date>_321.md`
3. bars-engine has a corresponding ingestion trigger that picks up files from this folder

**Advantage:** Full 321 text preserved. No length limits. Works offline. Complements the editing session workflow.

### Path 3: Zo Ask API (middle ground)
1. zo.space POSTs 321 output to `/zo/ask` with instruction: "Create a BAR seed from this 321 output"
2. Zo creates the BAR seed as a file in a shared space
3. bars-engine reads from shared space

**Note:** Requires `ZO_API_KEY` setup. More infrastructure. But keeps everything inside Zo ecosystem.

---

## Implementation Plan

**Phase 1 (now):** Path 2 — Obsidian capture
**Phase 2 (later):** Path 3 — Zo Ask API

### Phase 1: Obsidian Capture (immediate)

```
shadow/321 completion → 
  → write to: The Library/07 Book OS/SHADOW_SEEDS/YYYY-MM-DD_321.md
  → "Continue in bars-engine" button → link to bars-engine/shadow/321
  → bars-engine checks SHADOW_SEEDS folder for unprocessed seeds
```

**Changes needed:**
1. zo.space `shadow/321` — on completion, add "Save to Obsidian" step before the bars-engine link
2. File format: `SHADOW_SEEDS/YYYY-MM-DD_321.md` — date-stamped, full 321 text preserved
3. bars-engine `shadow/321` — check `SHADOW_SEEDS/` folder on load, present unprocessed seeds

### Phase 2: Zo Ask API (deferred)

zo.space POSTs 321 output to `/zo/ask` → Zo creates the BAR seed file in shared space → bars-engine reads.

**Requires:** `ZO_API_KEY` setup, bars-engine SHADOW_SEEDS inbox, endpoint maintenance.

---

## What Needs to Change

### Phase 1

### zo.space (`/shadow/321`)
- Add a step before the bars-engine link: "Save this 321 to Obsidian"
- Write output to a dated `.md` file in `The Library/07 Book OS/SHADOW_SEEDS/`
- Show the file path in the UI

### bars-engine
- Add a `SHADOW_SEEDS` ingestion folder check on startup or on demand
- Read new `.md` files, parse as BAR seed candidates
- Present to user as "Unprocessed 321 seeds" in the shadow/321 UI

### Obsidian
- Already synced via existing setup — no changes needed
- Already the destination for the editing session notes

---

## What This Enables

Once the bridge works:
1. 321 practice → shadow seed auto-captured
2. Editing session → uses shadow seeds as source material
3. BAR engine → draws from real emotional material, not generic prompts
4. Obsidian → becomes the hub between zo.space somatic practice and bars-engine product work

---

## Ownership

| Component | Owner | Status |
|-----------|-------|--------|
| zo.space 321 modification | Zo (this chat) | Can do now |
| bars-engine SHADOW_SEEDS ingestion | bars-engine repo | Needs separate chat |
| Obsidian sync | Already working | Confirmed |

---

*Spec status: Approved — Phase 1 (Path 2) active, Phase 2 (Path 3) deferred*
- [[KEYTERM_BAR_PIPELINE]]
