# Tasks: Inner Garden — Chapter 1 BAR → Deck

**Spec**: [SPEC.md](./SPEC.md)  
**Plan**: [PLAN.md](./PLAN.md)

## Phase A — Vertical slice (MVP)

### Data & systems

- [ ] **A1**: Define `BarRecord` shape in code + constructor/factory (matches SPEC minimum fields).
- [ ] **A2**: Define `GameCard` shape + `mintCardFromBar(barId)` (single kind for Ch.1 is OK).
- [ ] **A3**: Deck owner service: add/remove/list cards; maintain `order` or equivalent; handle `spent` (or removal from playable list).
- [ ] **A4**: Wire deck owner into `Game.js` construction and game loop tick if needed (or event-only).

### Persistence

- [ ] **A5**: Extend `SaveManager.serialize` with `bars` + `deck` (see SPEC).
- [ ] **A6**: Extend `applySave` + deserialize path; bump `SAVE_VERSION`; **migrate** missing keys to empty arrays.
- [ ] **A7**: Autosave after BAR submit, after mint, after card spend (match existing autosave patterns).

### UI

- [ ] **A8**: BAR capture UI: B/A/R fields, validation, submit, cancel.
- [ ] **A9**: Replace or redirect **journal** entry point to BAR per PLAN migration letter (document in PR).
- [ ] **A10**: Menu **Deck** tab: list cards (title, kind, spent); empty state copy.

### Chapter rail & spend

- [ ] **A11**: Quest/story flags for intro sequence (SPEC P4).
- [ ] **A12**: NPC or dialog line on `first_card_minted` (reuse `StoryScript` / `SceneManager` patterns).
- [ ] **A13**: Implement **one** `spendCard*(...)` non-combat action per SPEC; player-visible feedback.
- [ ] **A14**: Set chapter-complete (or slice-complete) flag when A13 done + optional NPC acknowledgment.

### Docs & hygiene

- [ ] **A15**: Link this spec kit from `inner-garden/DESIGN.md` or `BACKLOG.md` in **one line** (optional but recommended).
- [ ] **A16**: Add `REFERENCES` note in `SPEC_DECK_MECHANICS.md` top: “Chapter 1 uses BAR-first capture; journal language for ♦ may map to BAR `activation` + `result` — TBD.”

### Verification

- [ ] **A17**: **L3 manual script** (paste into PR or `inner-garden/docs/MANUAL_TEST-ch1-bar-deck.md`): new game → BAR → mint → deck visible → spend → reload → verify localStorage JSON.
- [ ] **A18**: If test harness exists in repo, add minimal L2 test for save shape; else skip with note in PR.

---

## Phase B — 321 capstone (post–Phase A)

- [ ] **B1**: Design minimal in-game **321** flow (3 fields / steps or import from bars-engine doc `INTEGRAL-DESIGN-321-VAULT-BRIDGE-PLAN.md` if relevant).
- [ ] **B2**: Gate unlock behind `ch1_bar_deck_complete` (or equivalent).
- [ ] **B3**: Apply **skill/ability** reward (stat bump, passive flag, or new player capability bit).
- [ ] **B4**: Update SPEC **Open questions** with resolved BAR parity notes after bars-engine field audit.

---

## Bridge track — bars-engine convergence

### L0/L1 humane bridge (export only)

- [x] **BR0**: Add `BAR_CHARGE_BRIDGE.md` vocabulary, field map, and Bridge JSON v0 example.
- [x] **BR1**: Add inner-garden bridge mapping helpers (`BarChargeBridge.js`) for emotion and intensity normalization.
- [x] **BR2**: Add `DeckSystem.exportBridgePayloadForCard(cardId)` with raw B/A/R + bars-engine `CreateChargeBarPayload` subset.
- [x] **BR3**: Add Deck tab export hotkey (`E`) that copies JSON when allowed and always saves it to `localStorage.inner_garden_last_bridge_export`.

### Future bridge work

- [ ] **BR4**: Add import/prefill path for bars-engine `charge_capture` exports as append-only local records.
- [ ] **BR5**: Add bars-engine “Open in Inner Garden” deep link after export/import is boring.
- [ ] **BR6**: Design account link / live sync only after BR4–BR5 are stable.

---

## Completion criteria

- All **Phase A** tasks **A1–A18** checked (A18 may be explicitly N/A with justification).
- SPEC [Verification](./SPEC.md#verification-tests) L3 passes.

## Notes

- **Spec kit ID** for cross-reference: `inner-garden-chapter1-bar-deck`.
- Strand / bars-engine promotion: consult outputs feed this kit per vault `STRAND-Obsidian-Multi-Context-Library.md`; implementation authority remains these three files until superseded.
