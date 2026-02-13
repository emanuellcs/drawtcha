'use client';

import { useEffect, useRef, useState } from 'react';
import { Stroke } from '@/lib/api';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  onStrokesChange: (strokes: Stroke[]) => void;
  disabled?: boolean;
}

export default function DrawingCanvas({ 
  width = 300, 
  height = 300, 
  onStrokesChange,
  disabled = false
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke>([]);

  // Render logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Style
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';

    // Draw all completed strokes
    strokes.forEach(stroke => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0], stroke[0][1]);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i][0], stroke[i][1]);
      }
      ctx.stroke();
    });

    // Draw current stroke
    if (currentStroke.length > 1) {
      ctx.beginPath();
      ctx.moveTo(currentStroke[0][0], currentStroke[0][1]);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i][0], currentStroke[i][1]);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke, width, height]);

  // Sync parent
  useEffect(() => {
    onStrokesChange(strokes);
  }, [strokes, onStrokesChange]);

  const getCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, t: Date.now() }; // Always return 't'
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      t: Date.now()
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const { x, y, t } = getCoords(e);
    setCurrentStroke([[x, y, t]]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || disabled) return;
    const { x, y, t } = getCoords(e);
    setCurrentStroke(prev => [...prev, [x, y, t]]);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    if (currentStroke.length > 0) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
  };

  const clear = () => {
    setStrokes([]);
    setCurrentStroke([]);
  };

  return (
    <div className="relative border border-gray-300 shadow-inner inline-block">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="touch-none cursor-crosshair bg-white"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      <button 
        onClick={clear}
        disabled={disabled}
        className="absolute top-2 right-2 bg-gray-100 hover:bg-gray-200 text-xs px-2 py-1 rounded text-gray-600 disabled:opacity-50"
      >
        Undo
      </button>
    </div>
  );
}