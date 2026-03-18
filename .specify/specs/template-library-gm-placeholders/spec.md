# Spec: Template Library Game Master Placeholders (Certification Feedback)

## Purpose

Fix the "no placeholder text when generating" issue reported on cert-template-library-v1 (STEP_2). Generated passages must have **visible, meaningful placeholder text** that scaffolds both admins and future Game Master agents. From the Game Master perspective: each passage slot is a teaching moment—the Architect structures the template; the six faces provide guidance for what belongs in each slot.

**Problem**: Certification feedback: "There wasn't any placeholder text when I generated text." Current implementation uses minimal `[Edit: context_1]`-style placeholders, which may be invisible, unclear, or insufficient for agents and admins to understand what to fill in.

**Practice**: Deftness Development — spec kit first, API-first. Extend existing template-library service; no schema change required for v0.

## Root Cause

- `generateFromTemplate` sets `text: \`[Edit: ${slot.nodeId}]\`` per passage.
- Either: (a) placeholders are not visible in the edit UI, or (b) they are too minimal to be useful—no narrative guidance.
- Game Master agents (Architect, Shaman, Challenger, etc.) need structured guidance to know what content belongs in each slot when generating or editing drafts.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Placeholder source** | Per-slot guidance text derived from Game Master face mapping. No schema change: use slot `nodeId` + label to select face and guidance. |
| **Face mapping** | context_1–3 → Shaman; anomaly_1–3 → Challenger; choice → Diplomat; response → Regent; artifact → Architect. |
| **Guidance format** | `[Face]: [What belongs here]. [Edit: replace this guidance with your content.]` — visible, instructional, agent-friendly. |
| **Backward compatibility** | Existing templates unchanged. New guidance is deterministic from slot metadata. |

## Conceptual Model

### Game Master Face → Slot Mapping (9-passage encounter)

| Slot | Face | Operational function | Guidance intent |
|------|------|----------------------|-----------------|
| context_1, context_2, context_3 | Shaman | threshold, mystery, unseen contact | Ground the scene; what world does the player stand in? |
| anomaly_1, anomaly_2, anomaly_3 | Challenger | testing, pressure, sharpening | Introduce tension; what disrupts or tests? |
| choice | Diplomat | relationship, translation, alignment | Present options; what paths can the player take? |
| response | Regent | authority, coherence, governance | Resolve; what outcome or ruling emerges? |
| artifact | Architect | structure, maps, pattern recognition | Deliverable; what does the player take away? |

Reference: [world_logic_synthesis.md](../../docs/world_logic/world_logic_synthesis.md) §4.

## User Story

**As a** tester (or admin / future Game Master agent), **I want** generated passages to show clear, face-specific placeholder text, **so that** I know what belongs in each slot and can edit with confidence.

**Acceptance**: Generate from template → each passage displays visible guidance (e.g. "Shaman: Ground the scene. What world does the player stand in? [Edit: replace with your content.]") instead of bare `[Edit: context_1]`.

## Functional Requirements

- **FR1**: `generateFromTemplate` MUST produce passage text that includes: (a) the Game Master face name, (b) a short instructional sentence for that slot type, (c) an explicit "[Edit: ...]" cue. Example: `Shaman: Ground the scene. What world does the player stand in? [Edit: replace with your content.]`
- **FR2**: Slot-to-face mapping MUST be deterministic: context_* → Shaman, anomaly_* → Challenger, choice → Diplomat, response → Regent, artifact → Architect. Unknown slots default to Architect.
- **FR3**: Placeholder text MUST be stored in `Passage.text` (no schema change). Existing edit UI MUST display it.
- **FR4**: Verification: cert-template-library-v1 STEP_2 passes when tester generates and sees face-specific placeholders in each passage.

## Non-Functional Requirements

- Minimal change: extend `generateFromTemplate` and optionally `scripts/seed-adventure-templates.ts` if slot metadata is enriched.
- No Prisma schema change for v0.
- Future: `AdventureTemplate.passageSlots` could add optional `gameMasterFace` and `guidance` per slot for custom templates.

## Reference

- Feedback source: [.feedback/cert_feedback.jsonl](../../.feedback/cert_feedback.jsonl) — cert-template-library-v1 STEP_2
- Template library: [template-library-draft-adventure](../template-library-draft-adventure/spec.md)
- Game Master faces: [.cursor/rules/game-master-agents.mdc](../../.cursor/rules/game-master-agents.mdc), [world_logic_synthesis.md](../../docs/world_logic/world_logic_synthesis.md)
- Implementation: [src/lib/template-library/index.ts](../../src/lib/template-library/index.ts)
