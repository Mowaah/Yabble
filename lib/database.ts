import { db as supabase } from './supabase';

// Audiobooks
export async function getAudiobooks(userId: string) {
  const { data, error } = await supabase
    .from('audiobooks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function getAudiobooksForLibrary(userId: string) {
  // Step 1: Get all audiobook IDs that the user has bookmarked.
  const { data: bookmarked, error: bookmarksError } = await supabase
    .from('bookmarks')
    .select('audiobook_id')
    .eq('user_id', userId);

  if (bookmarksError) {
    console.error('Error fetching bookmarks for library:', bookmarksError);
    return { data: [], error: bookmarksError };
  }

  const bookmarkedIds = bookmarked.map((b) => b.audiobook_id);

  // Step 2: Fetch all audiobooks that EITHER the user created OR they have bookmarked.
  let query = supabase.from('audiobooks').select(
    `
      id,
      title,
      cover_image,
      duration,
      status,
      voice_id,
      created_at,
      text_content,
      is_published,
      bookmarks_count
    `
  );

  // Safely build the .or() condition
  if (bookmarkedIds.length > 0) {
    query = query.or(`user_id.eq.${userId},id.in.(${bookmarkedIds.join(',')})`);
  } else {
    // If there are no bookmarks, only fetch the user's own books
    query = query.eq('user_id', userId);
  }

  const { data: audiobooks, error: audiobooksError } = await query.order('created_at', { ascending: false });

  if (audiobooksError) {
    console.error('Error fetching audiobooks for library:', audiobooksError);
    return { data: [], error: audiobooksError };
  }
  if (!audiobooks) {
    return { data: [], error: null };
  }

  // Step 3: Create a Set for quick lookups and merge the bookmark status.
  const bookmarkedIdsSet = new Set(bookmarkedIds);
  const finalData = audiobooks.map((book) => ({
    ...book,
    is_bookmarked: bookmarkedIdsSet.has(book.id),
  }));

  return { data: finalData, error: null };
}

export async function getAudiobook(id: string) {
  const { data, error } = await supabase.from('audiobooks').select('*').eq('id', id).single();

  if (error) {
    console.error('Error fetching audiobook:', error);
  }

  return { data, error };
}

export async function createAudiobook(audiobook: any) {
  const { data, error } = await supabase.from('audiobooks').insert(audiobook).select().single();

  return { data, error };
}

export async function updateAudiobook(id: string, updates: any) {
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

export async function publishAudiobook(id: string) {
  return await updateAudiobook(id, {
    is_published: true,
    published_at: new Date().toISOString(),
  });
}

export async function getHubAudiobooks(
  userId: string | null,
  filter: 'trending' | 'newest' | 'quick-listens' = 'newest'
) {
  // Query 1: Get all published audiobooks, regardless of bookmark status
  let audiobooksQuery = supabase
    .from('audiobooks')
    .select(
      `
      id,
      title,
      cover_image,
      duration,
      status,
      voice_id,
      bookmarks_count,
      author:profiles ( id, name )
    `
    )
    .eq('is_published', true);

  if (filter === 'trending') {
    audiobooksQuery = audiobooksQuery.order('bookmarks_count', { ascending: false });
  } else if (filter === 'quick-listens') {
    // Less than 15 minutes, most popular first
    audiobooksQuery = audiobooksQuery.lt('duration', 900).order('bookmarks_count', { ascending: false });
  } else {
    // Default to newest
    audiobooksQuery = audiobooksQuery.order('published_at', { ascending: false });
  }

  const { data: audiobooks, error: audiobooksError } = await audiobooksQuery.limit(20);

  if (audiobooksError) {
    console.error('Error fetching hub audiobooks:', audiobooksError);
    return { data: [], error: audiobooksError };
  }
  if (!audiobooks) {
    return { data: [], error: null };
  }

  // Manually fix the author type, as Supabase may return an array for relationships
  // and ensure all books have a consistent shape.
  const shapedData = audiobooks.map((book: any) => ({
    ...book,
    author: Array.isArray(book.author) ? book.author[0] : book.author,
  }));

  // If there's no user, we can't know their bookmarks. Return public data.
  if (!userId) {
    const publicData = shapedData.map((book) => ({
      ...book,
      is_bookmarked: false,
    }));
    return { data: publicData, error: null };
  }

  // Query 2: If we have a user, get their specific bookmarks
  const { data: userBookmarks, error: bookmarksError } = await supabase
    .from('bookmarks')
    .select('audiobook_id')
    .eq('user_id', userId);

  if (bookmarksError) {
    console.error('Error fetching user bookmarks for hub:', bookmarksError);
    // If this fails, don't crash the app. Return books without bookmark info.
    const publicData = shapedData.map((book) => ({
      ...book,
      is_bookmarked: false,
    }));
    return { data: publicData, error: null };
  }

  const bookmarkedIds = new Set(userBookmarks.map((b) => b.audiobook_id));

  // Merge the two data sources to create an accurate `is_bookmarked` status
  const finalData = shapedData.map((book) => ({
    ...book,
    is_bookmarked: bookmarkedIds.has(book.id),
  }));

  return { data: finalData, error: null };
}

export async function getAudiobookDetails(audiobookId: string, userId: string) {
  const { data, error } = await supabase.rpc('get_audiobook_details_for_user', {
    p_audiobook_id: audiobookId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching audiobook details via RPC:', error);
    return { data: null, error };
  }

  // RPC returns an array, but we expect a single object or empty
  return { data: data[0] || null, error: null };
}

export async function toggleBookmark(audiobookId: string, userId: string, isBookmarked: boolean) {
  if (isBookmarked) {
    // Remove bookmark
    const { error } = await supabase.from('bookmarks').delete().match({ user_id: userId, audiobook_id: audiobookId });
    if (error) {
      console.error('Error removing bookmark:', error);
      return { error };
    }
  } else {
    // Add bookmark
    const { error } = await supabase.from('bookmarks').insert({ user_id: userId, audiobook_id: audiobookId });
    if (error) {
      console.error('Error adding bookmark:', error);
      return { error };
    }
  }
  return { error: null };
}

export async function upsertAudiobookProgress(userId: string, audiobookId: string, position: number) {
  const { error } = await supabase.from('audiobook_progress').upsert(
    {
      user_id: userId,
      audiobook_id: audiobookId,
      last_position_millis: position,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,audiobook_id' }
  );
  if (error) {
    console.error('Error saving progress:', error);
  }
  return { error };
}

export async function bulkDeleteAudiobooks(ids: string[]) {
  if (ids.length === 0) {
    throw new Error('No audiobooks selected for deletion');
  }

  const { error } = await supabase.from('audiobooks').delete().in('id', ids);

  if (error) {
    console.error('Bulk delete error:', error);
    throw new Error('Failed to delete selected audiobooks');
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

export async function updateUserProfile(userId: string, updates: any) {
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
export async function saveVoiceSettings(settings: any) {
  const { data, error } = await supabase.from('voice_settings').insert(settings).select().single();

  return { data, error };
}
