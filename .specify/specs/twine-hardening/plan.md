# Technical Implementation Plan: Twine Engine Hardening

## Architecture Strategy
We will transition the Twine engine from implicit JSON parsing (`JSON.parse(...) as any`) to explicit runtime validation using `zod`. This establishes a contract that must be met before rendering or database insertion occurs.

## Component Design

### 1. Zod Schema (`src/lib/schemas/twine.ts`)
Create a new file containing:
- `TwinePassageSchema`: Validates individual passages (name, pid, text, tags, links).
- `ParsedTwineSchema`: Validates the top-level structure (title, passages, startPassage, startPassagePid, startPassageName).
- A helper function `getStartPassageId(parsed: z.infer<typeof ParsedTwineSchema>)` which intelligently resolves the starting passage by checking `startPassage` -> `startPassagePid` -> `startPassageName` -> `passages[0].pid/name` -> Error.

### 2. Action Updates (`src/actions/twine.ts`)
Update `getOrCreateRun` and any other relevant actions:
- Parse `story.parsedJson` using `ParsedTwineSchema.parse()`.
- Use `getStartPassageId()` to ensure `currentPassageId` is never undefined before calling `db.twineRun.create()`.

### 3. Error Boundary (`src/components/TwineErrorBoundary.tsx`)
Create a standard React Error Boundary component designed specifically to catch errors inside the `PassageRenderer`. If `PassageRenderer` throws due to a missing passage (like 'Passage "1" not found'), the boundary will catch it and display a localized "Quest Data Corrupted" UI rather than crashing the page.

### 4. Component Updates (`src/app/adventures/[id]/play/page.tsx` & `src/components/PassageRenderer.tsx`)
- Wrap `PassageRenderer` in the new Error Boundary.
- Ensure `PassageRenderer` uses `getStartPassageId()` if it needs to fallback.

## Database Impacts
None directly, but prevents `PrismaClientValidationError` crashes.
