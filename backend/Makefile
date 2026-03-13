PORT ?= 8000
FNM_INIT := export PATH="$$HOME/.local/share/fnm:$$PATH" && eval "$$(fnm env)"

.PHONY: test test-agents serve dev stop check install up down db

# Run all backend tests
test:
	uv run python -m pytest tests/ -v

# Run agent tests only
test-agents:
	uv run python -m pytest tests/test_agents/ -v

# Start backend server (with hot reload)
serve:
	uv run uvicorn app.main:app --reload --port $(PORT)

# THE BIG ONE: Postgres + backend + frontend, all at once
up: down
	@echo "==> Starting Postgres (Docker)..."
	docker compose up postgres -d
	@echo "==> Waiting for Postgres..."
	@until docker compose exec postgres pg_isready -U bars -d bars_engine > /dev/null 2>&1; do sleep 1; done
	@echo "==> Postgres ready on :5433"
	@echo "==> Starting backend on :$(PORT)..."
	DATABASE_URL=postgresql+asyncpg://bars:bars@localhost:5433/bars_engine \
		uv run uvicorn app.main:app --reload --port $(PORT) &
	@echo "==> Starting frontend on :3000..."
	export DATABASE_URL=postgresql://bars:bars@localhost:5433/bars_engine && \
		$(FNM_INIT) && cd .. && npm run dev &
	@echo ""
	@echo "  Backend:  http://localhost:$(PORT)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Agents:   http://localhost:3000/agents"
	@echo "  Health:   http://localhost:$(PORT)/api/health"
	@echo ""
	@wait

# Shut everything down
down:
	@kill $$(lsof -ti:$(PORT)) 2>/dev/null || true
	@kill $$(lsof -ti:3000) 2>/dev/null || true
	@docker compose down 2>/dev/null || true

# Just Postgres
db:
	docker compose up postgres -d
	@until docker compose exec postgres pg_isready -U bars -d bars_engine > /dev/null 2>&1; do sleep 1; done
	@echo "Postgres ready on :5433"

# Kill stale processes on dev ports
stop:
	@kill $$(lsof -ti:$(PORT)) 2>/dev/null || true
	@kill $$(lsof -ti:3000) 2>/dev/null || true

# Lint + type check
check:
	uv run ruff check app/ tests/

# Install dependencies
install:
	uv sync
