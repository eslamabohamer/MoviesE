
import React from 'react';
import { Movie } from '@/types/content';
import { User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';

interface MovieOverviewProps {
  movie: Movie;
}

const MovieOverview: React.FC<MovieOverviewProps> = ({ movie }) => {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full justify-start mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="cast">Top Billed Cast</TabsTrigger>
        <TabsTrigger value="media">Media</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="mt-0">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Synopsis</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">{movie.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Details</h3>
                <dl className="space-y-2">
                  <div className="flex">
                    <dt className="w-32 text-muted-foreground">Status</dt>
                    <dd>Released</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 text-muted-foreground">Release Date</dt>
                    <dd>{movie.releaseYear}</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 text-muted-foreground">Runtime</dt>
                    <dd>{movie.duration} minutes</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Keywords</h3>
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
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="cast" className="mt-0">
        <h2 className="text-2xl font-bold mb-4">Top Billed Cast</h2>
        {movie.cast && movie.cast.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
              {movie.cast.map((actor, index) => (
                <div key={index} className="bg-card rounded-lg overflow-hidden border border-border">
                  <div className="aspect-[2/3] bg-muted overflow-hidden">
                    {actor.photo ? (
                      <img 
                        src={actor.photo} 
                        alt={actor.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-1">{actor.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{actor.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-6" />
            <h3 className="text-xl font-semibold mb-4">Full Cast & Crew</h3>
            
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {movie.cast.map((actor, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-full overflow-hidden">
                      {actor.photo ? (
                        <img 
                          src={actor.photo} 
                          alt={actor.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{actor.name}</h4>
                      <p className="text-xs text-muted-foreground">{actor.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-card rounded-lg p-6 border border-border text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No cast information available.</p>
            <p className="text-xs text-muted-foreground mt-2">Cast information can be added in the admin panel.</p>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="media" className="mt-0">
        <h2 className="text-2xl font-bold mb-4">Media</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            {movie.backdropUrl && (
              <img 
                src={movie.backdropUrl} 
                alt={`${movie.title} backdrop`} 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No trailer available
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default MovieOverview;
