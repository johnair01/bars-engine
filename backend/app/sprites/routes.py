import asyncio
import logging
import uuid

from fastapi import APIRouter, HTTPException

from .schemas import SpriteGenerationJob, SpriteJobEnqueuedResponse, SpriteStatusResponse
from .worker import process_portrait_job

router = APIRouter(prefix="/api/sprites", tags=["sprites"])
logger = logging.getLogger(__name__)


async def _run_job(job: SpriteGenerationJob, job_id: str) -> None:
    """Wrapper so background task errors surface in logs instead of disappearing."""
    try:
        result = await process_portrait_job(job)
        logger.info(f"[SpriteGen] Job {job_id} complete: {result}")
    except Exception as e:
        logger.error(f"[SpriteGen] Job {job_id} failed: {e}", exc_info=True)


@router.post("/generate", response_model=SpriteJobEnqueuedResponse)
async def enqueue_sprite_generation(job: SpriteGenerationJob):
    """Enqueue sprite generation for a player. Called after deriveAvatarFromExisting."""
    job_id = str(uuid.uuid4())
    logger.info(f"[SpriteGen] Enqueued job {job_id} for player {job.playerId}: {job.nationKey}-{job.archetypeKey} pipelines={job.pipeline}")
    asyncio.create_task(_run_job(job, job_id))
    return SpriteJobEnqueuedResponse(jobId=job_id, status="enqueued")

@router.get("/status", response_model=SpriteStatusResponse)
async def get_sprite_status(playerId: str):
    """Check generation status for a player's sprites."""
    # TODO: query SpriteAuditLog (Phase 3a.16 — Regent face)
    return SpriteStatusResponse(portrait="none", walkable="none")
