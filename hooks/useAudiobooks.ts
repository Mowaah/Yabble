import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAudiobooks } from '../lib/database';
import type { Tables } from '../lib/database';

export function useAudiobooks() {
  const { session } = useAuth();
  const [audiobooks, setAudiobooks] = useState<Tables['audiobooks']['Row'][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAudiobooks() {
      if (!session?.user.id) return;

      try {
        setIsLoading(true);
        const { data, error } = await getAudiobooks(session.user.id);
        if (error) throw error;
        setAudiobooks(data || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadAudiobooks();
  }, [session?.user.id]);

  const refreshAudiobooks = async () => {
    if (!session?.user.id) return;
    
    try {
      const { data, error } = await getAudiobooks(session.user.id);
      if (error) throw error;
      setAudiobooks(data || []);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return { audiobooks, isLoading, error, refreshAudiobooks };
}