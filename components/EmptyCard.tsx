

import React, { forwardRef } from 'react';
import { TRANSLATIONS } from '../constants';
import { ArrowDownRight } from 'lucide-react';

interface EmptyCardProps {
  lang: 'en' | 'zh';
  style?: React.CSSProperties;
}

export const EmptyCard = forwardRef<HTMLDivElement, EmptyCardProps>(({ lang, style }, ref) => {
  const t = TRANSLATIONS[lang];

  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 w-full max-w-xl mx-auto pointer-events-none will-change-transform"
      style={{
        height: '500px',
        ...style
      }}
    >
      <div
        className={`
          relative w-full h-full
          bg-terminal-bg 
          rounded-lg
          border-4 border-dashed border-divider
          overflow-hidden
          flex items-center justify-center
          shadow-[0_25px_15px_-10px_rgba(0,0,0,0.8),0_10px_0px_#000]
        `}
      >
        {/* Top Highlight */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 z-30" />

        <div className="absolute inset-0 bg-striped-bar opacity-5" />

        <div className="flex flex-col items-center gap-4 opacity-30 rotate-12">
          <div className="w-32 h-20 border-2 border-[#666] rounded-sm flex items-center justify-center shadow-lg">
            <span className="text-2xl font-black text-[#666]">EMPTY</span>
          </div>
          <div className="text-xs font-mono text-[#666] tracking-[0.5em]">INSERT DISK</div>
        </div>

        {/* Guidance Text */}
        <div className="absolute bottom-16 right-8 flex flex-col items-end opacity-70">
          <div className="text-[10px] font-bold text-[#888] font-mono tracking-widest border border-[#444] px-2 py-1 bg-black/20 rounded mb-1">
            {t.clickToRecord}
          </div>
          <ArrowDownRight size={24} className="text-[#666] animate-bounce" />
        </div>

        {/* Label area */}
        <div className="absolute top-0 left-0 right-0 h-16 border-b-4 border-divider bg-header-bg flex items-center px-6 shadow-md">
          <div className="w-full h-4 bg-divider rounded-sm animate-pulse" />
        </div>
      </div>
    </div>
  );
});

EmptyCard.displayName = 'EmptyCard';