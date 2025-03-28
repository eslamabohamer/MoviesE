import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ContentRow from '@/components/ui/ContentRow';
import { fetchContentById, trackContentVisit } from '@/services/contentService';
import AdminControls from '@/components/admin/AdminControls';
import MovieHero from '@/components/movies/MovieHero';
import MovieOverview from '@/components/movies/MovieOverview';
import MovieSidebar from '@/components/movies/MovieSidebar';
import MovieError from '@/components/movies/MovieError';
import MovieLoading from '@/components/movies/MovieLoading';
import VideoPlayer from '@/components/movies/VideoPlayer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Play, Info, Star, Calendar, Film, List } from 'lucide-react';
import { Movie } from '@/types/content';

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('movie');
  const [showPlayer, setShowPlayer] = useState(true);
  const [hasTrackedVisit, setHasTrackedVisit] = useState(false);
  
  const { 
    data: movie, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['movie', id],
    queryFn: async () => {
      if (!id) throw new Error('Movie ID is required');
      
      console.log('Fetching movie with ID:', id);
      try {
        const result = await fetchContentById(id);
        console.log('Fetch result:', result);
        
        // Verify that video servers exist and are properly formatted
        if (result && result.type === 'movie') {
          console.log('Video servers data:', result.videoServers);
        }
        
        return result;
      } catch (err) {
        console.error('Error fetching movie:', err);
        throw err;
      }
    },
    enabled: !!id,
    retry: 1, // Reduce retries to avoid multiple error messages
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true
  });
  
  useEffect(() => {
    if (id && !id.startsWith('tmdb-') && movie && !hasTrackedVisit) {
      console.log('Tracking visit for movie:', id);
      trackContentVisit(id)
        .then(() => {
          console.log('Successfully tracked visit for movie:', id);
          setHasTrackedVisit(true);
        })
        .catch(error => {
          console.error('Error tracking visit:', error);
        });
    }
    
    if (movie) {
      document.title = `${movie.title} (${movie.releaseYear}) | StreamHub`;
    }
  }, [id, movie, hasTrackedVisit]);
  
  // Log error details for debugging
  useEffect(() => {
    if (isError) {
      console.error('MovieDetail error state:', error);
    }
  }, [isError, error]);

  const handleRetry = () => {
    toast.info("Retrying...");
    refetch();
  };
  
  // Get video URL for player
  const getVideoUrl = (movie: Movie) => {
    if (Array.isArray(movie.videoServers) && movie.videoServers.length > 0) {
      return movie.videoServers[0].url;
    }
    return movie.videoUrl || '';
  };
  
  if (isLoading) {
    return <MovieLoading />;
  }
  
  if (isError || !movie) {
    return <MovieError error={error} id={id} onRetry={handleRetry} />;
  }
  
  if (movie.type !== 'movie') {
    return <MovieError isWrongType id={id} />;
  }
  
  const hasVideoSources = (Array.isArray(movie.videoServers) && movie.videoServers.length > 0) || movie.videoUrl;
  
  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      
      <AdminControls 
        contentId={id || ''}
        contentTitle={movie.title}
        contentType="movie"
        onEdit={() => {
          window.location.href = `/admin?edit=${id}`;
        }}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{movie.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{movie.releaseYear}</span>
                </div>
                <div className="flex items-center">
                  <Film className="h-4 w-4 mr-1" />
                  <span>{movie.duration} min</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-yellow-400" />
                  <span>{movie.rating}/10</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area - Video Player and Info */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="movie" value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="mb-4">
                  <TabsTrigger value="movie" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Watch
                  </TabsTrigger>
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="movie">
                  {hasVideoSources ? (
                    <div className="rounded-lg overflow-hidden bg-card border mb-6">
                      <VideoPlayer 
                        videoUrl={getVideoUrl(movie)} 
                        title={movie.title}
                        videoServers={movie.videoServers}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center aspect-video bg-card border rounded-lg mb-6">
                      <div className="text-center text-muted-foreground">
                        <Film className="h-12 w-12 mx-auto mb-2" />
                        <p>No video sources available</p>
                      </div>
                    </div>
                  )}
                  
                  <MovieOverview movie={movie} />
                </TabsContent>
                
                <TabsContent value="overview">
                  <div className="aspect-video bg-cover bg-center rounded-lg overflow-hidden mb-6">
                    <img 
                      src={movie.backdropUrl} 
                      alt={movie.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <MovieOverview movie={movie} />
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Sidebar - Movie Info and Recommendations */}
            <div>
              <MovieSidebar movie={movie} />
            </div>
          </div>
          
          {/* Related Content */}
          {movie.relatedContent && movie.relatedContent.length > 0 && (
            <div className="mt-12">
              <ContentRow 
                title="You May Also Like" 
                content={movie.relatedContent} 
              />
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default MovieDetail;
