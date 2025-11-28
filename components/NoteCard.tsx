

import React, { forwardRef } from 'react';
import { Note, Mood } from '../types';
import { Clock, ImageIcon, ChevronDown, ExternalLink } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  lang: 'en' | 'zh';
  style?: React.CSSProperties;
  isExpanded?: boolean;
  splitHeader?: boolean;
  imageStylization?: boolean;
  isScreenshotMode?: boolean;
  isPreview?: boolean; // New prop for pulled-out state
  onPutBack?: (e: React.MouseEvent) => void; // New prop to handle dismissal
}

const MoodColors: Record<Mood, string> = {
  [Mood.NEUTRAL]: 'bg-gray-500',
  [Mood.HAPPY]: 'bg-yellow-500',
  [Mood.SAD]: 'bg-blue-500',
  [Mood.FOCUSED]: 'bg-emerald-500',
  [Mood.EXCITED]: 'bg-retro-orange',
  [Mood.ANXIOUS]: 'bg-purple-500',
};

// Retro Stripe Pattern
const Stripes = () => (
  <div className="flex flex-col h-full w-2">
    <div className="h-4 bg-retro-red w-full" />
    <div className="h-4 bg-retro-orange w-full" />
    <div className="h-4 bg-retro-amber w-full" />
    <div className="h-4 bg-yellow-200 w-full" />
  </div>
);

