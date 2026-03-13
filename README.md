# Bars Engine

> **Status:** MVP Logic Implemented (Feb 21 Party Target)

The **Bars Engine** is a narrative-driven quest system designed for the vibrational convergence. It powers a "choose your own adventure" style experience where players (Conclave members) complete quests, manage resources (Vibeulons), and evolve their characters through archetypal moves.

## 🚀 Getting Started

### Quick Start (Choose One)

**Option A: Synthetic Data (Local Development)**
```bash
make dev-local
```
Starts with local Docker Postgres + 40 test players. No Vercel access needed. Takes ~2 minutes.

**Option B: Real Backend (Vercel)**
```bash
make dev-vercel
```
Uses actual Vercel database. Requires `vercel link` (done once). Takes ~1 minute.

### Cross-Platform Notes
- **WSL Ubuntu (Nate)**: Docker runs natively; all commands work as-is
- **macOS (Wendell)**: Use `make` commands; Docker Desktop handles Postgres
- Both environments share the same database switching logic via `.env.local`

### Manual Setup (if not using Make)

#### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (local) or Vercel project access
- Docker (for local synthetic mode)

#### 2. Installation & Environment

**With Vercel project access (preferred):**
```bash
vercel link                    # One-time setup
npm run env:pull              # Pull DATABASE_URL and secrets
npm run smoke                 # Verify connectivity
```

**Without Vercel access:**
```bash
cp .env.example .env
# Set DATABASE_URL manually (get from team)
```

#### 3. Database & Seeds

For **local synthetic** mode:
```bash
make db-local                  # Start Docker Postgres
npm run db:seed               # Populate with 40 test players
```

For **Vercel real** mode:
- Database already exists and is managed by Vercel
- Run `npm run ensure:admin-local` if you need local admin access

#### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔄 Switching Between Modes

See [docs/SYNTHETIC_VS_REAL.md](docs/SYNTHETIC_VS_REAL.md) for detailed guide on toggling between synthetic (local) and real (Vercel) databases.

---

## 🛠 Operational Commands

**Use `make` for convenience or `npm run` directly:**

| Command | Description |
| :--- | :--- |
| `make dev-local` / `npm run dev:local` | Start with synthetic data (local Postgres) |
| `make dev-vercel` / `npm run dev:vercel` | Start with real Vercel backend |
| `make switch-local` / `npm run switch -- local` | Switch to local mode only |
| `make switch-vercel` / `npm run switch -- vercel` | Switch to Vercel mode only |
| `make db-local` | Start Docker Postgres (`docker compose up postgres`) |
| `make db-seed` / `npm run db:seed` | Seed database with 40 test players |
| `make smoke` / `npm run smoke` | Verify DATABASE_URL and connectivity |
| `npm run db:reset` | **Hard Reset**: Wipes and re-seeds database. Use with caution. |
| `npm run db:studio` | Opens Prisma Studio to visualize/edit records. |
| `npm run db:push` | Push schema changes without creating migration. |
| `npm run check` | Lint + type-check |
| `npm run build` | Production build |
| `make help` | Show all available Make targets |

## 🏗 Architecture Overview

- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL (Production) / SQLite (Dev), managed via Prisma ORM.
- **Styling**: Tailwind CSS.
- **Key Concepts**:
  - **Five dimensions**: WHO (Nation, Archetype), WHAT (Quests), WHERE (Allyship domains), Energy (Vibeulons), Personal throughput (4 moves: Wake Up, Clean Up, Grow Up, Show Up). See [FOUNDATIONS.md](./FOUNDATIONS.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).
  - **Player**: The central entity.
  - **Bar**: A unit of narrative/quest content. Can be system-generated or user-created (`CustomBar`).
  - **Vibeulon**: The currency of the realm (Energy).
  - **Archetypes**: `Nation` and `Playbook` determine character moves and story progression.
  - **Story Clock**: A global state tracker for the narrative phase.

## 🐍 Python Backend & AI Agents

This branch adds a Python FastAPI backend (`backend/`) with AI-powered agents:
- **Agent Framework**: Pydantic AI with tool use
- **Agents**: Regent, Diplomat, Architect, Sage, Shaman, Challenger, Mind
- **Database**: Shared PostgreSQL with the Next.js frontend

**Backend Setup:**
```bash
cd backend
uv sync                    # Install Python dependencies
make up                    # Full stack: Postgres + backend + frontend
# Or individual commands:
make db                    # Just Postgres
make serve                 # Backend server on :8000
```

See [backend/Makefile](backend/Makefile) for all backend targets.

---

## 📚 Documentation
- [FOUNDATIONS.md](./FOUNDATIONS.md) - Ontology, five dimensions, emotional alchemy, creative composting, Yellow Brick Road.
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Schema mapping, core objects, governance, economy.
- [CLAUDE.md](./CLAUDE.md) - Agent ethos and development guidelines (Integral Theory based).
- [docs/SYNTHETIC_VS_REAL.md](./docs/SYNTHETIC_VS_REAL.md) - Switching between local and Vercel databases.
- [docs/ENV_AND_VERCEL.md](./docs/ENV_AND_VERCEL.md) - Environment setup, Vercel sync, production troubleshooting.
- [docs/DEVELOPER_ONBOARDING.md](./docs/DEVELOPER_ONBOARDING.md) - New machine setup, verification steps, common fixes.
- [RUNBOOK.md](./RUNBOOK.md) - Deployment and operations guide.
- [.cursor/rules/](./cursor/rules/) - Editor hints (Cursor/VSCode).

---

## 🌀 Spec Kit Integration (SDD)

The repository is equipped with **GitHub Spec Kit** for Spec-Driven Development. To ensure no system-wide dependencies are modified, it is installed in a local virtual environment.

### Local Invocation
Use the local wrapper to run `specify` commands:
```bash
./tools/venv/bin/specify <command>
```

**Common Commands:**
- `./tools/venv/bin/specify init --here` - Re-initialize or update Spec Kit
- `./tools/venv/bin/specify check` - Verify local tool integrity
- `./tools/venv/bin/specify version` - Check version information
