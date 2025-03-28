
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Trash2, Film, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import VideoSourcesManager from './VideoSourcesManager';

interface AdminControlsProps {
  contentId: string;
  contentTitle: string;
  contentType: 'movie' | 'series';
  onEdit?: () => void;
  onDelete?: () => void;
}

const AdminControls: React.FC<AdminControlsProps> = ({ 
  contentId, 
  contentTitle, 
  contentType,
  onEdit,
  onDelete 
}) => {
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${contentTitle}"?`)) {
      try {
        toast.success(`${contentType === 'movie' ? 'Movie' : 'Series'} deleted successfully`);
        if (onDelete) onDelete();
        // Invalidate query cache to refresh lists
        queryClient.invalidateQueries({ queryKey: [contentType === 'movie' ? 'movies' : 'series'] });
      } catch (error) {
        toast.error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card rounded-lg shadow-lg p-2 border border-border flex flex-col gap-2">
      <div className="text-sm font-semibold px-2 py-1 flex items-center gap-2 text-primary">
        {contentType === 'movie' ? <Film className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        <span>Admin Controls</span>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onEdit}
          className="flex items-center gap-1"
        >
          <Edit className="h-3 w-3" />
          <span>Edit</span>
        </Button>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
            >
              <Play className="h-3 w-3" />
              <span>Sources</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Manage Video Sources</DialogTitle>
            </DialogHeader>
            <VideoSourcesManager contentId={contentId} />
          </DialogContent>
        </Dialog>
        
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleDelete}
          className="flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
          <span>Delete</span>
        </Button>
      </div>
    </div>
  );
};

export default AdminControls;
