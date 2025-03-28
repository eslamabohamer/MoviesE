import { supabase, TMDB_API_KEY, TMDB_BASE_URL } from "@/integrations/supabase/client";
import { Content, ContentWithDetails, Episode, Genre, Person } from "@/types/supabase";
import { 
  mapSupabaseContentToAppContent, 
  mapSupabaseContentWithDetailsToAppContent, 
  mapSupabaseEpisodeToAppEpisode,
  mapTmdbMovieToAppContent,
  mapTmdbTvToAppContent,
  mapTmdbSearchResultToAppContent,
  mapAppToSupabaseContent
} from "@/utils/adapters";
import { Content as AppContent, Episode as AppEpisode, Movie as AppMovie, Series as AppSeries, VideoServer } from "@/types/content";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { Json } from "@/integrations/supabase/types";
import { convertTmdbIdToUuid, isTmdbStyleId, ensureRequiredSupabaseFields } from "@/utils/adapters/supabaseContentAdapter";

interface ImportResult {
  success: boolean;
  error?: string;
}

interface BulkImportResult {
  success: number;
  total: number;
  failed: string[];
}

export const fetchFeaturedContent = async (): Promise<AppContent[]> => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('is_featured', true)
      .limit(10);
    
    if (error) {
      console.error('Error fetching featured content:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      return Promise.all(data.map(async (content) => {
        return await fetchContentDetailsById(content.id);
      }));
    }
    
    return fetchTmdbFeatured();
  } catch (error) {
    console.error('Error in fetchFeaturedContent:', error);
    return fetchTmdbFeatured();
  }
};

export const fetchMovies = async (): Promise<AppContent[]> => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('type', 'movie')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      return Promise.all(data.map(async (content) => {
        return await fetchContentDetailsById(content.id);
      }));
    }
    
    return fetchTmdbMovies();
  } catch (error) {
    console.error('Error in fetchMovies:', error);
    return fetchTmdbMovies();
  }
};

export const fetchSeries = async (): Promise<AppContent[]> => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('type', 'series')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error fetching series:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      return Promise.all(data.map(async (content) => {
        return await fetchContentDetailsById(content.id);
      }));
    }
    
    return fetchTmdbSeries();
  } catch (error) {
    console.error('Error in fetchSeries:', error);
    return fetchTmdbSeries();
  }
};

export const fetchGenres = async () => {
  const { data, error } = await supabase
    .from('genres')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
  
  return data as Genre[];
};

export const fetchContentById = async (id: string): Promise<AppContent | null> => {
  if (id.startsWith('tmdb-')) {
    return fetchTmdbContentById(id);
  }

  try {
    return await fetchContentDetailsById(id);
  } catch (error) {
    console.error('Error in fetchContentById:', error);
    return null;
  }
};

