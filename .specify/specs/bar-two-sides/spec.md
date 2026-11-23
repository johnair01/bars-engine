# The BAR as one card with two sides

Board `bar-two-sides-look-1`, Wendell's A (2026-11-21): the two-sided card replaces the text box at the Elder, and every BAR surface uses it. This kit is the short spec for slice 1 and names the later slices.

## The card
- **Side 1, the seal.** The word on the front ("Tonight" at the Elder), a seal drawn with the brush by the player (red strokes, 0..1 of the pad, at most 12 strokes of 240 points), and "drawn by you, <date>". A player who does not draw gets a plain seal.
- **Side 2, the moment.** The player's sentence in a hand face, then rows read from that sentence: Reaches, By, Costs. A row appears only when the sentence names it; nothing is guessed. "Given at" always appears (slice 1: "the Heaven sect altar, by the Elder").
- Tap, Enter or Space turns it. With reduced motion it swaps without the flip.
- The record every surface reads: `{ seal: strokes, moment: { sentence, at, given } }`. Code: `public/between/bar-card-data.js` (pure, tested), `public/between/bar-card.js` (draws it, and the drawing pad).

## Slices
1. **Elder's altar (this PR).** `bar.js` asks for the seal first, then the sentence, then holds and returns with the card. The seal and the time live in the tab's sessionStorage (`hq-bar-seal`, `hq-bar-at`).
2. **Server.** The seal is not saved yet: `/api/between/quest-bar` keeps only the sentence. A later slice stores the strokes in the BAR's `plantSnapshot` and returns them.
3. **Farm and character sheet** draw the same `barCard` from the stored record.
4. **Fields from the player.** The back's Voice faced and Weather rows wait for a decision on where those values come from; the sentence does not carry them.
