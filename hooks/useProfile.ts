import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile } from '../lib/database';
import type { Tables } from '../lib/database';

export function useProfile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Tables['profiles']['Row'] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user.id) return;

      try {
        const { data, error } = await getUserProfile(session.user.id);
        if (error) throw error;
        setProfile(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [session?.user.id]);

  const updateProfile = async (
    updates: Partial<Tables['profiles']['Update']>
  ) => {
    if (!session?.user.id) return;

    try {
      const { data, error } = await updateUserProfile(session.user.id, updates);
      if (error) throw error;
      setProfile(data);
      return data;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  };

  return { profile, isLoading, error, updateProfile };
}
