# FEATURE SPEC: Polarity Engine v0 (Emotional Charge + Polarity Extraction)

## Summary

Introduce a **Polarity Engine** layer to BARs that enables:

1. Charging BARs with emotional energy  
2. Generating a guiding question from emotion  
3. Extracting emergent polarity from the BAR  
4. Maintaining a “spin state” (active tension)  
5. Using polarity spin to drive quest generation  

This converts BARs from static notes → dynamic tension engines.

---

## Design Principles

- Minimal schema, maximum emergence
- Do not require users to define polarities explicitly
- Emotion → Question → Polarity must be fast (<30s interaction)
- Polarity is not resolved; it is sustained (spin)
- System suggests, player confirms

---

## Core Concepts

### 1. BAR (existing, extended)

```ts
type BAR = {
  id: string
  text: string
  emotionalCharge?: EmotionalCharge
  polarity?: PolarityInstance
}
```

---

### 2. Emotional Charge

```ts
type EmotionalCharge = {
  element: "fire" | "wood" | "water" | "earth" | "metal"
  intensity?: number
}
```

---

### 3. Emotion → Question Mapping

```ts
const EmotionQuestions = {
  fire: "What needs to change?",
  wood: "What wants to grow?",
  water: "What matters that is being lost or transformed?",
  earth: "What is out of balance?",
  metal: "What risk is asking to be faced?"
}
```

---

### 4. Polarity

```ts
type Polarity = {
  id: string
  poleA: string
  poleB: string
}
```

---

### 5. Polarity Instance

```ts
type PolarityInstance = {
  polarityId: string
  selectedPole: "A" | "B"
  magnitude?: number
  cost?: string
  unrealizedGain?: string
}
```

---

### 6. Spin State

```ts
type SpinState = {
  polarityId: string
  position: number
  intensity: number
}
```

---

## Core Flow

### Step 1 — Charge BAR

POST /bars/:id/charge

### Step 2 — Extract Polarity

POST /bars/:id/polarize

### Step 3 — Select Direction

POST /bars/:id/resolve-direction

### Step 4 — Update Spin

updatePlayerPolarityState(playerId, polarityId, delta)

---

## Quest Generation Hook

```ts
generateQuestFromPolarity(spinState: SpinState): Quest
```

---

## Success Criteria

- <30s polarization
- Leads to action
- Feels intuitive
