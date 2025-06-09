import { Audiobook, Voice, AudioEffect, User } from '../types';

export const mockAudiobooks: Audiobook[] = [
  {
    id: '1',
    title: 'The Adventure Begins',
    coverImage:
      'https://images.pexels.com/photos/3394939/pexels-photo-3394939.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    duration: 345, // 5:45
    createdAt: new Date('2025-04-01'),
    updatedAt: new Date('2025-04-01'),
    status: 'completed',
    voiceId: 'v1',
    textContent: 'Once upon a time in a land far away...',
    audioUrl: 'https://example.com/audio1.mp3',
  },
  {
    id: '2',
    title: 'My Personal Journal',
    coverImage:
      'https://images.pexels.com/photos/3652898/pexels-photo-3652898.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    duration: 180, // 3:00
    createdAt: new Date('2025-03-28'),
    updatedAt: new Date('2025-03-29'),
    status: 'completed',
    voiceId: 'v2',
    textContent:
      'Today I embarked on a journey that would change my life forever...',
    audioUrl: 'https://example.com/audio2.mp3',
  },
  {
    id: '3',
    title: 'Scientific Article',
    coverImage:
      'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    duration: 0,
    createdAt: new Date('2025-04-02'),
    updatedAt: new Date('2025-04-02'),
    status: 'draft',
    voiceId: undefined,
    textContent:
      'Recent advances in quantum computing have shown promising results...',
    audioUrl: undefined,
  },
];

export const mockVoices: Voice[] = [
  {
    id: 'v1',
    name: 'Alex',
    previewUrl: 'https://example.com/voice1.mp3',
    isPremium: false,
    category: 'standard',
  },
  {
    id: 'v2',
    name: 'Sophia',
    previewUrl: 'https://example.com/voice2.mp3',
    isPremium: false,
    category: 'standard',
  },
  {
    id: 'v3',
    name: 'James',
    previewUrl: 'https://example.com/voice3.mp3',
    isPremium: true,
    category: 'premium',
  },
  {
    id: 'v4',
    name: 'Emma',
    previewUrl: 'https://example.com/voice4.mp3',
    isPremium: true,
    category: 'premium',
  },
  {
    id: 'v5',
    name: 'Your Voice',
    previewUrl: 'https://example.com/voice5.mp3',
    isPremium: true,
    category: 'cloned',
  },
];

export const mockAudioEffects: AudioEffect[] = [
  {
    id: 'e1',
    name: 'Gentle Piano',
    category: 'music',
    previewUrl:
      'https://actions.google.com/sounds/v1/ambiences/relaxing_ambience.ogg',
  },
  {
    id: 'e2',
    name: 'Rainy Day',
    category: 'ambient',
    previewUrl: 'https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg',
  },
  {
    id: 'e3',
    name: 'Coffee Shop',
    category: 'ambient',
    previewUrl:
      'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
  },
  {
    id: 'e4',
    name: 'Nature Ambience',
    category: 'ambient',
    previewUrl:
      'https://actions.google.com/sounds/v1/ambiences/forest_night.ogg',
  },
  {
    id: 'e5',
    name: 'Meditation',
    category: 'music',
    previewUrl: 'https://actions.google.com/sounds/v1/ambiences/july_night.ogg',
  },
  {
    id: 'e6',
    name: 'Fireplace',
    category: 'ambient',
    previewUrl: 'https://actions.google.com/sounds/v1/ambiences/fireplace.ogg',
  },
  {
    id: 'e7',
    name: 'Stream',
    category: 'ambient',
    previewUrl:
      'https://actions.google.com/sounds/v1/water/stream_water_flowing.ogg',
  },
  {
    id: 'e8',
    name: 'Birds',
    category: 'sound_effect',
    previewUrl:
      'https://actions.google.com/sounds/v1/animals/birds_multiple_singing.ogg',
  },
];

export const mockUser: User = {
  id: 'u1',
  name: 'Jamie Smith',
  email: 'jamie@example.com',
  avatar:
    'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  isPremium: false,
  createdBooks: 3,
};
