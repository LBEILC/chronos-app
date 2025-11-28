
import React, { useEffect, useState, useRef } from 'react';
import { Note, Mood } from '../types';
import { X, Tag, Cpu, Trash2, Edit2, Save, RotateCcw, Image as ImageIcon, Plus } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface NoteDetailModalProps {
  note: Note | null;
  onClose: () => void;
  lang: 'en' | 'zh';
  onDelete: (id: string) => void;
  onUpdate: (updatedNote: Note) => void;
  imageStylization: boolean;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
}

const MoodColors: Record<Mood, string> = {
  [Mood.NEUTRAL]: 'text-gray-400',
  [Mood.HAPPY]: 'text-yellow-500',
  [Mood.SAD]: 'text-blue-500',
  [Mood.FOCUSED]: 'text-emerald-500',
  [Mood.EXCITED]: 'text-retro-orange',
  [Mood.ANXIOUS]: 'text-purple-500',
};

// Helper to format date for datetime-local input
const toDateTimeLocal = (timestamp: number) => {
  const date = new Date(timestamp);
  const pad = (n: number) => n < 10 ? '0' + n : n;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// --- Animation Components ---

const ScrambleTitle = ({ text, className }: { text: string; className?: string }) => {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);

  useEffect(() => {
    // Reset start
    setIsScrambling(true);
    let iteration = 0;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

    // Determine speed based on length (shorter texts can be slower per char, longer needs to be faster)
    const speed = Math.max(10, Math.min(50, 1000 / text.length));

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (char === " " || char === "\n") return char; // Preserve spaces
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
        setIsScrambling(false);
        setDisplayText(text); // Ensure final state is correct
      }

      iteration += 1 / 2; // Reveal half a char per frame on average for smoother effect
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <h1 className={`${className} ${isScrambling ? 'opacity-80' : 'opacity-100'}`}>
      {displayText}
    </h1>
  );
};

