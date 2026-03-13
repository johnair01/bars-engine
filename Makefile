.PHONY: help dev dev-local dev-vercel switch-local switch-vercel db-local db-seed smoke check build seed seed-sync

# Default: show help
help:
	@echo "🎮 BARs Engine - Development Commands"
	@echo ""
	@echo "🚀 Quick Start:"
	@echo "  make dev-local       Start with synthetic data (local Docker Postgres)"
	@echo "  make dev-vercel      Start with real Vercel backend"
	@echo ""
	@echo "🔄 Switch Modes (without starting dev):"
	@echo "  make switch-local    Switch to local synthetic mode"
	@echo "  make switch-vercel   Switch to Vercel backend mode"
	@echo ""
	@echo "🗄️  Database:"
	@echo "  make db-local        Start local Docker Postgres"
	@echo "  make db-seed         Seed local database with 40 test players"
	@echo "  make smoke           Verify DATABASE_URL and connectivity"
	@echo ""
	@echo "📦 Build & Check:"
	@echo "  make check           Lint + type check"
	@echo "  make build           Production build"
	@echo ""
	@echo "🌱 Ouroboros Seeds:"
	@echo "  make seed-sync       Copy seeds from ~/.ouroboros/seeds/ into .specify/seeds/"
	@echo ""
	@echo "📚 More Info:"
	@echo "  See docs/SYNTHETIC_VS_REAL.md for detailed guide"
	@echo ""

# 🚀 Quick Start Commands

dev-local:
	npm run dev:local

dev-vercel:
	npm run dev:vercel

# 🔄 Switching (without auto-starting dev)

switch-local:
	npm run switch -- local
	@echo ""
	@echo "✨ Switched to synthetic mode. Next:"
	@echo "   make db-local && make db-seed && make dev"

switch-vercel:
	npm run switch -- vercel
	@echo ""
	@echo "✨ Switched to Vercel. Next:"
	@echo "   make dev"

# 🗄️ Database Commands

db-local:
	docker compose up postgres -d
	@echo "✓ Postgres running on :5432"

db-seed:
	npm run db:seed

smoke:
	npm run smoke

# 📦 Build & Check

check:
	npm run check

build:
	npm run build

# 🌱 Ouroboros Seeds

seed-sync:
	@mkdir -p .specify/seeds
	@count=0; \
	for f in ~/.ouroboros/seeds/*.yaml; do \
		[ -f "$$f" ] || continue; \
		name=$$(basename "$$f"); \
		if [ ! -f ".specify/seeds/$$name" ]; then \
			cp "$$f" ".specify/seeds/$$name"; \
			echo "  + $$name"; \
			count=$$((count + 1)); \
		fi; \
	done; \
	echo "$$count seed(s) synced to .specify/seeds/"

# Aliases for convenience
dev: dev-vercel
seed: db-seed
