
import { GenreType, Genre as AppGenre } from '@/types/content';

/**
 * Converts a genre string to our app genre format
 */
export const convertGenreString = (genreName: string): GenreType | AppGenre => {
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
