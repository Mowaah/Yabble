import { useState, useEffect, useCallback } from 'react';
import { getHubAudiobooks, toggleBookmark } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';
import { HubAudiobook } from '../types';

export function useHubData() {
  const { session } = useAuth();
  const user = session?.user;
  const [featured, setFeatured] = useState<HubAudiobook | null>(null);
  const [trending, setTrending] = useState<HubAudiobook[]>([]);
  const [newest, setNewest] = useState<HubAudiobook[]>([]);
  const [quickListens, setQuickListens] = useState<HubAudiobook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHubData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userId = user?.id || null;

      // Use Promise.all to fetch all categories concurrently
      const [trendingData, newestData, quickListensData] = await Promise.all([
        getHubAudiobooks(userId, 'trending'),
        getHubAudiobooks(userId, 'newest'),
        getHubAudiobooks(userId, 'quick-listens'),
      ]);

      if (trendingData.error || newestData.error || quickListensData.error) {
        console.error('Failed to fetch one or more hub categories');
        throw new Error('Could not load the Hub. Please try again.');
      }

      // Set the state for each category
      setTrending(trendingData.data || []);
      setNewest(newestData.data || []);
      setQuickListens(quickListensData.data || []);

      // Designate the top trending book as the featured book
      if (trendingData.data && trendingData.data.length > 0) {
        setFeatured(trendingData.data[0]);
      } else if (newestData.data && newestData.data.length > 0) {
        // Fallback to the newest book if nothing is trending
        setFeatured(newestData.data[0]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHubData();
  }, [fetchHubData]);

  const handleToggleBookmark = async (
    audiobookId: string,
    isBookmarked: boolean,
    category: 'featured' | 'trending' | 'newest' | 'quickListens'
  ) => {
    if (!user) return;

    const { error: toggleError } = await toggleBookmark(audiobookId, user.id, isBookmarked);
    if (toggleError) {
      console.error('Failed to toggle bookmark', toggleError);
      return;
    }

    // To ensure UI consistency after a bookmark, we can either refetch all data
    // or manually update the state. For a better user experience, let's manually
    // update the specific item that was changed.
    const updateCategoryState = (
      setter: React.Dispatch<React.SetStateAction<HubAudiobook[]>>,
      itemCategory: 'trending' | 'newest' | 'quickListens'
    ) => {
      setter((prevItems) =>
        prevItems.map((item) => {
          if (item.id === audiobookId) {
            return {
              ...item,
              is_bookmarked: !item.is_bookmarked,
              bookmarks_count: isBookmarked ? (item.bookmarks_count || 1) - 1 : (item.bookmarks_count || 0) + 1,
            };
          }
          return item;
        })
      );
    };

    switch (category) {
      case 'featured':
        if (featured?.id === audiobookId) {
          setFeatured((prev) =>
            prev
              ? {
                  ...prev,
                  is_bookmarked: !prev.is_bookmarked,
                  bookmarks_count: isBookmarked ? (prev.bookmarks_count || 1) - 1 : (prev.bookmarks_count || 0) + 1,
                }
              : null
          );
        }
        // also update the item in its original list if it exists there
        updateCategoryState(setTrending, 'trending');
        updateCategoryState(setNewest, 'newest');
        break;
      case 'trending':
        updateCategoryState(setTrending, 'trending');
        if (featured?.id === audiobookId) {
          setFeatured((prev) => (prev ? { ...prev, is_bookmarked: !prev.is_bookmarked } : null));
        }
        break;
      case 'newest':
        updateCategoryState(setNewest, 'newest');
        if (featured?.id === audiobookId) {
          setFeatured((prev) => (prev ? { ...prev, is_bookmarked: !prev.is_bookmarked } : null));
        }
        break;
      case 'quickListens':
        updateCategoryState(setQuickListens, 'quickListens');
        break;
    }
  };

  return {
    featured,
    trending,
    newest,
    quickListens,
    isLoading,
    error,
    refresh: fetchHubData,
    toggleBookmark: handleToggleBookmark,
  };
}