async function fetchContentDetailsById(id: string): Promise<AppContent> {
  const { data: content, error } = await supabase
    .from('content')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching content with ID ${id}:`, error);
    throw error;
  }
  
  const { data: contentGenres, error: genresError } = await supabase
    .from('content_genres')
    .select('genres(id, name)')
    .eq('content_id', id);
  
  if (genresError) {
    console.error(`Error fetching genres for content ${id}:`, genresError);
  }
  
  const genres: Genre[] = [];
  if (contentGenres) {
    contentGenres.forEach(item => {
      if (item.genres) {
        const genre = item.genres as unknown as Genre;
        genres.push({
          ...genre,
          created_at: new Date().toISOString()
        });
      }
    });
  }
  
  const { data: contentCast, error: castError } = await supabase
    .from('content_cast')
    .select('people(id, name, photo_url), role, is_main_cast')
    .eq('content_id', id);
  
  if (castError) {
    console.error(`Error fetching cast for content ${id}:`, castError);
  }
  
  const cast: (Person & { role: string })[] = [];
  if (contentCast) {
    contentCast.forEach(item => {
      if (item.people) {
        const person = item.people as unknown as Person;
        cast.push({
          ...person,
          role: item.role,
          created_at: new Date().toISOString()
        });
      }
    });
  }
  
  let episodes: Episode[] = [];
  if (content.type === 'series') {
    const { data: seriesEpisodes, error: episodesError } = await supabase
      .from('episodes')
      .select('*')
      .eq('series_id', id)
      .order('season')
      .order('episode_number');
    
    if (episodesError) {
      console.error(`Error fetching episodes for series ${id}:`, episodesError);
    } else {
      episodes = seriesEpisodes || [];
    }
  }
  
  const contentWithDetails: ContentWithDetails = {
    ...content,
    genres,
    cast
  };
  
  return mapSupabaseContentWithDetailsToAppContent(contentWithDetails, episodes);
}

async function fetchTmdbContentById(tmdbId: string): Promise<AppContent | null> {
  try {
    const parts = tmdbId.split('-');
    if (parts.length < 3) return null;
    
    const mediaType = parts[1];
    const actualId = parts[2];
    
    const response = await fetch(
      `${TMDB_BASE_URL}/${mediaType}/${actualId}?api_key=${TMDB_API_KEY}&append_to_response=credits`
    );
    
    if (!response.ok) {
      console.error(`Error fetching TMDb content: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    const content = mediaType === 'movie' 
      ? mapTmdbMovieToAppContent(data)
      : mapTmdbTvToAppContent(data);
    
    if (content.genres && content.genres.length > 0) {
      try {
        const mainGenre = content.genres[0];
        const genreName = typeof mainGenre === 'string' ? mainGenre : mainGenre.name;
        const genreId = typeof mainGenre === 'string' ? 0 : parseInt(mainGenre.id.replace('tmdb-genre-', ''), 10);
        
        if (genreId) {
          const relatedContent = await fetchTmdbByGenre(genreId.toString(), mediaType, content.id);
          content.relatedContent = relatedContent.slice(0, 6);
        }
      } catch (relatedError) {
        console.error('Error fetching related content:', relatedError);
      }
    }
    
    return content;
  } catch (error) {
    console.error(`Error fetching TMDb content for ${tmdbId}:`, error);
    return null;
  }
}

export const fetchEpisodesBySeriesId = async (seriesId: string): Promise<{data: Episode[], error: any}> => {
  if (seriesId.startsWith('tmdb-')) {
    try {
      const parts = seriesId.split('-');
      if (parts.length < 3) return { data: [], error: null };
      
      const tvId = parts[2];
      
      const showResponse = await fetch(
        `${TMDB_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}`
      );
      
      if (!showResponse.ok) {
        return { data: [], error: null };
      }
      
      const showData = await showResponse.json();
      const episodes: Episode[] = [];
      
      const seasonsToFetch = Math.min(showData.number_of_seasons || 0, 3);
      
      for (let i = 1; i <= seasonsToFetch; i++) {
        const seasonResponse = await fetch(
          `${TMDB_BASE_URL}/tv/${tvId}/season/${i}?api_key=${TMDB_API_KEY}`
        );
        
        if (seasonResponse.ok) {
          const seasonData = await seasonResponse.json();
          
          seasonData.episodes.forEach((episode: any) => {
            episodes.push({
              id: `tmdb-episode-${episode.id}`,
              series_id: seriesId,
              title: episode.name,
              description: episode.overview || "No description available",
              thumbnail_url: episode.still_path 
                ? `https://image.tmdb.org/t/p/w300${episode.still_path}` 
                : "https://via.placeholder.com/300x170?text=No+Image",
              video_url: "",
              season: i,
              episode_number: episode.episode_number,
              duration: episode.runtime || 40,
              release_date: episode.air_date || ""
            } as Episode);
          });
        }
      }
      
      return { data: episodes, error: null };
    } catch (error) {
      console.error('Error fetching TMDb episodes:', error);
      return { data: [], error };
    }
  }
  
  return await supabase
    .from('episodes')
    .select('*')
    .eq('series_id', seriesId)
    .order('season')
    .order('episode_number');
};

export const fetchEpisodeById = async (id: string): Promise<AppEpisode | null> => {
  if (id.startsWith('tmdb-')) {
    try {
      const episodeId = id.replace('tmdb-episode-', '');
      return null;
    } catch (error) {
      return null;
    }
  }
  
  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    console.error(`Error fetching episode with ID ${id}:`, error);
    return null;
  }
  
  return mapSupabaseEpisodeToAppEpisode(data);
};

