const API_BASE = 'http://localhost:8000/api';

export type Point = [number, number, number]; // x, y, t
export type Stroke = Point[];

export interface VerifyResponse {
  success: boolean;
  score_semantic: number;
  score_human: number;
  message?: string;
}

export async function fetchChallenge() {
  const res = await fetch(`${API_BASE}/challenge`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to fetch challenge');
  return res.json() as Promise<{ challengeId: string; word: string }>;
}

export async function verifyDrawing(
  challengeId: string, 
  word: string, 
  strokes: Stroke[]
): Promise<VerifyResponse> {
  const res = await fetch(`${API_BASE}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId, word, strokes }),
  });
  
  if (!res.ok) throw new Error('Verification failed');
  return res.json();
}