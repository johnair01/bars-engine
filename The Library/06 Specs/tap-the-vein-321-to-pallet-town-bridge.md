# Tap the Vein × 321 → Pallet Town Bridge
**Status:** Draft
**Owner:** Architect
**Created:** 2026-04-28
**Pattern:** `localStorage` handoff — zero backend, no auth, same browser
**Blocks:** `tap-the-vein-pipeline-gap-analysis.md` Section 3a.2 and 3b.3

---
See also: [[KEYTERM-TAP-THE-VEIN.md]]


- [[KEYTERM-TAP-THE-VEIN]]

## 0. What This Is

A zero-backend bridge between the zo.space Tap the Vein / 321 pages and the Pallet Town game. All data flows through `localStorage` in the user's browser. No database writes, no API calls, no cross-origin communication.

**Why localStorage:**
- All three pages (Tap the Vein, 321, Pallet Town) share the same zo.space origin
- `localStorage` is accessible across all three
- No auth complexity — Phase 1 is single-user
- Falls apart immediately when multi-user is added (Phase 2 concern)

---

## 1. The Two Entry Points to Pallet Town

### Path A — No Charge, Just Distill (Tap the Vein → Distill)

```
User writes in Tap the Vein
→ charge is mild/none
→ no "Begin 321" CTA
→ Recap card: "Distill the meaning" button
```

**What Distill does:**
- Opens a modal showing the raw BAR phrase(s)
- User edits/refines the phrase
- "Send to Pallet Town" button
- Stores refined phrase in `localStorage` keyed to `tap-the-vein:distill:{tapEntryId}`
- Does NOT trigger 321

### Path B — Strong Charge, 321 Descent (Tap the Vein → 321 → Pallet Town)

```
User writes in Tap the Vein
→ charge is strong/intense
→ "Begin 321" CTA
→ 321 session completes
→ bars-seed is generated
→ "Continue in Pallet Town" button
→ Bars-seed stored in localStorage
```

---

## 2. localStorage Key Schema

### For Path A (Distill — no 321)

```
Key:   tap-the-vein:distill:{tapEntryId}
Value: {
  phrase: string,           // refined BAR phrase
  ea_channel: string,       // corrected EA channel
  sent_to_pallet: boolean,
  sent_at: timestamp
}
```

### For Path B (321 completion)

```
Key:   321:pallet-town:{sessionId}
Value: {
  bars_seed: string,        // 1-2 sentence summary
  ea_channel: string,       // locked at 321 start
  tap_entry_id: string,     // link back to Tap the Vein
  mask_name?: string,
  aligned_action?: string,
  sent_to_pallet: boolean,
  sent_at?: timestamp
}
```

### Pallet Town reads from

```
Key:   pallet-town:pending-bars
Value: Array<{
  id: string,               // source: "tap-the-vein:distill:{id}" | "321:{id}"
  phrase: string,           // the text to pre-fill
  ea_channel: string,      // EA channel for coloring
  source: 'tap-distill' | '321-bars-seed',
  queued_at: timestamp
}>
```

**Queue design:** Multiple items can be queued. Pallet Town processes in order when user approaches the shadows room BAR artifact.

---

## 3. Bridge Flow — Path A (Distill)

### 3a.1 — Distill the meaning (Tap the Vein recap)

After analytics run, if no charge (or mild), the recap card shows:

```
BAR phrase extracted:

  "The player walked through the shadow forest and felt the weight of their ancestors pressing down on them"

[Edit / Refine]
[Send to Pallet Town →]
```

**"Send to Pallet Town" click:**
1. User edits/refines the phrase in the modal
2. Push to `pallet-town:pending-bars`:
   ```javascript
   const queue = JSON.parse(localStorage.getItem('pallet-town:pending-bars') || '[]')
   queue.push({
     id: crypto.randomUUID(),
     phrase: refinedPhrase,
     ea_channel: correctedOrDetectedChannel,
     source: 'tap-distill',
     queued_at: new Date().toISOString()
   })
   localStorage.setItem('pallet-town:pending-bars', JSON.stringify(queue))
   ```
3. Show confirmation: "Sent to Pallet Town. Enter the Room of Shadows when ready."

**No automatic navigation** — user navigates to Pallet Town themselves. The phrase waits in the queue.

### 3a.2 — Pallet Town reads queue

When user approaches the shadows room BAR artifact:

```javascript
const queue = JSON.parse(localStorage.getItem('pallet-town:pending-bars') || '[]')
const next = queue.find(item => item.source === 'tap-distill')
if (next) {
  // Pre-fill encode modal with next.phrase
  // Remove from queue after user confirms (or explicitly keeps)
}
```

**Pre-fill behavior:**
- Modal shows the queued phrase in the textarea
- User can edit before confirming
- On confirm: BAR is sealed, phrase is removed from queue
- On cancel: phrase stays in queue (user can return later)

---

## 4. Bridge Flow — Path B (321 → Pallet Town)

### 3b.1 — 321 session completes

After 321 dialogue is complete, the completion screen shows:

```
Your bars-seed:

  "I carry the weight of my father's expectations as a shadow I can now see and alchemize."

[Continue in Pallet Town →]
```

**"Continue in Pallet Town" click:**
1. Store bars-seed:
   ```javascript
   localStorage.setItem(`321:pallet-town:${sessionId}`, JSON.stringify({
     bars_seed: barsSeedText,
     ea_channel: eaChannelLocked,
     tap_entry_id: tapEntryId,
     mask_name: maskName,
     aligned_action: alignedAction,
     sent_to_pallet: false,
     sent_at: null
   }))
   ```
