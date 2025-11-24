
import React, { useState, useEffect } from 'react';
import { Filter, Calendar, Tag, Check, X, Layers, RotateCcw } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { FilterCriteria, TagMode } from '../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'zh';
  availableTags: string[];
  currentFilters: FilterCriteria;
  onApply: (criteria: FilterCriteria) => void;
  onReset: () => void;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  lang,
  availableTags,
  currentFilters,
  onApply,
  onReset,
  triggerHaptic
}) => {
  const t = TRANSLATIONS[lang];
  const [localFilters, setLocalFilters] = useState<FilterCriteria>(currentFilters);
  const [isClosing, setIsClosing] = useState(false);

  // Sync local state when modal opens or currentFilters change externally
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(currentFilters);
      setIsClosing(false);
    }
  }, [isOpen, currentFilters]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    triggerHaptic('light');
    setLocalFilters(prev => {
      const isSelected = prev.selectedTags.includes(tag);
      return {
        ...prev,
        selectedTags: isSelected
          ? prev.selectedTags.filter(t => t !== tag)
          : [...prev.selectedTags, tag]
      };
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    handleClose(); // Animate close
  };

  const handleReset = () => {
    onReset();
    handleClose(); // Animate close
  };

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 ${isClosing ? 'pointer-events-none' : ''}`}>
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
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={handleClose}
      />

      {/* Filter Window */}
      <div className={`relative w-full max-w-lg bg-[#1a1a1a] border-4 border-retro-amber shadow-[0_0_30px_rgba(255,176,0,0.2)] ${isClosing ? 'animate-slide-down-out' : 'animate-slide-up'} overflow-hidden`}>
        
        {/* Header */}
        <div className="bg-retro-amber px-4 py-2 flex justify-between items-center border-b-4 border-[#111]">
          <div className="flex items-center gap-2 text-black font-bold">
            <Filter size={18} />
            <span className="tracking-widest uppercase">{t.filterModal.title}</span>
          </div>
          <button 
            onClick={handleClose}
            className="bg-black text-retro-amber p-0.5 border border-black hover:bg-[#333] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-grid-pattern bg-[size:20px_20px] relative">
           <div className="absolute inset-0 bg-[#1a1a1a] opacity-95" />
           
           <div className="relative z-10 space-y-6 font-mono">
              
              {/* Date Range Section */}
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-retro-amber text-xs uppercase tracking-widest mb-2">
                    <Calendar size={14} />
                    {t.filterModal.dateRange}
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] text-[#666]">{t.filterModal.from}</label>
                       <input 
                         type="date"
                         value={localFilters.startDate}
                         onChange={(e) => setLocalFilters({...localFilters, startDate: e.target.value})}
                         className="bg-[#111] border border-[#444] text-retro-light p-2 text-xs focus:outline-none focus:border-retro-amber uppercase"
                       />
                    </div>
                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] text-[#666]">{t.filterModal.to}</label>
                       <input 
                         type="date"
                         value={localFilters.endDate}
                         onChange={(e) => setLocalFilters({...localFilters, endDate: e.target.value})}
                         className="bg-[#111] border border-[#444] text-retro-light p-2 text-xs focus:outline-none focus:border-retro-amber uppercase"
                       />
                    </div>
                 </div>
              </div>

              <div className="w-full h-px bg-[#333]" />

              {/* Tags Section */}
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-retro-amber text-xs uppercase tracking-widest">
                       <Tag size={14} />
                       {t.filterModal.tags}
                    </div>

                    {/* Logic Gate Toggle */}
                    {localFilters.selectedTags.length > 1 && (
                      <div className="flex items-center bg-[#111] border border-[#333] rounded-sm overflow-hidden">
                        <button
                          onClick={() => { setLocalFilters({...localFilters, tagMode: 'ANY'}); triggerHaptic('light'); }}
                          className={`px-2 py-1 text-[9px] font-bold uppercase transition-colors ${localFilters.tagMode === 'ANY' ? 'bg-retro-green text-black' : 'text-[#666] hover:text-[#888]'}`}
                          title={t.filterModal.modeAny}
                        >
                          OR
                        </button>
                        <div className="w-px bg-[#333] h-full" />
                        <button
                          onClick={() => { setLocalFilters({...localFilters, tagMode: 'ALL'}); triggerHaptic('light'); }}
                          className={`px-2 py-1 text-[9px] font-bold uppercase transition-colors ${localFilters.tagMode === 'ALL' ? 'bg-retro-green text-black' : 'text-[#666] hover:text-[#888]'}`}
                          title={t.filterModal.modeAll}
                        >
                          AND
                        </button>
                      </div>
                    )}
                 </div>

                 <div className="flex flex-col gap-2">
                    {localFilters.selectedTags.length > 1 && (
                       <div className="text-[10px] text-[#666] flex items-center gap-1">
                          <Layers size={10} />
                          {localFilters.tagMode === 'ANY' ? t.filterModal.modeAny : t.filterModal.modeAll}
                       </div>
                    )}

                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                       {availableTags.length === 0 ? (
                          <span className="text-xs text-[#444] italic">{t.filterModal.noTags}</span>
                       ) : (
                          availableTags.map(tag => {
                             const isSelected = localFilters.selectedTags.includes(tag);
                             return (
                                <button
                                  key={tag}
                                  onClick={() => toggleTag(tag)}
                                  className={`
                                    px-2 py-1 text-xs border transition-all flex items-center gap-1
                                    ${isSelected 
                                      ? 'bg-retro-amber/20 border-retro-amber text-retro-amber shadow-[0_0_8px_rgba(255,176,0,0.3)]' 
                                      : 'bg-[#111] border-[#333] text-[#666] hover:border-[#666] hover:text-[#888]'}
                                  `}
                                >
                                  {isSelected && <Check size={10} />}
                                  #{tag}
                                </button>
                             );
                          })
                       )}
                    </div>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3 border-t border-[#333]">
                 <button
                   onClick={handleReset}
                   className="flex-1 py-2 border border-[#444] text-[#888] hover:text-white hover:border-white transition-colors text-xs font-bold uppercase flex items-center justify-center gap-2"
                 >
                   <RotateCcw size={14} />
                   {t.filterModal.reset}
                 </button>
                 <button
                   onClick={handleApply}
                   className="flex-[2] py-2 bg-retro-amber text-black border-2 border-retro-amber hover:bg-white hover:border-white transition-colors text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"
                 >
                   <Filter size={14} />
                   {t.filterModal.apply}
                 </button>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
};