// --- Main Component ---

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({ note, onClose, lang, onDelete, onUpdate, imageStylization, triggerHaptic }) => {
  const t = TRANSLATIONS[lang];
  const [isEditing, setIsEditing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState<{
    content: string;
    summary: string;
    tags: string;
    createdAt: string;
    mood: Mood;
    images: string[];
  } | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (note) {
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
      // Reset edit state when note changes
      setIsEditing(false);
      setFormData({
        content: note.content,
        summary: note.analysis?.summary || '',
        tags: note.analysis?.tags?.join(', ') || '',
        createdAt: toDateTimeLocal(note.createdAt),
        mood: note.analysis?.mood || Mood.NEUTRAL,
        images: note.images || []
      });
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [note]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleSave = () => {
    if (!note || !formData) return;

    const updatedNote: Note = {
      ...note,
      content: formData.content,
      createdAt: new Date(formData.createdAt).getTime(),
      analysis: {
        ...note.analysis!,
        summary: formData.summary,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        mood: formData.mood
      },
      images: formData.images
    };

    onUpdate(updatedNote);
    setIsEditing(false);
  };

  const handleDiscard = () => {
    if (!note) return;
    triggerHaptic('medium');
    setFormData({
      content: note.content,
      summary: note.analysis?.summary || '',
      tags: note.analysis?.tags?.join(', ') || '',
      createdAt: toDateTimeLocal(note.createdAt),
      mood: note.analysis?.mood || Mood.NEUTRAL,
      images: note.images || []
    });
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !formData) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          // Resize similar to Composer
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

            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setFormData(prev => prev ? ({ ...prev, images: [...prev.images, dataUrl] }) : null);
            triggerHaptic('medium');
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(file as Blob);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    if (!formData) return;
    triggerHaptic('medium');
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  if (!note) return null;

  const date = new Date(note.createdAt);
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  const fullDate = date.toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const mood = note.analysis?.mood || Mood.NEUTRAL;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 ${isClosing ? 'pointer-events-none' : ''}`}>
      <style>{`
        @keyframes blurIn {
          0% { filter: blur(12px); opacity: 0; transform: translateY(10px); }
          100% { filter: blur(0); opacity: 1; transform: translateY(0); }
        }
        .animate-blur-in {
          animation: blurIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        @keyframes slideDownOut {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(40px); opacity: 0; }
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

      {/* Lightbox Overlay */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 mt-[env(safe-area-inset-top)] text-white hover:text-retro-red transition-colors flex items-center gap-2 border border-white/20 px-3 py-1 bg-black z-50"
          >
            <X size={20} />
            <span className="text-xs font-mono uppercase tracking-widest">{t.closeImage}</span>
          </button>
          <img
            src={selectedImage}
            alt="Full view"
            className="max-w-full max-h-[90vh] object-contain border-4 border-[#333] shadow-[0_0_50px_rgba(0,0,0,1)]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Backdrop with Grid */}
      <div
        className={`absolute inset-0 bg-black/90 bg-grid-pattern opacity-90 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={handleClose}
      />

      {/* Modal Content - The Device */}
      <div className={`relative w-full max-w-3xl bg-[#0a0a0a] border-2 ${isEditing ? 'border-retro-amber' : 'border-retro-green'} shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-none overflow-hidden ${isClosing ? 'animate-slide-down-out' : 'animate-slide-up'} flex flex-col h-[85vh] transition-colors duration-300`}>

        {/* System Header (UI Frame - Always Mono) */}
        <div className={`${isEditing ? 'bg-retro-amber' : 'bg-[#151515] border-b border-retro-green/20'} px-4 py-3 flex justify-between items-center font-mono z-10 transition-colors duration-300 shrink-0`}>
          <div className={`flex items-center gap-2 ${isEditing ? 'text-black font-bold' : 'text-retro-green'}`}>
            <Cpu size={16} />
            <span className="tracking-widest text-sm">{isEditing ? t.editMode : 'SYSTEM_LOG_VIEWER // v2.1'}</span>
          </div>
          <button
            onClick={handleClose}
            className={`w-6 h-6 flex items-center justify-center border ${isEditing ? 'border-black text-black hover:bg-black hover:text-retro-amber' : 'border-retro-green/50 text-retro-green hover:bg-retro-green hover:text-black'} transition-colors`}
          >
            <X size={14} />
          </button>
        </div>

        {/* Meta Bar (UI Frame - Mono) - Only visible in View Mode */}
        {!isEditing && (
          <div className="grid grid-cols-2 bg-[#111] border-b border-[#222] text-[10px] font-mono text-[#666] shrink-0">
            <div className="p-2 border-r border-[#222]">
              TIMESTAMP: <span className="text-retro-light">{fullDate} {time}</span>
            </div>
            <div className="p-2 truncate">
              ID: <span className="text-[#444]">{note.id}</span>
            </div>
          </div>
        )}

        {/* Scrollable Body - The "Screen" or "Paper" */}
        <div className="overflow-y-auto custom-scrollbar flex-1 bg-[#121212] relative">

          <div className="min-h-full p-8 md:p-12 mx-auto max-w-2xl">

            {isEditing && formData ? (
              /* EDIT FORM (System/Terminal Style - Keeps Mono for data entry) */
              <div className="space-y-8 font-mono animate-fade-in">

                {/* Title Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-retro-amber uppercase tracking-widest">{t.labels.title}</label>
                  <input
                    type="text"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="bg-[#080808] border-b-2 border-retro-amber p-3 text-xl font-bold text-retro-light focus:outline-none focus:bg-[#151515] transition-colors rounded-none placeholder-retro-amber/30 w-full"
                  />
                </div>

                {/* Timestamp & Mood Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-retro-amber uppercase tracking-widest">{t.labels.date}</label>
                    <input
                      type="datetime-local"
                      value={formData.createdAt}
                      onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                      className="bg-[#080808] border border-retro-amber/50 p-2 text-retro-amber font-mono focus:outline-none focus:border-retro-amber rounded-none w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-retro-amber uppercase tracking-widest">{t.labels.mood}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.values(Mood).map((m) => (
                        <button
                          key={m}
                          onClick={() => { setFormData({ ...formData, mood: m }); triggerHaptic('light'); }}
                          className={`
                            px-1 py-2 text-[10px] font-bold uppercase border 
                            ${formData.mood === m ? 'bg-retro-amber text-black border-retro-amber' : 'border-[#333] text-[#666] hover:border-[#666]'}
                            transition-all
                          `}
                        >
                          {t.moods[m]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Content Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-retro-amber uppercase tracking-widest">{t.labels.content}</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full h-96 bg-[#080808] border-2 border-retro-amber/30 p-4 text-retro-light font-mono leading-relaxed focus:outline-none focus:border-retro-amber resize-none rounded-none text-sm"
                  />
                </div>

                {/* Tags Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-retro-amber uppercase tracking-widest">{t.labels.tags}</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="bg-[#080808] border border-retro-amber/50 p-3 text-retro-amber font-mono focus:outline-none focus:border-retro-amber rounded-none w-full"
                    placeholder="TAG1, TAG2, TAG3..."
                  />
                </div>

                {/* Images Edit Section */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-retro-amber uppercase tracking-widest flex justify-between items-center">
                    <span>{t.photos}</span>
                    <button
                      onClick={() => { triggerHaptic('light'); fileInputRef.current?.click(); }}
                      className="text-[10px] flex items-center gap-1 bg-[#222] px-2 py-1 hover:bg-[#333] border border-[#444]"
                    >
                      <Plus size={10} /> ADD
                    </button>
                  </label>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />

                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4 bg-[#080808] p-4 border border-retro-amber/20 min-h-[100px]">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative group aspect-square bg-[#111] border border-[#333]">
                        <img
                          src={img}
                          className={`w-full h-full object-cover group-hover:opacity-100 transition-opacity ${imageStylization ? 'grayscale opacity-60' : 'opacity-80'}`}
                        />
                        <button
                          onClick={() => handleRemoveImage(i)}
                          className="absolute -top-2 -right-2 bg-retro-red text-black p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-black shadow-md"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {formData.images.length === 0 && (
                      <div className="col-span-full flex items-center justify-center text-[#333] text-xs uppercase">
                        NO_ATTACHMENTS_FOUND
                      </div>
                    )}
                  </div>
                </div>
              </div>

            ) : (
              /* VIEW MODE (Hybrid Typography - Document Style) */
              /* Clean background, Sans-serif text, High readability */
              <article className="animate-fade-in pb-12">
                {/* Document Header */}
                <header className="mb-10 pb-6 border-b border-[#333]">
                  <div className="flex items-center gap-3 mb-4 animate-blur-in" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
                    <span className={`inline-block w-2 h-2 rounded-full ${MoodColors[mood].replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`} />
                    <span className="text-xs font-mono text-[#666] uppercase tracking-[0.2em]">{t.moods[mood]}</span>
                  </div>

                  <ScrambleTitle
                    text={note.analysis?.summary || t.untitled}
                    className="text-3xl md:text-4xl font-bold text-[#f0f0f0] font-sans leading-tight tracking-wide mb-2"
                  />
                </header>

                {/* Document Body */}
                <div className="prose prose-invert prose-lg max-w-none animate-blur-in" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
                  <p className="text-[#d4d4d4] font-sans text-lg leading-loose tracking-wide whitespace-pre-wrap selection:bg-retro-green/30 selection:text-white">
                    {note.content}
                  </p>
                </div>

                {/* Photo Gallery (View Mode) */}
                {note.images && note.images.length > 0 && (
                  <div className="mt-12 animate-blur-in" style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#222]">
                      <ImageIcon size={14} className="text-[#666]" />
                      <span className="text-xs font-mono text-[#666] uppercase tracking-widest">{t.photos}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {note.images.map((img, i) => (
                        <div
                          key={i}
                          className="relative group cursor-pointer overflow-hidden border-2 border-[#222] bg-[#000] aspect-square shadow-lg"
                          onClick={() => { triggerHaptic('light'); setSelectedImage(img); }}
                        >
                          <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors z-10" />
                          <img
                            src={img}
                            alt={`Attachment ${i}`}
                            className={`w-full h-full object-cover transition-all duration-500 transform group-hover:scale-110 ${imageStylization ? 'filter grayscale sepia-[0.3] contrast-125 group-hover:filter-none' : ''}`}
                          />
                          {/* Retro Glare Effect */}
                          <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10 group-hover:animate-shine" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document Footer / Taxonomy */}
                {note.analysis?.tags && (
                  <div className="mt-16 pt-6 border-t border-[#222] flex flex-wrap gap-3 animate-blur-in" style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}>
                    <span className="text-[10px] text-[#444] font-mono tracking-widest py-1">REF_TAGS:</span>
                    {note.analysis.tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded text-xs text-[#888] font-mono hover:text-retro-light hover:border-[#555] transition-colors cursor-default">
                        <Tag size={10} className="mr-1.5" />
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            )}
          </div>
        </div>

        {/* Footer Actions (UI Frame - Always Mono) */}
        <div className={`p-3 border-t flex justify-between items-center text-[10px] uppercase font-mono z-10 shrink-0 ${isEditing ? 'bg-[#1a1100] border-retro-amber' : 'bg-[#1a1a1a] border-[#222]'}`}>

          {!isEditing ? (
            <>
              <span className="text-[#444] tracking-widest hidden md:inline">Memory_Block: {note.content.length}b {note.images ? `+ ${note.images.length} imgs` : ''}</span>

              <div className="flex gap-4 ml-auto">
                <button
                  onClick={() => { triggerHaptic('medium'); setIsEditing(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#222] border border-[#333] text-retro-green hover:bg-retro-green hover:text-black hover:border-retro-green transition-all"
                  title={t.edit}
                >
                  <Edit2 size={12} />
                  <span className="font-bold tracking-widest">{t.edit}</span>
                </button>

                <button
                  onClick={() => onDelete(note.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#222] border border-[#333] text-retro-red hover:bg-retro-red hover:text-black hover:border-retro-red transition-all group"
                  title={t.delete}
                >
                  <Trash2 size={12} className="group-hover:animate-bounce" />
                  <span className="font-bold tracking-widest">{t.delete}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-retro-amber/50 hidden md:inline">EDIT_SESSION_ACTIVE</span>

              <div className="flex gap-4 ml-auto">
                <button
                  onClick={handleDiscard}
                  className="flex items-center gap-2 px-4 py-2 bg-[#222] border border-[#444] text-[#888] hover:bg-[#333] hover:text-[#aaa] transition-colors"
                >
                  <RotateCcw size={12} />
                  <span className="font-bold tracking-widest">{t.discardChanges}</span>
                </button>

                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-retro-amber border border-retro-amber text-black font-bold hover:bg-white transition-colors"
                >
                  <Save size={12} />
                  <span className="font-bold tracking-widest">{t.saveChanges}</span>
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
