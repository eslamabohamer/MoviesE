
import React, { useState, useEffect } from 'react';
import { Movie } from '@/types/content';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Play, ExternalLink, Link as LinkIcon, Info, ChevronDown, ChevronUp, Users, Video, Bookmark, Heart, List } from 'lucide-react';
import { getGenreName } from '@/types/content';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface MovieSidebarProps {
  movie: Movie;
}

const MovieSidebar: React.FC<MovieSidebarProps> = ({ movie }) => {
  const hasVideoSources = movie.videoServers && movie.videoServers.length > 0;
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isRated, setIsRated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user has this movie in watchlist, favorites, rated
  useEffect(() => {
    const checkUserInteractions = async () => {
      if (!user || !movie.id) return;
      
      try {
        // Check watchlist
        const { data: watchlistData } = await supabase
          .from('watchlist')
          .select()
          .eq('user_id', user.id)
          .eq('content_id', movie.id)
          .single();
        
        setIsInWatchlist(!!watchlistData);
        
        // Check favorites
        const { data: favoritesData } = await supabase
          .from('favorites')
          .select()
          .eq('user_id', user.id)
          .eq('content_id', movie.id)
          .single();
        
        setIsFavorited(!!favoritesData);
        
        // Check rated
        const { data: ratedData } = await supabase
          .from('rated_content')
          .select()
          .eq('user_id', user.id)
          .eq('content_id', movie.id)
          .single();
        
        setIsRated(!!ratedData);
        
        // Check if user is admin
        const { data: isAdminResult } = await supabase.rpc('is_admin');
        setIsAdmin(!!isAdminResult);
      } catch (error) {
        console.error('Error checking user interactions:', error);
      }
    };
    
    checkUserInteractions();
  }, [user, movie.id]);
  
  const scrollToPlayer = () => {
    const playerElement = document.getElementById('movie-player');
    if (playerElement) {
      playerElement.scrollIntoView({ behavior: 'smooth' });
      toast.info("Viewing available video sources");
    }
  };
  
  // Mutation for watchlist
  const watchlistMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      if (isInWatchlist) {
        // Remove from watchlist
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', movie.id);
          
        if (error) throw error;
      } else {
        // Add to watchlist
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
  
  // Mutation for favorites
  const favoritesMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', movie.id);
          
        if (error) throw error;
      } else {
        // Add to favorites
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
  
  // Mutation for rated
  const ratedMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      if (isRated) {
        // Remove from rated
        const { error } = await supabase
          .from('rated_content')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', movie.id);
          
        if (error) throw error;
      } else {
        // Add to rated with default rating (movie's own rating or 7)
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
  
  const handleAdminClick = () => {
    if (!isAdmin) {
      toast.error('You do not have admin privileges');
      return;
    }
    
    window.location.href = `/admin?edit=${movie.id}`;
    toast.info('Editing this content in admin panel');
  };
  
  return (
    <div className="space-y-6" id="movie-player">
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <h2 className="font-semibold text-lg mb-3">Status</h2>
          <p>Released</p>
        </CardContent>
      </Card>
      
      {/* User Actions Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <h2 className="font-semibold text-lg mb-3">User Actions</h2>
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              className={`w-full flex items-center justify-start gap-2 ${isInWatchlist ? 'bg-primary/10 border-primary/20' : ''}`}
              onClick={handleWatchlistClick}
            >
              <List className={`h-4 w-4 ${isInWatchlist ? 'text-primary' : ''}`} />
              <span>{isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
            </Button>
            
            <Button 
              variant="outline" 
              className={`w-full flex items-center justify-start gap-2 ${isFavorited ? 'bg-primary/10 border-primary/20' : ''}`}
              onClick={handleFavoriteClick}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? 'text-primary fill-primary' : ''}`} />
              <span>{isFavorited ? 'Favorited' : 'Add to Favorites'}</span>
            </Button>
            
            <Button 
              variant="outline" 
              className={`w-full flex items-center justify-start gap-2 ${isRated ? 'bg-primary/10 border-primary/20' : ''}`}
              onClick={handleRateClick}
            >
              <Star className={`h-4 w-4 ${isRated ? 'text-yellow-500 fill-yellow-500' : ''}`} />
              <span>{isRated ? 'Rated' : 'Rate this movie'}</span>
            </Button>
            
            {isAdmin && (
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-start gap-2 mt-2 border-destructive/30"
                onClick={handleAdminClick}
              >
                <Info className="h-4 w-4 text-destructive" />
                <span>Admin Edit</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {hasVideoSources && (
        <Card className="overflow-hidden border-primary/10">
          <CardContent className="p-5">
            <h2 className="font-semibold text-lg mb-3">Video Sources</h2>
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={scrollToPlayer}
            >
              <Video className="h-4 w-4" />
              <span>
                {movie.videoServers?.length === 1 
                  ? "1 Source Available" 
                  : `${movie.videoServers?.length} Sources Available`}
              </span>
            </Button>
            
            <div className="mt-3 text-xs text-muted-foreground">
              {movie.videoServers?.map((server, index) => (
                <div key={index} className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>{server.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold text-lg mb-3">Original Language</h2>
          <p>English</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold text-lg mb-3">Movie Facts</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Runtime</dt>
              <dd>{movie.duration} minutes</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Budget</dt>
              <dd>-</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Revenue</dt>
              <dd>-</dd>
            </div>
            <div className="border-t border-border pt-3 mt-3">
              <dt className="text-muted-foreground mb-2">Genres</dt>
              <dd className="flex flex-wrap gap-2">
                {movie.genres.map((genre, i) => (
                  <span key={i} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                    {getGenreName(genre)}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold text-lg mb-3">Cast</h2>
          <div className="space-y-2">
            {movie.cast && movie.cast.length > 0 ? (
              movie.cast.slice(0, 5).map((member, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{member.name}</span>
                  <span className="text-xs text-muted-foreground">{member.role}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center p-3">
                <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No cast information</span>
              </div>
            )}
            
            {movie.cast && movie.cast.length > 5 && (
              <Button variant="link" size="sm" className="text-xs mt-1 px-0">
                +{movie.cast.length - 5} more
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold text-lg mb-3">Keywords</h2>
          <div className="flex flex-wrap gap-2">
            {movie.tags && movie.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                {tag}
              </span>
            ))}
            {(!movie.tags || movie.tags.length === 0) && (
              <span className="text-muted-foreground">No keywords have been added.</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MovieSidebar;
