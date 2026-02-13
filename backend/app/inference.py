import onnxruntime as ort
import numpy as np
import json
import os
from typing import Dict, Any, List
from app.config import settings
from app.preprocess import vector_to_raster, preprocess_strokes_rnn

class ModelManager:
    _instance = None
    
    def __init__(self):
        self.cnn_session = None
        self.rnn_session = None
        self.config = {}
        self.class_map = {} # label_idx -> class_name
        
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
            cls._instance.load_models()
        return cls._instance
        
    def load_models(self):
        print(f"Loading models from {settings.MODEL_DIR}...")
        try:
            # Load Config
            with open(settings.CONFIG_PATH, 'r') as f:
                self.config = json.load(f)
            
            # Create Index Map
            self.classes = self.config.get("classes", [])
            self.class_map = {i: name for i, name in enumerate(self.classes)}
            
            # Load ONNX Models
            self.cnn_session = ort.InferenceSession(settings.CNN_MODEL_PATH)
            self.rnn_session = ort.InferenceSession(settings.RNN_MODEL_PATH)
            print("Models loaded successfully.")
            
        except Exception as e:
            print(f"Error loading models: {e}")
            print("WARNING: Inference will fail until models are fixed.")

    def predict(self, strokes: List[Any]) -> Dict[str, Any]:
        if not self.cnn_session or not self.rnn_session:
            raise RuntimeError("Models not loaded")

        # CNN Inference (Semantic)
        # Preprocess
        img = vector_to_raster(strokes, side=self.config.get("img_size", 28))
        # Add batch dim and channel dim: (1, 1, 28, 28)
        img_batch = img[np.newaxis, np.newaxis, :, :]
        
        # Run CNN
        cnn_input_name = self.cnn_session.get_inputs()[0].name
        cnn_logits = self.cnn_session.run(None, {cnn_input_name: img_batch})[0]
        
        # Softmax
        exp_logits = np.exp(cnn_logits - np.max(cnn_logits))
        probs = exp_logits / exp_logits.sum()
        
        top_idx = np.argmax(probs)
        top_class = self.class_map.get(top_idx, "unknown")
        confidence = float(probs[0][top_idx])

        # RNN Inference (Human/Bot)
        # Preprocess
        seq = preprocess_strokes_rnn(strokes, max_len=self.config.get("max_seq_len", 100))
        # Add batch dim: (1, 100, 3)
        seq_batch = seq[np.newaxis, :, :]
        
        # Run RNN
        rnn_input_name = self.rnn_session.get_inputs()[0].name
        rnn_out = self.rnn_session.run(None, {rnn_input_name: seq_batch})[0]
        # Probability 0.0-1.0
        human_score = float(rnn_out[0][0])
        
        return {
            "semantic_class": top_class,
            "semantic_score": confidence,
            "human_score": human_score,
            "all_probs": {self.class_map[i]: float(p) for i, p in enumerate(probs[0])}
        }

model_manager = ModelManager()