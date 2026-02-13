import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Drawtcha API"
    VERSION: str = "0.1.0"
    
    # Model Paths (mapped inside Docker)
    MODEL_DIR: str = os.getenv("MODEL_DIR", "./models")
    CNN_MODEL_PATH: str = os.path.join(MODEL_DIR, "cnn.onnx")
    RNN_MODEL_PATH: str = os.path.join(MODEL_DIR, "rnn.onnx")
    CONFIG_PATH: str = os.path.join(MODEL_DIR, "config.json")

    # Thresholds (Configurable via ENV)
    SEMANTIC_THRESHOLD: float = 0.6 # CNN confidence
    HUMAN_THRESHOLD: float = 0.5 # RNN confidence
    MIN_STROKE_POINTS: int = 10 # Reject tiny scribbles
    MIN_DURATION_MS: int = 500 # Reject super fast bot-like draws

    # CORS
    CORS_ORIGINS: list = ["*"]  # For this MVP, allow all. Lock down in prod.

    class Config:
        case_sensitive = True

settings = Settings()