export const NoteCard = forwardRef<HTMLDivElement, NoteCardProps>(({
  note,
  onClick,
  lang,
  style,
  isExpanded = false,
  splitHeader = true,
  imageStylization = true,
  isScreenshotMode = false,
  isPreview = false,
  onPutBack
}, ref) => {
  const t = TRANSLATIONS[lang];

  const date = new Date(note.createdAt);
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';

  const dateString = date.toLocaleDateString(locale, { month: '2-digit', day: '2-digit' }).replace(/\//g, '.');
  const timeString = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
  const year = date.getFullYear();

  const mood = note.analysis?.mood || Mood.NEUTRAL;
  const moodColor = MoodColors[mood];
  const moodTextColor = moodColor.replace('bg-', 'text-');

  const useSplitLayout = isExpanded && splitHeader;
  const hasImages = note.images && note.images.length > 0;

  const showThumbnails = hasImages && (!isExpanded || isScreenshotMode);

  // Adjust height style to minimum if not expanded, allowing flex to fill
  const cardHeight = isExpanded ? 'auto' : '500px';

  return (
    <div
      ref={ref}
      className={`
        absolute left-0 right-0 w-full max-w-xl mx-auto 
      `}
      style={{
        ...style,
        height: cardHeight,
        minHeight: cardHeight,
      }}
      onClick={(e) => {
        e.stopPropagation(); // Handle click locally
        onClick(note);
      }}
    >
      <div
        className={`
          relative w-full
          bg-card-bg 
          rounded-lg
          border-4 
          border-card-border shadow-[0_25px_15px_-10px_rgba(0,0,0,0.8),0_10px_0px_#000]
          cursor-pointer
          overflow-hidden
          group
          transition-all duration-200 ease-out
          active:scale-[0.98] active:brightness-95
          ${isExpanded ? 'h-auto' : 'h-full'}
          flex flex-col
        `}
      >
        {/* Top Bevel Highlight for Thickness */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/40 z-30 pointer-events-none" />

        {/* Preview Indicator */}
        {isPreview && (
          <div className="absolute top-0 right-0 bg-retro-amber text-black text-[10px] font-bold px-2 py-0.5 z-40 border-l border-b border-black shadow-sm">
            {t.pulledOut}
          </div>
        )}

        {/* Header Section */}
        <div className={`relative bg-header-bg text-header-text border-b-4 border-card-border shadow-[0_4px_4px_rgba(0,0,0,0.5)] z-10 shrink-0 ${isExpanded ? 'h-auto flex items-stretch' : 'h-[80px] flex items-stretch'}`}>

          {useSplitLayout ? (
            <>
              <div className="w-4 bg-retro-gray border-r border-divider relative overflow-hidden shrink-0">
                <div className="absolute top-2 left-0 w-full h-12 bg-striped-bar opacity-30" />
              </div>

              <div className="flex-1 p-3 flex flex-col gap-2 min-w-0">
                <div className="flex justify-between items-center border-b border-divider border-dashed pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="text-[10px] text-subtext tracking-widest uppercase leading-none">Index.Date</div>
                      <div className="text-xl font-bold tracking-tighter text-retro-amber text-shadow-amber font-mono leading-none mt-0.5">
                        {year}.{dateString}
                      </div>
                    </div>
                    <div className="w-px h-6 bg-[#444]" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wide ${moodTextColor} text-right`}>{t.moods[mood]}</span>
                    <div className={`w-3 h-3 rounded-full ${moodColor} shadow-[0_0_5px_currentColor]`} />
                  </div>
                </div>

                <div className="w-full">
                  <div className="text-[10px] text-subtext tracking-widest uppercase mb-0.5">Subject</div>
                  <h3 className="text-xl font-bold text-header-text whitespace-pre-wrap break-words leading-tight">
                    {note.isProcessing ? 'PROCESSING...' : (note.analysis?.summary || 'NO_DATA')}
                  </h3>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-4 bg-retro-gray border-r border-divider relative overflow-hidden shrink-0">
                <div className="absolute top-2 left-0 w-full h-12 bg-striped-bar opacity-30" />
              </div>

              <div className={`flex-1 px-4 flex justify-between relative overflow-hidden ${isExpanded ? 'py-4 items-center' : 'py-2 items-center'}`}>
                <div className="flex flex-col shrink-0">
                  <div className="text-[10px] text-subtext tracking-widest uppercase">Index.Date</div>
                  <div className="text-2xl font-bold tracking-tighter text-retro-amber text-shadow-amber font-mono">
                    {year}.{dateString}
                  </div>
                </div>

                <div className={`w-px bg-divider mx-4 shrink-0 ${isExpanded ? 'self-stretch my-1' : 'h-8'}`} />

                <div className="flex-1 flex flex-col min-w-0">
                  <div className="text-[10px] text-subtext tracking-widest uppercase">Subject</div>
                  <h3 className={`text-lg font-bold text-header-text group-hover:text-retro-orange transition-colors ${isExpanded ? 'whitespace-pre-wrap break-words leading-tight' : 'truncate'}`}>
                    {note.isProcessing ? 'PROCESSING...' : (note.analysis?.summary || 'NO_DATA')}
                  </h3>
                </div>

                <div className="ml-4 flex flex-col items-center gap-1 shrink-0">
                  <div className={`w-3 h-3 rounded-full ${moodColor} shadow-[0_0_5px_currentColor] animate-pulse`} />
                  <span className="text-[8px] text-[#666] uppercase">MOOD</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Cassette Body */}
        <div className={`relative bg-body-bg p-4 flex-1 flex flex-col gap-4`}>
          <div
            className={`
                relative bg-terminal-bg border-2 border-terminal-border rounded-sm p-4 overflow-hidden shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] flex flex-col
                ${isExpanded ? 'h-auto min-h-[50px]' : 'flex-1 min-h-0'} 
             `}
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] pointer-events-none" />

            <div className={`relative z-10 flex flex-col ${isExpanded ? 'h-auto' : 'h-full'}`}>
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-divider border-dashed shrink-0">
                <Clock size={12} className="text-retro-green" />
                <span className="text-xs text-retro-green font-mono">{timeString} REC_START</span>
                {hasImages && (
                  <div className="ml-auto flex items-center gap-1 text-[10px] text-retro-amber border border-retro-amber/30 px-1 rounded-sm">
                    <ImageIcon size={10} />
                    <span className="font-bold">{note.images?.length}</span>
                  </div>
                )}
              </div>

              <p
                className={`text-retro-light font-mono text-sm leading-6 opacity-90 ${isExpanded ? 'whitespace-pre-wrap break-words' : 'line-clamp-6 overflow-hidden'}`}
              >
                {note.content}
              </p>

              {showThumbnails && (
                <div className="mt-auto pt-4 flex gap-2 overflow-hidden opacity-90 hover:opacity-100 transition-opacity shrink-0">
                  {note.images?.slice(0, 4).map((img, i) => (
                    <div key={i} className="w-10 h-10 md:w-12 md:h-12 border border-[#444] bg-black shrink-0 relative p-1 shadow-md rotate-1 hover:rotate-0 transition-transform">
                      <img
                        src={img}
                        alt="thumb"
                        className={`w-full h-full object-cover transition-all duration-300 ${imageStylization ? 'grayscale opacity-80' : ''}`}
                      />
                      {imageStylization && <div className="absolute top-0 left-0 right-0 h-1 bg-black/20" />}
                    </div>
                  ))}
                  {note.images && note.images.length > 4 && (
                    <div className="w-12 h-12 border border-[#444] bg-[#222] shrink-0 flex items-center justify-center text-[10px] text-[#666]">
                      +{note.images.length - 4}
                    </div>
                  )}
                </div>
              )}

              {note.analysis?.tags && (
                <div className={`mt-auto pt-4 flex flex-wrap gap-2 ${isExpanded ? 'relative' : ''}`}>
                  {note.analysis.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1 bg-retro-orange text-black font-bold uppercase tracking-wider shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Label Section */}
          <div className={`shrink-0 h-8 flex items-center justify-between ${isExpanded ? 'mt-2' : ''}`}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1">
                <Stripes />
                <span className="text-xs font-black text-divider tracking-widest ml-2">CHRONOS MAG-TAPE</span>
              </div>

              {isPreview ? (
                <div className="relative z-50">
                  <button
                    onClick={onPutBack}
                    className="flex items-center gap-1 bg-button-bg px-3 py-1.5 rounded-sm border-2 border-button-border shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none active:bg-white transition-all text-xs font-bold text-button-text"
                  >
                    <span>{t.putBack}</span>
                    <ChevronDown size={14} />
                  </button>
                </div>
              ) : (
                <div className="text-[10px] text-[#666] border border-[#999] px-1 rounded-sm shadow-sm">
                  SIDE A
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

NoteCard.displayName = 'NoteCard';