import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAudiobooksForLibrary } from '../lib/database';

export function useAudiobooks() {
  const { session } = useAuth();
  const [audiobooks, setAudiobooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAudiobooks = useCallback(
    async (options?: { isInitialLoad?: boolean }) => {
      if (!session?.user.id) {
        if (options?.isInitialLoad) setIsLoading(false);
        return;
      }

      if (options?.isInitialLoad) {
        setIsLoading(true);
      }

      try {
        const { data, error } = await getAudiobooksForLibrary(session.user.id);
        if (error) {
          throw error;
        }
        setAudiobooks(data || []);
        setError(null);
      } catch (e: any) {
        setError(e.message);
      } finally {
        if (options?.isInitialLoad) {
          setIsLoading(false);
        }
      }
    },
    [session?.user.id]
  );

  useEffect(() => {
    refreshAudiobooks({ isInitialLoad: true });
  }, [refreshAudiobooks]);

  return { audiobooks, isLoading, error, refreshAudiobooks };
}
