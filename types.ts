
export enum Mood {
  NEUTRAL = 'NEUTRAL',
  HAPPY = 'HAPPY',
  SAD = 'SAD',
  FOCUSED = 'FOCUSED',
  EXCITED = 'EXCITED',
  ANXIOUS = 'ANXIOUS'
}

export interface AIAnalysis {
  summary: string;
  tags: string[];
  mood: Mood;
}

export interface Note {
  id: string;
  content: string;
  createdAt: number; // Timestamp
  analysis?: AIAnalysis;
  isProcessing?: boolean;
  images?: string[]; // Base64 encoded strings
}

export type TagMode = 'ANY' | 'ALL';

export interface FilterCriteria {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  selectedTags: string[];
  tagMode: TagMode;
}

export type SoundType = 'MECHANICAL' | 'RETRO' | 'SOFT';
