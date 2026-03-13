# Branch Updates — nn-edits-20260312

**Date**: March 13, 2026
**Status**: Documentation & tooling complete for cross-platform development

---

## What Was Updated

### 1. README.md (Complete Rewrite of Getting Started)
- ✅ Added quick-start options (Synthetic vs Real)
- ✅ Added cross-platform notes (WSL Ubuntu for Nate, macOS for Wendell)
- ✅ Reorganized operational commands with Make targets
- ✅ Added Python backend section with agent framework info
- ✅ Updated documentation references
- ✅ Linked to new guides (SYNTHETIC_VS_REAL, CURSOR_SETUP)

### 2. Cursor Rules (`.cursor/` directory)
- ✅ **new** `branch-context-nn-edits.mdc` — Full context for this branch
  - Quick reference for Make commands
  - Cross-platform setup notes
  - Key files directory
  - Troubleshooting checklist

- ✅ **updated** `fail-fix-workflow.mdc` — Expanded for both frontend and backend
  - Added Python verification steps
  - Added cross-platform testing notes
  - Schema change guidance

- ✅ **updated** `.cursorrules` — Points to all available rules
  - Links to branch context and fail-fix workflow
  - Quick database sync reminder

### 3. Documentation Files (New & Updated)
- ✅ **new** `docs/CURSOR_SETUP.md` — Cursor-specific setup and daily workflow
  - Initial setup checklist (one-time)
  - Daily development commands
  - Common tasks table
  - Platform-specific tips
  - Troubleshooting FAQ
  - Before-commit checklist

- ✅ **new** `docs/SYNTHETIC_VS_REAL.md` — Database mode switching guide
  - Quick switch commands
  - How it works (automatic backup/restore)
  - When to use each mode
  - Verification commands
  - Troubleshooting

- ✅ **existing** `docs/ENV_AND_VERCEL.md` — Already comprehensive
  - Vercel project setup
  - Environment variable management
  - Production troubleshooting
  - Database diagnostics

### 4. Development Tools (New)
- ✅ **new** `Makefile` (root level)
  - User-friendly Make targets
  - Help command shows all options
  - Aliases for convenience
  - Mirrors npm script functionality

- ✅ **new** `scripts/switch-db-mode.ts`
  - Switches DATABASE_URL between local and Vercel
  - Automatic backup/restore
  - Clear status messages

---

## For Wendell (macOS) & Nate (WSL Ubuntu)

### Identical Workflows
Both developers can use the same commands:
```bash
make dev-local              # Start with synthetic data
make dev-vercel             # Start with real backend
make switch-local           # Use local only
make switch-vercel          # Use Vercel only
npm run check              # Verify code before commit
```

### Platform Differences Handled
- **Docker**: Native on both (Docker Desktop on Mac, native in WSL)
- **Environment**: `.env.local` auto-switches between modes
- **Commands**: `make` targets work identically on both

---

## Key References for Team

When onboarding or reviewing code:
1. **Quick setup?** → Point to `README.md` "Getting Started"
2. **Cursor user setup?** → Point to `docs/CURSOR_SETUP.md`
3. **Database mode confusion?** → Point to `docs/SYNTHETIC_VS_REAL.md`
4. **Vercel/env questions?** → Point to `docs/ENV_AND_VERCEL.md`
5. **Project ethos & guidelines?** → Point to `CLAUDE.md`
6. **Available commands?** → Run `make help`

---

## Next Steps

### For Developers
1. Run `make help` to see all available commands
2. Follow `docs/CURSOR_SETUP.md` for initial setup
3. Use `make dev-local` or `make dev-vercel` to start

### For Cursor
- Reference `@doc docs/CURSOR_SETUP.md` for team context
- Reference `@doc CLAUDE.md` for project ethos
- Cursor rules are in `.cursor/rules/` (auto-applied)

### For CI/CD
- Tests should verify both synthetic and real modes
- Backend tests: `cd backend && make test`
- Frontend tests: `npm run check`
- Full build: `npm run build`

---

## Files Modified/Created in This Update

```
Modified:
  - README.md (complete rewrite of Getting Started section)
  - .cursorrules (added references)
  - .cursor/rules/fail-fix-workflow.mdc (expanded)

Created:
  - .cursor/rules/branch-context-nn-edits.mdc
  - docs/CURSOR_SETUP.md
  - docs/SYNTHETIC_VS_REAL.md
  - docs/BRANCH_UPDATES_20260313.md (this file)
  - Makefile (root)
  - scripts/switch-db-mode.ts
```

**Note**: Additional changes from earlier in the branch include Python backend (`backend/`), agent system (`src/app/agents/`), and new npm scripts for database/backend management.

---

## Verification Checklist

- ✅ README updated with quick-start for both modes
- ✅ Cross-platform notes for Nate (WSL) and Wendell (Mac)
- ✅ Cursor rules comprehensive and linked
- ✅ New Makefile with help command
- ✅ Database switcher script working
- ✅ All documentation internally consistent
- ✅ Quick reference guides for common tasks

---

## Questions or Issues?

1. **"Which mode should I use?"** → Read `docs/SYNTHETIC_VS_REAL.md`
2. **"How do I set up on my machine?"** → Follow `docs/CURSOR_SETUP.md`
3. **"What commands are available?"** → Run `make help`
4. **"My Vercel env isn't pulled"** → Run `npm run env:pull`
5. **"Docker isn't running"** → See CURSOR_SETUP.md troubleshooting
