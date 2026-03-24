"""
Sprite generation worker.
Phase 3a: Portrait busts (OpenAI images API, per layer) — portrait layers already exist.
Phase 3b: Walkable spritesheets via Replicate retro-diffusion/rd-animation.
         four_angle_walking produces 48×48 per frame; spritesheet output is 192×48.
"""
import json
import logging
import os
import shutil
import subprocess
from pathlib import Path

import httpx

from app.config import settings
from app.sprite_gen.builder import build_walkable

from .schemas import SpriteGenerationJob

logger = logging.getLogger(__name__)

# Resolve paths relative to repo root (backend runs from repo root on Railway)
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
WALKABLE_DIR = Path(os.environ.get("SPRITE_WALKABLE_DIR", str(_REPO_ROOT / "public/sprites/walkable")))
PENDING_DIR = Path(os.environ.get("SPRITE_PENDING_DIR", str(_REPO_ROOT / "public/sprites/pending")))
PUBLIC_DIR = Path(os.environ.get("SPRITE_PUBLIC_DIR", str(_REPO_ROOT / "public/sprites")))


def _is_enabled() -> bool:
    return os.environ.get("SPRITE_GENERATION_ENABLED", "1") == "1"


def _replicate_token() -> str:
    return settings.replicate_api_token.get_secret_value()


async def generate_walkable_sprite(job: SpriteGenerationJob) -> dict:
    """
    Generate a walkable spritesheet via Replicate retro-diffusion/rd-animation.
    four_angle_walking style: 48×48 per frame, 192×48 spritesheet (4 directions).
    Saves to public/sprites/walkable/{nationKey}-{archetypeKey}.png.
    Returns {"status": "generated"|"stub_pending"|"error", "path": str}.
    """
    key = f"{job.nationKey}-{job.archetypeKey}"
    output_path = WALKABLE_DIR / f"{key}.png"

    if not _is_enabled():
        PENDING_DIR.mkdir(parents=True, exist_ok=True)
        marker = PENDING_DIR / f"{key}_walkable_job.json"
        marker.write_text(json.dumps({
            "playerId": job.playerId,
            "nationKey": job.nationKey,
            "archetypeKey": job.archetypeKey,
            "genderKey": job.genderKey,
            "status": "stub_pending",
            "note": "SPRITE_GENERATION_ENABLED not set",
        }))
        logger.info(f"[SpriteWorker] Stub walkable job written: {marker}")
        return {"status": "stub_pending", "path": str(marker)}

    token = _replicate_token()
    if not token:
        logger.error("[SpriteWorker] REPLICATE_API_TOKEN not set")
        return {"status": "error", "error": "REPLICATE_API_TOKEN not set"}

    prompt_result = build_walkable(job.nationKey, job.archetypeKey, job.genderKey)
    logger.info(f"[SpriteWorker] Generating walkable sprite for {key} via Replicate")
    logger.debug(f"[SpriteWorker] Prompt [{prompt_result.category_tag}]: {prompt_result.positive}")
    logger.debug(f"[SpriteWorker] Negative: {prompt_result.negative}")
    logger.debug(f"[SpriteWorker] Seed: {prompt_result.seed}")

    try:
        # Submit prediction to Replicate
        # four_angle_walking forces 48×48 per frame — width/height params are ignored by the model
        # but we pass them for clarity. Output is a 192×48 spritesheet (4 directions).
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                "https://api.replicate.com/v1/models/retro-diffusion/rd-animation/predictions",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "Prefer": "wait",  # wait up to 60s for result inline
                },
                json={
                    "input": {
                        "prompt": prompt_result.positive,
                        "style": "four_angle_walking",
                        "return_spritesheet": True,
                        "bypass_prompt_expansion": True,  # use our crafted prompt as-is
                        "seed": prompt_result.seed,
                        "width": 48,
                        "height": 48,
                    }
                },
            )
            resp.raise_for_status()
            prediction = resp.json()

        # Poll if not completed inline
        prediction_id = prediction.get("id")
        output = prediction.get("output")

        if not output and prediction_id:
            output = await _poll_prediction(token, prediction_id)

        if not output:
            logger.error(f"[SpriteWorker] No output from Replicate for {key}: {prediction}")
            return {"status": "error", "error": "No output from Replicate"}

        # output may be a URL string or list
        sprite_url = output[0] if isinstance(output, list) else output

        # Download the spritesheet
        async with httpx.AsyncClient(timeout=60) as client:
            img_resp = await client.get(sprite_url)
            img_resp.raise_for_status()
            sprite_bytes = img_resp.content

        # Save to public/sprites/walkable/
        WALKABLE_DIR.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(sprite_bytes)
        logger.info(f"[SpriteWorker] Walkable sprite saved: {output_path} ({len(sprite_bytes)} bytes)")

        return {"status": "generated", "path": str(output_path), "key": key}

    except httpx.HTTPStatusError as e:
        logger.error(f"[SpriteWorker] Replicate HTTP error for {key}: {e.response.status_code} {e.response.text[:200]}")
        return {"status": "error", "error": f"HTTP {e.response.status_code}"}
    except Exception as e:
        logger.error(f"[SpriteWorker] Walkable generation failed for {key}: {e}")
        return {"status": "error", "error": str(e)}


