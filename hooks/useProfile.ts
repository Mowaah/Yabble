import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile } from '../lib/database';
import { supabase } from '../lib/supabase';
import type { Tables } from '../lib/database';

type ProfileUpdate = Tables['profiles']['Update'] & {
  avatarFile?: { uri: string; name: string };
};

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

  const updateProfile = async (updates: ProfileUpdate) => {
    if (!session?.user.id) throw new Error('User not authenticated');

    try {
      let avatarUrl = updates.avatar_url;

      if (updates.avatarFile) {
        const { uri, name } = updates.avatarFile;
        const arraybuffer = await fetch(uri).then((res) => res.arrayBuffer());

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(`${session.user.id}/${name}`, arraybuffer, {
            contentType: 'image/jpeg', // Or other appropriate mime type
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadData.path);
        avatarUrl = publicUrlData.publicUrl;
      }

      const profileUpdates = {
        ...updates,
        avatar_url: avatarUrl,
        id: session.user.id,
      };
      delete profileUpdates.avatarFile;

      const { data, error } = await updateUserProfile(
        session.user.id,
        profileUpdates
      );

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
