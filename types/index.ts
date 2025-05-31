export type AudiobookStatus = 'draft' | 'processing' | 'completed';

export interface Audiobook {
  id: string;
  title: string;
  coverImage?: string;
  duration: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
  status: AudiobookStatus;
  voiceId?: string;
  textContent: string;
  audioUrl?: string;
}

export interface Voice {
  id: string;
  name: string;
  previewUrl: string;
  isPremium: boolean;
  category: 'standard' | 'premium' | 'cloned';
}

export interface AudioEffect {
  id: string;
  name: string;
  category: 'music' | 'ambient' | 'sound_effect';
  previewUrl: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isPremium: boolean;
  createdBooks: number;
}