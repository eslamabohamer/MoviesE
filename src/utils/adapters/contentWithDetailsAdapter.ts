
import { ContentBase, Content, Movie as AppMovie, Series as AppSeries, GenreInput } from '@/types/content';
import { ContentWithDetails, Episode as SupabaseEpisode } from '@/types/supabase';
import { mapSupabaseEpisodeToAppEpisode } from './episodeAdapter';

/**
 * Maps a Supabase content with details to an app content object
 */
export const mapSupabaseContentWithDetailsToAppContent = (
  content: ContentWithDetails, 
  episodes: SupabaseEpisode[] = []
): Content => {
  const mappedGenres: GenreInput[] = content.genres?.map(genre => ({
    id: genre.id,
    name: genre.name
  })) || [];
  
  const mappedCast = content.cast?.map(person => ({
    id: person.id,
    name: person.name,
    photo: person.photo_url,
    role: person.role
  })) || [];
  
  const baseContent = {
    id: content.id,
    title: content.title,
    description: content.description,
    type: content.type,
    thumbnailUrl: content.thumbnail_url,
    backdropUrl: content.backdrop_url,
    releaseYear: content.release_year,
    rating: content.rating || 0,
    genres: mappedGenres,
    isFeatured: content.is_featured || false,
    cast: mappedCast,
    tags: []
  };

  if (content.type === 'movie') {
    // Parse video servers from JSON if present
    let videoServers = [];
    if (content.video_servers) {
      try {
        // Handle both string and object representations
        if (typeof content.video_servers === 'string') {
          videoServers = JSON.parse(content.video_servers);
        } else if (Array.isArray(content.video_servers)) {
          // If already an array, use directly
          videoServers = content.video_servers;
        } else if (typeof content.video_servers === 'object') {
          // If it's a non-array object, convert to array if possible
          videoServers = Array.isArray(Object.values(content.video_servers)) 
            ? Object.values(content.video_servers) 
            : [content.video_servers];
        }
      } catch (e) {
        console.error('Error parsing video servers:', e, content.video_servers);
      }
    }
    
    const movieContent: AppMovie = {
      ...baseContent,
      type: 'movie',
      duration: content.duration || 0,
      videoUrl: content.video_url,
      videoServers: Array.isArray(videoServers) ? videoServers : []
    };
    return movieContent;
  } else {
    const mappedEpisodes = episodes.map(mapSupabaseEpisodeToAppEpisode);
    
    const seriesContent: AppSeries = {
      ...baseContent,
      type: 'series',
      seasons: content.seasons || 1,
      episodes: mappedEpisodes
    };
    return seriesContent;
  }
};
