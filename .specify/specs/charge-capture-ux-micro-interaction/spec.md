# Spec: Charge Capture UX Micro-Interaction v0 (GD)

## Problem

The current charge capture form requires 6+ taps and the emotion selector is buried below the text input. This reverses the correct attention order: players should name *how* the charge feels before they name *what* it is. The form also lacks an "Act" path after capture.

## Design Principles

- **Emotion first**: Somatic signal (how it feels) precedes conceptual articulation (what it is). See `docs/FELT_SENSE_321_PRAXIS.md`.
- **3–5 taps to BAR**: Only summary (text) is required. Emotion is the first tap. Intensity/satisfaction are optional and post-capture.
- **Private by default**: Already implemented in `createChargeBar` (`visibility: 'private'`).
- **Post-capture triage**: Three clear paths — Reflect (internal), Explore (convert to quests), Act (return to NOW with compass + discover strip).

## Functional Requirements

| # | Requirement |
|---|---|
| FR1 | Emotion selector appears ABOVE the text input, using large tap targets (full-width grid or pill row). |
| FR2 | Text input autofocuses after emotion selection. |
| FR3 | Only `summary` is required to submit. Emotion, intensity, satisfaction are optional single-tap enrichments. |
| FR4 | After successful capture, show three options: **Reflect** (→ 321), **Explore** (→ quest suggestions), **Act** (→ NOW dashboard). |
| FR5 | Satisfaction and intensity selectors move below the submit button as optional "enrich" section, or collapse into a single expansion row. |
| FR6 | "Captured this session" history strip remains for multi-capture sessions. |

## Out of Scope

- Backend changes — the `createChargeBar` action is unchanged.
- The `ChargeExploreFlow` and `TransitionCeremony` are unchanged.
- Multi-step wizard / animated transitions (future GF spec).

## Acceptance Criteria

- [ ] A player can capture a charge (emotion + summary) in 3 taps.
- [ ] Post-capture shows Reflect / Explore / Act options.
- [ ] No required fields beyond `summary`.
- [ ] `npm run check` passes.
