# Specification: Resilient Twine JSON Standard

## Overview
Implement a strict, centralized data normalization pipeline for Twine JSON payloads to prevent UI rendering bugs caused by heterogenous JSON property names.

## Principles
1. **The UI is Dumb:** React components should not contain complex fallback logic to guess what property holds the text.
2. **The Pipeline is Smart:** A single normalization function is responsible for coercing all incoming data shapes (Legacy JSON, Modern Twine HTML Export, Minimal JSON) into one canonical structure.
3. **Strict Typings:** Only canonical interfaces are allowed into the renderer.

## Scope
- `schemas.ts` (The Pipeline)
- `twine.ts` (The Runtime Gatekeeper)
- `PassageRenderer.tsx` (The Consumer)
- `seed-admin-tests.ts` (The Data Source)
