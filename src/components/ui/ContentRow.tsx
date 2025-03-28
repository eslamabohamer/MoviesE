
import React, { useRef } from 'react';
import { Content as AppContent } from '@/types/content';
import { Content as SupabaseContent } from '@/types/supabase';
import ContentCardWrapper from './ContentCardWrapper';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

type ContentType = AppContent | SupabaseContent;

interface ContentRowProps {
  title: string;
  content: ContentType[];
  moreLink?: string;
  className?: string;
  onContentClick?: (id: string) => void;
}

const ContentRow: React.FC<ContentRowProps> = ({ 
  title, 
  content, 
  moreLink, 
  className,
  onContentClick 
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!content.length) return null;

  return (
    <div className={cn("w-full px-6 md:px-12", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        
        <div className="flex space-x-2">
          {moreLink && (
            <Link to={moreLink} className="flex items-center text-sm text-primary hover:underline mr-2">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
          
          <button 
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-card/50 hover:bg-card/80 transition-colors"
            aria-label="Scroll left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button 
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-card/50 hover:bg-card/80 transition-colors"
            aria-label="Scroll right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
      >
        {content.map((item) => (
          <div key={item.id} className="flex-shrink-0 w-[180px] md:w-[200px]">
            {onContentClick ? (
              <ContentCardWrapper 
                content={item as AppContent} 
                onClick={onContentClick}
              />
            ) : (
              <ContentCardWrapper content={item as AppContent} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentRow;
