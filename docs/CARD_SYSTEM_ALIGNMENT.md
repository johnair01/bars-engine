# Card System Alignment — CultivationCard ↔ Allyship Deck

**Status**: Design governance note. Records the decision that the Emotional Alchemy practice surfaces speak the **Allyship Deck** design language, and the follow-up recommendation to converge `CultivationCard` toward it.
**Trigger**: aligning the Emotional Alchemy practice card (Practice Atlas target 3 UX) with the rest of *Mastering the Game of Allyship*.

---

## The two card systems (today)

The app has **two distinct card visual languages**, and they theme by **different axes**:

| | **CultivationCard** | **Allyship Deck** (`AllyshipCard`) |
|---|---|---|
| Home | `src/components/ui/CultivationCard.tsx` + `UI_COVENANT.md` | `src/components/deck/AllyshipCard.tsx` + `src/lib/allyship-deck/card-visuals.ts` |
| Styling | Tailwind + CSS classes (`cultivation-cards.css`), CSS custom properties | **Inline styles**, token objects |
| Signature | Wuxing frame/glow, altitude border, stage density | **`DECK_GOLD` #C9A84C** 2px edge + ♦ accent, "Struck Gold" foil back |
| Fonts | app sans (Geist) | **`DECK_FONTS`** — Jost / Nunito / Space Mono |
| Themed by | **element** (`element` prop) | **move** — `themeForMove(move)`: show_up→fire, grow_up→wood, clean_up→water, wake_up→earth, open_up→liminal purple |
| Encodes | element · altitude · stage (three channels) | move · operation (face) · domain |

**Two element mappings coexist and must not be confused:**
- **Emotion → element** (`EMOTION_TO_ELEMENT`, this module): anger→fire, sadness→water, fear→metal, joy→wood, neutrality→earth. Drives the diagnostic's channel accent.
- **Move → element** (`MOVE_ELEMENT` / `themeForMove`, the deck): the five WAVE moves → element themes. Drives the deck card's color.

These are different axes on purpose (a charge's *feeling* vs a card's *move*). A Show Up card is fire because of the **move**, not because the player is angry.

---

## Decision (shipped)

The Allyship Deck is the flagship card system of MTGOA, and the practice card **flows from a deck draw** — so it belongs to the deck family, not the Wuxing CultivationCard family. (The deck-literacy spec already says the deck "is its own surface … never `CultivationCard`.")

1. **Practice card → Allyship Deck language.** `PracticeCard` is rendered with `DECK_GOLD` frame, `DECK_FONTS`, `themeForMove`, the move glyph, and deck inline-style — reusing `card-visuals.ts`. **CultivationCard is retired from the practice surface.**
2. **Theme by the drawn move**, not the emotion. `themeForMove(drawnCard.move)` drives the card; the **emotional channel** appears as a *secondary accent* (a gem dot + "Anger 6" label — the charge's signature inside the drawn card). Chosen because the card you drew becomes the practice — one continuous identity.
3. **The diagnostic stays raw** (pre-card). Only the formed practice card adopts deck gold/fonts. This preserves **UI_COVENANT law 10** — pre-card must look distinct from post-card — so the deck-gold "formation" still lands as the payoff. The diagnostic keeps the app-sans SceneCard register.

Result: `charge → (raw diagnostic) → The Read (threshold, first element accent) → draw an Allyship card → (gold-framed practice card)`. Pre-card and post-card are now visibly different families, and the post-card is unmistakably a deck card.

---

## Follow-up recommendation — adjust CultivationCard (not yet built)

CultivationCard and the deck should **converge on the gold-framed deck identity** so the whole app reads as one card game, not two. This is a larger, cross-cutting change (every CultivationCard consumer) and is **filed here as a recommendation, not done in this slice**:

- **R1 — Gold edge on CultivationCard.** Add the `DECK_GOLD` 2px edge + `INSET_TOP` highlight as the shared brand frame, so a CultivationCard and an AllyshipCard read as siblings. Keep the Wuxing element as the *interior* gradient/glow (CultivationCard's element channel stays meaningful).
- **R2 — Shared font stack.** Move CultivationCard surfaces onto `DECK_FONTS` (display Jost, mono Space Mono) for card chrome, keeping the pre-card raw surfaces on app sans.
- **R3 — One tokens source.** `card-visuals.ts` already re-derives from `card-tokens.ts` (`ELEMENT_TOKENS`); factor the shared frame constants (`DECK_GOLD`, `INSET_TOP`, the radial-gradient recipe) into one place both card systems import, so the gold edge can never drift.
- **R4 — Covenant update.** When R1–R3 land, amend `UI_COVENANT.md` law 3 (card anatomy) to include the gold edge as a brand constant and cross-reference this note.

Scope/owner TBD — this touches `NationCardWithModal`, `SceneCard`-adjacent card tiles, and every `CultivationCard` consumer. Recommend a dedicated spec kit (`card-system-convergence`) before implementing.

---

## References
- `src/lib/allyship-deck/card-visuals.ts` (`DECK_GOLD`, `INSET_TOP`, `DECK_FONTS`, `themeForMove`, `MOVE_ICON_PATHS`)
- `src/components/deck/AllyshipCard.tsx` (deck card reference)
- `src/components/practice/PracticeCard.tsx`, `DeckDrawReveal.tsx` (the aligned practice surfaces)
- `UI_COVENANT.md` (law 10 pre/post-card; law 3 anatomy — see R4)
- `.specify/specs/emotional-alchemy-diagnostic/DESIGN_HANDOFF.md` (post-card contract, updated)
- `.specify/specs/allyship-deck-literacy/spec.md` ("the deck is its own surface")
