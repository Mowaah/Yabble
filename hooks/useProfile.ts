import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile } from '../lib/database';
import { uploadFile } from '../lib/storage';
import { Profile } from '../types';

type ProfileUpdate = Partial<Profile> & {
  avatarFile?: { uri: string };
};

export function useProfile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user.id) return;

      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await getUserProfile(session.user.id);
        if (fetchError) throw fetchError;
        setProfile(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [session?.user.id]);

  const updateProfile = async (updates: ProfileUpdate) => {
    if (!session?.user.id) throw new Error('User not authenticated');
    if (!profile) throw new Error('Profile not loaded yet');

    setIsLoading(true);
    setError(null);

    try {
      let avatarUrl = updates.avatar_url;

      if (updates.avatarFile?.uri) {
        avatarUrl = await uploadFile('avatars', updates.avatarFile.uri, session.user.id);
      }

      const profileUpdates: Partial<Profile> = {
        ...updates,
        avatar_url: avatarUrl,
        id: session.user.id,
      };
      delete (profileUpdates as any).avatarFile;

      const { data, error: updateError } = await updateUserProfile(session.user.id, profileUpdates);

      if (updateError) throw updateError;
      setProfile(data);
      return data;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return { profile, isLoading, error, updateProfile };
}
