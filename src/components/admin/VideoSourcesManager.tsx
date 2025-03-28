import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { fetchContentById, updateContentWithVideoSources } from '@/services/adminService';
import { useQueryClient } from '@tanstack/react-query';
import { Content, VideoServer, Movie } from '@/types/content';

interface VideoSourcesManagerProps {
  contentId: string;
  onClose?: () => void;
}

export const VideoSourcesManager: React.FC<VideoSourcesManagerProps> = ({ contentId, onClose }) => {
  const [content, setContent] = useState<Content | null>(null);
  const [videoServers, setVideoServers] = useState<VideoServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true);
        const contentData = await fetchContentById(contentId);
        setContent(contentData);
        
        // Initialize video servers from content
        if (contentData.type === 'movie') {
          const movieContent = contentData as Movie;
          if (movieContent.videoServers) {
            setVideoServers([...movieContent.videoServers]);
          } else if (movieContent.videoUrl) {
            setVideoServers([{ name: 'Default', url: movieContent.videoUrl }]);
          } else {
            setVideoServers([{ name: '', url: '' }]);
          }
        } else {
          setVideoServers([{ name: '', url: '' }]);
        }
      } catch (error) {
        console.error('Error loading content:', error);
        toast.error('Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [contentId]);

  const addVideoServer = () => {
    setVideoServers([...videoServers, { name: '', url: '' }]);
  };

  const removeVideoServer = (index: number) => {
    const updatedServers = [...videoServers];
    updatedServers.splice(index, 1);
    setVideoServers(updatedServers);
  };

  const handleServerChange = (index: number, field: 'name' | 'url', value: string) => {
    const updatedServers = [...videoServers];
    updatedServers[index] = {
      ...updatedServers[index],
      [field]: value
    };
    setVideoServers(updatedServers);
  };

  const handleSave = async () => {
    if (!content) return;

    // Validate all servers have name and URL
    const invalidServers = videoServers.filter(server => !server.name || !server.url);
    if (invalidServers.length > 0) {
      toast.error('All video servers must have a name and URL');
      return;
    }

    try {
      setIsSaving(true);
      
      await updateContentWithVideoSources(contentId, videoServers);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      
      toast.success('Video sources updated successfully');
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving video sources:', error);
      toast.error('Failed to save video sources');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!content) {
    return <div className="text-center p-4">Content not found</div>;
  }

  if (content.type !== 'movie') {
    return <div className="text-center p-4">Video sources can only be added to movies</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Video Sources for "{content.title}"</h3>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        {videoServers.map((server, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-5">
              <Label htmlFor={`server-name-${index}`}>Server Name</Label>
              <Input
                id={`server-name-${index}`}
                value={server.name}
                onChange={(e) => handleServerChange(index, 'name', e.target.value)}
                placeholder="Server name"
              />
            </div>
            <div className="col-span-6">
              <Label htmlFor={`server-url-${index}`}>Video URL</Label>
              <Input
                id={`server-url-${index}`}
                value={server.url}
                onChange={(e) => handleServerChange(index, 'url', e.target.value)}
                placeholder="https://example.com/video.mp4"
              />
            </div>
            <div className="col-span-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeVideoServer(index)}
                disabled={videoServers.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        <Button variant="outline" onClick={addVideoServer} className="w-full">
          <Plus className="h-4 w-4 mr-2" /> Add Server
        </Button>
      </div>
      
      <div className="flex justify-end mt-6 space-x-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default VideoSourcesManager;
