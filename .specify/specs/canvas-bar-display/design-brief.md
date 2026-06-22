# Claude Design Brief: Canvas BAR Display

## Context

BARs Engine is a mobile-first web app where players capture emotionally charged moments ("BARs") as draggable stickers on a phone-frame canvas — like an Instagram Stories composer. The canvas has a dark aesthetic with Wuxing element theming (fire/water/wood/metal/earth), each element having a distinct gem color and glow.

We need to design two screens:
1. **BAR Detail Page** — how a canvas-captured BAR looks when you open it
2. **BAR Feed Card** — how it appears in the list/feed

---

## Design System

**Background**: `#0a0908` (near-black, warm)
**Surface**: `#14151a`
**Text primary**: `#e8e6e0`
**Text muted**: `rgba(232,226,218,0.55)`
**Accent (liminal purple)**: `#7c3aed`

**Fonts**:
- Headings: Jost 700
- Body/labels: Nunito
- Metadata/mono: Space Mono

**Element colors (Wuxing)**:
| Element | Gem | Frame | Glow |
|---------|-----|-------|------|
| fire    | `#e05c2e` | `#7a2a12` | `rgba(224,92,46,0.55)` |
| water   | `#3b82c4` | `#1e3a5f` | `rgba(59,130,196,0.55)` |
| wood    | `#2ecc71` | `#1a5c35` | `rgba(46,204,113,0.55)` |
| metal   | `#c0c0c0` | `#4a4a4a` | `rgba(192,192,192,0.45)` |
| earth   | `#c8a84b` | `#5c4a1e` | `rgba(200,168,75,0.5)` |

---

## The Canvas (for reference)

The existing capture canvas looks like this:
- Phone frame: 392×812px logical, `border-radius: 38px`, dark background
- Field background: subtle radial glow in the active element color at the top, grid lines, dark gradient
- Vignette: `linear-gradient(180deg, rgba(6,7,10,0.55), transparent 20%, transparent 60%, rgba(6,7,10,0.94))`
- Text stickers: Nunito 700, colored by element, `text-shadow: 0 2px 16px rgba(0,0,0,0.85)`, positioned absolutely
- Photo stickers: rounded cards (~118×132px) with box-shadow, slightly rotated
- Element sigils: ◆(fire) ◇(water) ◇(wood) ◇(metal) ◇(earth) — each has a distinct glyph

---

## Screen 1: BAR Detail Page

### Current state (problem)
The detail page at `/bars/{id}` currently shows:
- Creator name + date
- Face/Back tab system: Face tab = photo (if any), Back tab = description text + tags
- Share history list
- Action buttons (Share, Send, Grow)

For canvas-captured BARs, the description is **empty**, so players see a blank shell.

### What needs designing

Show a **read-only canvas preview** (frozen whiteboard) as the hero of the detail page. Design the layout for:

**A. The canvas preview block**
- A scaled-down version of the canvas (phone-frame shape, same 392:812 aspect ratio)
- Max width 360px on mobile, centered
- Shows the frozen stickers exactly where they were placed
- The field background glow pulses very subtly (or is static — design call)
- No UI chrome (no tool rail, no bottom buttons, no status bar)
- Should feel like a "polaroid" of the captured moment

**B. Element + charge row** (below the canvas)
- Left: element sigil (e.g. ◇) + element name (e.g. "water"), colored with element gem color, subtle glow
- Right: charge level — 5 dots (●○○○○ style), filled dots colored with element gem, label like "hard to shake" (charge 4 label)

**C. Intent/story line** (if present)
- The player may have set an intent like "reflection" or "gift"
- Shows below the element row in Space Mono 10px muted, like: `intent · reflection`

**D. The rest of the page below**
- The existing face/back tab content (description, tags) stays below — now used for players who want to add written notes to their canvas capture
- Share history, action buttons — unchanged

**Design questions to resolve:**
1. Should the canvas preview crop to just the sticker zone (removing the black edges), or show the full phone frame with rounded corners as a decorative element?
2. Do the element badge and charge dots live as an overlay at the bottom of the canvas frame (like a caption strip), or as a separate row beneath it?
3. Does the detail page scroll (canvas preview is above the fold, rest scrolls), or is it a fixed layout?

---

## Screen 2: BAR Feed Card

### Current state (problem)
The feed at `/bars` shows BAR cards with:
- An image (if the BAR has a photo attachment)
- The first line of the `description` field as a text teaser

Canvas-captured BARs have no `description`, so the card shows blank or missing text.

### What needs designing

**A. Canvas BAR card variant**
The feed card for a canvas-captured BAR should show:
- The first text sticker content as the teaser (e.g. "I went quiet in the meeting again.")
- Element sigil in a small corner badge (top-right or bottom-left), colored with element gem
- If the BAR has a photo sticker, use that as the card image (same as before)
- If no photo, use the element color as a subtle tinted background (the element frame color at low opacity)

**B. Comparison: old-format card vs canvas card**
Design both side-by-side so we can see the family resemblance and differences.

**Design questions to resolve:**
1. Should canvas cards have a distinct visual marker so players know it was canvas-captured (vs. form-entered)? Or should they look identical?
2. Should the element color bleed into the card background when there's no image?
3. Where does the element sigil badge live — overlay on the card, or in the text metadata row?

---

## Constraints

- Mobile-first: primary viewport is 390px wide
- Dark mode only
- The canvas preview must feel like a **living artifact** — not just a screenshot. Subtle element glow, the vignette overlay. It should feel like the moment is still present.
- Old-format BARs must render identically to today — no regression

---

## Deliverables Requested

1. **Detail page mockup** — mobile, showing a canvas BAR with a water-element text sticker ("I went quiet in the meeting again.") and charge level 4. Show the full page scroll.
2. **Detail page mockup** — same page but with the face/back tab open to "Back" (showing description field, now editable/addable after the canvas).
3. **Feed card pair** — canvas BAR card next to an old-format BAR card, same width, showing the visual difference and family resemblance.
4. **Edge case: no text sticker** — a canvas BAR that only has a photo sticker. What does the feed card look like?
