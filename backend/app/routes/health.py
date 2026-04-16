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


@router.get("/startup")
async def startup_diagnostic():
    """Test all startup dependencies and return structured diagnostics."""
    import traceback
    from app.database import engine

    results = {}
    errors = []

    # 1. Config loading
    try:
        results["config"] = {
            "environment": settings.environment,
            "database_url_present": bool(settings.database_url),
            "database_url_masked": settings.database_url[:20] + "***" if settings.database_url else None,
            "openai_configured": bool(settings.openai_api_key.get_secret_value()),
            "cors_origins": settings.cors_origins,
        }
    except Exception as e:
        errors.append(f"config: {e}")
        results["config"] = {"error": str(e)}

    # 2. Database engine creation
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        results["database"] = "connected"
    except Exception as e:
        errors.append(f"database: {e}")
        results["database"] = {"error": str(e), "trace": traceback.format_exc()}

    # 3. Import chain (did app.main mount?)
    try:
        from app.main import app
        results["app_mounted"] = True
        results["app_routes"] = [r.path for r in app.routes]
    except Exception as e:
        errors.append(f"app_mount: {e}")
        results["app_mounted"] = False
        results["app_mount_error"] = str(e)

    if errors:
        return JSONResponse(status_code=500, content={"status": "error", "errors": errors, "results": results})
    return {"status": "ok", "results": results}