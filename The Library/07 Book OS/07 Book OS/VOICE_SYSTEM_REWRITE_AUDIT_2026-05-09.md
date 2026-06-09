---
type: spec
aliases:
  - Voice System Rewrite Audit
  - Voice Guide 6-Face ITD Audit
tags:
  - mtgoa
  - book-os
  - voice
  - audit
created: 2026-05-09
review: 2026-05-16
---

# Voice System Rewrite Audit — 2026-05-09

## Cast Lens

See [[WORKING_CAST_PROTOCOL]].

Working cast for this rewrite:

- Primary hexagram: `64` — Before Completion
- Changing lines: `3`, `4`
- Relating hexagram: `53` — Gradual Development

Interpretation for this audit:

- the current system contains real insight but is not stable enough for reliable application
- premature elegance is a risk
- the rewrite should favor staged determinism over expressive completeness

## 6-Face Gap List

### Shaman

Current guides know what alive writing feels like, but they do not yet give the agent enough embodied checkpoints to detect when prose is dead.

Gap:
- too much felt recognition
- not enough observable signal

Need:
- concrete markers for when a paragraph has gone generic, evasive, or over-explained

### Challenger

The current guidance still leaves too much room for “close enough” passing.

Gap:
- evaluator language is too permissive
- failure conditions are not hard enough

Need:
- banned phrases
- binary fail conditions
- explicit no-pass states

### Regent

Authority in the voice stack is still too diffuse.

Gap:
- profile, guide, and matrix all compete for primacy
- agent can cherry-pick the most flattering interpretation

Need:
- one operational file
- clear support files
- explicit precedence

### Architect

This is the largest gap.

Gap:
- the system describes voice moves but not a generation/evaluation algorithm
- no paragraph router
- no evidence-based test format

Need:
- section-type contracts
- paragraph-type contracts
- required / forbidden / evidence fields

### Diplomat

The real readers are under-modeled operationally.

Gap:
- Wendell-as-reader is implicit
- ideal-reader logic exists in a separate note but is not embedded into the guide

Need:
- deterministic reader contracts
- explicit advanced-trap checks for Ch0 and similar sections

### Sage

The current system can sound wise while still hallucinating confidence.

Gap:
- too much interpretation before constraints
- not enough separation between deterministic checks and softer judgment

Need:
- layered evaluation
- hard gates first
- aesthetic judgment only after constraint pass

## ITD Audit

### Q1 — Developmental Lines

How does the user of this system move through levels?

Current answer:
- novice agent gets overwhelmed
- stronger model improvises aesthetically
- neither has a reliable path to maturity

Gap:
- no staged path from imitation to disciplined evaluation

Need:
- a progression from detection -> compression -> reader gates -> evidence-based pass

### Q2 — AQAL + Design Surfaces

Which quadrants are being changed?

Current state:
- UL: agent judgment and taste
- LL: shared language about voice
- LR: workflow notes
- UR: not enough observable text behavior tests

Gap:
- overweights shared interpretation and underweights observable textual behavior

Need:
- more UR/LR discipline: measurable textual features and repeatable process

### Q3 — Rectify the Names

Rectifications needed:

- “voice guide” -> operational contract
- “reader check” -> reader contract
- “sounds like Wendell” -> evidence-backed pass against Wendell contract
- “ideal reader” -> explicit advanced-trap target model

### Q4 — Hats at Levels

The system must support all three hats:

- service provider: helps the reader
- game designer: creates reliable editorial mechanics
- business person: reduces wasted revision cycles and token burn

Gap:
- current guides mostly serve the service-provider hat and some game-designer aesthetics
- they do not yet serve the business-person need for consistent throughput

Need:
- lower-cost evaluation with tighter pass/fail logic

### Q5 — Shadow Prediction

If this rewrite works perfectly, its shadow is:

- sterile compliance writing
- gaming the tests without producing life

Checkpoint to prevent shadow:

- deterministic gates must be necessary but not sufficient
- after hard-pass, there is still a final compression/aliveness review

### Q6 — Designer Shadow

Designer risk in this rewrite:

- over-correcting toward mechanization because hallucination risk is frustrating
- building a test harness that kills the living voice it was meant to protect

Response:

- keep hard gates narrow and text-facing
- keep the final judgment layer small but real

## 4 Key Concepts Applied

### 1. UX Developmental Line Intersection

The system should not assume the agent starts at Wendell’s level of stylistic intuition.

Design for the intersection:
- the agent needs constraints
- the project needs life

### 2. Polarity Thinking

This is not “deterministic vs alive.”

It is a polarity:
- too loose -> hallucination
- too rigid -> dead prose

The rewrite must manage the polarity rather than solve it.

### 3. Three-System Integration

The voice system needs to integrate:

- somatic/aliveness cues
- developmental reader logic
- structural tests

### 4. The Three Hats

The rewritten guide must simultaneously:

- help the reader
- function as a game system
- reduce editorial waste

## Rewrite Directives

1. Make `WENDELL_VOICE_AGENT_GUIDE.md` the primary operational file.
2. Treat `WENDELL_VOICE_PROFILE.md` and `VOICE_MATRIX_BY_FACE.md` as supporting references.
3. Add reader contracts for Wendell and the ideal reader.
4. Add section and paragraph routers.
5. Add deterministic gates with evidence requirements.
6. Add “no-pass” failure conditions.
7. Keep a final aliveness check after the hard gates.

## Related

- [[WORKING_CAST_PROTOCOL]]
- [[IDEAL_READER_PROFILE]]
- [[WENDELL_VOICE_PROFILE]]
- [[WENDELL_VOICE_AGENT_GUIDE]]
