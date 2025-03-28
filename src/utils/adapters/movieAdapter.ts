
import { Movie as AppMovie, Content, VideoServer } from '@/types/content';
import { Content as SupabaseContent } from '@/types/supabase';
import { mapAppContentToSupabaseContent } from './contentBaseAdapter';
import { Json } from '@/integrations/supabase/types';

/**
 * Maps a movie app content object to a Supabase content object
 */
export const mapAppMovieToSupabaseContent = (movie: AppMovie): Partial<SupabaseContent> => {
  const baseContent = mapAppContentToSupabaseContent(movie);
  
  // Ensure videoServers is properly serialized for Supabase
  let videoServers: Json | null = null;
  if (movie.videoServers && movie.videoServers.length > 0) {
    // Cast to Json type to satisfy TypeScript
    videoServers = movie.videoServers as unknown as Json;
  }
  
  return {
    ...baseContent,
    duration: movie.duration,
    video_url: movie.videoUrl,
    video_servers: videoServers
  };
};

/**
 * Parses and validates video servers from Supabase JSON
 */
export const parseVideoServers = (videoServersJson: Json | null): VideoServer[] => {
  if (!videoServersJson) return [];
  
  try {
    // Handle both array and object formats
    let servers: VideoServer[] = [];
    
    if (Array.isArray(videoServersJson)) {
      servers = videoServersJson as unknown as VideoServer[];
    } else if (typeof videoServersJson === 'object' && videoServersJson !== null) {
      // If it's an object, convert to array
      servers = Object.values(videoServersJson) as unknown as VideoServer[];
    } else if (typeof videoServersJson === 'string') {
      // If it's a string, try to parse as JSON
      servers = JSON.parse(videoServersJson) as VideoServer[];
    }
    
    // Validate each server has required fields
    return servers.filter(server => 
      server && 
      typeof server === 'object' && 
      'name' in server && 
      'url' in server &&
      typeof server.name === 'string' && 
      typeof server.url === 'string'
    );
  } catch (e) {
    console.error('Error parsing video servers:', e);
    return [];
  }
};
