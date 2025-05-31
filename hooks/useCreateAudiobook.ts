import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createAudiobook } from '../lib/database';
import type { Tables } from '../lib/database';

export function useCreateAudiobook() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (params: {
    title: string;
    textContent: string;
    voiceId?: string;
  }) => {
    if (!session?.user.id) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create the audiobook record with proper initial status
      const { data: audiobook, error: createError } = await createAudiobook({
        user_id: session.user.id,
        title: params.title,
        text_content: params.textContent,
        voice_id: params.voiceId,
        status: 'draft',
        duration: 0,
        audio_url: null,
        cover_image: null,
      });

      if (createError) throw createError;
      if (!audiobook) throw new Error('Failed to create audiobook');

      return audiobook;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return { create, isLoading, error };
}