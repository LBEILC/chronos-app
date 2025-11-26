
import React, { useRef, useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Monitor, Volume2, Globe, Camera, HardDrive, Download, Upload, Layout, Brain, Music, Image as ImageIcon, Vibrate } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Note, SoundType } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'zh';
  setLang: (lang: 'en' | 'zh') => void;
  crtEnabled: boolean;
  setCrtEnabled: (enabled: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  soundVolume: number;
  setSoundVolume: (volume: number) => void;
  soundType: SoundType;
  setSoundType: (type: SoundType) => void;
  hapticEnabled: boolean;
  setHapticEnabled: (enabled: boolean) => void;
  onTestSound: () => void;
  imageStylization: boolean;
  setImageStylization: (enabled: boolean) => void;
  screenshotMode: boolean;
  setScreenshotMode: (enabled: boolean) => void;
  screenshotSplitView: boolean;
  setScreenshotSplitView: (enabled: boolean) => void;
  smartAnalysisMode: boolean;
  setSmartAnalysisMode: (enabled: boolean) => void;
  notes: Note[];
  screenshotTargetId: string | null;
  setScreenshotTargetId: (id: string) => void;
  onImport: (notes: Note[]) => void;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
  screenshotMargin: boolean;
  setScreenshotMargin: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  setLang,
  crtEnabled,
  setCrtEnabled,
  soundEnabled,
  setSoundEnabled,
  soundVolume,
  setSoundVolume,
  soundType,
  setSoundType,
  hapticEnabled,
  setHapticEnabled,
  onTestSound,
  imageStylization,
  setImageStylization,
  screenshotMode,
  setScreenshotMode,
  screenshotSplitView,
  setScreenshotSplitView,
  smartAnalysisMode,
  setSmartAnalysisMode,
  notes,
  screenshotTargetId,
  onImport,
  triggerHaptic,
  screenshotMargin,
  setScreenshotMargin
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
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

  const handleExport = () => {
    triggerHaptic('medium');
    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `chronos_archive_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') throw new Error(t.invalidFormat);

        const importedData = JSON.parse(result);
        onImport(importedData);
        setImportStatus({ msg: t.importSuccess, type: 'success' });
        triggerHaptic('heavy');

        // Reset file input so user can import same file again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error("Import error:", error);
        setImportStatus({
          msg: error instanceof Error && error.message.includes("JSON") ? t.invalidFormat : t.importError,
          type: 'error'
        });
        triggerHaptic('heavy');
      }
    };
    reader.readAsText(file);
  };

  const triggerImport = () => {
    setImportStatus(null);
    triggerHaptic('medium');
    fileInputRef.current?.click();
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

      {/* Settings Window */}
      <div className={`relative w-full max-w-md bg-[#1a1a1a] border-4 border-[#333] shadow-[8px_8px_0px_rgba(0,0,0,1)] ${isClosing ? 'animate-slide-down-out' : 'animate-slide-up'} overflow-hidden flex flex-col max-h-[70vh] mt-[env(safe-area-inset-top)]`}>

        {/* Header - Shrink 0 to prevent collapsing */}
        <div className="bg-[#333] px-4 py-2 flex justify-between items-center border-b-4 border-[#111] shrink-0 z-10">
          <div className="flex items-center gap-2 text-retro-light font-bold">
            <SettingsIcon size={18} />
            <span className="tracking-widest">{t.settings}</span>
          </div>
          <button
            onClick={handleClose}
            className="bg-retro-red text-black p-0.5 border border-black hover:bg-red-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Wrapper with Static Background */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {/* Static Background Layers */}
          <div className="absolute inset-0 bg-grid-pattern bg-[size:20px_20px] pointer-events-none" />
          <div className="absolute inset-0 bg-[#1a1a1a] opacity-90 pointer-events-none" />

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-10">
            <div className="space-y-8">

              {/* Language Setting */}
              <div className="flex items-center justify-between group">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 text-retro-light">
                    <Globe size={20} className="text-retro-amber" />
                    <span className="font-mono text-lg">{t.language}</span>
                  </div>
                  <div className="text-[10px] text-[#666] font-mono pl-8 pt-1">// {t.settingsTips.language}</div>
                </div>
                <div className="flex bg-[#111] p-1 border-2 border-[#444] rounded-sm shrink-0">
                  <button
                    onClick={() => { setLang('en'); triggerHaptic('light'); }}
                    className={`px-3 py-1 text-xs font-bold transition-all ${lang === 'en' ? 'bg-retro-amber text-black shadow-[2px_2px_0px_#000]' : 'text-[#666] hover:text-[#888]'}`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => { setLang('zh'); triggerHaptic('light'); }}
                    className={`px-3 py-1 text-xs font-bold transition-all ${lang === 'zh' ? 'bg-retro-amber text-black shadow-[2px_2px_0px_#000]' : 'text-[#666] hover:text-[#888]'}`}
                  >
                    中文
                  </button>
                </div>
              </div>

              <div className="h-px bg-[#333]" />

              {/* Smart Analysis Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 text-retro-light">
                    <Brain size={20} className="text-purple-400" />
                    <span className="font-mono text-lg">{t.smartAnalysisMode}</span>
                  </div>
                  <div className="text-[10px] text-[#666] font-mono pl-8 pt-1">// {t.settingsTips.smartAnalysis}</div>
                </div>
                <button
                  onClick={() => { setSmartAnalysisMode(!smartAnalysisMode); triggerHaptic('medium'); }}
                  className={`w-16 h-8 border-2 border-[#444] rounded-full relative transition-colors shrink-0 ${smartAnalysisMode ? 'bg-[#221122]' : 'bg-[#111]'}`}
                >
                  <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-purple-400 border border-black shadow-[0_0_5px_rgba(192,132,252,0.5)] rounded-full transition-all duration-300 ${smartAnalysisMode ? 'left-9' : 'left-1 grayscale'}`} />
                  <span className={`absolute top-1/2 -translate-y-1/2 text-[9px] font-bold ${smartAnalysisMode ? 'left-2 text-purple-400' : 'right-2 text-[#444]'}`}>
                    {smartAnalysisMode ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* CRT Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 text-retro-light">
                    <Monitor size={20} className="text-retro-green" />
                    <span className="font-mono text-lg">{t.crtEffect}</span>
                  </div>
                  <div className="text-[10px] text-[#666] font-mono pl-8 pt-1">// {t.settingsTips.crt}</div>
                </div>
                <button
                  onClick={() => { setCrtEnabled(!crtEnabled); triggerHaptic('medium'); }}
                  className={`w-16 h-8 border-2 border-[#444] rounded-full relative transition-colors shrink-0 ${crtEnabled ? 'bg-[#112211]' : 'bg-[#111]'}`}
                >
                  <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-retro-green border border-black shadow-[0_0_5px_rgba(51,255,0,0.5)] rounded-full transition-all duration-300 ${crtEnabled ? 'left-9' : 'left-1 grayscale'}`} />
                  <span className={`absolute top-1/2 -translate-y-1/2 text-[9px] font-bold ${crtEnabled ? 'left-2 text-retro-green' : 'right-2 text-[#444]'}`}>
                    {crtEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Image Stylization Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 text-retro-light">
                    <ImageIcon size={20} className="text-retro-light" />
                    <span className="font-mono text-lg">{t.imageStylization}</span>
                  </div>
                  <div className="text-[10px] text-[#666] font-mono pl-8 pt-1">// {t.settingsTips.imageStyle}</div>
                </div>
                <button
                  onClick={() => { setImageStylization(!imageStylization); triggerHaptic('medium'); }}
                  className={`w-16 h-8 border-2 border-[#444] rounded-full relative transition-colors shrink-0 ${imageStylization ? 'bg-[#222222]' : 'bg-[#111]'}`}
                >
                  <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-black shadow-[0_0_5px_rgba(255,255,255,0.5)] rounded-full transition-all duration-300 ${imageStylization ? 'left-9' : 'left-1 grayscale'}`} />
                  <span className={`absolute top-1/2 -translate-y-1/2 text-[9px] font-bold ${imageStylization ? 'left-2 text-white' : 'right-2 text-[#444]'}`}>
                    {imageStylization ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Sound Settings */}
              <div className="flex flex-col gap-4">
                {/* Sound On/Off */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3 text-retro-light">
                      <Volume2 size={20} className="text-retro-orange" />
                      <span className="font-mono text-lg">{t.soundEffect}</span>
                    </div>
                    <div className="text-[10px] text-[#666] font-mono pl-8 pt-1">// {t.settingsTips.sound}</div>
                  </div>
                  <button
                    onClick={() => { setSoundEnabled(!soundEnabled); triggerHaptic('medium'); }}
                    className={`w-16 h-8 border-2 border-[#444] rounded-full relative transition-colors shrink-0 ${soundEnabled ? 'bg-[#221111]' : 'bg-[#111]'}`}
                  >
                    <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-retro-orange border border-black shadow-[0_0_5px_rgba(255,85,0,0.5)] rounded-full transition-all duration-300 ${soundEnabled ? 'left-9' : 'left-1 grayscale'}`} />
                    <span className={`absolute top-1/2 -translate-y-1/2 text-[9px] font-bold ${soundEnabled ? 'left-2 text-retro-orange' : 'right-2 text-[#444]'}`}>
                      {soundEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>

                {soundEnabled && (
                  <div className="flex flex-col gap-3 pl-9 animate-fade-in border-l border-[#333]">

                    {/* Volume Slider */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-retro-orange/60 font-mono uppercase tracking-widest">{t.volume}</label>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-retro-orange font-mono min-w-[30px] text-right">{Math.round(soundVolume * 100)}%</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={soundVolume}
                          onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                          onMouseUp={() => onTestSound()}
                          onTouchEnd={() => onTestSound()}
                          className="flex-1 h-1 bg-[#333] appearance-none rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-retro-orange [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_5px_rgba(255,85,0,0.5)]"
                        />
                      </div>
                    </div>

                    {/* Sound Type Selector */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] text-retro-orange/60 font-mono uppercase tracking-widest flex items-center gap-1">
                        <Music size={10} />
                        {t.soundType}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['MECHANICAL', 'RETRO', 'SOFT'] as SoundType[]).map((type) => (
                          <button
                            key={type}
                            onClick={() => { setSoundType(type); onTestSound(); }}
                            className={`
                                     px-1 py-1.5 text-[9px] font-bold uppercase border transition-all
                                     ${soundType === type
                                ? 'bg-retro-orange text-black border-retro-orange shadow-[0_0_8px_rgba(255,85,0,0.4)]'
                                : 'border-[#444] text-[#666] hover:border-[#666] hover:text-[#888]'}
                                   `}
                          >
                            {t.soundTypes[type]}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Haptic Feedback Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 text-retro-light">
                    <Vibrate size={20} className="text-retro-red" />
                    <span className="font-mono text-lg">{t.hapticFeedback}</span>
                  </div>
                  <div className="text-[10px] text-[#666] font-mono pl-8 pt-1">// {t.settingsTips.haptic}</div>
                </div>
                <button
                  onClick={() => {
                    const newState = !hapticEnabled;
                    setHapticEnabled(newState);
                    if (newState && navigator.vibrate) navigator.vibrate(20);
                  }}
                  className={`w-16 h-8 border-2 border-[#444] rounded-full relative transition-colors shrink-0 ${hapticEnabled ? 'bg-[#221111]' : 'bg-[#111]'}`}
                >
                  <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-retro-red border border-black shadow-[0_0_5px_rgba(255,51,51,0.5)] rounded-full transition-all duration-300 ${hapticEnabled ? 'left-9' : 'left-1 grayscale'}`} />
                  <span className={`absolute top-1/2 -translate-y-1/2 text-[9px] font-bold ${hapticEnabled ? 'left-2 text-retro-red' : 'right-2 text-[#444]'}`}>
                    {hapticEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Screenshot Mode Toggle */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3 text-retro-light">
                      <Camera size={20} className="text-blue-400" />
                      <span className="font-mono text-lg">{t.screenshotMode}</span>
                    </div>
                    <div className="text-[10px] text-[#666] font-mono pl-8 pt-1">// {t.settingsTips.screenshot}</div>
                  </div>
                  <button
                    onClick={() => { setScreenshotMode(!screenshotMode); triggerHaptic('medium'); }}
                    className={`w-16 h-8 border-2 border-[#444] rounded-full relative transition-colors shrink-0 ${screenshotMode ? 'bg-[#111122]' : 'bg-[#111]'}`}
                  >
                    <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-400 border border-black shadow-[0_0_5px_rgba(0,100,255,0.5)] rounded-full transition-all duration-300 ${screenshotMode ? 'left-9' : 'left-1 grayscale'}`} />
                    <span className={`absolute top-1/2 -translate-y-1/2 text-[9px] font-bold ${screenshotMode ? 'left-2 text-blue-400' : 'right-2 text-[#444]'}`}>
                      {screenshotMode ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>

                {screenshotMode && (
                  <div className="pt-2 border-t border-[#333] animate-fade-in flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-retro-light font-mono text-xs uppercase tracking-wider">{t.targetNote}</span>
                      <select
                        value={screenshotTargetId || ''}
                        onChange={(e) => { setScreenshotTargetId(e.target.value); triggerHaptic('light'); }}
                        className="bg-[#111] text-retro-amber border border-[#444] p-2 font-mono text-xs focus:outline-none focus:border-retro-amber"
                      >
                        {notes.map(n => (
                          <option key={n.id} value={n.id}>
                            {n.analysis?.summary || 'UNTITLED'} // {new Date(n.createdAt).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Layout Split Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-retro-light">
                        <Layout size={14} className="text-[#888]" />
                        <span className="font-mono text-xs text-[#aaa] uppercase">{t.splitTitleMood}</span>
                      </div>
                      <button
                        onClick={() => { setScreenshotSplitView(!screenshotSplitView); triggerHaptic('light'); }}
                        className={`w-10 h-5 border border-[#444] rounded-full relative transition-colors shrink-0 ${screenshotSplitView ? 'bg-[#222233]' : 'bg-[#111]'}`}
                      >
                        <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#888] rounded-full transition-all duration-300 ${screenshotSplitView ? 'left-6 bg-retro-light' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-px bg-[#333]" />

              {/* Data Management Section */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col mb-1">
                  <div className="flex items-center gap-3 text-retro-light">
                    <HardDrive size={20} className="text-purple-400" />
                    <span className="font-mono text-lg">{t.dataManagement}</span>
                  </div>
                  <div className="text-[10px] text-[#666] font-mono pl-8 pt-1">// {t.settingsTips.data}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-[#111] border border-[#444] hover:bg-[#222] hover:border-retro-amber hover:text-retro-amber transition-colors text-xs font-bold uppercase tracking-wider"
                  >
                    <Download size={14} />
                    {t.exportData}
                  </button>

                  <button
                    onClick={triggerImport}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-[#111] border border-[#444] hover:bg-[#222] hover:border-retro-green hover:text-retro-green transition-colors text-xs font-bold uppercase tracking-wider"
                  >
                    <Upload size={14} />
                    {t.importData}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />
                </div>

                {importStatus && (
                  <div className={`text-[10px] font-mono p-2 border ${importStatus.type === 'success' ? 'border-retro-green text-retro-green bg-retro-green/10' : 'border-retro-red text-retro-red bg-retro-red/10'} animate-fade-in`}>
                    STATUS: {importStatus.msg}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Footer - Shrink 0 to prevent collapsing */}
        <div className="px-4 py-2 bg-[#111] text-[#444] text-[10px] uppercase font-mono border-t-2 border-[#333] flex justify-between shrink-0 z-10">
          <span>Sys_Config_ID: 0x8842</span>
          <span>Status: OK</span>
        </div>
      </div>
    </div>
  );
};
