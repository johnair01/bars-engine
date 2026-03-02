---
name: roadblock-metabolism
description: Teaches the AI to treat build errors as Roadblock Quests—verify imports, directives, and metabolize errors before commit. Use when editing files that may introduce type/export or "use client" regressions.
---

# Roadblock Metabolism

In the BARS Engine, an **Emergent Roadblock** is not just a bug; it is a manifestation of misaligned intention—a knot in the pipeline of inspiration. When the system fails to metabolize a BAR (a user request/signal), it produces a Roadblock Error. This skill teaches the agent to **metabolize roadblocks** before they manifest in the shared field (the committed branch).

## When to Use

- Before suggesting or making a commit
- When editing `.tsx` or `.ts` files that add imports, hooks, or server actions
- When a build or type-check fails after your edits
- When the user reports "build error," "type error," or "export mismatch"

## Verification Rules

### 1. Imports vs Exports

Before committing changes, verify:
- Every newly introduced `import` resolves to an export from the destination module
- No circular import chains that could cause runtime failures
- Barrel exports (`index.ts`) include all intended re-exports

### 2. Directive Requirements

| Pattern | Required Directive |
|---------|-------------------|
| `useState`, `useEffect`, `useTransition`, `useCallback`, `useMemo`, `useRef` | `"use client"` at top of file |
| `createContext`, `useContext` (when used in component) | `"use client"` |
| `'use server'` or server action functions | `"use server"` at top or inline |
| Event handlers (`onClick`, `onChange`) in components | `"use client"` |
| Browser APIs (`window`, `document`, `localStorage`) | `"use client"` |

### 3. Common Regression Patterns

- **Missing "use client"**: Component uses hooks but has no directive → add `"use client"` as first line
- **Wrong directive**: Server action file has `"use client"` → change to `"use server"` or remove
- **Export mismatch**: File imports `X` from `Y` but `Y` doesn't export `X` → fix import or add export

## Reflection Step (Before Commit)

Before suggesting a commit, the agent MUST:

1. **Audit changed files** against the verification rules above
2. **Run type-check** mentally or suggest `npm run build:type-check` to the user
3. **If errors found**: Say "Metabolizing a Roadblock" and fix them before proceeding
4. **If clean**: Proceed with commit

## Phrasing

When the agent catches its own error during the reflection phase:
- Use: *"Metabolizing a Roadblock — I introduced [X]. Fixing before commit."*
- Or: *"Roadblock detected: [description]. Resolving."*

## Pre-Commit Ritual

The project has a pre-commit hook that runs:
- `npm run build:type-check` (tsc --noEmit)
- Optionally: `npm run validate-manifest` (checks "use client" for hooks)

If the hook fails, the commit is rejected. The agent should run these locally before suggesting commit, or remind the user to run them.

## Reference

- Spec: [.specify/specs/roadblock-metabolism/spec.md](../../.specify/specs/roadblock-metabolism/spec.md)
- FOUNDATIONS.md: Metabolism of Roadblocks section
