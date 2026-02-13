import uuid
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas import ChallengeResponse, VerifyRequest, VerifyResponse
from app.inference import ModelManager

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models on startup
@app.on_event("startup")
def startup_event():
    ModelManager.get_instance()

@app.get("/")
def read_root():
    return {"status": "online", "version": settings.VERSION}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/challenge", response_model=ChallengeResponse)
def get_challenge():
    """Generates a random word for the user to draw."""
    mgr = ModelManager.get_instance()
    if not mgr.classes:
        raise HTTPException(status_code=503, detail="Models not loaded or config empty")
    
    word = random.choice(mgr.classes)
    challenge_id = str(uuid.uuid4())
    
    # In a real production app, we'd store challenge_id + word in Redis with TTL
    # For this MVP, we trust the client to send back the word (stateless)
    
    return ChallengeResponse(challengeId=challenge_id, word=word)

@app.post("/api/verify", response_model=VerifyResponse)
def verify_drawing(req: VerifyRequest):
    """Verifies the drawing against the requested word."""
    mgr = ModelManager.get_instance()
    
    # Basic Heuristics
    if len(req.strokes) == 0:
        return VerifyResponse(success=False, score_semantic=0, score_human=0, message="No strokes")
    
    total_points = sum(len(s) for s in req.strokes)
    if total_points < settings.MIN_STROKE_POINTS:
        return VerifyResponse(success=False, score_semantic=0, score_human=0, message="Too few points")

    # Run Inference
    try:
        result = mgr.predict(req.strokes)
    except Exception as e:
        print(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail="Inference failed")

    sem_score = result["semantic_score"]
    hum_score = result["human_score"]
    pred_class = result["semantic_class"]
    
    # Decision Logic
    is_correct_class = (pred_class == req.word)
    is_semantic_pass = is_correct_class and (sem_score >= settings.SEMANTIC_THRESHOLD)
    is_human_pass = (hum_score >= settings.HUMAN_THRESHOLD)
    
    # Debug print
    print(f"Target: {req.word} | Pred: {pred_class} ({sem_score:.2f}) | Human: {hum_score:.2f}")

    if is_semantic_pass and is_human_pass:
        return VerifyResponse(success=True, score_semantic=sem_score, score_human=hum_score)
    else:
        msg = []
        if not is_correct_class: msg.append(f"Looks like {pred_class}")
        elif not is_semantic_pass: msg.append("Low confidence")
        if not is_human_pass: msg.append("Bot detected")
        
        return VerifyResponse(
            success=False, 
            score_semantic=sem_score, 
            score_human=hum_score,
            message=", ".join(msg)
        )