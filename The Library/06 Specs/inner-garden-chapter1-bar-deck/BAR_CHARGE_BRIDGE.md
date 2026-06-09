---
type: bridge-contract
spec_kit_id: inner-garden-chapter1-bar-deck
title: "BAR ↔ charge_capture Bridge v0"
created: 2026-05-11
status: draft
---

# BAR ↔ charge_capture Bridge v0

This is the **L0/L1 humane bridge** between **inner-garden** and **bars-engine**.

It does **not** define live sync. It defines vocabulary, a lossy-but-explicit field map, and the first export payload shape for player-consented copy/download.

## Vocabulary

| Term | inner-garden | bars-engine |
|------|--------------|-------------|
| **BAR** | Player-authored `behavior` / `activation` / `result` record stored locally in `DeckSystem.bars`. | A broader `CustomBar`; for charge capture specifically, `type: "charge_capture"`. |
| **Charge** | The felt emotional energy that becomes a seed and a Witness card. | The felt signal named through `/capture`; persisted as private `charge_capture`. |
| **Witness card** | Local `GameCard` minted from one BAR; can be spent once for Chapter 1 reflection XP. | Not equivalent to Hand, vibeulons, compost, or quest completion. |
| **Hand** | Not implemented in Chapter 1. | Account/vault surface for charges, drafts, quests, moves, compost. |
| **Compost** | Not implemented; `spent: true` is only a local tombstone. | BAR lifecycle state / archive ecology. |
| **321** | Phase B capstone, not runtime yet. | `/shadow/321?chargeBarId=...` can launch from a charge BAR. |

## Field Map

| inner-garden | bars-engine `CreateChargeBarPayload` | Mapping |
|--------------|--------------------------------------|---------|
| `bar.result` | `summary` | Use `result` as the concise charged line. If missing, fall back to `behavior`. |
| B/A/R block | `context_note` | Preserve full wording as `B: ...\nA: ...\nR: ...`. |
| `emotionTag` | `emotion_channel` | Map known overlap directly; `anxiety` and `shame` currently normalize to `neutrality` with loss note. |
| BAR intensity | `intensity` | inner-garden `20–100` normalized to bars-engine `1–5`. Current export uses `null` unless the BAR has `intensity`. |
| none | `satisfaction` | `null`; never guessed. |
| none | `personal_move` | `null`; never guessed. |

## Bridge JSON v0

```json
{
  "schemaVersion": "ig-bar-charge-bridge.v0",
  "exportedAt": "2026-05-11T16:15:00.000Z",
  "source": "inner-garden",
  "mode": "manual_export",
  "privacy": "player_consented_copy",
  "innerGarden": {
    "bar": {
      "id": "local-bar-id",
      "createdAt": 1770000000000,
      "behavior": "...",
      "activation": "...",
      "result": "...",
      "emotionTag": "anger",
      "source": "player"
    },
    "card": {
      "id": "local-card-id",
      "title": "Witness · ...",
      "kind": "witness",
      "spent": false
    }
  },
  "barsEngine": {
    "customBarType": "charge_capture",
    "createChargeBarPayload": {
      "summary": "...",
      "emotion_channel": "anger",
      "intensity": null,
      "satisfaction": null,
      "context_note": "B: ...\nA: ...\nR: ...",
      "personal_move": null
    }
  },
  "lossNotes": [
    "satisfaction not captured in inner-garden Chapter 1",
    "personal_move not captured in inner-garden Chapter 1"
  ]
}
```

## Humane Rules

- Export is **manual** and **local**. No background network call.
- Export preserves raw B/A/R text.
- Import later must be **append-only** or **prefill-only**; no last-write-wins.
- Missing `satisfaction` and `personal_move` remain `null`, not inferred.
