
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ContentCard from '@/components/ui/ContentCard';
import { Content } from '@/types/content';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface ContentCardWrapperProps {
  content: Content;
  showRemoveButton?: boolean;
  onRemove?: (id: string) => void;
  onClick?: (id: string) => void;
}

const ContentCardWrapper = ({ 
  content, 
  showRemoveButton = false,
  onRemove,
  onClick
}: ContentCardWrapperProps) => {
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    if (onClick) {
      onClick(content.id);
    } else {
      if (content.type === 'movie') {
        navigate(`/movies/${content.id}`);
      } else if (content.type === 'series') {
        navigate(`/series/${content.id}`);
      }
    }
  };
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(content.id);
    }
  };
  
  return (
    <div className="relative group">
      {showRemoveButton && (
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 z-10 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div 
        onClick={handleCardClick}
        className="cursor-pointer"
      >
        <ContentCard 
          content={content}
        />
      </div>
    </div>
  );
};

export default ContentCardWrapper;
