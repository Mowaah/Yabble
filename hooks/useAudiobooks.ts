import { useState, useCallback } from 'react';
import { getAudiobooksForLibrary } from '../lib/database';

export function useAudiobooks() {
  const [audiobooks, setAudiobooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAudiobooks = useCallback(async (userId?: string | null) => {
    if (!userId) {
      // Don't fetch if no user ID is provided.
      setAudiobooks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await getAudiobooksForLibrary(userId);
      if (dbError) {
        throw dbError;
      }
      // Always set the audiobooks, even if it's an empty array
      setAudiobooks(data || []);
    } catch (e: any) {
      setError(e.message);
      console.error('Error fetching audiobooks for library:', e);
    } finally {
      // Ensure loading is always turned off after an attempt
      setIsLoading(false);
    }
  }, []); // No dependencies, it's a pure function now

  // No longer fetches automatically on mount.
  // The component is now in full control.

  return { audiobooks, isLoading, error, refreshAudiobooks };
}
