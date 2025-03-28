
import { v4 as uuidv4 } from 'uuid';
import { convertTmdbIdToDbId } from '@/types/content';
import { Content as AppContent, Movie as AppMovie, Series as AppSeries, Episode as AppEpisode, Genre as AppGenre, GenreInput } from '@/types/content';
import { getTmdbImageUrl } from '@/integrations/supabase/client';

/**
 * Maps TMDb movie data to our app content format
 */
export const mapTmdbMovieToAppContent = (tmdbMovie: any): AppMovie => {
  // Generate a proper UUID for our database
  const id = uuidv4();
  
  const genres = tmdbMovie.genres
    ? tmdbMovie.genres.map((genre: any) => ({
        id: `tmdb-genre-${genre.id}`, // Keep TMDB format for display only
        name: genre.name
      }))
    : [];
  
  const cast = tmdbMovie.credits?.cast
    ? tmdbMovie.credits.cast.slice(0, 10).map((person: any) => ({
        id: uuidv4(), // Use a proper UUID instead of TMDB format
        name: person.name || 'Unknown Actor',
        photo: person.profile_path ? getTmdbImageUrl(person.profile_path, 'w185') : null,
        role: person.character || 'Actor'
      }))
    : [];
  
  const releaseYear = tmdbMovie.release_date 
    ? parseInt(tmdbMovie.release_date.split('-')[0], 10) 
    : new Date().getFullYear();
  
  const movie: AppMovie = {
    id,
    title: tmdbMovie.title,
    description: tmdbMovie.overview || "No description available",
    thumbnailUrl: getTmdbImageUrl(tmdbMovie.poster_path),
    backdropUrl: getTmdbImageUrl(tmdbMovie.backdrop_path, 'original'),
    releaseYear,
    rating: tmdbMovie.vote_average || 0,
    genres,
    isFeatured: tmdbMovie.popularity > 50,
    cast,
    tags: [],
    type: "movie",
    duration: tmdbMovie.runtime || 120,
    videoServers: []
  };
  
  return movie;
};

/**
 * Maps TMDb TV show data to our app content format
 */
export const mapTmdbTvToAppContent = (tmdbTv: any): AppSeries => {
  // Generate a proper UUID for our database
  const id = uuidv4();
  
  const genres = tmdbTv.genres
    ? tmdbTv.genres.map((genre: any) => ({
        id: `tmdb-genre-${genre.id}`, // Keep TMDB format for display only
        name: genre.name
      }))
    : [];
  
  const cast = tmdbTv.credits?.cast
    ? tmdbTv.credits.cast.slice(0, 10).map((person: any) => ({
        id: uuidv4(), // Use a proper UUID instead of TMDB format
        name: person.name || 'Unknown Actor',
        photo: person.profile_path ? getTmdbImageUrl(person.profile_path, 'w185') : null,
        role: person.character || 'Actor'
      }))
    : [];
  
  const releaseYear = tmdbTv.first_air_date 
    ? parseInt(tmdbTv.first_air_date.split('-')[0], 10) 
    : new Date().getFullYear();
  
  const episodes: AppEpisode[] = [];
  if (tmdbTv.seasons) {
    tmdbTv.seasons.forEach((season: any) => {
      if (season.episodes) {
        season.episodes.forEach((episode: any) => {
          episodes.push({
            id: uuidv4(), // Proper UUID for episodes too
            seriesId: id,
            title: episode.name,
            description: episode.overview || "No description available",
            thumbnailUrl: getTmdbImageUrl(episode.still_path),
            videoUrl: "",
            season: season.season_number,
            episodeNumber: episode.episode_number,
            duration: episode.runtime || 40,
            releaseDate: episode.air_date || ""
          });
        });
      }
    });
  }

  const series: AppSeries = {
    id,
    title: tmdbTv.name,
    description: tmdbTv.overview || "No description available",
    thumbnailUrl: getTmdbImageUrl(tmdbTv.poster_path),
    backdropUrl: getTmdbImageUrl(tmdbTv.backdrop_path, 'original'),
    releaseYear,
    rating: tmdbTv.vote_average || 0,
    genres,
    isFeatured: tmdbTv.popularity > 50,
    cast,
    tags: [],
    type: "series",
    seasons: tmdbTv.number_of_seasons || 1,
    episodes
  };
  
  return series;
};

/**
 * Maps TMDb search result to our app content format
 */
export const mapTmdbSearchResultToAppContent = (result: any): AppContent => {
  const type = result.media_type === 'movie' || result.title ? 'movie' : 'series';
  
  // Generate proper UUID
  const id = uuidv4();
  const title = type === 'movie' ? result.title : result.name;
  const releaseYear = result.release_date || result.first_air_date
    ? parseInt((result.release_date || result.first_air_date).split('-')[0], 10)
    : 0;
  
  const baseContent = {
    id,
    title,
    description: result.overview || "No description available",
    thumbnailUrl: getTmdbImageUrl(result.poster_path),
    backdropUrl: getTmdbImageUrl(result.backdrop_path, 'original'),
    releaseYear,
    rating: result.vote_average || 0,
    genres: [],
    isFeatured: false,
    cast: [],
    tags: []
  };
  
  if (type === 'movie') {
    return {
      ...baseContent,
      type: 'movie',
      duration: 120,
      videoServers: []
    } as AppMovie;
  } else {
    return {
      ...baseContent,
      type: 'series',
      seasons: 1,
      episodes: []
    } as AppSeries;
  }
};
