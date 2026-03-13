# Cursor Setup & Reference

This guide helps Cursor users (on Mac or WSL) get productive on the BARs Engine project.

## Initial Setup (One-Time)

### 1. Install Prerequisites
```bash
# Node.js 18+ and npm
node --version  # Should be 18+

# For Python backend (optional but recommended)
python3 --version  # 3.10+
uv                 # Modern Python package manager
```

### 2. Clone and Install
```bash
git clone <repo>
cd bars-engine
npm install
```

### 3. Set Up Environment
```bash
# Option A: Link to Vercel (if you have access)
vercel link
npm run env:pull

# Option B: No Vercel access
cp .env.example .env
# Ask team for DATABASE_URL value
```

### 4. Verify Setup
```bash
npm run smoke
# Should output: ✓ DATABASE_URL is present, ✓ Database is reachable
```

---

## Daily Development

### Start the App

**Choose one:**
```bash
# Synthetic mode (local test data, no Vercel needed)
make dev-local

# Real mode (Vercel backend)
make dev-vercel
```

Then open [http://localhost:3000](http://localhost:3000).

### Common Tasks

| Task | Command |
|------|---------|
| Type-check & lint | `npm run check` |
| Build for production | `npm run build` |
| View all Make targets | `make help` |
| Switch database mode | `npm run switch -- local` or `npm run switch -- vercel` |
| Open Prisma Studio | `npm run db:studio` |
| Seed test players (40 total) | `npm run db:seed` |

### Python Backend (if working on agents)

```bash
cd backend
make serve      # Start FastAPI server on :8000
make test       # Run all backend tests
make test-agents # Run agent tests only
make check      # Lint and type-check
```

---

## Cursor Shortcuts & Tips

### Helpful Cursor Commands
- **`@project` references** — Mentions project files in your queries for context
- **`@doc CLAUDE.md`** — Reference the project's AI ethos and guidelines
- **`@doc docs/SYNTHETIC_VS_REAL.md`** — When asking about database modes
- **`@doc FOUNDATIONS.md`** — For questions about game design and Integral Theory

### Cursor Rules to Know
The `.cursor/rules/` directory has:
- `branch-context-nn-edits.mdc` — Full context for this branch
- `fail-fix-workflow.mdc` — How to verify your work before committing
- `.cursorrules` at root — Quick database sync rule

### Getting Help from Claude

**Good prompt structure:**
```
I'm working on [feature]. Here's the context:
- Using synthetic mode (local database)
- Frontend change to [component/page]
- [Specific question or error]

@doc CLAUDE.md
@doc docs/ENV_AND_VERCEL.md
```

---

## Platform-Specific Notes

### macOS (Wendell)
- ✅ Cursor runs natively
- ✅ Docker Desktop handles containers
- ✅ All commands work as documented
- **Note**: Ensure Docker Desktop is running before `make dev-local`

### WSL Ubuntu (Nate)
- ✅ All commands work in WSL terminal
- ✅ Docker runs natively in WSL
- ✅ Cursor runs in WSL terminal or via VS Code Remote WSL
- **Verify Docker**: `docker ps` should work without errors

---

## Troubleshooting

### App Starts but Shows "DATABASE_URL not set"
1. Check: `grep DATABASE_URL .env.local`
2. Should show either:
   - `localhost:5432` (synthetic/local)
   - `prisma.io` or similar (Vercel/real)
3. If missing: `npm run env:pull` (Vercel) or manually add DATABASE_URL

### Docker "connection refused"
```bash
# For local synthetic mode, ensure Postgres is running:
docker ps | grep postgres
# If not running:
make db-local
```

### Tests Fail Locally but Pass on CI
- May be Node version difference: `node --version` should be 18+
- May be database state: `npm run db:reset` to clean slate
- May be env issue: `npm run smoke` to verify DATABASE_URL

### "Vercel CLI not found"
```bash
npm i -g vercel
# or use:
npx vercel link
npx vercel env pull .env.local
```

---

## Before Committing

Always run:
```bash
npm run check       # Lint + type-check
npm run build       # Verify build works
make help           # Familiar with targets
```

For backend changes:
```bash
cd backend
make check
make test
```

See `.cursor/rules/fail-fix-workflow.mdc` for full details.

---

## Quick Reference Commands

```bash
# Development
make dev-local              # Start with synthetic data
make dev-vercel            # Start with real backend

# Database
make db-local              # Start Postgres
make db-seed               # Populate 40 test players
make switch-local          # Use local mode
make switch-vercel         # Use Vercel mode

# Verify & Build
npm run smoke              # Check DATABASE_URL
npm run check              # Lint + type-check
npm run build              # Production build

# Backend (if needed)
cd backend && make serve   # Start FastAPI server
cd backend && make test    # Run tests

# Help
make help                  # Show all targets
grep -r "TODO" src/ --include="*.ts"  # Find TODOs
```

---

## Getting Help

1. **Check docs/** — Most answers are in existing docs
2. **Run `make help`** — See available commands
3. **Ask in Cursor** — Reference `@doc CLAUDE.md` for project context
4. **Check `.cursor/rules/`** — Contains workflows and guidelines
