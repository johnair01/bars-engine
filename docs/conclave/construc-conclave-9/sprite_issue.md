# 🎮 Establish Canonical Walkable Sprite Pipeline + Spatial Map Replacement Demo

## 🧭 Context
The BARS engine already contains a partially implemented avatar → sprite → spatial rendering pipeline.

### Existing Systems
- Pixi spatial renderer (RoomRenderer)
- Avatar system (avatar-utils.ts, avatar-parts.ts)
- Walkable sprite resolution

## 🕳️ Problem
No end-to-end pipeline proving avatar → sprite → spatial map.

## 🎯 Goal
Create a canonical demo proving:
Avatar → Sprite → World

## ✅ Acceptance Criteria
- Avatar config resolves to walkableSpriteUrl
- Spatial map renders correct sprite
- Direction updates visually
- Fallback works

## 🧱 Tasks
1. Verify sprite resolution path
2. Ensure player sprite replaces default
3. Add one real sprite asset
4. Force demo config
5. Validate direction rendering
6. Strengthen fallback
7. (Optional) Agent sprite parity

## 🧠 Insight
This establishes the contract between:
Avatar system → Asset system → Pixi renderer

## 🚫 Non-Goals
- Full character creator
- Dynamic sprite compositing

## 🏁 Summary
Ship proof that Avatar → Sprite → World is real.
