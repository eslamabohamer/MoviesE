export type GenreType =
  | 'action'
  | 'comedy'
  | 'drama'
  | 'fantasy'
  | 'horror'
  | 'mystery'
  | 'romance'
  | 'thriller'
  | 'western'
  | 'animation'
  | 'sci-fi'
  | 'adventure'
  | 'crime'
  | 'documentary'
  | 'family'
  | 'history'
  | 'music'
  | 'sport'
  | 'war';

export interface Genre {
  id: string;
  name: string;
}

export type GenreInput = GenreType | Genre;

export interface Cast {
  id: string;
  name: string;
  photo: string | null;
  role: string;
}

export type CastMember = Cast;

export interface VideoServer {
  name: string;
  url: string;
}

export interface ContentBase {
  id: string;
  title: string;
  description: string;
  type: 'movie' | 'series';
  thumbnailUrl: string;
  backdropUrl: string;
  releaseYear: number;
  rating: number;
  genres: GenreInput[];
  isFeatured: boolean;
  cast: Cast[];
  tags?: string[];
  isFromOmdb?: boolean;
  omdbId?: string;
  relatedContent?: Content[];
  visitCount?: number;
  createdAt?: string;
}

export interface Movie extends ContentBase {
  type: 'movie';
  duration: number;
  videoServers?: VideoServer[];
  videoUrl?: string; // For backward compatibility
}

export interface Series extends ContentBase {
  type: 'series';
  seasons: number;
  episodes: Episode[];
}

export type Content = Movie | Series;

export interface Episode {
  id: string;
  title: string;
  season: number;
  episodeNumber: number;
  thumbnailUrl: string;
  videoUrl: string;
  description: string;
  duration: number;
  seriesId?: string;
  releaseDate?: string;
}

export const getGenreName = (genre: GenreInput): string => {
  if (typeof genre === 'string') {
    switch (genre) {
      case 'action': return 'Action';
      case 'comedy': return 'Comedy';
      case 'drama': return 'Drama';
      case 'fantasy': return 'Fantasy';
      case 'horror': return 'Horror';
      case 'mystery': return 'Mystery';
      case 'romance': return 'Romance';
      case 'thriller': return 'Thriller';
      case 'western': return 'Western';
      case 'animation': return 'Animation';
      case 'sci-fi': return 'Sci-Fi';
      case 'adventure': return 'Adventure';
      case 'crime': return 'Crime';
      case 'documentary': return 'Documentary';
      case 'family': return 'Family';
      case 'history': return 'History';
      case 'music': return 'Music';
      case 'sport': return 'Sport';
      case 'war': return 'War';
      default: return 'Unknown';
    }
  } else if (typeof genre === 'object' && genre !== null && 'name' in genre) {
    return genre.name;
  }
  return 'Unknown';
};

export const getGenreId = (genre: GenreInput): string => {
  if (typeof genre === 'string') {
    return genre;
  } else if (typeof genre === 'object' && genre !== null && 'id' in genre) {
    return genre.id;
  }
  return 'unknown';
};

export const isGenreObject = (genre: GenreInput): genre is Genre => {
  return typeof genre === 'object' && genre !== null && 'id' in genre && 'name' in genre;
};

export const convertGenreString = (genreName: string): GenreType | Genre => {
  const lowercaseName = genreName.toLowerCase();
  
  // Special handling for multi-word genres
  if (lowercaseName === 'sci-fi' || lowercaseName === 'science fiction') {
    return 'sci-fi';
  }
  
  // Check if it's a valid GenreType
  const validGenres: GenreType[] = [
    'action', 'comedy', 'drama', 'fantasy', 'horror', 
    'mystery', 'romance', 'thriller', 'western', 'animation',
    'sci-fi', 'adventure', 'crime', 'documentary', 'family',
    'history', 'music', 'sport', 'war'
  ];
  
  if (validGenres.includes(lowercaseName as GenreType)) {
    return lowercaseName as GenreType;
  }
  
  // If it's not a valid GenreType, return it as a Genre object
  return {
    id: lowercaseName,
    name: genreName
  };
};

/**
 * Converts a TMDB-style ID (e.g., "actor-12345" or "tmdb-genre-28") 
 * to a format suitable for database storage
 */
export const convertTmdbIdToDbId = (id: string): string => {
  // Check if this is a TMDB-style ID
  if (id && typeof id === 'string' && (
      id.startsWith('actor-') || 
      id.startsWith('tmdb-') || 
      id.includes('-'))) {
    // For database storage, we want to generate a proper UUID
    // rather than using the TMDB ID format
    return crypto.randomUUID();
  }
  
  // If it's already a UUID or other acceptable format, return as is
  return id;
};

/**
 * Checks if an ID appears to be from TMDB based on its format
 */
export const isTmdbId = (id: string): boolean => {
  return typeof id === 'string' && (
    id.startsWith('actor-') || 
    id.startsWith('tmdb-') || 
    id.includes('-')
  );
};
