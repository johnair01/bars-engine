# BARS Engine Spec: Pixel Identity System v0
### Composable, Symbolic, Scalable Sprite Architecture

---

## 0. Core Insight

A character sprite is not an image.

It is a **rendered state of a structured identity object**.

> Sprites are views. Identity is data. Meaning lives upstream.

---

## 1. System Overview

### Visual Identity Engine (VIE)

A system that bridges:
- Player identity (nation, archetype, BARs, emotional state)
- Rendering layer (sprite/avatar)

### Pipeline Flow

Player State
→ Identity Schema
→ Visual Token Resolver
→ Layer Composition Engine
→ Sprite Output (client-side)

---

## 2. Identity Schema (The Spine)

### CharacterIdentity Object

type CharacterIdentity = {
  baseModel: "humanoid_v1"

  nation: NationId
  archetype: ArchetypeId
  gmFace: GMFaceId

  equipment: EquipmentSlotMap
  visualMods: VisualModifier[]

  emotionalState?: EmotionalState
  questState?: QuestVisualState

  unlockedCosmetics: CosmeticId[]
}

---

## 3. Visual Token System (Core Abstraction Layer)

Identity does not map directly to sprites.

It maps to **visual tokens**.

---

## 4. Sprite Architecture (Layered Composition)

[ Base Body ]
[ Skin Tone ]
[ Clothing Base ]
[ Nation Layer ]
[ Archetype Layer ]
[ Equipment Layers ]
[ Effects Layer ]
[ Emotional Aura Layer ]

---

## 5. Rendering Strategy

Client-side composition with caching and batching.

---

## 6. AI Asset Pipeline

AI generates options. Humans define canon.

---

## 7. Asset Registry

/assets
  /base
  /nation
  /archetype
  /equipment
  /effects
  /emotional

---

## 8. Emotional Alchemy Integration

Emotional state becomes visible through overlays and effects.

---

## 9. BARs Integration

Visual modifiers attach to identity based on actions.

---

## 10. System Tensions

Balance expression, performance, consistency, and meaning.

---

## 11. Architecture Decisions

Layered sprites + token system + runtime rendering.

---

## 12. Implementation Plan

Phase 1–7 covering foundation → scaling → optimization.

---

## Final Principle

Players should experience identity transformation visually through action.