export const fetchContentByGenre = async (genreName: string): Promise<AppContent[]> => {
  try {
    const { data: genre, error: genreError } = await supabase
      .from('genres')
      .select('id')
      .ilike('name', genreName)
      .single();
    
    if (genreError || !genre) {
      return fetchTmdbByGenreName(genreName);
    }
    
    const { data: contentGenres, error: contentGenresError } = await supabase
      .from('content_genres')
      .select('content_id')
      .eq('genre_id', genre.id);
    
    if (contentGenresError || !contentGenres || contentGenres.length === 0) {
      return fetchTmdbByGenreName(genreName);
    }
    
    const contentIds = contentGenres.map(cg => cg.content_id);
    const { data: contents, error: contentsError } = await supabase
      .from('content')
      .select('*')
      .in('id', contentIds);
    
    if (contentsError || !contents || contents.length === 0) {
      return fetchTmdbByGenreName(genreName);
    }
    
    return Promise.all(contents.map(async (content) => {
      return await fetchContentDetailsById(content.id);
    }));
  } catch (error) {
    console.error(`Error fetching content by genre ${genreName}:`, error);
    return fetchTmdbByGenreName(genreName);
  }
};

async function fetchTmdbByGenreName(genreName: string): Promise<AppContent[]> {
  try {
    const genreResponse = await fetch(
      `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`
    );
    
    if (!genreResponse.ok) {
      return [];
    }
    
    const genreData = await genreResponse.json();
    const genre = genreData.genres.find((g: any) => 
      g.name.toLowerCase() === genreName.toLowerCase()
    );
    
    if (!genre) {
      const tvGenreResponse = await fetch(
        `${TMDB_BASE_URL}/genre/tv/list?api_key=${TMDB_API_KEY}`
      );
      
      if (!tvGenreResponse.ok) {
        return [];
      }
      
      const tvGenreData = await tvGenreResponse.json();
      const tvGenre = tvGenreData.genres.find((g: any) => 
        g.name.toLowerCase() === genreName.toLowerCase()
      );
      
      if (!tvGenre) {
        return [];
      }
      
      return fetchTmdbByGenre(tvGenre.id, 'tv');
    }
    
    return fetchTmdbByGenre(genre.id, 'movie');
  } catch (error) {
    console.error(`Error fetching TMDb content by genre name ${genreName}:`, error);
    return [];
  }
}

async function fetchTmdbByGenre(genreId: string, mediaType: string = 'movie', excludeId: string = ''): Promise<AppContent[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/${mediaType}?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=1`
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return [];
    }
    
    const filteredResults = excludeId ? 
      data.results.filter((item: any) => `tmdb-${mediaType}-${item.id}` !== excludeId) : 
      data.results;
    
    const contents: AppContent[] = [];
    
    for (const result of filteredResults.slice(0, 10)) {
      try {
        const detailResponse = await fetch(
          `${TMDB_BASE_URL}/${mediaType}/${result.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`
        );
        
        if (!detailResponse.ok) continue;
        
        const detailData = await detailResponse.json();
        
        const content = mediaType === 'movie' 
          ? mapTmdbMovieToAppContent(detailData)
          : mapTmdbTvToAppContent(detailData);
        
        contents.push(content);
      } catch (detailError) {
        console.error(`Error fetching TMDb details for ${result.id}:`, detailError);
      }
    }
    
    return contents;
  } catch (error) {
    console.error(`Error fetching TMDb content by genre ${genreId}:`, error);
    return [];
  }
}

export const fetchTmdbFeatured = async (): Promise<AppContent[]> => {
  try {
    const movieResponse = await fetch(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`
    );
    
    const tvResponse = await fetch(
      `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}`
    );
    
    const [movieData, tvData] = await Promise.all([
      movieResponse.ok ? movieResponse.json() : { results: [] },
      tvResponse.ok ? tvResponse.json() : { results: [] }
    ]);
    
    const combined = [
      ...movieData.results.slice(0, 3),
      ...tvData.results.slice(0, 3)
    ].sort(() => Math.random() - 0.5);
    
    const featured: AppContent[] = [];
    
    for (const item of combined) {
      try {
        const mediaType = item.title ? 'movie' : 'tv';
        const detailResponse = await fetch(
          `${TMDB_BASE_URL}/${mediaType}/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`
        );
        
        if (!detailResponse.ok) continue;
        
        const detailData = await detailResponse.json();
        
        const content = mediaType === 'movie' 
          ? mapTmdbMovieToAppContent(detailData)
          : mapTmdbTvToAppContent(detailData);
        
        content.isFeatured = true;
        featured.push(content);
      } catch (detailError) {
        console.error('Error fetching TMDb details:', detailError);
      }
    }
    
    return featured;
  } catch (error) {
    console.error('Error fetching TMDb featured content:', error);
    return [];
  }
}

