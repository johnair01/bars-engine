# Bars Engine

> **Status:** MVP Logic Implemented (Feb 21 Party Target)

The **Bars Engine** is a narrative-driven quest system designed for the vibrational convergence. It powers a "choose your own adventure" style experience where players (Conclave members) complete quests, manage resources (Vibeulons), and evolve their characters through archetypal moves.

## 🚀 Getting Started

Follow these steps to get the engine running locally.

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (for local development; connection string in `.env` as `DATABASE_URL`)

### 2. Installation

```bash
# Install dependencies
npm install

# Initialize Database (Run Migrations)
npx prisma migrate dev --name init

# Seed Initial Data (Roles, Bars, Admin Invite)
# This populates the database with essential game data.
npm run db:seed
```

### 3. Environment Variables
The app requires **PostgreSQL** and a `DATABASE_URL`. For the canonical setup (including getting `DATABASE_URL` from Vercel), see [docs/ENV_AND_VERCEL.md](docs/ENV_AND_VERCEL.md).

**Fallback** (if you don’t have Vercel project access): copy the example and set your database URL:

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL to your Postgres connection string, e.g.:
# DATABASE_URL="postgresql://user:password@localhost:5432/bars_engine"
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🛠 Operational Commands

We have several utility scripts to help manage the game state.

| Command | Description |
| :--- | :--- |
| `npm run db:reset` | **Hard Reset**: Wipes the database and re-seeds it. Use with caution. |
| `npm run db:studio` | Opens Prisma Studio to visualize and edit database records. |
| `npm run db:push` | Pushes schema changes to the database without creating a migration file. |
| `npm run loop:ready` | Runs a readiness check for the game loop. |
| `npm run test:actions` | Runs server action tests. |

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

## 📚 Documentation
- [docs/DEVELOPER_ONBOARDING.md](./docs/DEVELOPER_ONBOARDING.md) - New machine setup, verification steps, and common fixes.
- [RUNBOOK.md](./RUNBOOK.md) - Detailed deployment and operations guide.

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
