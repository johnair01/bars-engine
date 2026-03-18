from pydantic import BaseModel
from typing import Literal, Optional, List

PipelineType = Literal["portrait", "walkable"]
StatusType = Literal["enqueued", "generated", "review", "approved", "rejected"]

class SpriteGenerationJob(BaseModel):
    playerId: str
    nationKey: str
    archetypeKey: str
    genderKey: str = "default"
    pipeline: List[PipelineType] = ["portrait", "walkable"]

class SpriteJobEnqueuedResponse(BaseModel):
    jobId: str
    status: str = "enqueued"

class SpriteStatusResponse(BaseModel):
    portrait: StatusType | Literal["none"]
    walkable: StatusType | Literal["none"]
