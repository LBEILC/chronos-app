
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Note, Mood, FilterCriteria, SoundType } from './types';
import { analyzeNote } from './services/geminiService';
import { NoteCard } from './components/NoteCard';
import { EmptyCard } from './components/EmptyCard';
import { Composer } from './components/Composer';
import { NoteDetailModal } from './components/NoteDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { FilterModal } from './components/FilterModal';
import { INITIAL_NOTES, TRANSLATIONS } from './constants';
import { Disc, Battery, Wifi, Settings as SettingsIcon, Filter } from 'lucide-react';

const App: React.FC = () => {
  // Persistence Keys
  const STORAGE_KEY_PREFIX = 'chronos_storage_';

  // State: Notes (Persisted)
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const savedNotes = localStorage.getItem(`${STORAGE_KEY_PREFIX}notes`);
      return savedNotes ? JSON.parse(savedNotes) : INITIAL_NOTES;
    } catch (error) {
      console.warn("Failed to load notes from storage:", error);
      return INITIAL_NOTES;
    }
  });

  const [isComposerOpen, setComposerOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [previewNoteId, setPreviewNoteId] = useState<string | null>(null);
  const [retractingNoteId, setRetractingNoteId] = useState<string | null>(null);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);

  // Settings State (Persisted)
  const [lang, setLang] = useState<'en' | 'zh'>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}lang`);
    return (saved === 'en' || saved === 'zh') ? saved : 'zh';
  });

  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isFilterOpen, setFilterOpen] = useState(false);

  // Filter State
  const defaultFilter: FilterCriteria = {
    startDate: '',
    endDate: '',
    selectedTags: [],
    tagMode: 'ANY'
  };
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>(defaultFilter);

  const [crtEnabled, setCrtEnabled] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}crt`);
    return saved !== null ? saved === 'true' : true;
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}sound`);
    return saved !== null ? saved === 'true' : true;
  });

  const [soundVolume, setSoundVolume] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}volume`);
    return saved !== null ? parseFloat(saved) : 0.5;
  });

  const [soundType, setSoundType] = useState<SoundType>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}sound_type`);
    return (saved === 'MECHANICAL' || saved === 'RETRO' || saved === 'SOFT') ? (saved as SoundType) : 'MECHANICAL';
  });

  const [hapticEnabled, setHapticEnabled] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}haptic`);
    return saved !== null ? saved === 'true' : true;
  });

  const [imageStylization, setImageStylization] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}image_style`);
    return saved !== null ? saved === 'true' : true;
  });

  const [screenshotMode, setScreenshotMode] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}screenshot`);
    return saved !== null ? saved === 'true' : false;
  });

  const [screenshotSplitView, setScreenshotSplitView] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}screenshot_split`);
    return saved !== null ? saved === 'true' : true;
  });

  const [screenshotMargin, setScreenshotMargin] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}screenshot_margin`);
    return saved !== null ? saved === 'true' : true;
  });

  const [smartAnalysisMode, setSmartAnalysisMode] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}smart_analysis`);
    return saved !== null ? saved === 'true' : true;
  });

  const [screenshotTargetId, setScreenshotTargetId] = useState<string | null>(null);

  // Effects for Persistence
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}notes`, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}lang`, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}crt`, String(crtEnabled));
  }, [crtEnabled]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}sound`, String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}volume`, String(soundVolume));
  }, [soundVolume]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}sound_type`, soundType);
  }, [soundType]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}haptic`, String(hapticEnabled));
  }, [hapticEnabled]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}image_style`, String(imageStylization));
  }, [imageStylization]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}screenshot`, String(screenshotMode));
  }, [screenshotMode]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}screenshot_split`, String(screenshotSplitView));
  }, [screenshotSplitView]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}screenshot_margin`, String(screenshotMargin));
  }, [screenshotMargin]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}smart_analysis`, String(smartAnalysisMode));
  }, [smartAnalysisMode]);

  // Set default screenshot target if none selected
  useEffect(() => {
    if (screenshotMode && !screenshotTargetId && notes.length > 0) {
      setScreenshotTargetId(notes[0].id);
    }
  }, [screenshotMode, notes, screenshotTargetId]);

  // Extract all available tags for the filter modal
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    for (const note of notes) {
      note.analysis?.tags?.forEach(tag => tags.add(tag));
    }
    return Array.from(tags).sort();
  }, [notes]);

  // Filtering Logic
  const filteredNotes = useMemo(() => {
    // If screenshot mode is active, temporarily disable filtering so the target note is not hidden
    if (screenshotMode) return notes;

    return notes.filter(note => {
      // 1. Date Filter
      if (filterCriteria.startDate) {
        // Create date object at start of day local time
        const start = new Date(filterCriteria.startDate);
        start.setHours(0, 0, 0, 0);
        if (note.createdAt < start.getTime()) return false;
      }

      if (filterCriteria.endDate) {
        // Create date object at end of day local time
        const end = new Date(filterCriteria.endDate);
        end.setHours(23, 59, 59, 999);
        if (note.createdAt > end.getTime()) return false;
      }

      // 2. Tag Filter
      if (filterCriteria.selectedTags.length > 0) {
        const noteTags = note.analysis?.tags || [];
        if (filterCriteria.tagMode === 'ALL') {
          // Note must have ALL selected tags
          const hasAll = filterCriteria.selectedTags.every(t => noteTags.includes(t));
          if (!hasAll) return false;
        } else {
          // Note must have ANY of the selected tags
          const hasAny = filterCriteria.selectedTags.some(t => noteTags.includes(t));
          if (!hasAny) return false;
        }
      }

      return true;
    });
  }, [notes, filterCriteria, screenshotMode]);

  const isFilterActive = useMemo(() => {
    if (screenshotMode) return false;
    return !!filterCriteria.startDate ||
      !!filterCriteria.endDate ||
      filterCriteria.selectedTags.length > 0;
  }, [filterCriteria, screenshotMode]);


  // Scroll & Physics State - OPTIMIZED: Refs instead of State for animation loop
  const scrollTopRef = useRef(0);
  const velocityRef = useRef(0);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const lastAutoScrollRef = useRef<number>(0);

  // Animation progress tracking for JS-driven animations (key -> progress 0..1)
  const cardAnimValues = useRef<Map<string, number>>(new Map());
  const lastFrameTimeRef = useRef<number>(0);

  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  const lastScrollTopRef = useRef(0);
  const lastFeedbackScrollTopRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const initialScrollDoneRef = useRef(false);

  const t = TRANSLATIONS[lang];

  // Initialize Audio Context on first interaction
  const initAudio = useCallback(() => {
    if (soundEnabled && !audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, [soundEnabled]);

  // Add global listeners to initialize audio on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
    };

    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [initAudio]);

  // Synthesize and play different sound effects
  const playClickSound = (forceType?: SoundType) => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const t = ctx.currentTime;
      const typeToPlay = forceType || soundType;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const baseGain = 0.1 * soundVolume;

      if (typeToPlay === 'MECHANICAL') {
        const biquadFilter = ctx.createBiquadFilter();
        biquadFilter.type = 'highpass';
        biquadFilter.frequency.value = 800;

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, t);
        oscillator.frequency.exponentialRampToValueAtTime(10, t + 0.05);

        gainNode.gain.setValueAtTime(baseGain, t);
        gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        oscillator.connect(biquadFilter);
        biquadFilter.connect(gainNode);
      }
      else if (typeToPlay === 'RETRO') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(600, t);
        oscillator.frequency.exponentialRampToValueAtTime(300, t + 0.03);

        gainNode.gain.setValueAtTime(baseGain * 0.8, t);
        gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

        oscillator.connect(gainNode);
      }
      else if (typeToPlay === 'SOFT') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, t);
        oscillator.frequency.linearRampToValueAtTime(150, t + 0.08);

        gainNode.gain.setValueAtTime(0.001, t);
        gainNode.gain.linearRampToValueAtTime(baseGain * 1.5, t + 0.01);
        gainNode.gain.linearRampToValueAtTime(0.001, t + 0.08);

        oscillator.connect(gainNode);
      }

      gainNode.connect(ctx.destination);
      oscillator.start(t);
      oscillator.stop(t + 0.1);

    } catch (e) {
      console.error("Audio synth error", e);
    }
  };

  const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'selection' = 'medium') => {
    if (!hapticEnabled) return;

    try {
      if (type === 'selection') {
        await Haptics.selectionChanged();
        return;
      }

      let style = ImpactStyle.Medium;
      if (type === 'light') style = ImpactStyle.Light;
      if (type === 'heavy') style = ImpactStyle.Heavy;

      await Haptics.impact({ style });
    } catch (e) {
      // Fallback for Web if Capacitor Haptics fails or is not available
      if (navigator.vibrate) {
        const patterns = {
          light: 10,
          medium: 20,
          heavy: 40,
          selection: 5
        };
        navigator.vibrate(patterns[type]);
      }
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSaveNote = async (data: string | {
    content: string;
    summary: string;
    tags: string[];
    mood: Mood;
    createdAt: number;
    images: string[];
  }, imagesFromSmartMode: string[] = []) => {
    initAudio();
    triggerHaptic('heavy');

    // Check if it's smart analysis (string) or manual entry (object)
    if (typeof data === 'string') {
      const newNote: Note = {
        id: Date.now().toString(),
        content: data,
        createdAt: Date.now(),
        isProcessing: true,
        images: imagesFromSmartMode
      };

      setNotes(prev => [newNote, ...prev]);

      try {
        const analysis = await analyzeNote(data, lang);
        setNotes(prev => prev.map(n =>
          n.id === newNote.id
            ? { ...n, analysis, isProcessing: false }
            : n
        ));
      } catch (error) {
        console.error("Failed to analyze note", error);
        setNotes(prev => prev.map(n =>
          n.id === newNote.id
            ? { ...n, isProcessing: false }
            : n
        ));
      }
    } else {
      // Manual Entry
      const newNote: Note = {
        id: Date.now().toString(),
        content: data.content,
        createdAt: data.createdAt,
        analysis: {
          summary: data.summary,
          tags: data.tags,
          mood: data.mood
        },
        images: data.images,
        isProcessing: false // No need to process
      };
      setNotes(prev => [newNote, ...prev]);
    }
  };

  const handleUpdateNote = (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    if (selectedNote && selectedNote.id === updatedNote.id) {
      setSelectedNote(updatedNote);
    }
  };

  const handleRequestDelete = (id: string) => {
    setNoteToDeleteId(id);
    triggerHaptic('medium');
  };

  const executeDelete = () => {
    if (noteToDeleteId) {
      triggerHaptic('heavy');
      setNotes(prev => prev.filter(n => n.id !== noteToDeleteId));
      setSelectedNote(null);
      setNoteToDeleteId(null);
    }
  };

  const handleImportNotes = (importedNotes: any[]) => {
    if (!Array.isArray(importedNotes)) {
      throw new Error("Invalid structure: Root must be an array");
    }
    const validNotes = importedNotes.filter((n: any) => {
      return n && typeof n.id === 'string' &&
        typeof n.content === 'string' &&
        typeof n.createdAt === 'number';
    });

    if (validNotes.length === 0 && importedNotes.length > 0) {
      throw new Error("No valid notes found in import file");
    }

    setNotes(prev => {
      const noteMap = new Map(prev.map(n => [n.id, n]));
      validNotes.forEach(n => noteMap.set(n.id, n as Note));
      return Array.from(noteMap.values()).sort((a: Note, b: Note) => b.createdAt - a.createdAt);
    });
  };

  const dismissPreview = () => {
    if (previewNoteId) {
      // Set retracting ID to keep it rendered with high Z-index logic if needed,
      // but now JS animation handles the visual transition.
      setRetractingNoteId(previewNoteId);
      // Slightly longer than the JS animation duration (approx 0.6s) to be safe
      setTimeout(() => setRetractingNoteId(null), 700);
      setPreviewNoteId(null);
    }
  };

  const MIN_CARDS = 12;
  const HEADER_OFFSET = 70;
  // STACK_START: Increased significantly to ensure pulled-out card (moved up by 480px) stays fully on screen
  const STACK_START = 600;
  // INITIAL_SCROLL_OFFSET: Hide the top gap initially
  const INITIAL_SCROLL_OFFSET = 470;

  // Use Filtered Notes for the stack
  const totalNotes = filteredNotes.length;
  const fillerCount = Math.max(0, MIN_CARDS - totalNotes);
  const totalItems = totalNotes + fillerCount;

  const stackItems = useMemo(() => {
    const fillers = Array.from({ length: fillerCount }).map((_, i) => ({ type: 'empty' as const, key: `empty-${i}` }));
    // reversedNotes puts Oldest first (Index 0). Newest last (Top of stack).
    const reversedNotes = [...filteredNotes].reverse().map(note => ({ type: 'note' as const, data: note, key: note.id }));
    return [...fillers, ...reversedNotes];
  }, [filteredNotes, fillerCount]);

  const finalItemTop = STACK_START + ((totalItems - 1) * HEADER_OFFSET);

  // Dynamic Scroll Height Calculation
  const focusThreshold = viewportHeight * 0.4;
  const idealScrollHeight = finalItemTop + viewportHeight - focusThreshold + 40;
  const containerScrollHeight = screenshotMode ? 'auto' : Math.max(viewportHeight, idealScrollHeight);

  // Card Interaction Logic
  const handleCardClick = (note: Note) => {
    triggerHaptic('medium');

    // Find index of this note in the stack
    const indexInStack = stackItems.findIndex(item => item.key === note.id);
    const isFrontCard = indexInStack === stackItems.length - 1;

    if (isFrontCard && !previewNoteId) {
      setSelectedNote(note);
    } else if (previewNoteId === note.id) {
      // Double click or click on already pulled out card opens it
      setSelectedNote(note);
      setPreviewNoteId(null);
    } else {
      playClickSound('SOFT');
      setPreviewNoteId(note.id);

      // SCROLL LOGIC: Center the pulled-out card
      if (indexInStack !== -1 && scrollContainerRef.current) {
        // Record time to prevent immediate dismissal in onScroll
        lastAutoScrollRef.current = Date.now();

        const naturalTop = STACK_START + (indexInStack * HEADER_OFFSET);
        // The card will be pulled UP by 480px visually relative to its natural top
        const pulledVisualTop = naturalTop - 480;

        // We want center of card (top + 250) to be at Viewport Center (scrollTop + h/2)
        // scrollTop = (pulledVisualTop + 250) - (viewportHeight/2)

        const targetScroll = Math.max(0, (pulledVisualTop + 250) - (viewportHeight * 0.5));

        scrollContainerRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  };

  // Update scroll on Add/Delete
  // Sync scroll on load and mode change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        if (!initialScrollDoneRef.current && !screenshotMode) {
          // Initial load: scroll to bottom to show first card
          const maxScroll = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;
          scrollContainerRef.current.scrollTop = maxScroll;
          scrollTopRef.current = maxScroll;
          lastScrollTopRef.current = maxScroll;
          initialScrollDoneRef.current = true;
        } else if (!screenshotMode) {
          // Exiting screenshot mode: scroll to bottom
          const maxScroll = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;
          scrollContainerRef.current.scrollTo({ top: maxScroll, behavior: 'smooth' });
        } else if (screenshotMode) {
          // Entering screenshot mode: scroll to top
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [filteredNotes.length, viewportHeight, screenshotMode]);

  // Sync ref for animation loop
  const animState = useRef({
    stackItems: [] as typeof stackItems,
    totalItems: 0,
    viewportHeight: window.innerHeight,
    screenshotMode: false,
    previewNoteId: null as string | null,
    retractingNoteId: null as string | null,
    stackStart: STACK_START
  });

  // Update animState on render
  animState.current = {
    stackItems,
    totalItems,
    viewportHeight,
    screenshotMode,
    previewNoteId,
    retractingNoteId,
    stackStart: STACK_START
  };

  // Easing function for non-linear return (Quartic Ease Out)
  const easeOutQuart = (x: number): number => {
    return 1 - Math.pow(1 - x, 4);
  };

  // --- ANIMATION LOOP ---
  const animate = useCallback((time: number) => {
    if (!lastFrameTimeRef.current) lastFrameTimeRef.current = time;
    const delta = (time - lastFrameTimeRef.current) / 1000; // seconds
    lastFrameTimeRef.current = time;

    const { stackItems, totalItems, viewportHeight, screenshotMode, previewNoteId, retractingNoteId, stackStart } = animState.current;

    if (!screenshotMode) {
      const scrollTop = scrollTopRef.current;
      const velocity = velocityRef.current;
      const isMobile = window.innerWidth < 768;

      for (let index = 0; index < stackItems.length; index++) {
        const item = stackItems[index];
        const el = cardRefs.current.get(item.key);
        if (!el) continue;

        const isPreviewTarget = item.key === previewNoteId;

        // Animation Progress Logic (JS-driven spring/ease)
        let progress = cardAnimValues.current.get(item.key) || 0;
        const targetProgress = isPreviewTarget ? 1 : 0;

        // Move progress towards target
        if (Math.abs(progress - targetProgress) > 0.001) {
          const speed = isPreviewTarget ? 3.0 : 2.5; // pull out speed vs retract speed
          if (progress < targetProgress) {
            progress = Math.min(targetProgress, progress + speed * delta);
          } else {
            progress = Math.max(targetProgress, progress - speed * delta);
          }
          cardAnimValues.current.set(item.key, progress);
        } else {
          progress = targetProgress;
          cardAnimValues.current.set(item.key, progress);
        }

        const easedProgress = easeOutQuart(progress);

        // If completely retracted (0) and not previewing or retracting state, skip complex calc if hidden?
        // No, always calc for stack physics.

        const naturalTop = stackStart + (index * HEADER_OFFSET);
        const screenY = naturalTop - scrollTop;

        // 3D Depth Logic
        const viewStart = -100;
        const viewEnd = viewportHeight * 0.4;
        const range = viewEnd - viewStart;

        let stackProgress = (screenY - viewStart) / range;
        stackProgress = Math.max(0, Math.min(1, stackProgress));

        // Curve for depth effects (0 = Near, 1 = Far)
        const depth = 1 - stackProgress;
        const curve = depth * depth * depth;

        // Standard Physics Calculation (Stack State)
        const maxZ = 100;
        const minZ = -900;
        let zPos = maxZ + (curve * (minZ - maxZ));

        const maxScale = 1.0;
        const minScale = 0.85;
        let scale = maxScale + (curve * (minScale - maxScale));

        const baseTilt = -15;
        let tilt = baseTilt * curve;

        const velocityDampener = isMobile ? 0.3 : 0.6;
        const maxV = isMobile ? 30 : 60;
        const clampedV = Math.max(-maxV, Math.min(maxV, velocity));
        let vOffset = clampedV * velocityDampener * (1 - curve * 0.5);
        let vTilt = clampedV * -0.05 * (1 - curve);

        // --- HYBRID STATE INTERPOLATION ---
        // Interpolate between Stack Physics (progress 0) and Pulled Out Physics (progress 1)

        // Pulled Out Targets
        const pulledOffset = -480;
        const pulledBlur = 0;
        const pulledBrightness = 1;
        const pulledTilt = 0;
        // We maintain vOffset even when pulled out so it moves with scroll naturally, 
        // but we might want to dampen the tilt or extra Z effects.

        // Apply easing
        // Visual Y offset: standard stack offset (0) -> pulled offset (-480)
        const finalPullY = easedProgress * pulledOffset;

        // When pulled out, we want to neutralize the stack curve effects (blur, dark, tilt)
        const effectiveBlur = (curve * 6) * (1 - easedProgress) + (pulledBlur * easedProgress);
        const effectiveBrightness = (1 - (curve * 0.4)) * (1 - easedProgress) + (pulledBrightness * easedProgress);
        const effectiveTilt = (tilt + vTilt) * (1 - easedProgress) + (pulledTilt * easedProgress);

        // Ensure zIndex is correct order
        el.style.zIndex = `${index}`;

        const isVisible = progress > 0.01 || (screenY > -1000 && screenY < viewportHeight + 400);

        if (isVisible) {
          // Use opacity transition only for smooth fade in/out if needed, but here mostly 1
          // Retracting ghost state opacity
          let opacity = 1 - (curve * 0.4);
          if (progress > 0) opacity = 1;
          if (item.key === retractingNoteId && progress < 0.01) {
            // Ensure it fades nicely if it was stuck
            // Handled by CSS opacity transition in isVisible check logic usually
          }

          el.style.opacity = `${opacity}`;
          el.style.pointerEvents = 'auto';

          // Use JS animation for transform - removing CSS transition for transform allows instantaneous response to scroll
          el.style.transition = 'filter 0.3s, opacity 0.3s';

          // Apply combined transform
          el.style.transform = `translate3d(0px, ${vOffset + finalPullY}px, ${zPos}px) scale(${scale}) rotateX(${effectiveTilt}deg)`;
          el.style.top = `${naturalTop}px`;

          el.style.filter = `blur(${effectiveBlur}px) brightness(${effectiveBrightness})`;

        } else {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        }
      }

      const friction = 0.92;
      velocityRef.current *= friction;
      if (Math.abs(velocityRef.current) < 0.1) velocityRef.current = 0;
    }

    requestRef.current = requestAnimationFrame(animate);
  }, []);

  // Start/Stop Animation Loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  // Scroll Handler
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (screenshotMode) return;

    // Check if we are auto-scrolling to focus first
    // If < 800ms since click, ignore scroll as it is likely the auto-center scroll
    if (previewNoteId) {
      const isAutoScroll = Date.now() - lastAutoScrollRef.current < 800;
      if (!isAutoScroll) {
        // Only put back if scroll is significant (user interaction)
        const currentScroll = e.currentTarget.scrollTop;
        if (Math.abs(currentScroll - lastScrollTopRef.current) > 10) {
          dismissPreview();
        }
      }
    }

    const currentScroll = e.currentTarget.scrollTop;
    const delta = currentScroll - lastScrollTopRef.current;

    if (Math.abs(currentScroll - lastFeedbackScrollTopRef.current) > 80) {
      if (soundEnabled) playClickSound();
      if (hapticEnabled) triggerHaptic('light');
      lastFeedbackScrollTopRef.current = currentScroll;
    }

    lastScrollTopRef.current = currentScroll;
    scrollTopRef.current = currentScroll;
    velocityRef.current = delta;
  };

  return (
    <div
      className="h-screen w-screen bg-retro-black text-retro-light font-mono overflow-hidden relative selection:bg-retro-orange selection:text-black"
      onClick={() => {
        dismissPreview();
        initAudio();
      }}
    >

      {crtEnabled && (
        <>
          <div className="fixed inset-0 pointer-events-none z-[9999] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
          <div
            className="fixed inset-0 pointer-events-none z-[9998] opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`
            }}
          />
        </>
      )}

      <div className="fixed inset-0 pointer-events-none z-0 bg-grid-pattern opacity-20 bg-[size:40px_40px]" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-black/80 via-transparent to-black/80" />

      {/* Control Panel Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b-2 border-[#333] h-auto min-h-16 pt-[env(safe-area-inset-top)] flex items-center justify-between px-4 md:px-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-r-2 border-[#333] pr-6">
            <div className="w-8 h-8 bg-retro-orange rounded-sm flex items-center justify-center text-black font-bold border border-retro-red shadow-[0_0_10px_rgba(255,85,0,0.5)]">
              <Disc size={20} className="animate-spin-slow" />
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="text-xl font-bold tracking-widest text-retro-light uppercase">
                {t.appName}
              </h1>
              <span className="text-[10px] text-retro-amber tracking-wider">V.1984.05</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-retro-red rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-retro-amber rounded-full opacity-50" />
              <div className="w-2 h-2 bg-retro-green rounded-full opacity-50" />
            </div>
            <span className="text-xs text-[#555]">// REC_READY</span>
          </div>
        </div>

        <div className="flex items-center gap-6">

          {/* Filter Trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('medium');
              setFilterOpen(true);
            }}
            className={`flex items-center gap-2 group cursor-pointer transition-colors ${isFilterActive ? 'text-retro-amber animate-pulse' : 'text-[#888] hover:text-retro-light'}`}
            title={t.filter}
          >
            <Filter size={20} className={isFilterActive ? 'fill-current' : ''} />
            {isFilterActive && <span className="text-[10px] font-bold border border-retro-amber px-1">ACTIVE</span>}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('medium');
              setSettingsOpen(true);
            }}
            className="flex items-center gap-2 group cursor-pointer text-[#888] hover:text-retro-light transition-colors"
            title={t.settings}
          >
            <SettingsIcon size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>

          {/* System Status */}
          <div className="hidden md:flex items-center gap-3 bg-[#111] border border-[#333] px-3 py-1 rounded-sm">
            <Battery size={14} className="text-retro-green" />
            <span className="w-px h-3 bg-[#333]" />
            <Wifi size={14} className="text-retro-green" />
            <span className="text-xs text-retro-green tracking-widest font-bold">ONLINE</span>
          </div>
        </div>
      </header>

      {/* Main Scroll Area */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 w-full h-full overflow-y-auto perspective-container scroll-smooth"
        onScroll={onScroll}
      >
        <div
          className="relative w-full max-w-xl mx-auto"
          style={{ height: typeof containerScrollHeight === 'number' ? `${containerScrollHeight}px` : containerScrollHeight }}
        >
          {stackItems.map((item, index) => {
            const isTarget = item.type === 'note' && item.key === screenshotTargetId;

            let cardStyle: React.CSSProperties = {
              position: 'absolute',
              left: 0,
              right: 0,
              width: '100%'
            };

            let isExpanded = false;

            if (screenshotMode) {
              if (isTarget) {
                isExpanded = true;
                cardStyle = {
                  position: 'relative',
                  zIndex: 100,
                  top: '0px',
                  marginTop: '120px',
                  marginBottom: '120px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  width: screenshotMargin ? 'calc(100% - 48px)' : '100%',
                  transform: 'none',
                  filter: 'none',
                  opacity: 1,
                  pointerEvents: 'auto',
                };
              } else {
                cardStyle = { display: 'none' };
              }
            }

            if (item.type === 'note') {
              return (
                <NoteCard
                  key={item.key}
                  ref={(el) => {
                    if (el) cardRefs.current.set(item.key, el);
                    else cardRefs.current.delete(item.key);
                  }}
                  note={item.data}
                  onClick={(n) => {
                    // Stop propagation handled in NoteCard, here we just receive the note
                    handleCardClick(n);
                  }}
                  onPutBack={(e) => {
                    e.stopPropagation();
                    triggerHaptic('light');
                    dismissPreview();
                  }}
                  lang={lang}
                  style={cardStyle}
                  isExpanded={isExpanded}
                  splitHeader={screenshotMode ? screenshotSplitView : true}
                  imageStylization={imageStylization}
                  isScreenshotMode={screenshotMode}
                  isPreview={item.key === previewNoteId}
                />
              );
            } else {
              if (screenshotMode) return null;

              return (
                <EmptyCard
                  key={item.key}
                  ref={(el) => {
                    if (el) cardRefs.current.set(item.key, el);
                    else cardRefs.current.delete(item.key);
                  }}
                  lang={lang}
                  style={cardStyle}
                />
              );
            }
          })}
        </div>
      </div>

      <NoteDetailModal
        note={selectedNote}
        onClose={() => {
          triggerHaptic('medium');
          setSelectedNote(null);
        }}
        lang={lang}
        onDelete={handleRequestDelete}
        onUpdate={(n) => {
          triggerHaptic('medium');
          handleUpdateNote(n);
        }}
        imageStylization={imageStylization}
        triggerHaptic={triggerHaptic}
      />

      {!screenshotMode && (
        <Composer
          onSave={handleSaveNote}
          isExpanded={isComposerOpen}
          setExpanded={(open) => {
            triggerHaptic('medium');
            setComposerOpen(open);
          }}
          lang={lang}
          smartAnalysisMode={smartAnalysisMode}
          triggerHaptic={triggerHaptic}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          triggerHaptic('medium');
          setSettingsOpen(false);
        }}
        lang={lang}
        setLang={setLang}
        crtEnabled={crtEnabled}
        setCrtEnabled={setCrtEnabled}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        soundVolume={soundVolume}
        setSoundVolume={setSoundVolume}
        soundType={soundType}
        setSoundType={setSoundType}
        hapticEnabled={hapticEnabled}
        setHapticEnabled={setHapticEnabled}
        onTestSound={() => {
          playClickSound();
          triggerHaptic('light');
        }}
        imageStylization={imageStylization}
        setImageStylization={setImageStylization}
        screenshotMode={screenshotMode}
        setScreenshotMode={setScreenshotMode}
        screenshotMargin={screenshotMargin}
        setScreenshotMargin={setScreenshotMargin}
        screenshotSplitView={screenshotSplitView}
        setScreenshotSplitView={setScreenshotSplitView}
        smartAnalysisMode={smartAnalysisMode}
        setSmartAnalysisMode={setSmartAnalysisMode}
        notes={notes}
        screenshotTargetId={screenshotTargetId}
        setScreenshotTargetId={setScreenshotTargetId}
        onImport={handleImportNotes}
        triggerHaptic={triggerHaptic}
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => {
          triggerHaptic('medium');
          setFilterOpen(false);
        }}
        lang={lang}
        availableTags={availableTags}
        currentFilters={filterCriteria}
        onApply={(f) => {
          triggerHaptic('medium');
          setFilterCriteria(f);
        }}
        onReset={() => {
          triggerHaptic('light');
          setFilterCriteria(defaultFilter);
        }}
        triggerHaptic={triggerHaptic}
      />

      <ConfirmationModal
        isOpen={!!noteToDeleteId}
        onClose={() => {
          triggerHaptic('medium');
          setNoteToDeleteId(null);
        }}
        onConfirm={executeDelete}
        title={t.delete}
        message={t.confirmDelete}
        lang={lang}
        triggerHaptic={triggerHaptic}
      />

    </div>
  );
};

export default App;
