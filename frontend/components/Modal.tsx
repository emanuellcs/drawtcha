'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl overflow-hidden max-w-sm w-full animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <h2 className="text-sm uppercase font-bold tracking-wider">{title}</h2>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-0">
          {children}
        </div>
      </div>
    </div>
  );
}