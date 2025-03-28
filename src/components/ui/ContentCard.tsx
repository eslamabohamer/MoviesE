
import React from 'react';
import { cn } from '@/lib/utils';
import { Content as SupabaseContent } from '@/types/supabase';
import { Content as AppContent } from '@/types/content';

type ContentType = AppContent | SupabaseContent;

interface ContentCardProps {
  content: ContentType;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const ContentCard = ({ content, className, size = 'medium' }: ContentCardProps) => {
  // Determine if we're using Supabase or App content type
  const isSupabaseContent = 'thumbnail_url' in content;
  
  // Extract properties accordingly
  const id = content.id;
  const title = content.title;
  const thumbnailUrl = isSupabaseContent ? content.thumbnail_url : content.thumbnailUrl;
  const releaseYear = isSupabaseContent ? content.release_year : content.releaseYear;
  const type = content.type;
  
  const cardSizeClasses = {
    small: 'w-full aspect-[2/3]',
    medium: 'w-full aspect-[2/3]',
    large: 'w-full aspect-[16/9]',
  };
  
  const imageSizeClasses = {
    small: 'aspect-[2/3]',
    medium: 'aspect-[2/3]',
    large: 'aspect-[16/9]',
  };
  
  const titleSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-xl',
  };
  
  return (
    <div 
      className={cn(
        'group relative overflow-hidden rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer',
        cardSizeClasses[size],
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300 z-10" />
      
      <img 
        src={thumbnailUrl} 
        alt={title} 
        className={cn(
          'w-full h-full object-cover transition-transform duration-500 group-hover:scale-110',
          imageSizeClasses[size]
        )}
        loading="lazy"
      />
      
      <div className="absolute bottom-0 left-0 w-full p-4 z-20">
        <h3 className={cn('font-semibold text-white text-shadow mb-1', titleSizeClasses[size])}>
          {title}
        </h3>
        
        <div className="flex items-center gap-2 text-xs text-white/80">
          <span>{releaseYear}</span>
          <span className="w-1 h-1 rounded-full bg-white/80" />
          <span className="capitalize">{type}</span>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
