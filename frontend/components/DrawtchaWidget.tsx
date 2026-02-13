'use client';

import { useState } from 'react';
import { Loader2, Check, RefreshCw } from 'lucide-react';
import { fetchChallenge, verifyDrawing, Stroke } from '@/lib/api';
import DrawingCanvas from './DrawingCanvas';
import Modal from './Modal';

export default function DrawtchaWidget() {
  const [status, setStatus] = useState<'idle' | 'challenging' | 'verifying' | 'success' | 'fail'>('idle');
  const [challenge, setChallenge] = useState<{ id: string, word: string } | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const startChallenge = async () => {
    if (status === 'success') return;
    
    setStatus('challenging');
    setFeedback("");
    setStrokes([]);
    setIsModalOpen(true);

    try {
      const data = await fetchChallenge();
      setChallenge({ id: data.challengeId, word: data.word });
    } catch (e) {
      console.error(e);
      setFeedback("Error connecting to server");
      setStatus('idle');
      setIsModalOpen(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    // Reset if they close it without success
    if (status !== 'success') {
      setStatus('idle');
    }
  };

  const handleSubmit = async () => {
    if (!challenge || strokes.length === 0) return;

    setStatus('verifying');
    try {
      const res = await verifyDrawing(challenge.id, challenge.word, strokes);
      if (res.success) {
        setStatus('success');
        setIsModalOpen(false);
      } else {
        setStatus('fail');
        setFeedback(res.message || "Verification failed");
      }
    } catch (e) {
      setStatus('fail');
      setFeedback("Network error");
    }
  };

  // ReCAPTCHA-like Card
  return (
    <>
      <div className="bg-white p-4 rounded-md border shadow-sm w-72 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            onClick={startChallenge}
            className={`w-6 h-6 border-2 rounded-sm cursor-pointer flex items-center justify-center transition-colors
              ${status === 'success' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-gray-400'}`}
          >
            {status === 'success' ? (
              <Check className="w-4 h-4 text-white" />
            ) : status === 'verifying' ? (
               <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            ) : null}
          </div>
          <span className="text-sm font-medium text-gray-700">I'm not a robot</span>
        </div>
        <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-semibold">Drawtcha</span>
            <RefreshCw className="w-3 h-3 text-gray-400" />
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleClose} 
        title="Draw this object:"
      >
        <div className="flex flex-col items-center">
            <div className="bg-blue-600 w-full pb-4 px-4 text-white -mt-1">
               <p className="text-3xl font-bold capitalize">{challenge?.word || "..."}</p>
            </div>

            <div className="p-4 flex flex-col items-center bg-gray-50 w-full">
                {status === 'fail' && (
                    <div className="w-full bg-red-100 text-red-700 text-xs p-2 mb-2 rounded border border-red-200">
                    {feedback}. Try again.
                    </div>
                )}
                
                <DrawingCanvas 
                    width={300} 
                    height={300} 
                    onStrokesChange={setStrokes} 
                    disabled={status === 'verifying'}
                />
                
                <div className="mt-4 flex gap-2 w-full">
                    <button 
                    onClick={startChallenge} // Retry
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                    title="Get new word"
                    >
                    <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                    onClick={handleSubmit}
                    disabled={status === 'verifying' || strokes.length === 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                    {status === 'verifying' ? (
                        <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                        </>
                    ) : (
                        "Verify"
                    )}
                    </button>
                </div>
            </div>
        </div>
      </Modal>
    </>
  );
}