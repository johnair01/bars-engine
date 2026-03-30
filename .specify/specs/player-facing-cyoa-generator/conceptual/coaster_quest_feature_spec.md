# Feature Request: Coaster-Based Quest Authoring Engine

## Summary
Implement a coaster-based narrative engine that converts BAR polarity into structured quest flows using defined node types and validation rules.

---

## Problem
Current quest creation lacks:
- Consistent emotional arc
- Structural validation
- Clear translation from BAR polarity to gameplay

---

## Solution
Introduce a Coaster-Based Quest Authoring system using:
- Narrative force model
- Coaster node primitives
- Six Game Master validation layers

---

## Core Model

Polarity → Charge → Commitment → Release → Transformation → Integration

Mapped to:
LIFT → DROP → TURN → INVERSION → BRAKE → STATION

---

## Node Types

### LIFT
- Locks player into path
- Requires intent

### DROP
- Irreversible decision
- High stakes

### TURN
- Low-stakes branching
- May reconverge

### INVERSION
- Perspective shift
- Reframe required

### BRAKE
- Reflection moment
- Emotional processing

### STATION
- Resolution
- Vibeulon mint

---

## Requirements

### Functional
- Quest builder supports all node types
- Nodes can be sequenced and validated
- Polarity must be defined before quest creation

### Validation Rules
- Minimum nodes: LIFT, DROP, INVERSION, BRAKE, STATION
- No more than 3 TURN nodes without escalation
- INVERSION must be followed by BRAKE
- STATION must resolve core tension

---

## Game Master Scoring

Each quest scored (0–5):

- Shaman: emotional charge
- Challenger: stakes
- Regent: clarity
- Architect: pacing
- Diplomat: emotional resonance
- Sage: systemic coherence

---

## API Sketch

POST /quests/create

{
  "title": "string",
  "polarity": {
    "desire": "string",
    "fear": "string"
  },
  "nodes": [
    { "type": "LIFT" },
    { "type": "DROP" },
    { "type": "TURN" },
    { "type": "INVERSION" },
    { "type": "BRAKE" },
    { "type": "STATION" }
  ]
}

---

## Acceptance Criteria

- Users can create quests using node system
- System validates structure automatically
- System flags missing polarity or weak structure
- Vibeulon mint triggered on completion

---

## Future Enhancements

- Visual coaster builder UI
- Procedural quest generation from BARs
- Adaptive difficulty via emotional energy tracking

---

## Principle

Polarity is fuel. The system converts emotional tension into meaningful action.
