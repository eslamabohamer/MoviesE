import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { fetchMovies, fetchGenres, trackContentVisit, fetchContentByGenre, searchContent } from '@/services/contentService';
import { Genre, Content } from '@/types/content';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Search, X, Loader2 } from 'lucide-react';
import ContentCardWrapper from '@/components/ui/ContentCardWrapper';

const Movies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  const [searchInputValue, setSearchInputValue] = useState(searchTerm);
  
  const { genreName } = useParams<{ genreName?: string }>();
  const navigate = useNavigate();

  // Set search input value when searchTerm changes
  useEffect(() => {
    setSearchInputValue(searchTerm);
  }, [searchTerm]);

  // Fetch movies - including search functionality
  const { 
    data: movies = [], 
    isLoading: isMoviesLoading,
    isFetching: isMoviesFetching 
  } = useQuery({
    queryKey: ['movies', genreName, searchTerm],
    queryFn: async () => {
      // If searching, use search function
      if (searchTerm) {
        return searchContent(searchTerm, 'movie');
      }
      
      // If genre is specified, fetch movies by genre
      if (genreName) {
        return fetchContentByGenre(genreName);
      }
      
      // Otherwise fetch all movies
      return fetchMovies();
    },
    meta: {
      onSettled: (_, error: Error | null) => {
        if (error) toast.error(`Failed to load movies: ${error.message}`);
      }
    }
  });

  // Fetch genres
  const { data: genres = [], isLoading: isGenresLoading } = useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres,
    meta: {
      onSettled: (_, error: Error | null) => {
        if (error) toast.error(`Failed to load genres: ${error.message}`);
      }
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInputValue.trim()) {
      setSearchParams({ search: searchInputValue.trim() });
    } else {
      setSearchParams({});
    }
  };

  const clearSearch = () => {
    setSearchInputValue('');
    setSearchParams({});
  };

  const trackVisit = async (contentId: string) => {
    try {
      await trackContentVisit(contentId);
      navigate(`/movies/${contentId}`);
    } catch (error: any) {
      toast.error(`Failed to track visit: ${error.message}`);
    }
  };

  const handleGenreClick = (genreName: string) => {
    navigate(`/movies/genre/${genreName}`);
  };

  const isLoading = isMoviesLoading || isGenresLoading;
  const isSearching = isMoviesFetching && searchTerm;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-white">
            {searchTerm ? `Search Results: "${searchTerm}"` : 
             genreName ? `Movies - ${genreName}` : 'Popular Movies'}
          </h1>
          
          <form onSubmit={handleSearch} className="flex items-center w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Input
                type="text"
                placeholder="Search for movies..."
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                className="pr-10"
              />
              {searchInputValue && (
                <button 
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button type="submit" className="ml-2">
              {isSearching ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
          </form>
        </div>

        {/* Genre Filters */}
        {genres.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Genres</h2>
            <ScrollArea className="rounded-md border">
              <div className="flex flex-wrap gap-2 p-2">
                {genres.map((genre) => (
                  <Button
                    key={genre.id}
                    variant="outline"
                    className={`text-sm rounded-full ${genreName?.toLowerCase() === genre.name.toLowerCase() ? 'bg-secondary hover:bg-secondary/80' : ''}`}
                    onClick={() => handleGenreClick(genre.name)}
                  >
                    {genre.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {/* Movie Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((content) => (
              <ContentCardWrapper 
                key={content.id} 
                content={content} 
                onClick={() => trackVisit(content.id)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2">No movies found</h2>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? `No results found for "${searchTerm}". Please try a different search term.` 
                : genreName 
                  ? `No movies found in the ${genreName} genre.` 
                  : 'No movies found.'}
            </p>
            {(searchTerm || genreName) && (
              <Button onClick={() => navigate('/movies')}>
                View all movies
              </Button>
            )}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Movies;
