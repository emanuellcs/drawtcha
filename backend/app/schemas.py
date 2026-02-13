from pydantic import BaseModel
from typing import List, Tuple, Optional

# A single point: [x, y, t]
# t is optional because some clients might only send x,y, but we need t for RNN ideally
Point = Tuple[float, float, float] 

# A stroke is a list of points
Stroke = List[Point]

class ChallengeResponse(BaseModel):
    challengeId: str
    word: str

class VerifyRequest(BaseModel):
    challengeId: str
    word: str
    strokes: List[Stroke]
    # Optional: client timestamp or total duration for sanity check
    duration: Optional[float] = None

class VerifyResponse(BaseModel):
    success: boolean
    score_semantic: float
    score_human: float
    message: Optional[str] = None