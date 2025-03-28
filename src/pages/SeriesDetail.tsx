import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ContentRow from '@/components/ui/ContentRow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchContentById, fetchEpisodesBySeriesId, trackContentVisit } from '@/services/adminService';
import { fetchEpisodeById } from '@/services/contentService';
import { Badge } from '@/components/ui/badge';
import { Series, Episode, getGenreName } from '@/types/content';
import { Star, Calendar, Play, Film, List, User } from 'lucide-react';
import { mapSupabaseEpisodeToAppEpisode } from '@/utils/adapters';
import AdminControls from '@/components/admin/AdminControls';
import SeriesError from '@/components/series/SeriesError';

const SeriesDetail = () => {
  const { id, seriesId, episodeId } = useParams<{ id?: string; seriesId?: string; episodeId?: string }>();
  const [activeTab, setActiveTab] = useState('episodes');
  
  const contentId = id || seriesId || '';
  
  const { data: series, isLoading, isError, error } = useQuery({
    queryKey: ['series', contentId],
    queryFn: () => fetchContentById(contentId),
    enabled: !!contentId,
    retry: 1,
    retryDelay: 1000
  });
  
  const { data: episodes = [] } = useQuery({
    queryKey: ['episodes', contentId],
    queryFn: () => fetchEpisodesBySeriesId(contentId).then(res => res.data),
    enabled: !!contentId && !!series && series.type === 'series'
  });
  
  const { data: currentEpisode } = useQuery({
    queryKey: ['episode', episodeId],
    queryFn: () => fetchEpisodeById(episodeId || ''),
    enabled: !!episodeId
  });
  
  useEffect(() => {
    if (contentId && !contentId.startsWith('tmdb-')) {
      trackContentVisit(contentId).catch(error => {
        console.error('Error tracking visit:', error);
      });
    }
    
    if (series) {
      document.title = `${series.title} | Series`;
    }
  }, [contentId, series]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (isError || !series) {
    return <SeriesError error={error} />;
  }
  
  if (series.type !== 'series') {
    return <SeriesError isWrongType id={contentId} />;
  }
  
  const episodesBySeason: Record<number, Episode[]> = {};
  episodes.forEach(episode => {
    const appEpisode = mapSupabaseEpisodeToAppEpisode(episode);
    if (!episodesBySeason[appEpisode.season]) {
      episodesBySeason[appEpisode.season] = [];
    }
    episodesBySeason[appEpisode.season].push(appEpisode);
  });
  
  const seasons = Object.keys(episodesBySeason)
    .map(Number)
    .sort((a, b) => a - b);
  
  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      
      <AdminControls 
        contentId={contentId}
        contentTitle={series.title}
        contentType="series"
        onEdit={() => {
          window.location.href = `/admin?edit=${contentId}`;
        }}
      />
      
      <div 
        className="relative w-full h-[70vh] bg-cover bg-center" 
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url(${series.backdropUrl})` 
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
        <div className="container mx-auto px-4 h-full flex flex-col justify-end pb-12 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="w-40 h-60 rounded-lg overflow-hidden shadow-lg shrink-0 hidden md:block">
              <img 
                src={series.thumbnailUrl} 
                alt={series.title} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">{series.title}</h1>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {series.genres.map((genre, index) => (
                  <Badge key={index} variant="secondary">
                    {typeof genre === 'string' ? genre : genre.name}
                  </Badge>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-4 text-white/90 mb-4">
                <div className="flex items-center">
                  <Film className="h-4 w-4 mr-1" />
                  <span>{series.seasons} Season{series.seasons !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-yellow-400" />
                  <span>{series.rating}/10</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{series.releaseYear}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {currentEpisode && (
          <div className="mb-8">
            <div className="bg-card rounded-lg overflow-hidden mb-4">
              {currentEpisode.videoUrl ? (
                <div className="aspect-video w-full">
                  <iframe 
                    src={currentEpisode.videoUrl} 
                    title={currentEpisode.title}
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              ) : (
                <div className="aspect-video w-full bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">Video not available</p>
                </div>
              )}
            </div>
            
            <h2 className="text-2xl font-bold mb-2">
              S{currentEpisode.season} E{currentEpisode.episodeNumber}: {currentEpisode.title}
            </h2>
            <p className="text-muted-foreground mb-6">{currentEpisode.description}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="episodes" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="episodes" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Episodes
                </TabsTrigger>
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="cast" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cast
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="episodes">
                {seasons.length > 0 ? (
                  <div className="space-y-8">
                    {seasons.map(season => (
                      <div key={season}>
                        <h3 className="text-xl font-bold mb-4">Season {season}</h3>
                        
                        <div className="space-y-4">
                          {episodesBySeason[season].map(episode => (
                            <Link
                              key={episode.id}
                              to={`/series/${contentId}/episode/${episode.id}`}
                              className="flex flex-col sm:flex-row gap-4 bg-card hover:bg-card/80 transition-colors p-3 rounded-lg"
                            >
                              <div className="w-full sm:w-32 aspect-video rounded overflow-hidden flex-shrink-0">
                                <img 
                                  src={episode.thumbnailUrl || series.thumbnailUrl} 
                                  alt={episode.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-bold">
                                    {season}x{episode.episodeNumber} {episode.title}
                                  </h4>
                                  <span className="text-sm text-muted-foreground">
                                    {episode.duration} min
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {episode.description}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Episodes Available</h3>
                    <p className="text-muted-foreground">
                      Episodes for this series haven't been added yet.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="overview">
                <h2 className="text-2xl font-bold mb-4">Overview</h2>
                <p className="text-muted-foreground mb-8">{series.description}</p>
              </TabsContent>
              
              <TabsContent value="cast">
                <h2 className="text-2xl font-bold mb-4">Cast</h2>
                {series.cast && series.cast.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {series.cast.map((actor, index) => (
                      <div key={index} className="text-center">
                        <div className="w-24 h-24 mx-auto bg-card rounded-full overflow-hidden mb-2">
                          {actor.photo ? (
                            <img 
                              src={actor.photo} 
                              alt={actor.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <span className="text-2xl font-bold text-muted-foreground">
                                {actor.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="font-medium">{actor.name}</p>
                        <p className="text-sm text-muted-foreground">{actor.role}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No cast information available.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Series Info</h2>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Released</dt>
                  <dd>{series.releaseYear}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Seasons</dt>
                  <dd>{series.seasons}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Episodes</dt>
                  <dd>{episodes.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Rating</dt>
                  <dd>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-400" />
                      {series.rating}/10
                    </div>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Genres</dt>
                  <dd className="text-right">
                    {series.genres.map((genre, i) => (
                      <span key={i}>
                        {getGenreName(genre)}
                        {i < series.genres.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        
        {series.relatedContent && series.relatedContent.length > 0 && (
          <div className="mt-12">
            <ContentRow 
              title="You May Also Like" 
              content={series.relatedContent} 
            />
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default SeriesDetail;
