from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("")
async def health_check():
    openai_configured = bool(settings.openai_api_key.get_secret_value())
    return {
        "status": "ok",
        "environment": settings.environment,
        "openai_configured": openai_configured,
    }


@router.get("/db")
async def health_check_db(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception:
        return JSONResponse(status_code=503, content={"status": "error", "database": "unreachable"})
