# Plan: Roadblock Metabolism System

## Summary

Add pre-commit hook for type-check, validate-manifest script for common regressions, agent skill for roadblock metabolism, and FOUNDATIONS lore.

## Implementation

### Phase 1: Scripts and Package

**1.1 build:type-check script**

**File**: `package.json`

- Add `"build:type-check": "tsc --noEmit"` (or reuse `check` which does lint + tsc)
- Pre-commit will run this; `check` is heavier (includes lint). Use `tsc --noEmit` for speed, or `check` for thoroughness. Spec says "build errors" — tsc catches type/export errors. Use `build:type-check` as alias for `tsc --noEmit`.

**1.2 validate-manifest script**

**File**: `scripts/validate-manifest.ts`

- Scan `.tsx` and `.ts` files in `src/`
- Check: files that use `useState`, `useEffect`, `useTransition`, etc. must have `"use client"` at top
- Check: files that use `'use server'` or server actions — ensure correct directive
- Check: common patterns (e.g. `createContext` without "use client")
- Exit 1 if any violation; exit 0 if clean
- Keep it simple: regex-based scan for hooks + "use client" presence

### Phase 2: Husky Pre-Commit

**2.1 Install husky**

```bash
npm install -D husky
npx husky init
```

**2.2 Pre-commit hook**

**File**: `.husky/pre-commit`

```sh
#!/bin/sh
npm run build:type-check
```

Or run both:
```sh
npm run build:type-check && npm run validate-manifest
```

### Phase 3: Agent Skill

**File**: `.agents/skills/roadblock-metabolism/SKILL.md`

- When to use: when editing files that might introduce import/export or directive errors
- Verification rules: imports match exports; "use client" for hooks; "use server" for server actions
- Reflection step: before suggesting commit, audit changed files against these rules
- Phrasing: "Metabolizing a Roadblock" when catching own error

### Phase 4: FOUNDATIONS Update

**File**: `FOUNDATIONS.md`

- Add section "Metabolism of Roadblocks"
- Content: Emergent Roadblock = misaligned intention; system fails to metabolize BAR → Roadblock Error; ritual = pre-commit scan, agent reflection; roadblocks must be metabolized before commit

## File Impact Summary

| Action | File |
|--------|------|
| Edit | `package.json` (add build:type-check, validate-manifest) |
| Create | `scripts/validate-manifest.ts` |
| Create | `.husky/pre-commit` |
| Create | `.agents/skills/roadblock-metabolism/SKILL.md` |
| Edit | `FOUNDATIONS.md` |
| Edit | `package.json` (add husky devDep, prepare script) |
