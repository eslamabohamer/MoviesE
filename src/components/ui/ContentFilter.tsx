
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchGenres } from '@/services/contentService';
import { Genre } from '@/types/supabase';
import { FilterIcon, X } from 'lucide-react';

interface ContentFilterProps {
  onFilter: (year?: number, genreId?: string) => void;
  contentType: 'movie' | 'series';
}

const ContentFilter: React.FC<ContentFilterProps> = ({ onFilter, contentType }) => {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Fetch genres with React Query
  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres
  });

  // Generate years from 1950 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => (currentYear - i).toString());

  // Update active filters status
  useEffect(() => {
    setHasActiveFilters(!!selectedYear || !!selectedGenre);
  }, [selectedYear, selectedGenre]);

  const handleFilter = () => {
    const year = selectedYear ? parseInt(selectedYear, 10) : undefined;
    const genreId = selectedGenre || undefined;
    onFilter(year, genreId);
  };

  const handleReset = () => {
    setSelectedYear('');
    setSelectedGenre('');
    onFilter(undefined, undefined);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {contentType === 'movie' ? 'Movies' : 'Series'}
        </h2>
        
        <Button 
          variant={hasActiveFilters ? "default" : "outline"} 
          size="sm"
          onClick={() => setIsFiltersVisible(!isFiltersVisible)}
          className="flex items-center gap-2"
        >
          <FilterIcon className="h-4 w-4" />
          {hasActiveFilters ? 'Filters Active' : 'Filter'}
        </Button>
      </div>
      
      {isFiltersVisible && (
        <div className="bg-card p-4 rounded-lg shadow-md mb-6 border border-border animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Years</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Genre</label>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Genres</SelectItem>
                  {genres.map((genre: Genre) => (
                    <SelectItem key={genre.id} value={genre.id}>{genre.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button 
                className="flex-1" 
                onClick={handleFilter}
              >
                Apply Filters
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="px-3"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentFilter;
