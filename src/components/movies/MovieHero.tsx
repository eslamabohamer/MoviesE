import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, Calendar, Award, Heart, List, Bookmark, Plus, Play } from 'lucide-react';
import { Movie } from '@/types/content';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MovieHeroProps {
  movie: Movie;
}

const MovieHero: React.FC<MovieHeroProps> = ({ movie }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isRated, setIsRated] = useState(false);
  
  const hasVideoSources = ('videoServers' in movie && movie.videoServers && movie.videoServers.length > 0) || movie.videoUrl;
  
  useEffect(() => {
    const checkUserLists = async () => {
      if (!user || !movie) return;
      
      try {
        const { data: watchlistData, error: watchlistError } = await supabase
          .from('watchlist')
          .select()
          .eq('user_id', user.id)
          .eq('content_id', movie.id)
          .single();
          
        setIsInWatchlist(!!watchlistData);
        
        const { data: favoritesData, error: favoritesError } = await supabase
          .from('favorites')
          .select()
          .eq('user_id', user.id)
          .eq('content_id', movie.id)
          .single();
          
        setIsFavorited(!!favoritesData);
        
        const { data: ratedData, error: ratedError } = await supabase
          .from('rated_content')
          .select()
          .eq('user_id', user.id)
          .eq('content_id', movie.id)
          .single();
          
        setIsRated(!!ratedData);
      } catch (error) {
        console.error('Error checking user lists:', error);
      }
    };
    
    checkUserLists();
  }, [user, movie]);
  
  const formatReleaseDate = () => {
    const year = movie.releaseYear;
    return `${year}`;
  };

  const watchlistMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      if (isInWatchlist) {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', movie.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            content_id: movie.id
          });
          
        if (error) throw error;
      }
      
      return !isInWatchlist;
    },
    onSuccess: (newIsInWatchlist) => {
      setIsInWatchlist(newIsInWatchlist);
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
      
      toast.success(newIsInWatchlist 
        ? `${movie.title} added to your watchlist` 
        : `${movie.title} removed from your watchlist`
      );
    },
    onError: (error) => {
      console.error('Error updating watchlist:', error);
      toast.error('Failed to update watchlist');
    }
  });

  const favoritesMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', movie.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            content_id: movie.id
          });
          
        if (error) throw error;
      }
      
      return !isFavorited;
    },
    onSuccess: (newIsFavorited) => {
      setIsFavorited(newIsFavorited);
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      
      toast.success(newIsFavorited 
        ? `${movie.title} added to your favorites` 
        : `${movie.title} removed from your favorites`
      );
    },
    onError: (error) => {
      console.error('Error updating favorites:', error);
      toast.error('Failed to update favorites');
    }
  });

  const ratedMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      if (isRated) {
        const { error } = await supabase
          .from('rated_content')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', movie.id);
          
        if (error) throw error;
      } else {
        const rating = movie.rating || 7.0;
        const { error } = await supabase
          .from('rated_content')
          .insert({
            user_id: user.id,
            content_id: movie.id,
            rating: rating
          });
          
        if (error) throw error;
      }
      
      return !isRated;
    },
    onSuccess: (newIsRated) => {
      setIsRated(newIsRated);
      queryClient.invalidateQueries({ queryKey: ['rated', user?.id] });
      
      toast.success(newIsRated 
        ? `${movie.title} added to your rated movies` 
        : `${movie.title} removed from your rated movies`
      );
    },
    onError: (error) => {
      console.error('Error updating rated movies:', error);
      toast.error('Failed to update rated movies');
    }
  });

  const handleWatchlistClick = () => {
    if (!user) {
      toast.error('Please login to add to watchlist');
      navigate('/login');
      return;
    }
    
    watchlistMutation.mutate();
  };

  const handleFavoriteClick = () => {
    if (!user) {
      toast.error('Please login to add to favorites');
      navigate('/login');
      return;
    }
    
    favoritesMutation.mutate();
  };

  const handleRateClick = () => {
    if (!user) {
      toast.error('Please login to rate movies');
      navigate('/login');
      return;
    }
    
    ratedMutation.mutate();
  };
  
  const navigateToWatchlist = () => {
    navigate('/watchlist');
    toast.info('Viewing your watchlist');
  };
  
  const navigateToFavorites = () => {
    navigate('/favorites');
    toast.info('Viewing your favorites');
  };
  
  const navigateToRated = () => {
    navigate('/rated');
    toast.info('Viewing your rated content');
  };

  const handleWatchNow = () => {
    const element = document.getElementById('movie-player');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      
      const setPlayerVisible = () => {
        const movieSidebar = document.getElementById('movie-player');
        if (movieSidebar) {
          const button = movieSidebar.querySelector('button');
          if (button) {
            button.click();
          }
        }
      };
      
      setTimeout(setPlayerVisible, 100);
    }
  };

  return (
    <div className="relative">
      <div 
        className="absolute inset-0 w-full h-screen bg-cover bg-center" 
        style={{ 
          backgroundImage: `url(${movie.backdropUrl})`,
          backgroundPosition: 'center top',
          filter: 'brightness(0.2)'
        }} 
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
      
      <div className="relative z-10 container mx-auto pt-12 pb-8">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="flex-shrink-0 w-64 h-96 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] border-2 border-white/10">
            <img 
              src={movie.thumbnailUrl} 
              alt={movie.title} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm text-white/70 mb-2">
              <span className="px-2 py-1 bg-primary/20 rounded font-semibold text-white">PG</span>
              <span>{formatReleaseDate()}</span>
              <span>•</span>
              {movie.genres.map((genre, index) => (
                <React.Fragment key={index}>
                  <span>{typeof genre === 'string' ? genre : genre.name}</span>
                  {index < movie.genres.length - 1 && <span>•</span>}
                </React.Fragment>
              ))}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {movie.duration} min
              </span>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              {movie.title} <span className="text-white/70 font-normal">({movie.releaseYear})</span>
            </h1>
            
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <svg viewBox="0 0 36 36" className="w-16 h-16">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#204529"
                      strokeWidth="3"
                      strokeDasharray="100, 100"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#21d07a"
                      strokeWidth="3"
                      strokeDasharray={`${movie.rating * 10}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                    {movie.rating * 10}<sup>%</sup>
                  </div>
                </div>
                <span className="text-white text-sm font-medium">User<br/>Score</span>
              </div>
              
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full w-10 h-10 border-white/20 bg-white/5 hover:bg-white/10"
                      title="Your lists"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Your Lists</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={navigateToWatchlist}>
                      <List className="h-4 w-4 mr-2" /> Watchlist
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={navigateToFavorites}>
                      <Heart className="h-4 w-4 mr-2" /> Favorites
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={navigateToRated}>
                      <Star className="h-4 w-4 mr-2" /> Rated Movies
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`rounded-full w-10 h-10 border-white/20 ${isInWatchlist ? 'bg-primary/50 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                  onClick={handleWatchlistClick}
                  title="Add to watchlist"
                >
                  <List className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`rounded-full w-10 h-10 border-white/20 ${isFavorited ? 'bg-primary/50 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                  onClick={handleFavoriteClick}
                  title="Mark as favorite"
                >
                  <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`rounded-full w-10 h-10 border-white/20 ${isRated ? 'bg-primary/50 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                  onClick={handleRateClick}
                  title="Rate this movie"
                >
                  <Star className={`h-5 w-5 ${isRated ? 'fill-current' : ''}`} />
                </Button>
              </div>
              
              {hasVideoSources && (
                <Button 
                  className="bg-primary hover:bg-primary/90 font-medium flex items-center gap-2 h-12 px-6"
                  onClick={handleWatchNow}
                >
                  <Play className="h-5 w-5 fill-white" />
                  Watch Now
                </Button>
              )}
            </div>
            
            <div className="italic text-white/70 mb-4">{movie.tags && movie.tags.length > 0 ? movie.tags.join(' • ') : 'The classic tale comes to life.'}</div>
            
            <h3 className="text-xl font-semibold text-white mb-2">Overview</h3>
            <p className="text-white/80 leading-relaxed mb-6">{movie.description}</p>
            
            {movie.cast && movie.cast.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {movie.cast.slice(0, 4).map((person, index) => (
                  <div key={index}>
                    <h4 className="font-medium text-white">{person.name}</h4>
                    <p className="text-sm text-white/60">{person.role}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieHero;
