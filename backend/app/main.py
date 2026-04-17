from collections.abc import AsyncGenerator
# Railway deploy trigger — env vars updated
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import dispose_engine
from app.routes.agents import router as agents_router
from app.routes.health import router as health_router
from app.routes.strands import router as strands_router
from app.sprites.routes import router as sprites_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    if settings.logfire_token:
        try:
            import logfire
            logfire.configure(token=settings.logfire_token.get_secret_value())
            logfire.instrument_fastapi(app)
        except ImportError:
            pass
    yield
    # Shutdown
    await dispose_engine()


app = FastAPI(
    title="BARs Engine API",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/")
async def root():
    return {"status": "ok", "service": "bars-engine-api"}


_default_origins = ["http://localhost:3000", "http://localhost:3001"]
_cors_origins = settings.cors_origins.split(",") if settings.cors_origins else _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(agents_router)
app.include_router(strands_router)
app.include_router(sprites_router)
