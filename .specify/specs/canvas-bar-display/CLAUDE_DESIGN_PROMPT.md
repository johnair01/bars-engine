# Paste this into Claude Design

---

Design a mobile UI for "BARs Engine" — a dark, mystical journaling app where players capture emotional moments as draggable stickers on a phone-frame canvas (like Instagram Stories). The app has a Wuxing (five-element) theme: fire, water, wood, metal, earth — each with its own gem color.

**Design system:**
- Background: `#0a0908` (warm near-black)
- Surface: `#14151a`
- Text: `#e8e6e0` / muted `rgba(232,226,218,0.55)`
- Accent: `#7c3aed` (liminal purple)
- Fonts: Jost (headings, 700), Nunito (body), Space Mono (metadata/mono)
- Element gem colors: fire `#e05c2e` · water `#3b82c4` · wood `#2ecc71` · metal `#c0c0c0` · earth `#c8a84b`

---

## What to design

### Screen 1A — BAR Detail Page (canvas BAR, default view)

A player created a BAR on the canvas with:
- Element: **water** (gem `#3b82c4`, subtle blue top glow)
- Charge level: **4 out of 5** (label: "hard to shake")
- One text sticker: *"I went quiet in the meeting again."* (Nunito 700, 27px, water blue, rotated -2°, positioned center-upper canvas)
- One photo sticker (small polaroid-style card, slightly rotated, lower canvas)
- Intent: "reflection"

Show the full mobile detail page (390px wide), scrollable:

**Top section — Canvas preview block:**
- Phone-frame shape (border-radius 38px), 360px wide, centered, aspect ratio 392:812
- Field background: radial blue glow at top (water element), subtle diagonal grid lines, dark gradient, vignette (stronger at bottom)
- Text sticker rendered in position (water blue, Nunito 700)
- Photo sticker rendered in position (polaroid-style, slightly rotated)
- No UI chrome (no buttons, no status bar, no tool rail)
- Feels like a "living polaroid" — not a flat screenshot

**Below the canvas:**
- Element + charge row: ◇ water · [5 dots, 4 filled in water blue] · "hard to shake" (Space Mono 10px, muted)
- Intent line: `intent · reflection` (Space Mono 9px, very muted)
- Thin divider
- "Face / Back" tab strip (Nunito, small, muted tabs)
- Face tab content: if the BAR has a written description it shows here; if not, shows a soft prompt like "Add a note to this moment →" (muted, tappable)
- Action buttons row: "Tune →" (purple filled), "Share" (ghost), "Send" (ghost)
- Share history section (collapsible, Space Mono labels)

---

### Screen 1B — BAR Detail Page (Back tab open)

Same page, Back tab selected. Shows:
- Canvas preview still visible at top (same frozen state)
- Below: editable description textarea (dark input, placeholder "What does this moment mean to you?")
- Tags row: pill inputs, placeholder "add tag…"
- Save / Cancel buttons

---

### Screen 2 — BAR Feed Cards (side by side comparison)

Show two feed cards at full width (390px), stacked:

**Card A — Canvas-captured BAR (water element):**
- Tinted background using water element frame color `#1e3a5f` at low opacity (no photo)
- OR: if a photo exists, show the photo as card background
- Text teaser: *"I went quiet in the meeting again."* (derived from first text sticker)
- Small element badge: ◇ in water blue, top-right corner
- Charge dots: 4 of 5 filled, water blue, bottom-left
- Creator name + timestamp, Space Mono muted

**Card B — Old-format BAR (no element, no canvas):**
- Plain dark surface card
- Text teaser from description field
- No element badge
- Same creator/timestamp treatment

Make the two cards feel like the same family but clearly distinguishable. The canvas card should feel more alive.

---

### Screen 3 — Edge case: canvas BAR with no text sticker

A canvas BAR that has only a photo sticker and no text. What does the feed card look like with no text to derive?

Options to explore:
- Show a placeholder like "— a moment, captured" (Space Mono, italic-style, very muted)
- Or show just the element sigil large and centered with the element glow
- Or show the photo as background with just the element badge overlay

Design the best option.

---

**Tone:** Dark, ritual, contemplative. Like a spellbook crossed with a journaling app. The moments feel weighted and sacred, not casual. Subtle glows, not neon. The canvas preview should feel like looking through glass at a preserved moment.
