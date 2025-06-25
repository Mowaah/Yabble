import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createAudiobook } from '../lib/database';
import { uploadFile } from '../lib/storage';

export function useCreateAudiobook() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (params: {
    title: string;
    textContent: string;
    voiceId?: string;
    coverImageUri?: string | null;
  }) => {
    if (!session?.user.id) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      let coverImageUrl: string | null = null;
      if (params.coverImageUri) {
        coverImageUrl = await uploadFile('cover-images', params.coverImageUri, session.user.id);
      }

      // Create the audiobook record with proper initial status
      const { data: audiobook, error: createError } = await createAudiobook({
        user_id: session.user.id,
        title: params.title,
        text_content: params.textContent,
        voice_id: params.voiceId,
        status: 'draft',
        duration: 0,
        audio_url: null,
        cover_image: coverImageUrl,
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
