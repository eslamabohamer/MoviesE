
import { v4 as uuidv4 } from 'uuid';
import { Content as AppContent, Movie as AppMovie, Series as AppSeries, GenreInput, convertGenreString } from '@/types/content';

/**
 * Maps OMDB data to our app content format
 */
export const mapOmdbToAppContent = (omdbData: any): AppContent => {
  const genreStrings = omdbData.Genre ? omdbData.Genre.split(', ') : [];
  const genres: GenreInput[] = genreStrings.map((genre: string) => convertGenreString(genre));
  
  const releaseYear = parseInt(omdbData.Year.split('–')[0], 10) || new Date().getFullYear();
  
  const id = omdbData.imdbID || `omdb-${uuidv4()}`;
  
  const posterUrl = omdbData.Poster !== "N/A" ? omdbData.Poster : 'https://via.placeholder.com/300x450?text=No+Image';
  
  const commonProps = {
    id,
    title: omdbData.Title,
    description: omdbData.Plot || "No description available",
    thumbnailUrl: posterUrl,
    backdropUrl: posterUrl,
    releaseYear,
    rating: parseFloat(omdbData.imdbRating) || 0,
    genres,
    isFeatured: false,
    cast: omdbData.Actors ? omdbData.Actors.split(', ').map((name: string, index: number) => ({
      id: `actor-${id}-${index}`,
      name,
      photo: null,
      role: omdbData.Actors && index < 2 ? "Lead" : "Supporting"
    })) : [],
    tags: [],
    isFromOmdb: true
  };
  
  if (omdbData.Type === "movie") {
    const movie: AppMovie = {
      ...commonProps,
      type: "movie",
      duration: omdbData.Runtime ? parseInt(omdbData.Runtime.replace(' min', ''), 10) || 120 : 120,
      videoServers: []
    };
    return movie;
  } else {
    const series: AppSeries = {
      ...commonProps,
      type: "series",
      seasons: 1,
      episodes: []
    };
    return series;
  }
};
