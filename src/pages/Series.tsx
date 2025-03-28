import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ContentCardWrapper from '@/components/ui/ContentCardWrapper';
import { 
  fetchSeries, 
  fetchContentByGenre,
  trackContentVisit,
  searchContent,
  fetchGenres
} from '@/services/contentService';
import { Content, Genre } from '@/types/content';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, Loader2 } from 'lucide-react';

const Series = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  const [searchInputValue, setSearchInputValue] = useState(searchTerm);
  const { genreName } = useParams<{ genreName?: string }>();
  const navigate = useNavigate();
  
  useEffect(() => {
    setSearchInputValue(searchTerm);
  }, [searchTerm]);

  const { 
    data: series = [], 
    isLoading: isSeriesLoading,
    isFetching: isSeriesFetching 
  } = useQuery({
    queryKey: ['series', genreName, searchTerm],
    queryFn: async () => {
      if (searchTerm) {
        return searchContent(searchTerm, 'series');
      }
      
      if (genreName) {
        return fetchContentByGenre(genreName);
      }
      
      return fetchSeries();
    },
    meta: {
      onSettled: (_, error: Error | null) => {
        if (error) toast.error(`Failed to load series: ${error.message}`);
      }
    }
  });

  const { data: genres = [], isLoading: isGenresLoading } = useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres,
    meta: {
      onSettled: (_, error: Error | null) => {
        if (error) toast.error(`Failed to load genres: ${error.message}`);
      }
    }
  });

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
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

  const handleCardClick = async (contentId: string) => {
    await trackContentVisit(contentId);
    navigate(`/series/${contentId}`);
  };

  const handleGenreClick = (genreName: string) => {
    navigate(`/series/genre/${genreName}`);
  };

  const isLoading = isSeriesLoading || isGenresLoading;
  const isSearching = isSeriesFetching && searchTerm;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-white">
            {searchTerm ? `Search Results: "${searchTerm}"` : 
             genreName ? `Series - ${genreName}` : 'Popular Series'}
          </h1>
          
          <form onSubmit={handleSearch} className="flex items-center w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Input
                type="text"
                placeholder="Search for series..."
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
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : series.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {series.map((content) => (
              <ContentCardWrapper 
                key={content.id} 
                content={content} 
                onClick={() => handleCardClick(content.id)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2">No Series Found</h2>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? `No results found for "${searchTerm}". Please try a different search term.` 
                : genreName 
                  ? `No series found in the ${genreName} genre.` 
                  : 'No series found.'}
            </p>
            {(searchTerm || genreName) && (
              <Button onClick={() => navigate('/series')}>
                View all series
              </Button>
            )}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Series;
