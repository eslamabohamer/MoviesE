import { 
  fetchFeaturedContent as adminFetchFeaturedContent,
  fetchMovies as adminFetchMovies,
  fetchSeries as adminFetchSeries,
  fetchGenres as adminFetchGenres,
  fetchContentById as adminFetchContentById,
  fetchContentByGenre as adminFetchContentByGenre,
  searchTmdb,
  fetchEpisodeById as adminFetchEpisodeById,
  trackContentVisit as adminTrackContentVisit,
  fetchMostViewedContent as adminFetchMostViewedContent,
  fetchRecentContent as adminFetchRecentContent,
  filterContent as adminFilterContent,
  importFromTmdbByTitle as adminImportFromTmdbByTitle,
  importMultipleFromTmdb as adminImportMultipleFromTmdb
} from './adminService';

import { Content, Episode } from '@/types/content';
import { Episode as SupabaseEpisode } from '@/types/supabase';
import { mapSupabaseEpisodeToAppEpisode } from '@/utils/adapters';
import { mapTmdbMovieToAppContent, mapTmdbTvToAppContent } from '@/utils/adapters/tmdbAdapter';
import { TMDB_API_KEY, getTmdbImageUrl } from '@/integrations/supabase/client';

// Re-export functions from adminService with more user-friendly names
export const fetchFeaturedContent = adminFetchFeaturedContent;
export const fetchMovies = adminFetchMovies;
export const fetchSeries = adminFetchSeries;
export const fetchGenres = adminFetchGenres;
export const fetchMostViewedContent = adminFetchMostViewedContent;
export const fetchRecentContent = adminFetchRecentContent;
export const filterContent = adminFilterContent;
export const importFromTmdbByTitle = adminImportFromTmdbByTitle;

// Fetch TMDB content by ID
export const fetchTmdbContentById = async (id: string, type: 'movie' | 'tv'): Promise<Content | null> => {
  try {
    console.log(`Fetching content from TMDB: ${id}, type: ${type}`);
    
    // Use the TMDB_API_KEY from the client config
    const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`TMDB API error: ${response.status}, Message: ${await response.text()}`);
      return null;
    }
    
    const data = await response.json();
    console.log('TMDB data received:', data);
    
    // Map TMDB data to our content format
    if (type === 'movie') {
      return mapTmdbMovieToAppContent(data);
    } else {
      return mapTmdbTvToAppContent(data);
    }
  } catch (error) {
    console.error('Error fetching from TMDB:', error);
    return null;
  }
};

// Extract potential title from URL or ID for TMDB search
const extractPotentialTitleFromUrl = (url: string): string => {
  const pathSegments = url.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1];
  
  // Replace hyphens and underscores with spaces
  return lastSegment
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    // Remove UUIDs
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '')
    .trim();
};