export const fetchTmdbMovies = async (): Promise<AppMovie[]> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return [];
    }
    
    const movies: AppMovie[] = [];
    
    for (const result of data.results.slice(0, 10)) {
      try {
        const detailResponse = await fetch(
          `${TMDB_BASE_URL}/movie/${result.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`
        );
        
        if (!detailResponse.ok) continue;
        
        const detailData = await detailResponse.json();
        movies.push(mapTmdbMovieToAppContent(detailData) as AppMovie);
      } catch (detailError) {
        console.error(`Error fetching TMDb movie details for ${result.id}:`, detailError);
      }
    }
    
    return movies;
  } catch (error) {
    console.error('Error fetching TMDb movies:', error);
    return [];
  }
}

export const fetchTmdbSeries = async (): Promise<AppSeries[]> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}`
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return [];
    }
    
    const series: AppSeries[] = [];
    
    for (const result of data.results.slice(0, 10)) {
      try {
        const detailResponse = await fetch(
          `${TMDB_BASE_URL}/tv/${result.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`
        );
        
        if (!detailResponse.ok) continue;
        
        const detailData = await detailResponse.json();
        series.push(mapTmdbTvToAppContent(detailData) as AppSeries);
      } catch (detailError) {
        console.error(`Error fetching TMDb TV details for ${result.id}:`, detailError);
      }
    }
    
    return series;
  } catch (error) {
    console.error('Error fetching TMDb series:', error);
    return [];
  }
}

export const searchTmdb = async (query: string, type?: 'movie' | 'series'): Promise<AppContent[]> => {
  try {
    const tmdbType = type === 'series' ? 'tv' : 'movie';
    
    let url = `${TMDB_BASE_URL}/search/`;
    if (tmdbType) {
      url += `${tmdbType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    } else {
      url += `multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TMDb search failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return [];
    }
    
    const filteredResults = tmdbType 
      ? data.results 
      : data.results.filter((item: any) => 
          item.media_type === 'movie' || item.media_type === 'tv'
        );
    
    const contents: AppContent[] = [];
    
    for (const result of filteredResults.slice(0, 10)) {
      try {
        const mediaType = result.media_type || tmdbType || (result.title ? 'movie' : 'tv');
        const detailResponse = await fetch(
          `${TMDB_BASE_URL}/${mediaType}/${result.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`
        );
        
        if (!detailResponse.ok) {
          contents.push(mapTmdbSearchResultToAppContent(result));
          continue;
        }
        
        const detailData = await detailResponse.json();
        
        if (mediaType === 'movie') {
          contents.push(mapTmdbMovieToAppContent(detailData));
        } else {
          contents.push(mapTmdbTvToAppContent(detailData));
        }
      } catch (detailError) {
        console.error(`Error fetching TMDb details for ${result.id}:`, detailError);
        contents.push(mapTmdbSearchResultToAppContent(result));
      }
    }
    
    return contents;
  } catch (error: any) {
    console.error('Error searching TMDb:', error);
    toast.error('Failed to search for content');
    return [];
  }
};

export const trackContentVisit = async (contentId: string): Promise<boolean> => {
  try {
    const { data: content, error: fetchError } = await supabase
      .from('content')
      .select('id, visit_count')
      .eq('id', contentId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching content visit count:', fetchError);
      return false;
    }
    
    const newVisitCount = (content?.visit_count || 0) + 1;
    
    const { error: updateError } = await supabase
      .from('content')
      .update({ visit_count: newVisitCount })
      .eq('id', contentId);
    
    if (updateError) {
      console.error('Error updating visit count:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error tracking content visit:', error);
    return false;
  }
};

export const fetchMostViewedContent = async (limit = 10): Promise<AppContent[]> => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .order('visit_count', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching most viewed content:', error);
      throw error;
    }
    
    return Promise.all(data.map(async (content) => {
      return await fetchContentDetailsById(content.id);
    }));
  } catch (error) {
    console.error('Error in fetchMostViewedContent:', error);
    return [];
  }
};

export const fetchRecentContent = async (limit = 10): Promise<AppContent[]> => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching recent content:', error);
      throw error;
    }
    
    return Promise.all(data.map(async (content) => {
      return await fetchContentDetailsById(content.id);
    }));
  } catch (error) {
    console.error('Error in fetchRecentContent:', error);
    return [];
  }
};

export const filterContent = async (
  type?: 'movie' | 'series',
  year?: number,
  genreId?: string,
  limit = 20
): Promise<AppContent[]> => {
  try {
    let query = supabase.from('content').select('*');
    
    if (type) {
      query = query.eq('type', type);
    }
    
    if (year) {
      query = query.eq('release_year', year);
    }
    
    if (genreId) {
      const { data: contentIds, error: genreError } = await supabase
        .from('content_genres')
        .select('content_id')
        .eq('genre_id', genreId);
      
      if (genreError) {
        console.error('Error fetching content by genre:', genreError);
        throw genreError;
      }
      
      if (contentIds && contentIds.length > 0) {
        const ids = contentIds.map(item => item.content_id);
        query = query.in('id', ids);
      } else {
        return [];
      }
    }
    
    const { data, error } = await query
      .order('visit_count', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error filtering content:', error);
      throw error;
    }
    
    return Promise.all(data.map(async (content) => {
      return await fetchContentDetailsById(content.id);
    }));
  } catch (error) {
    console.error('Error in filterContent:', error);
    return [];
  }
};

export const fetchContent = async () => {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching content:", error);
    return [];
  }

  return data;
};

export const deleteContent = async (id: string) => {
  try {
    // First, remove all records from related tables that reference this content
    
    // Remove from favorites
    const { error: favoritesError } = await supabase
      .from('favorites')
      .delete()
      .eq('content_id', id);
    
    if (favoritesError) {
      console.error("Error deleting content from favorites:", favoritesError);
    }
    
    // Remove from watchlist
    const { error: watchlistError } = await supabase
      .from('watchlist')
      .delete()
      .eq('content_id', id);
    
    if (watchlistError) {
      console.error("Error deleting content from watchlist:", watchlistError);
    }
    
    // Remove from rated_content
    const { error: ratedError } = await supabase
      .from('rated_content')
      .delete()
      .eq('content_id', id);
    
    if (ratedError) {
      console.error("Error deleting content from rated_content:", ratedError);
    }
    
    // Remove from content_genres
    const { error: genresError } = await supabase
      .from('content_genres')
      .delete()
      .eq('content_id', id);
    
    if (genresError) {
      console.error("Error deleting content from content_genres:", genresError);
    }
    
    // Remove from content_cast
    const { error: castError } = await supabase
      .from('content_cast')
      .delete()
      .eq('content_id', id);
    
    if (castError) {
      console.error("Error deleting content from content_cast:", castError);
    }
    
    // Remove episodes if this is a series
    const { error: episodesError } = await supabase
      .from('episodes')
      .delete()
      .eq('series_id', id);
    
    if (episodesError) {
      console.error("Error deleting episodes for series:", episodesError);
    }
    
    // Finally, delete the content itself
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting content:", error);
      throw error;
    }
    
    return id;
  } catch (error) {
    console.error("Exception in deleteContent:", error);
    throw error;
  }
};

export const createContent = async (content: AppContent, genreIds: string[] = []): Promise<AppContent> => {
  try {
    // Extract cast members before creating content
    const castMembers = content.cast ? [...content.cast] : [];
    
    // Convert the app content to Supabase format
    const supabaseContent = mapAppToSupabaseContent(content);
    const completeSupabaseContent = ensureRequiredSupabaseFields(supabaseContent);

    // Insert the content
    const { data: createdContent, error: contentError } = await supabase
      .from('content')
      .insert(completeSupabaseContent)
      .select()
      .single();
    
    if (contentError) {
      console.error('Error creating content:', contentError);
      throw contentError;
    }
    
    // If we have genres, associate them with the content
    if (genreIds && genreIds.length > 0) {
      // Filter out TMDB-style IDs and convert to proper UUIDs if needed
      const validGenreIds = genreIds
        .filter(id => {
          // Skip IDs that aren't valid UUIDs or DB references
          try {
            // If it's a string genre type, we'll need to look it up
            if (typeof id === 'string' && !isTmdbStyleId(id)) {
              return true;
            }
            return false;
          } catch (e) {
            console.error('Invalid genre ID format:', id);
            return false;
          }
        });
      
      if (validGenreIds.length > 0) {
        const genreData = validGenreIds.map(genreId => ({
          content_id: createdContent.id,
          genre_id: genreId
        }));
        
        const { error: genreError } = await supabase
          .from('content_genres')
          .insert(genreData);
        
        if (genreError) {
          console.error('Error associating genres with content:', genreError);
          // Don't throw here, we'll still return the content
        }
      }
    }
    
    // If we have cast members, associate them with the content
    if (castMembers && castMembers.length > 0) {
      // First, we need to check if these cast members exist in our database
      // And create them if they don't
      const processedCastData = [];
      
      for (const member of castMembers) {
        // Skip cast members with TMDB-style IDs
        if (isTmdbStyleId(member.id)) {
          try {
            // Create a new person entry
            const { data: person, error } = await supabase
              .from('people')
              .insert({
                name: member.name,
                photo_url: member.photo
              })
              .select('id')
              .single();
            
            if (error) {
              console.error('Error creating person:', error);
              continue;
            }
            
            // Use the new person ID
            processedCastData.push({
              personId: person.id,
              role: member.role,
              isMainCast: true
            });
          } catch (e) {
            console.error('Error processing cast member:', e);
          }
        } else {
          // Use existing ID
          processedCastData.push({
            personId: member.id,
            role: member.role,
            isMainCast: true
          });
        }
      }
      
      // Now insert all processed cast members
      if (processedCastData.length > 0) {
        const castData = processedCastData.map(item => ({
          content_id: createdContent.id,
          person_id: item.personId,
          role: item.role,
          is_main_cast: item.isMainCast
        }));
        
        const { error: castError } = await supabase
          .from('content_cast')
          .insert(castData);
        
        if (castError) {
          console.error('Error associating cast with content:', castError);
          // Don't throw here, we'll still return the content
        }
      }
    }
    
    // Return the complete content with all details
    return await fetchContentDetailsById(createdContent.id);
  } catch (error) {
    console.error("Error in createContent:", error);
    throw error;
  }
};

export const importFromTmdbByTitle = async (
  title: string, 
  type: 'movie' | 'series' = 'movie'
): Promise<ImportResult> => {
  try {
    console.log(`Importing ${type} from TMDB with title: ${title}`);
    
    const tmdbType = type === 'series' ? 'tv' : 'movie';
    const searchUrl = `${TMDB_BASE_URL}/search/${tmdbType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      return {
        success: false,
        error: `TMDB API error: ${response.status}`
      };
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return {
        success: false,
        error: `No ${type}s found with title "${title}"`
      };
    }
    
    // Get the first result (most relevant)
    const firstResult = data.results[0];
    
    // Fetch full details of the content
    const detailUrl = `${TMDB_BASE_URL}/${tmdbType}/${firstResult.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
    const detailResponse = await fetch(detailUrl);
    
    if (!detailResponse.ok) {
      return {
        success: false,
        error: `Error fetching details: ${detailResponse.status}`
      };
    }
    
    const detailData = await detailResponse.json();
    
    // Map to our content format
    let content: AppContent;
    if (type === 'movie') {
      content = mapTmdbMovieToAppContent(detailData);
    } else {
      content = mapTmdbTvToAppContent(detailData);
    }
    
    // Insert the content into our database
    const supabaseContent = mapAppToSupabaseContent(content);
    const completeSupabaseContent = ensureRequiredSupabaseFields(supabaseContent);
    
    // Insert into database
    const { data: createdContent, error: insertError } = await supabase
      .from('content')
      .insert(completeSupabaseContent)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting content:', insertError);
      return {
        success: false,
        error: `Database error: ${insertError.message}`
      };
    }
    
    // Handle genres if the content has any
    if (content.genres && content.genres.length > 0) {
      for (const genre of content.genres) {
        const genreName = typeof genre === 'string' ? genre : genre.name;
        
        // First check if this genre exists in our database
        const { data: existingGenre, error: genreError } = await supabase
          .from('genres')
          .select('id')
          .ilike('name', genreName)
          .maybeSingle();
        
        let genreId;
        if (genreError) {
          console.error('Error checking for genre:', genreError);
          continue;
        }
        
        if (existingGenre) {
          genreId = existingGenre.id;
        } else {
          // Create the genre
          const { data: newGenre, error: createError } = await supabase
            .from('genres')
            .insert({ name: genreName })
            .select('id')
            .single();
          
          if (createError) {
            console.error('Error creating genre:', createError);
            continue;
          }
          
          genreId = newGenre.id;
        }
        
        // Associate genre with content
        const { error: linkError } = await supabase
          .from('content_genres')
          .insert({
            content_id: createdContent.id,
            genre_id: genreId
          });
        
        if (linkError) {
          console.error('Error linking genre to content:', linkError);
        }
      }
    }
    
    // Handle cast if the content has any
    if (content.cast && content.cast.length > 0) {
      for (const member of content.cast) {
        // First check if this person exists in our database
        const { data: existingPerson, error: personError } = await supabase
          .from('people')
          .select('id')
          .ilike('name', member.name)
          .maybeSingle();
        
        let personId;
        if (personError) {
          console.error('Error checking for person:', personError);
          continue;
        }
        
        if (existingPerson) {
          personId = existingPerson.id;
        } else {
          // Create the person
          const { data: newPerson, error: createError } = await supabase
            .from('people')
            .insert({
              name: member.name,
              photo_url: member.photo
            })
            .select('id')
            .single();
          
          if (createError) {
            console.error('Error creating person:', createError);
            continue;
          }
          
          personId = newPerson.id;
        }
        
        // Associate person with content
        const { error: linkError } = await supabase
          .from('content_cast')
          .insert({
            content_id: createdContent.id,
            person_id: personId,
            role: member.role || 'Unknown',
            is_main_cast: true
          });
        
        if (linkError) {
          console.error('Error linking person to content:', linkError);
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error importing from TMDB:', error);
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const importMultipleFromTmdb = async (
  titles: string[],
  type: 'movie' | 'series' = 'movie'
): Promise<BulkImportResult> => {
  const results: BulkImportResult = {
    success: 0,
    total: titles.length,
    failed: []
  };
  
  for (const title of titles) {
    const result = await importFromTmdbByTitle(title, type);
    if (result.success) {
      results.success++;
    } else {
      results.failed.push(`${title}: ${result.error}`);
    }
  }
  
  return results;
};

export const updateContent = async (content: AppContent): Promise<AppContent> => {
  try {
    // Convert the app content to Supabase format
    const supabaseContent = mapAppToSupabaseContent(content);
    const completeSupabaseContent = ensureRequiredSupabaseFields(supabaseContent);

    // Update the content
    const { error: contentError } = await supabase
      .from('content')
      .update(completeSupabaseContent)
      .eq('id', content.id);
    
    if (contentError) {
      console.error('Error updating content:', contentError);
      throw contentError;
    }
    
    // Return the updated content with all details
    return await fetchContentDetailsById(content.id);
  } catch (error) {
    console.error("Error in updateContent:", error);
    throw error;
  }
};

export const fetchPeople = async (): Promise<Person[]> => {
  try {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching people:', error);
      return [];
    }
    
    return data as Person[];
  } catch (error) {
    console.error('Error in fetchPeople:', error);
    return [];
  }
};

export const createPerson = async (name: string, photoUrl?: string): Promise<Person | null> => {
  try {
    const { data, error } = await supabase
      .from('people')
      .insert({
        name,
        photo_url: photoUrl || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating person:', error);
      return null;
    }
    
    return data as Person;
  } catch (error) {
    console.error('Error in createPerson:', error);
    return null;
  }
};

export const updateContentWithVideoSources = async (
  contentId: string, 
  videoSources: VideoServer[]
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('content')
      .update({
        video_servers: videoSources.length > 0 ? JSON.stringify(videoSources) : null
      })
      .eq('id', contentId);
    
    if (error) {
      console.error('Error updating video sources:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateContentWithVideoSources:', error);
    return false;
  }
};

export const uploadMediaFile = async (file: File, path: string): Promise<string> => {
  try {
    // This is just a placeholder - in a real application you would 
    // upload the file to Supabase storage or another storage provider
    console.warn('uploadMediaFile is not fully implemented');
    return URL.createObjectURL(file);
  } catch (error) {
    console.error('Error uploading media file:', error);
    throw error;
  }
};
