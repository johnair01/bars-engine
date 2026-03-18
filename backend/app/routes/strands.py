"""Strand execution API."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.database import get_db
from app.strand.runner import run_strand
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/strands", tags=["strands"])


class StrandRunRequest(BaseModel):
    """Request to run a strand."""

    type: str = Field(description="Strand type: diagnostic, research, content, etc.")
    subject: str = Field(description="Subject/problem to investigate")
    create_branch: bool = Field(default=False, description="Create git branch (Phase 2)")
    sects: list[str] | None = Field(default=None, description="Override sect sequence")


class StrandRunResponse(BaseModel):
    """Response from strand execution."""

    strand_bar_id: str
    output_bar_ids: list[str]
    branch: str | None = None
    provenance: dict


@router.post("/run", response_model=StrandRunResponse)
async def strand_run(
    body: StrandRunRequest,
    db: AsyncSession = Depends(get_db),
):
    """Execute a strand. Returns strand BAR ID and output BAR IDs."""
    result = await run_strand(
        db,
        body.type,
        body.subject,
        create_branch=body.create_branch,
        sects=body.sects,
    )
    return StrandRunResponse(**result)
