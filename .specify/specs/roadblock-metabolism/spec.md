# Spec: Roadblock Metabolism System

## Purpose

Implement a pre-commit "Scan Ritual" that prevents build errors (export mismatches, missing directives) from being committed. Develop an agent skill that teaches the AI to treat build errors as "Roadblock Quests" that must be metabolized before commit.

**Lore**: In the BARS Engine, an "Emergent Roadblock" is a manifestation of misaligned intention—a knot in the pipeline of inspiration. When the system fails to metabolize a BAR (a user request/signal), it produces a Roadblock Error. This spec defines the ritual for metabolizing roadblocks before they manifest in the shared field (the committed branch).

## User Stories

### P1: Pre-commit type check
**As a developer**, I want commits that introduce build/type errors to be rejected, so broken code does not reach the shared branch.

**Acceptance**: A git pre-commit hook runs `npm run build:type-check` (or equivalent). Commits that fail the check are rejected.

### P2: Validate manifest script
**As a developer**, I want a script that checks for common regression patterns, so I can catch missing "use client" and similar issues before commit.

**Acceptance**: `scripts/validate-manifest.ts` exists and checks for: (a) components using hooks or client-only APIs without `"use client"`; (b) server actions without `"use server"` where required. Script exits non-zero on failure.

### P3: Agent skill — Roadblock Metabolism
**As an AI agent**, I want a skill that teaches me to verify imports, directives, and treat build errors as roadblock quests, so I metabolize errors before suggesting commits.

**Acceptance**: `.agents/skills/roadblock-metabolism/SKILL.md` exists with: (a) Verify imports against destination module exports; (b) Ensure `"use client"` or `"use server"` when needed; (c) Reflection step — audit plan against module exports before commit; (d) Proactively mention "Metabolizing a Roadblock" when catching own errors.

### P4: FOUNDATIONS lore
**As a reader**, I want FOUNDATIONS.md to document the Metabolism of Roadblocks, so the lore is canonical.

**Acceptance**: FOUNDATIONS.md includes a "Metabolism of Roadblocks" section.

## Functional Requirements

- **FR1**: Pre-commit hook MUST run type-check before allowing commit.
- **FR2**: `npm run build:type-check` (or `check`) MUST exist and run `tsc --noEmit` (and optionally lint).
- **FR3**: `scripts/validate-manifest.ts` MUST check for common regression patterns; exit 1 on failure.
- **FR4**: Agent skill MUST include reflection step and verification rules.
- **FR5**: FOUNDATIONS.md MUST include Metabolism of Roadblocks section.

## Verification

- A commit that introduces a missing import or type error is REJECTED by the git hook.
- The agent proactively mentions "Metabolizing a Roadblock" when it catches its own error during reflection.

## Reference

- Original prompt: [prompt_roadblock_metabolism.md](/Users/test/.gemini/antigravity/brain/3ff95f09-ab1b-444f-bde9-6eb4bfba0e9e/prompt_roadblock_metabolism.md)
- Backlog: F (1.2) — Roadblock Metabolism System
