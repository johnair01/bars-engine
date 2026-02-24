# Specification: Twine Engine Hardening

## Overview
Address the fragility of the Twine Engine parser by implementing a "360-degree" hardening strategy. This will ensure that malformed or varied Twine JSON structures (e.g., using `startPassagePid` instead of `startPassage`) do not cause unhandled runtime errors during gameplay.

## Target Audience
Players (who will experience fewer crashes) and Developers (who will get clear error messages instead of obfuscated Prisma validation errors).

## User Stories
1. **As a Player,** if a Twine quest is fundamentally broken, I want to see a graceful "Quest Data Corrupted" message rather than the application crashing or hanging.
2. **As a Developer,** I want strict type definitions for the Parsed Twine JSON so I know exactly what fields are guaranteed to exist, preventing runtime `undefined` errors.
3. **As a System Engineer,** I want `startPassage` lookup to be robust, falling back to alternative fields like `startPassagePid` or `startPassageName` so older Twine exports still work.

## Functional Requirements
- **FR1 (Schema Validation):** Introduce Zod schemas to validate `ParsedTwine` payloads.
- **FR2 (Robust Lookup):** Create a utility to reliably identify the starting passage ID/name regardless of the Twine export format.
- **FR3 (Error Boundaries):** Wrap the Twine Passage Renderer in an error boundary to catch and gracefully display rendering or data parsing failures.

## Non-Functional Requirements
- **NFR1:** Must not degrade performance of passage navigation.
- **NFR2:** Fallbacks must be properly typed so `currentPassageId` is guaranteed to be a valid string before insertion into the database.
