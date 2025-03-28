
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Content as SupabaseContent } from '@/types/supabase';
import { Content as AppContent } from '@/types/content';
import { cn } from '@/lib/utils';

type ContentType = AppContent | SupabaseContent;

interface HeroSliderProps {
  content: ContentType[];
}

const HeroSlider: React.FC<HeroSliderProps> = ({ content }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  
  // Auto-advance the slider
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 8000);
    
    return () => clearInterval(timer);
  }, [currentIndex]);
  
  const handleNext = () => {
    if (transitioning || content.length <= 1) return;
    
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % content.length);
      setTransitioning(false);
    }, 500);
  };
  
  const handlePrev = () => {
    if (transitioning || content.length <= 1) return;
    
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? content.length - 1 : prev - 1));
      setTransitioning(false);
    }, 500);
  };
  
  const handleDotClick = (index: number) => {
    if (transitioning || index === currentIndex || content.length <= 1) return;
    
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setTransitioning(false);
    }, 500);
  };
  
  if (!content.length) return null;
  
  const current = content[currentIndex];
  // Determine if we're using Supabase or App content type
  const isSupabaseContent = 'backdrop_url' in current;
  
  // Extract properties accordingly
  const id = current.id;
  const title = current.title;
  const description = current.description;
  const backdropUrl = isSupabaseContent ? current.backdrop_url : current.backdropUrl;
  const type = current.type;
  const url = type === 'movie' ? `/movies/${id}` : `/series/${id}`;
  
  return (
    <div className="relative w-full h-[70vh] overflow-hidden">
      {/* Background Image */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-1000",
          transitioning ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
        <img 
          src={backdropUrl} 
          alt={title} 
          className="w-full h-full object-cover object-center"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-20 h-full w-full max-w-screen-2xl mx-auto flex items-center px-6 md:px-12">
        <div className={cn(
          "max-w-2xl transition-all duration-700 transform",
          transitioning ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"
        )}>
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-wider text-white/80 font-medium">
              {type === 'movie' ? 'Film' : 'Series'}
            </span>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white text-shadow-lg">{title}</h1>
            
            <p className="text-white/90 text-sm md:text-base line-clamp-3 md:line-clamp-4 text-shadow max-w-xl">
              {description}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link 
                to={url}
                className="flex items-center gap-2 px-6 py-3 bg-primary rounded-full text-white font-medium hover:bg-primary/90 transition-all transform hover:scale-105"
              >
                <Play className="w-5 h-5" />
                {type === 'movie' ? 'Watch Now' : 'Watch Series'}
              </Link>
              
              <Link 
                to={url}
                className="px-6 py-3 border border-white/20 rounded-full text-white font-medium hover:bg-white/10 backdrop-blur-sm transition-all"
              >
                More Info
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Slider Controls */}
      {content.length > 1 && (
        <div className="absolute bottom-8 right-8 z-20 flex items-center space-x-2">
          {content.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                index === currentIndex ? "bg-white scale-100" : "bg-white/40 scale-75 hover:bg-white/60"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Navigation Arrows */}
      {content.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all"
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </>
      )}
    </div>
  );
};

export default HeroSlider;
