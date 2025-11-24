
import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, X, Save, Calendar, Tag, Smile, Image as ImageIcon, Trash2 } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Mood } from '../types';

interface ComposerProps {
  onSave: (data: string | { content: string, summary: string, tags: string[], mood: Mood, createdAt: number, images: string[] }, images?: string[]) => void;
  isExpanded: boolean;
  setExpanded: (expanded: boolean) => void;
  lang: 'en' | 'zh';
  smartAnalysisMode: boolean;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
}

export const Composer: React.FC<ComposerProps> = ({ onSave, isExpanded, setExpanded, lang, smartAnalysisMode, triggerHaptic }) => {
  // Common State
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  // Manual Mode State
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [mood, setMood] = useState<Mood>(Mood.NEUTRAL);
  const [date, setDate] = useState(() => {
    // Format YYYY-MM-DDTHH:MM for datetime-local
    const now = new Date();
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[lang];

  // Animation closing state
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isExpanded && textareaRef.current && smartAnalysisMode) {
      textareaRef.current.focus();
    }
  }, [isExpanded, smartAnalysisMode]);

  // Reset fields when opening/closing
  useEffect(() => {
    if (!isExpanded) {
      // Delay cleaning to avoid UI jump during close animation
      const timer = setTimeout(() => {
        setContent('');
        setTitle('');
        setTags('');
        setImages([]);
        setMood(Mood.NEUTRAL);
        const now = new Date();
        const pad = (n: number) => n < 10 ? '0' + n : n;
        setDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setExpanded(false);
      setIsClosing(false);
    }, 300);
  };

  const handleSubmit = () => {
    if (!content.trim() && images.length === 0) return;

    if (smartAnalysisMode) {
      onSave(content, images);
    } else {
      // Validation for manual mode
      const finalTitle = title.trim() || t.untitled;
      const finalTags = tags.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const timestamp = new Date(date).getTime();

      onSave({
        content,
        summary: finalTitle,
        tags: finalTags,
        mood,
        createdAt: timestamp,
        images
      });
    }

    handleClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit();
    }
  };

  // Image Upload Handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          // Resize image to max 800px width/height to save space
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Compression quality 0.7
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setImages(prev => [...prev, dataUrl]);
            triggerHaptic('medium');
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(file as Blob);
    });
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    triggerHaptic('medium');
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Determine if button should be hidden (when expanded and not currently closing)
  // If closing, we want the button to reappear (be visible)
  const isButtonHidden = isExpanded && !isClosing;

  return (
    <>
      {/* Floating Action Button with Transition */}
      <button
        onClick={() => setExpanded(true)}
        disabled={isButtonHidden}
        className={`
          fixed bottom-8 right-8 z-[60] group flex items-center justify-center w-16 h-16 
          bg-retro-orange border-4 border-[#111] shadow-[4px_4px_0px_#000] 
          hover:translate-y-1 hover:shadow-[2px_2px_0px_#000] hover:bg-white 
          active:translate-y-2 active:shadow-none 
          transition-all duration-500 origin-center
          ${isButtonHidden ? 'scale-0 opacity-0 pointer-events-none rotate-180' : 'scale-100 opacity-100 rotate-0'}
        `}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <Terminal size={28} className="text-black group-hover:text-retro-orange transition-colors" />
      </button>

      {/* Modal Container */}
      {isExpanded && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 ${isClosing ? 'animate-fade-out pointer-events-none' : 'animate-fade-in'}`}>
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
          
          <div className={`w-full max-w-2xl bg-[#1a1a1a] border-4 border-retro-light shadow-[10px_10px_0px_#000] relative flex flex-col ${isClosing ? 'animate-slide-down-out' : 'animate-slide-up'} ${smartAnalysisMode ? 'max-h-[80vh]' : 'h-[85vh] md:h-auto md:max-h-[90vh]'}`}>
            
            {/* Terminal Header */}
            <div className="px-4 py-2 border-b-4 border-retro-light flex justify-between items-center bg-retro-light shrink-0">
              <h2 className="text-sm font-bold text-black flex items-center gap-2 uppercase tracking-widest">
                <Terminal size={16} />
                {t.captureThought} // {smartAnalysisMode ? 'AUTO_ANALYSIS' : 'MANUAL_ENTRY'}
              </h2>
              <button 
                onClick={handleClose}
                className="p-1 bg-retro-red border-2 border-black hover:bg-red-400 transition-colors"
              >
                <X size={16} className="text-black" />
              </button>
            </div>

            {/* CRT Screen Area */}
            <div className="p-4 bg-black relative flex-1 overflow-y-auto custom-scrollbar">
              {/* Green Screen Glow */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(51,255,0,0.2)] z-0" />
              
              <div className="relative z-10 flex flex-col h-full">
                {smartAnalysisMode ? (
                  // SMART MODE: Simple Textarea
                  <div className="flex gap-2 flex-1">
                    <span className="text-retro-green font-mono select-none pt-1">{'>'}</span>
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t.placeholder}
                      className="w-full h-full min-h-[160px] bg-transparent text-retro-green p-0 text-lg placeholder-retro-green/30 resize-none focus:outline-none font-mono leading-relaxed caret-retro-green selection:bg-retro-green selection:text-black"
                    />
                  </div>
                ) : (
                  // MANUAL MODE: Form Fields
                  <div className="flex flex-col gap-6 font-mono pb-4">
                    
                    {/* Row 1: Title */}
                    <div className="flex flex-col gap-1 group">
                       <label className="text-[10px] text-retro-green/60 uppercase tracking-widest flex items-center gap-1 group-focus-within:text-retro-green transition-colors">
                         <Terminal size={10} />
                         {t.labels.title}
                       </label>
                       <input 
                         type="text" 
                         value={title}
                         onChange={(e) => setTitle(e.target.value)}
                         className="bg-transparent border-b border-retro-green/30 text-retro-green font-bold text-xl py-1 focus:outline-none focus:border-retro-green placeholder-retro-green/20"
                         placeholder="UNTITLED_ENTRY"
                       />
                    </div>

                    {/* Row 2: Date & Mood */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="flex flex-col gap-1 group">
                          <label className="text-[10px] text-retro-green/60 uppercase tracking-widest flex items-center gap-1 group-focus-within:text-retro-green transition-colors">
                            <Calendar size={10} />
                            {t.labels.date}
                          </label>
                          <input 
                            type="datetime-local" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent border-b border-retro-green/30 text-retro-green py-1 focus:outline-none focus:border-retro-green text-sm font-mono"
                          />
                       </div>

                       <div className="flex flex-col gap-2">
                          <label className="text-[10px] text-retro-green/60 uppercase tracking-widest flex items-center gap-1">
                            <Smile size={10} />
                            {t.labels.mood}
                          </label>
                          <div className="flex flex-wrap gap-2">
                             {Object.values(Mood).map(m => (
                                <button
                                  key={m}
                                  onClick={() => { setMood(m); triggerHaptic('light'); }}
                                  className={`
                                    text-[10px] uppercase px-2 py-1 border transition-all
                                    ${mood === m 
                                      ? 'bg-retro-green text-black border-retro-green font-bold shadow-[0_0_10px_rgba(51,255,0,0.5)]' 
                                      : 'border-retro-green/30 text-retro-green/60 hover:text-retro-green hover:border-retro-green'}
                                  `}
                                >
                                  {t.moods[m]}
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    {/* Row 3: Tags */}
                    <div className="flex flex-col gap-1 group">
                       <label className="text-[10px] text-retro-green/60 uppercase tracking-widest flex items-center gap-1 group-focus-within:text-retro-green transition-colors">
                         <Tag size={10} />
                         {t.labels.tags}
                       </label>
                       <input 
                         type="text" 
                         value={tags}
                         onChange={(e) => setTags(e.target.value)}
                         className="bg-transparent border-b border-retro-green/30 text-retro-green py-1 focus:outline-none focus:border-retro-green placeholder-retro-green/20 text-sm"
                         placeholder="TAG1, TAG2, TAG3..."
                       />
                    </div>

                    {/* Row 4: Content */}
                    <div className="flex flex-col gap-1 group flex-1">
                       <label className="text-[10px] text-retro-green/60 uppercase tracking-widest flex items-center gap-1 group-focus-within:text-retro-green transition-colors">
                         {'>'} {t.labels.content}
                       </label>
                       <textarea
                         value={content}
                         onChange={(e) => setContent(e.target.value)}
                         className="w-full bg-transparent border border-retro-green/20 p-2 text-retro-green text-base focus:outline-none focus:border-retro-green/50 placeholder-retro-green/20 font-mono leading-relaxed h-32 md:h-40 resize-none"
                         placeholder={t.placeholder}
                       />
                    </div>
                  </div>
                )}

                {/* Image Preview Area */}
                {images.length > 0 && (
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-2 custom-scrollbar shrink-0">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group shrink-0">
                        <div className="w-16 h-16 md:w-20 md:h-20 border border-retro-green/50 p-1 bg-black/50">
                          <img src={img} alt="Preview" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                        </div>
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-retro-red text-black rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity border border-black shadow-sm"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Blinking Block Cursor (Visual only) */}
              <div className="absolute bottom-4 right-4 text-xs text-retro-green font-mono animate-pulse pointer-events-none">
                 CURSOR_ACTIVE_
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-4 py-3 bg-[#262626] border-t-4 border-retro-light flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                 <button
                   onClick={() => { triggerHaptic('light'); fileInputRef.current?.click(); }}
                   className="flex items-center gap-1 px-3 py-1 bg-[#333] border border-[#555] text-retro-light hover:text-retro-green hover:border-retro-green transition-colors text-xs font-bold uppercase"
                   title={t.addImage}
                 >
                    <ImageIcon size={14} />
                    <span className="hidden md:inline">{t.addImage}</span>
                    <span className="ml-1 opacity-50 text-[10px]">({images.length})</span>
                 </button>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleImageUpload} 
                   className="hidden" 
                   accept="image/*" 
                   multiple 
                 />
                 
                 <span className="text-xs text-[#888] font-mono uppercase hidden md:inline ml-2 border-l border-[#444] pl-3">
                    // {smartAnalysisMode ? t.aiDisclaimer : 'MANUAL_INPUT_MODE'}
                 </span>
              </div>

              <div className="flex items-center gap-4 ml-auto">
                 <span className="text-xs text-retro-amber font-mono border border-retro-amber px-2 py-0.5">
                   LEN: {content.length}
                 </span>
                 <button
                  onClick={handleSubmit}
                  disabled={!content.trim() && images.length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-retro-light border-b-4 border-r-4 border-[#555] active:border-0 active:translate-y-1 text-black font-bold uppercase hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                 >
                   <span>{t.record}</span>
                   <Save size={16} />
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
