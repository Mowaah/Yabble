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
  is_published?: boolean;
  published_at?: string;
  bookmarks_count?: number;
  is_bookmarked?: boolean;
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

export interface Profile {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string | null;
  is_premium?: boolean;
  created_books?: number;
}

export interface HubAudiobook {
  id: string;
  title: string;
  cover_image?: string;
  duration: number;
  status: string;
  voice_id?: string;
  bookmarks_count?: number;
  author: Profile;
  is_bookmarked: boolean;
}
