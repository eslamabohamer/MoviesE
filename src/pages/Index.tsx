
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSlider from '@/components/ui/HeroSlider';
import ContentRow from '@/components/ui/ContentRow';
import { 
  fetchFeaturedContent, 
  fetchMovies, 
  fetchSeries, 
  fetchMostViewedContent,
  fetchRecentContent,
  trackContentVisit
} from '@/services/contentService';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();

  // Fetch featured content
  const { data: featuredContent = [], isLoading: isFeaturedLoading } = useQuery({
    queryKey: ['featuredContent'],
    queryFn: fetchFeaturedContent,
    meta: {
      onSettled: (_, error: Error | null) => {
        if (error) toast.error(`Failed to load featured content: ${error.message}`);
      }
    }
  });

  // Fetch movies
  const { data: movies = [], isLoading: isMoviesLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: () => fetchMovies(),
    meta: {
      onSettled: (_, error: Error | null) => {
        if (error) toast.error(`Failed to load movies: ${error.message}`);
      }
    }
  });

  // Fetch series
  const { data: series = [], isLoading: isSeriesLoading } = useQuery({
    queryKey: ['series'],
    queryFn: fetchSeries,
    meta: {
      onSettled: (_, error: Error | null) => {
        if (error) toast.error(`Failed to load series: ${error.message}`);
      }
    }
  });

  // Fetch most viewed content
  const { data: mostViewedContent = [], isLoading: isMostViewedLoading } = useQuery({
    queryKey: ['mostViewedContent'],
    queryFn: () => fetchMostViewedContent(8),
    meta: {
      onSettled: (_, error: Error | null) => {
        if (error) toast.error(`Failed to load most viewed content: ${error.message}`);
      }
    }
  });

  // Fetch recent content
  const { data: recentContent = [], isLoading: isRecentLoading } = useQuery({
    queryKey: ['recentContent'],
    queryFn: () => fetchRecentContent(8),
    meta: {
      onSettled: (_, error: Error | null) => {
        if (error) toast.error(`Failed to load recent content: ${error.message}`);
      }
    }
  });

  const isLoading = isFeaturedLoading || isMoviesLoading || isSeriesLoading || 
                   isMostViewedLoading || isRecentLoading;

  // Handle content click
  const handleContentClick = async (contentId: string) => {
    try {
      await trackContentVisit(contentId);
      const content = [...movies, ...series, ...mostViewedContent, ...recentContent, ...featuredContent]
        .find(item => item.id === contentId);
      
      if (content) {
        if (content.type === 'movie') {
          navigate(`/movies/${contentId}`);
        } else if (content.type === 'series') {
          navigate(`/series/${contentId}`);
        }
      }
    } catch (error) {
      console.error('Error handling content click:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Slider */}
      {featuredContent.length > 0 && (
        <section className="w-full">
          <HeroSlider content={featuredContent} />
        </section>
      )}
      
      {/* Content Sections */}
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Most Viewed Content */}
        {mostViewedContent.length > 0 && (
          <ContentRow 
            title="Most Viewed" 
            content={mostViewedContent}
            onContentClick={handleContentClick}
          />
        )}
        
        {/* Recent Additions */}
        {recentContent.length > 0 && (
          <ContentRow 
            title="Recently Added" 
            content={recentContent}
            onContentClick={handleContentClick}
          />
        )}
        
        {/* Movies */}
        {movies.length > 0 && (
          <ContentRow 
            title="Popular Movies" 
            content={movies} 
            moreLink="/movies"
            onContentClick={handleContentClick}
          />
        )}
        
        {/* Series */}
        {series.length > 0 && (
          <ContentRow 
            title="Popular Series" 
            content={series} 
            moreLink="/series"
            onContentClick={handleContentClick}
          />
        )}
        
        {/* Loading state */}
        {isLoading && movies.length === 0 && series.length === 0 && (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && movies.length === 0 && series.length === 0 && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2">Welcome to our Streaming Platform</h2>
            <p className="text-muted-foreground">We're setting up our content library. Please check back soon!</p>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
