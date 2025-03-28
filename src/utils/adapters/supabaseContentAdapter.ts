import { Content as AppContent, Movie as AppMovie, Series as AppSeries } from '@/types/content';
import { Content as SupabaseContent } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Converts an App Content object to a Supabase Content object format
 * Returns a complete object with all required fields for Supabase
 */
export const mapAppContentToSupabaseContent = (content: AppContent): Partial<SupabaseContent> => {
  // Create base content mapping with all required fields
  const baseContent: Partial<SupabaseContent> = {
    id: content.id,
    title: content.title,
    description: content.description,
    type: content.type,
    thumbnail_url: content.thumbnailUrl,
    backdrop_url: content.backdropUrl,
    release_year: content.releaseYear,
    rating: content.rating,
    is_featured: content.isFeatured
  };

  // Add visit_count if it exists in the content object
  if (content.visitCount !== undefined) {
    // Using type assertion to avoid TypeScript error
    (baseContent as any).visit_count = content.visitCount;
  }

  if (content.type === 'movie') {
    const movieContent = content as AppMovie;
    return {
      ...baseContent,
      duration: movieContent.duration,
      video_url: movieContent.videoUrl,
      video_servers: movieContent.videoServers ? JSON.stringify(movieContent.videoServers) : null
    };
  } else {
    const seriesContent = content as AppSeries;
    return {
      ...baseContent,
      seasons: seriesContent.seasons
    };
  }
};

/**
 * Type guard to check if a string is a valid content type
 */
export const isValidContentType = (type: string): type is 'movie' | 'series' => {
  return type === 'movie' || type === 'series';
};

/**
 * Generates a new UUID for content or cast members
 */
export const generateUUID = (): string => {
  return uuidv4();
};

/**
 * Check if an ID appears to be a TMDB ID format that needs conversion
 */
export const isTmdbStyleId = (id: string): boolean => {
  return id.startsWith('actor-') || 
         id.startsWith('tmdb-') ||
         id.includes('-');
};

/**
 * Converts TMDB-style IDs to proper UUIDs for database storage
 */
export const convertTmdbIdToUuid = (id: string): string => {
  if (isTmdbStyleId(id)) {
    return generateUUID();
  }
  return id;
};

/**
 * Ensures that a content object has all required fields for Supabase
 * This is useful when inserting/updating content in the database
 */
export const ensureRequiredSupabaseFields = (contentData: Partial<SupabaseContent>): Omit<SupabaseContent, 'created_at' | 'updated_at'> => {
  // Default values for required fields if they're missing
  const result = {
    id: contentData.id || uuidv4(),
    title: contentData.title || '',
    description: contentData.description || '',
    type: contentData.type || 'movie',
    thumbnail_url: contentData.thumbnail_url || '',
    backdrop_url: contentData.backdrop_url || '',
    release_year: contentData.release_year || 2024,
    rating: contentData.rating || 0,
    is_featured: contentData.is_featured || false,
    duration: contentData.duration,
    seasons: contentData.seasons,
    video_url: contentData.video_url,
    video_servers: contentData.video_servers,
  } as Omit<SupabaseContent, 'created_at' | 'updated_at'>;
  
  // Handle visit_count separately to avoid TypeScript errors
  if ('visit_count' in contentData) {
    (result as any).visit_count = (contentData as any).visit_count !== undefined ? (contentData as any).visit_count : 0;
  } else {
    (result as any).visit_count = 0;
  }
  
  return result;
};