async def _poll_prediction(token: str, prediction_id: str, max_wait: int = 90) -> str | None:
    """Poll Replicate prediction until complete or timeout."""
    import asyncio
    async with httpx.AsyncClient(timeout=30) as client:
        for _ in range(max_wait // 3):
            await asyncio.sleep(3)
            r = await client.get(
                f"https://api.replicate.com/v1/predictions/{prediction_id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            r.raise_for_status()
            data = r.json()
            status = data.get("status")
            if status == "succeeded":
                return data.get("output")
            if status in ("failed", "canceled"):
                logger.error(f"[SpriteWorker] Prediction {prediction_id} {status}: {data.get('error')}")
                return None
    logger.error(f"[SpriteWorker] Prediction {prediction_id} timed out after {max_wait}s")
    return None


async def process_portrait_job(job: SpriteGenerationJob) -> dict:
    """
    Generate portrait bust layers. Stubbed — portrait uses OpenAI images API (Phase 3a).
    Walkable sprites are the priority path (Phase 3b, now active via Replicate).
    """
    pending_key = f"{job.nationKey}-{job.archetypeKey}"
    pending_path = PENDING_DIR / "portrait" / pending_key
    pending_path.mkdir(parents=True, exist_ok=True)

    marker = pending_path / "_job.json"
    marker.write_text(json.dumps({
        "playerId": job.playerId,
        "nationKey": job.nationKey,
        "archetypeKey": job.archetypeKey,
        "genderKey": job.genderKey,
        "status": "portrait_pending",
        "note": "Portrait generation queued. Walkable sprite generated separately via Replicate.",
    }))

    # Trigger walkable generation alongside portrait enqueue
    if "walkable" in job.pipeline:
        result = await generate_walkable_sprite(job)
        logger.info(f"[SpriteWorker] Walkable result for {pending_key}: {result.get('status')}")
        return result

    return {"status": "portrait_pending", "path": str(marker)}


async def flatten_portrait(nation_key: str, archetype_key: str) -> Path | None:
    """
    Flatten 5 portrait layers into a single 64x64 PNG using LibreSprite --batch.
    Returns path to flattened PNG or None if LibreSprite not available.
    """
    libresprite = shutil.which("libresprite") or shutil.which("LibreSprite")
    if not libresprite:
        logger.warning("[SpriteWorker] LibreSprite not found — skipping flatten")
        return None

    pending_path = PENDING_DIR / "portrait" / f"{nation_key}-{archetype_key}"
    output_path = PENDING_DIR / "portrait" / f"{nation_key}-{archetype_key}-flat.png"
    script_path = _REPO_ROOT / "scripts/sprites/flatten-portrait.lua"

    if not script_path.exists():
        logger.warning(f"[SpriteWorker] flatten-portrait.lua not found at {script_path}")
        return None

    cmd = [
        libresprite, "--batch",
        "--script", str(script_path),
        "--script-param", f"input={pending_path}",
        "--script-param", f"output={output_path}",
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            logger.error(f"[SpriteWorker] LibreSprite error: {result.stderr}")
            return None
        logger.info(f"[SpriteWorker] Flattened portrait to {output_path}")
        return output_path
    except subprocess.TimeoutExpired:
        logger.error("[SpriteWorker] LibreSprite timed out")
        return None
