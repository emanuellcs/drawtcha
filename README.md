# Drawtcha: Draw-to-Verify CAPTCHA

A "draw-to-verify" system where users must draw a specific object to prove they are human.

## Project Structure
- `notebooks/`: Kaggle training pipeline.
- `backend/`: FastAPI server (Python) + ONNX inference.
- `frontend/`: Next.js client (TypeScript/Tailwind).

## Setup & Run

### 1. Model Artifacts
Ensure you have the trained models.
Place `cnn.onnx`, `rnn.onnx`, and `config.json` inside:
`backend/models/`

### 2. Run with Docker Compose (Recommended)
This starts both the backend API and the frontend UI.

```bash
docker-compose up --build
```

* **Frontend:** http://localhost:3000
* **Backend API:** http://localhost:8000
* **API Docs:** http://localhost:8000/docs

### 3. Manual Local Development

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install -g pnpm
pnpm install
pnpm dev
```

## How it works

1. **Frontend** requests a challenge (`/api/challenge`).
2. **User** draws the prompt on the canvas.
3. **Frontend** sends stroke data `{x,y,t}` to `/api/verify`.
4. **Backend** rasterizes strokes for the CNN (Is it a cat?) and processes timing for the RNN (Is it human movement?).
5. **Backend** returns pass/fail based on weighted score.