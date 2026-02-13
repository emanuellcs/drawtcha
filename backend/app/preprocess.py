import numpy as np
import cv2
from typing import List
from app.schemas import Stroke

def vector_to_raster(strokes: List[Stroke], side=28, padding=16, line_width=4) -> np.ndarray:
    """
    Converts a list of strokes (x, y, t) into a 28x28 grayscale bitmap.
    Matches the Kaggle notebook 'vector_to_raster' logic.
    """
    # Flatten to find bounds
    all_x, all_y = [], []
    for stroke in strokes:
        if not stroke: continue
        # stroke is list of [x, y, t]
        # unzip
        xs = [p[0] for p in stroke]
        ys = [p[1] for p in stroke]
        all_x.extend(xs)
        all_y.extend(ys)
    
    if not all_x:
        return np.zeros((side, side), dtype=np.float32)

    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)
    
    width = max_x - min_x
    height = max_y - min_y
    if width == 0: width = 1
    if height == 0: height = 1
    
    # Setup high-res canvas
    target_size = 256
    scale = (target_size - 2 * padding) / max(width, height)
    
    mask = np.zeros((target_size, target_size), dtype=np.uint8)
    
    for stroke in strokes:
        if len(stroke) < 2: continue
        
        pts = []
        for p in stroke:
            nx = int((p[0] - min_x) * scale) + padding
            ny = int((p[1] - min_y) * scale) + padding
            pts.append((nx, ny))
            
        for i in range(len(pts) - 1):
            cv2.line(mask, pts[i], pts[i+1], 255, line_width)
            
    # Resize to model input size (28x28)
    img = cv2.resize(mask, (side, side), interpolation=cv2.INTER_AREA)
    
    # Normalize to 0-1 range (float32) and add channel dimension
    # Model expects (1, 28, 28)
    img = img.astype(np.float32) / 255.0
    return img

def preprocess_strokes_rnn(strokes: List[Stroke], max_len=100) -> np.ndarray:
    """
    Converts list of strokes into sequence of [dx, dy, pen_lift].
    Matches 'preprocess_strokes_rnn' from training.
    """
    seq = []
    for s_idx, stroke in enumerate(strokes):
        if len(stroke) < 2: continue
        
        for i in range(len(stroke)):
            curr = stroke[i]
            if i == 0:
                dx, dy = 0, 0
                # If new stroke (and not the very first one), pen_lift=1 signals the jump
                pen_lift = 1 if s_idx > 0 else 0
            else:
                prev = stroke[i-1]
                dx = curr[0] - prev[0]
                dy = curr[1] - prev[1]
                pen_lift = 0
            
            seq.append([dx, dy, pen_lift])
            
    seq = np.array(seq, dtype=np.float32)
    
    if len(seq) == 0:
        return np.zeros((1, max_len, 3), dtype=np.float32)
        
    # Normalize by std dev
    std = np.std(seq[:, :2]) + 1e-6
    seq[:, :2] /= std
    
    # Pad or truncate
    if len(seq) > max_len:
        seq = seq[:max_len]
    else:
        pad_len = max_len - len(seq)
        pad = np.zeros((pad_len, 3), dtype=np.float32)
        seq = np.vstack((seq, pad))
        
    return seq