2. Push to queue:
   ```javascript
   const queue = JSON.parse(localStorage.getItem('pallet-town:pending-bars') || '[]')
   queue.push({
     id: `321:${sessionId}`,
     phrase: barsSeedText,
     ea_channel: eaChannelLocked,
     source: '321-bars-seed',
     queued_at: new Date().toISOString()
   })
   localStorage.setItem('pallet-town:pending-bars', JSON.stringify(queue))
   ```
3. Show confirmation: "Sent to Pallet Town. Enter the Room of Shadows to forge your BAR."

### 3b.2 — Pallet Town reads queue (same logic as 3a.2)

Same as above — `tap-distill` and `321-bars-seed` are processed identically in the queue. Both get pre-filled in the shadows room encode modal.

**Differentiation:** The `source` field is used to:
- Show a subtle indicator in the pre-fill ("From 321 session" vs "From Tap the Vein")
- The `ea_channel` drives the color of the pre-filled text in the encode modal

---

## 5. Pallet Town Encode Modal Changes

### Pre-fill logic

```typescript
function getPreFillText(): string | null {
  const queue = JSON.parse(localStorage.getItem('pallet-town:pending-bars') || '[]')
  // Prefer 321-bars-seed, then tap-distill
  const item = queue.find(i => i.source === '321-bars-seed') || queue.find(i => i.source === 'tap-distill')
  return item?.phrase ?? null
}
```

### Pre-fill display

```
[BAR ENCODE MODAL]

Source: 321 Bars-Seed (EA: water)
─────────────────────────────────
Your words encoded as a BAR:

[Pre-filled textarea — user can edit]
─────────────────────────────────

[FORGE BAR →]
```

**Visual:** If `ea_channel` is known, the modal border color shifts to match:
- Metal → `#708090` (slate)
- Water → `#3a6a9a` (deep blue)
- Wood → `#4a8a4a` (warm green)
- Fire → `#c04020` (amber-red)
- Earth → `#8a6a3a` (warm brown)

### On confirm

```javascript
// Remove from queue
const queue = JSON.parse(localStorage.getItem('pallet-town:pending-bars') || '[]')
const remaining = queue.filter(item => item.id !== preFilledItemId)
localStorage.setItem('pallet-town:pending-bars', JSON.stringify(remaining))

// Also clean up the 321 source key
if (preFilledItem.source === '321-bars-seed') {
  localStorage.removeItem(`321:pallet-town:${preFilledItem.id.replace('321:','')}`)
}
```

---

## 6. Queue UX — Multiple Items

If user accumulates multiple items in the queue (e.g., 3 Tap the Vein writes + 1 321 session = 4 items):

**Option selected:** Sequential processing, oldest first.

When user approaches shadows room BAR artifact:
1. Show queue count: "3 items waiting. Oldest first."
2. Pre-fill with the first item
3. On confirm: auto-load the next item
4. On skip: leave in queue, move to next
5. When queue is empty: show normal (empty) encode modal

**"Skip" button:** Appears in modal when queue has more than 1 item. Skips current item to next.

---

## 7. Pre-Seeding via URL Param (Alternative Entry)

If user deep-links directly to Pallet Town with a `?bars_seed=X` or `?tap_entry=Y` param:

```
https://wendellbritt.zo.space/pallet-town?bars_seed=I+carry+the+weight+of+my+father
```

On Pallet Town load:
1. Check URL params for `bars_seed` or `tap_entry_id`
2. If found, inject into `pallet-town:pending-bars` queue as highest priority
3. Navigate to shadows room on load (auto-enter from overworld)

**This is the primary bridge mechanism** — 321 completion page can link directly:
```
/pallet-town?bars_seed={encoded_bars_seed}&ea_channel={channel}&mask={mask_name}
```

---

## 8. Data Lifetimes

| Key | Lifetime | Cleanup |
|---|---|---|
| `tap-the-vein:distill:{id}` | Until consumed or 7 days | Auto-expire after 7 days |
| `321:pallet-town:{id}` | Until consumed | Removed on Pallet Town confirm |
| `pallet-town:pending-bars` | Until all items consumed | Auto-empty when queue empty |
| Pallet Town `roomState` | Indefinite (localStorage) | Until user resets |

**Expiry rule:** On Tap the Vein load, clean up any `tap-the-vein:distill:*` keys older than 7 days. On 321 load, clean up old `321:pallet-town:*` keys.

---

## 9. Mobile Considerations

- "Send to Pallet Town" button is visible on recap card
- On mobile, Pallet Town is playable via on-screen D-pad
- Queue management (skip, confirm) works with tap, not just keyboard
- URL param deep-link works on mobile browser

---

## 10. Out of Scope (Phase 2)

- Backend persistence (bars-engine Prisma schema)
- Multi-user queue separation
- Daemon emergence triggers
- Export to bars-engine BAR creation API

---

## 11. Implementation Checklist

### Tap the Vein side
- [ ] "Distill the meaning" modal in recap card
- [ ] "Send to Pallet Town" button → push to queue
- [ ] Cleanup old `tap-the-vein:distill:*` on load

### 321 side
- [ ] Completion screen: "Continue in Pallet Town" button
- [ ] Store bars-seed + push to queue on click
- [ ] URL param deep-link (`?bars_seed=X&ea_channel=Y`)

### Pallet Town side
- [ ] Read `pallet-town:pending-bars` on shadows room approach
- [ ] Pre-fill encode modal with queue item
- [ ] "Source" indicator in pre-filled modal (321 vs Tap)
- [ ] EA channel → modal border color
- [ ] Queue navigation (next, skip, empty)
- [ ] Cleanup on confirm

---

*Spec status: DRAFT — ready for build*