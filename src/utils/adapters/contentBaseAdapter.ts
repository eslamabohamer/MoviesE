
import { ContentBase, Content, GenreInput } from '@/types/content';
import { Content as SupabaseContent, ContentWithDetails, Genre as SupabaseGenre } from '@/types/supabase';

/**
 * Maps an app content object to a Supabase content object
 */
export const mapAppContentToSupabaseContent = (content: Content): Partial<SupabaseContent> => {
  return {
    title: content.title,
    description: content.description,
    type: content.type,
    thumbnail_url: content.thumbnailUrl,
    backdrop_url: content.backdropUrl,
    release_year: content.releaseYear,
    rating: content.rating,
    is_featured: content.isFeatured
  };
};

/**
 * Maps a Supabase content object to an app content object
 */
export const mapSupabaseContentToAppContent = (content: SupabaseContent, genres: SupabaseGenre[] = []): Content => {
  const mappedGenres: GenreInput[] = genres.map(genre => ({
    id: genre.id,
    name: genre.name
  }));

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
    cast: [],
    tags: []
  };

  if (content.type === 'movie') {
    return {
      ...baseContent,
      type: 'movie',
      duration: content.duration || 0,
      videoUrl: content.video_url,
      videoServers: content.video_servers ? JSON.parse(content.video_servers as string) : []
    };
  } else {
    return {
      ...baseContent,
      type: 'series',
      seasons: content.seasons || 1,
      episodes: []
    };
  }
};
