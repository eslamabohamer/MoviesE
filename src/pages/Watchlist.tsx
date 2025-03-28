
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ContentCardWrapper from '@/components/ui/ContentCardWrapper';
import { Content } from '@/types/content';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { fetchContentById } from '@/services/contentService';

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query to fetch the user's watchlist
  const { data, refetch, isError } = useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data: watchlistData, error } = await supabase
        .from('watchlist')
        .select('content_id')
        .eq('user_id', user.id);

      if (error) throw error;

      // If watchlist is empty, return empty array
      if (!watchlistData || watchlistData.length === 0) {
        return [];
      }

      // Fetch details for each content item
      const contentPromises = watchlistData.map(item => 
        fetchContentById(item.content_id)
      );

      // Wait for all content to be fetched
      const contentItems = await Promise.all(contentPromises);
      return contentItems;
    },
    enabled: !!user,
    retry: 1
  });

  // Mutation to remove an item from watchlist
  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (contentId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', contentId);
      
      if (error) throw error;
      return contentId;
    },
    onSuccess: (contentId) => {
      // Update the local state
      setWatchlist(prev => prev.filter(item => item.id !== contentId));
      // Invalidate the watchlist query to refetch data
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
      toast.success('Removed from your watchlist');
    },
    onError: (error) => {
      console.error('Error removing from watchlist:', error);
      toast.error('Failed to remove from watchlist');
    }
  });

  // Update local state when data changes
  useEffect(() => {
    if (data) {
      setWatchlist(data);
      setIsLoading(false);
    }
  }, [data]);

  // Handle remove button click
  const removeFromWatchlist = (contentId: string) => {
    removeFromWatchlistMutation.mutate(contentId);
  };

  // If user is not authenticated, redirect to login
  useEffect(() => {
    if (!user && !isLoading) {
      toast.error('Please login to view your watchlist');
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
        
        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading your watchlist...</p>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-4">Your watchlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Movies you want to watch will appear here
            </p>
            <button
              onClick={() => navigate('/movies')}
              className="bg-primary hover:bg-primary/90 text-white py-2 px-6 rounded-md"
            >
              Browse Movies
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {watchlist.map((content) => (
              <ContentCardWrapper 
                key={content.id} 
                content={content}
                onRemove={removeFromWatchlist}
                showRemoveButton
              />
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Watchlist;
