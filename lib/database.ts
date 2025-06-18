import { db as supabase } from './supabase';
import { Database } from '../types/supabase';

export type Tables = Database['public']['Tables'];

// Audiobooks
export async function getAudiobooks(userId: string) {
  const { data, error } = await supabase
    .from('audiobooks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function getAudiobook(id: string) {
  const { data, error } = await supabase.from('audiobooks').select('*').eq('id', id).single();

  if (error) {
    console.error('Error fetching audiobook:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function createAudiobook(audiobook: Tables['audiobooks']['Insert']) {
  const { data, error } = await supabase.from('audiobooks').insert(audiobook).select().single();

  return { data, error };
}

export async function updateAudiobook(id: string, updates: Partial<Tables['audiobooks']['Update']>) {
  const { data, error } = await supabase.from('audiobooks').update(updates).eq('id', id).select().single();

  return { data, error };
}

export async function deleteAudiobook(id: string) {
  const { error } = await supabase.from('audiobooks').delete().eq('id', id);

  if (error) {
    console.error('Delete error:', error);
    throw new Error('Failed to delete audiobook');
  }

  return true;
}

// User Profiles
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    return { data: null, error };
  }
}

export async function updateUserProfile(userId: string, updates: Partial<Tables['profiles']['Update']>) {
  try {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { data: null, error };
  }
}

// Voice Settings
export async function getVoiceSettings(userId: string) {
  const { data, error } = await supabase.from('voice_settings').select('*').eq('user_id', userId);

  return { data, error };
}
export async function saveVoiceSettings(settings: Tables['voice_settings']['Insert']) {
  const { data, error } = await supabase.from('voice_settings').insert(settings).select().single();

  return { data, error };
}