// Enhanced fetchContentById with better error handling and TMDB fallback search
export const fetchContentById = async (id: string): Promise<Content> => {
  if (!id) {
    throw new Error('Content ID is required');
  }
  
  // Check if this is a TMDB ID format (e.g., tmdb-movie-123 or tmdb-tv-456)
  const tmdbMatch = id.match(/^tmdb-(movie|tv)-(\d+)$/);
  if (tmdbMatch) {
    const [_, contentType, tmdbId] = tmdbMatch;
    const tmdbContent = await fetchTmdbContentById(tmdbId, contentType === 'movie' ? 'movie' : 'tv');
    
    if (tmdbContent) {
      console.log(`Successfully fetched TMDB content: ${tmdbContent.title}`);
      return tmdbContent;
    }
    
    throw new Error(`Content with TMDB ID ${tmdbId} not found`);
  }
  
  try {
    console.log(`Fetching content with ID: ${id}`);
    const content = await adminFetchContentById(id);
    
    if (!content) {
      console.error(`Content with ID ${id} not found in database, trying TMDB search...`);
      throw new Error(`Content with ID ${id} not found`);
    }
    
    console.log(`Successfully fetched content: ${content.title}`);
    return content;
  } catch (error: any) {
    console.error('Error in fetchContentById:', error);
    
    // If the content was not found in our database, let's try to search TMDB
    try {
      // First, try to extract a meaningful title from the URL
      const potentialTitle = extractPotentialTitleFromUrl(window.location.pathname);
      
      // If we have a potentially meaningful title (more than 2 characters)
      if (potentialTitle && potentialTitle.length > 2) {
        console.log(`Trying TMDB search for: "${potentialTitle}"`);
        
        // Try to get both movies and TV shows
        const searchResults = await searchTmdb(potentialTitle);
        
        if (searchResults && searchResults.length > 0) {
          console.log(`Found TMDB search results:`, searchResults);
          // Return the first result
          return searchResults[0];
        }
      }
      
      // If we couldn't find by title, try direct ID lookup if it looks like a UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) {
        // Try both movie and TV endpoints since we don't know the type
        // Extract first 7 characters as a TMDB ID (just a fallback)
        const shortId = id.substring(0, 7);
        
        console.log(`Trying TMDB direct lookup with ID: ${shortId}`);
        const tmdbMovieContent = await fetchTmdbContentById(shortId, 'movie');
        if (tmdbMovieContent) return tmdbMovieContent;
        
        const tmdbTvContent = await fetchTmdbContentById(shortId, 'tv');
        if (tmdbTvContent) return tmdbTvContent;
      }
      
      // Try a secondary search with just the first part of the ID
      // This is a last resort attempt
      if (id.includes('-')) {
        const firstPart = id.split('-')[0];
        if (firstPart.length > 3) {
          console.log(`Trying secondary TMDB search with ID part: ${firstPart}`);
          const secondaryResults = await searchTmdb(firstPart);
          
          if (secondaryResults && secondaryResults.length > 0) {
            console.log(`Found secondary TMDB results:`, secondaryResults);
            return secondaryResults[0];
          }
        }
      }
    } catch (tmdbError) {
      console.error('Error searching TMDB:', tmdbError);
    }
    
    // Add more context to the error
    const enhancedError = new Error(
      `Failed to fetch content with ID ${id}: ${error.message || 'Unknown error'}`
    );
    // Preserve the original stack trace
    if (error.stack) {
      enhancedError.stack = error.stack;
    }
    throw enhancedError;
  }
};

// Fetch content by genre with improved error handling
export const fetchContentByGenre = async (genreId: string): Promise<Content[]> => {
  try {
    console.log(`Fetching content by genre ID: ${genreId}`);
    return await adminFetchContentByGenre(genreId);
  } catch (error) {
    console.error('Error fetching content by genre:', error);
    return [];
  }
};

// Fetch episode by ID with adapter
export const fetchEpisodeById = async (id: string): Promise<Episode | null> => {
  try {
    const episode = await adminFetchEpisodeById(id);
    if (!episode) {
      console.error(`Episode with ID ${id} not found`);
      return null;
    }
    
    // First cast to unknown, then to SupabaseEpisode to avoid the type error
    return mapSupabaseEpisodeToAppEpisode(episode as unknown as SupabaseEpisode);
  } catch (error) {
    console.error('Error fetching episode by ID:', error);
    return null;
  }
};

// Pass through the track content visit function with error handling
export const trackContentVisit = async (contentId: string): Promise<void> => {
  try {
    await adminTrackContentVisit(contentId);
  } catch (error) {
    console.error('Error tracking content visit:', error);
    // Don't throw error to prevent UI issues
  }
};

// Search content wrapper function
export const searchContent = async (query: string, type?: 'movie' | 'series'): Promise<Content[]> => {
  try {
    return await searchTmdb(query, type);
  } catch (error) {
    console.error('Error searching content:', error);
    return [];
  }
};

// Expose TMDB import functions with correct typing
export const importMovieOrSeriesFromTmdb = (title: string, type: 'movie' | 'series') => {
  // Pass title and type to the import function
  return importFromTmdbByTitle(title, type);
};

export const importMultipleFromTmdb = adminImportMultipleFromTmdb;
