.PHONY: help dev dev-local dev-vercel switch-local switch-vercel db-local db-seed smoke check build seed seed-sync simulate

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
	@echo "🧪 Flow simulator (DT):"
	@echo "  make simulate FILE=fixtures/flows/orientation_linear_minimal.json"
	@echo "  (same as npm run simulate -- \$\$FILE)"
	@echo ""
	@echo "🌱 Ouroboros Seeds:"
	@echo "  make seed-sync SPEC=<feature>   Copy latest seed into .specify/specs/<feature>/seed.yaml"
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

# Flow simulator CLI — requires FILE=path/to/flow.json
simulate:
	@if [ -z "$(FILE)" ]; then echo "Usage: make simulate FILE=fixtures/flows/orientation_linear_minimal.json"; exit 1; fi
	npm run simulate -- "$(FILE)"

# 🌱 Ouroboros Seeds
# Usage: make seed-sync SPEC=my-feature-name
# Seeds land at .specify/specs/<name>/seed.yaml alongside spec.md/plan.md/tasks.md

seed-sync:
	@set -e; \
	if [ -z "$(SPEC)" ]; then \
		echo "Error: SPEC is required. Usage: make seed-sync SPEC=<feature>"; \
		exit 1; \
	fi; \
	latest=$$(ls -t ~/.ouroboros/seeds/*.yaml 2>/dev/null | head -1); \
	if [ -z "$$latest" ]; then \
		echo "No seeds found in ~/.ouroboros/seeds/"; \
		exit 1; \
	fi; \
	dest=".specify/specs/$(SPEC)"; \
	mkdir -p "$$dest"; \
	cp "$$latest" "$$dest/seed.yaml"; \
	echo "Copied $$(basename $$latest) -> $$dest/seed.yaml"; \
	echo "Next: run spec-kit-translator to generate spec.md, plan.md, tasks.md"

# Aliases for convenience
dev: dev-vercel
seed: db-seed
