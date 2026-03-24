from typing import Literal

from pydantic import BaseModel

PipelineType = Literal["portrait", "walkable"]
StatusType = Literal["enqueued", "generated", "review", "approved", "rejected"]

class SpriteGenerationJob(BaseModel):
    playerId: str
    nationKey: str
    archetypeKey: str
    genderKey: str = "default"
    pipeline: list[PipelineType] = ["portrait", "walkable"]

class SpriteJobEnqueuedResponse(BaseModel):
    jobId: str
    status: str = "enqueued"

class SpriteStatusResponse(BaseModel):
    portrait: StatusType | Literal["none"]
    walkable: StatusType | Literal["none"]
