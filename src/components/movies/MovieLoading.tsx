
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from '@/components/layout/Navbar';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Heart, Bookmark, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MovieLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero section */}
      <div className="relative">
        <Skeleton className="w-full h-screen rounded-none" />
        
        <div className="container mx-auto px-4 pt-16 pb-8 absolute bottom-0 left-0 right-0 z-10">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <Skeleton className="w-64 h-96 rounded-lg" />
            
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-10 w-32" />
                
                {/* Interactive buttons loading state */}
                <div className="flex items-center gap-3 ml-4">
                  <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-white/20 bg-white/5" disabled>
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-white/20 bg-white/5" disabled>
                    <List className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-white/20 bg-white/5" disabled>
                    <Heart className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-white/20 bg-white/5" disabled>
                    <Bookmark className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-white/20 bg-white/5" disabled>
                    <Star className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">
                    <Skeleton className="h-4 w-20" />
                  </TabsTrigger>
                  <TabsTrigger value="cast">
                    <Skeleton className="h-4 w-20" />
                  </TabsTrigger>
                  <TabsTrigger value="media">
                    <Skeleton className="h-4 w-20" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Skeleton className="h-[400px] w-full rounded-lg mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="rounded-lg overflow-hidden">
                  <Skeleton className="aspect-[2/3] w-full" />
                  <div className="pt-2 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <Skeleton className="h-[120px] w-full rounded-lg" />
            <Skeleton className="h-[80px] w-full rounded-lg" />
            <Skeleton className="h-[80px] w-full rounded-lg" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-[150px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieLoading;
