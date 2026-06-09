---
title: Unstuck Deck - Self-Sort Quiz
created: 2026-05-27
status: stub
parent: SPEC.md
tags:
  - unstuck-deck
  - quiz
  - routing
---

# Self-Sort Quiz

## Purpose

Route a player from plain-language stuckness into an EA channel, a Door, and a recommended first Gate.

## Recommended Flow

1. Name the stuck place in one sentence.
2. Choose the pain-language line that feels most accurate from the 30-state matrix.
3. Confirm the emotional/body signal.
4. Confirm the stuck style.
5. Recommend Door + first Gate.
6. Offer either guided first card or shuffle within the Door.

## Routing Inputs

| Input | Routes Toward |
|---|---|
| Pain-language selection | EA channel + Door |
| Body/emotional signal | EA channel confidence |
| Behavioral pattern | Door confidence |
| Obstruction phrase | First Gate |

## Output Shape

```json
{
  "channel": "Fear",
  "door": "Architect",
  "first_gate": "Skeptic",
  "recognition_line": "I keep designing more safeguards before I let the thing touch reality.",
  "recommended_card": "Architect / Skeptic"
}
```
