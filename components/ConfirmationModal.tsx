
import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  lang: 'en' | 'zh';
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  lang,
  triggerHaptic
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  return (
    <div className={`fixed inset-0 z-[300] flex items-center justify-center p-4 ${isClosing ? 'pointer-events-none' : ''}`}>
      <style>{`
        @keyframes slideDownOut {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(20px); opacity: 0; }
        }
        .animate-slide-down-out {
          animation: slideDownOut 0.3s ease-in forwards;
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .animate-fade-out {
          animation: fadeOut 0.3s ease-out forwards;
        }
      `}</style>

      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/90 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={handleClose}
      />

      {/* Warning Box */}
      <div className={`relative w-full max-w-sm bg-[#111] border-4 border-retro-red shadow-[0_0_20px_rgba(255,51,51,0.3)] ${isClosing ? 'animate-slide-down-out' : 'animate-slide-up'} overflow-hidden`}>
        
        {/* Striped Header */}
        <div className="bg-retro-red h-8 flex items-center px-2 gap-2 overflow-hidden">
           <div className="w-full h-full flex items-center gap-4 animate-pulse">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-4 h-full bg-black/20 -skew-x-12" />
              ))}
           </div>
           <div className="absolute left-1/2 -translate-x-1/2 bg-retro-red px-4 font-bold text-black border-x-2 border-black tracking-widest uppercase">
              WARNING
           </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
           <AlertTriangle size={48} className="text-retro-red mx-auto mb-4 animate-pulse" />
           <h3 className="text-retro-red font-bold text-lg mb-2 uppercase tracking-wider">{title}</h3>
           <p className="text-retro-light font-mono text-sm leading-relaxed whitespace-pre-wrap opacity-80 mb-8">
             {message}
           </p>

           <div className="flex gap-4">
              <button 
                onClick={handleClose}
                className="flex-1 py-3 border-2 border-[#444] text-[#888] font-bold uppercase hover:bg-[#222] hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <X size={16} />
                {t.cancel}
              </button>
              <button 
                onClick={onConfirm}
                className="flex-1 py-3 bg-retro-red border-2 border-retro-red text-black font-bold uppercase hover:bg-red-400 hover:border-red-400 transition-colors flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none"
              >
                <Check size={16} />
                {t.confirm}
              </button>
           </div>
        </div>

        {/* Footer Code */}
        <div className="bg-[#000] p-1 text-center text-[8px] text-retro-red/40 font-mono tracking-[0.5em]">
           ERR_DESTRUCTIVE_ACTION_DETECTED
        </div>
      </div>
    </div>
  );
};
