
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, X, CirclePlay, CirclePause } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { VideoServer } from '@/types/content';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  videoServers?: VideoServer[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoUrl, 
  title,
  videoServers 
}) => {
  const [activeServer, setActiveServer] = useState<string>(videoUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Set initial active server
    if (videoServers && videoServers.length > 0) {
      setActiveServer(videoServers[0].url);
    } else if (videoUrl) {
      setActiveServer(videoUrl);
    }
    
    setShowPlayer(true);
  }, [videoUrl, videoServers]);

  // Setup video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100 || 0);
    };

    const onLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const onEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('ended', onEnded);
    };
  }, [videoRef.current]);

  // Format time display (00:00 format)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleServerChange = (url: string, name: string) => {
    setActiveServer(url);
    setIsPlaying(true);
    setShowPlayer(true);
    toast.success(`Playing from ${name}`);
    
    // Restart video if needed
    if (videoRef.current && !shouldUseIframe(url)) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  // Video control functions
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    
    const progressBar = event.currentTarget;
    const clickPosition = event.clientX - progressBar.getBoundingClientRect().left;
    const percentage = clickPosition / progressBar.clientWidth;
    
    videoRef.current.currentTime = percentage * duration;
  };

  const handleSkipBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
  };

  const handleSkipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => {
        toast.error("Error attempting to enable fullscreen");
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Check if URL is YouTube
  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Check if URL should use an iframe
  const shouldUseIframe = (url: string): boolean => {
    // YouTube URLs always use iframe
    if (isYouTubeUrl(url)) return true;
    
    // Common streaming services and embed URLs
    const iframePatterns = [
      'vimeo.com', 
      'dailymotion.com', 
      'player.vimeo.com',
      'embed', 
      'iframe', 
      'player.',
      'drive.google.com',
      'dropbox.com/s',
      'streamable.com',
      'jwplayer',
      '.m3u8',
      'streaming',
      // Add more external video hosting domains
      'vidply.com',
      'do7go.com',
      'filemoon.sx',
      'dood.', // Covers dood.watch, dood.la, etc.
      'streamtape.com',
      'streamsb.net',
      'mixdrop.co',
      'streamlare.com',
      'vidoza.net',
      'fembed.com',
      'mp4upload.com',
      'upstream.to',
      'videobin.co',
      'easyload.io',
      'smartshare.tv',
      'gounlimited.to',
      'netu.tv',
      'videozupload.net',
      'sendvid.com',
      'movcloud.net',
      'vidbam.org',
      'evoload.io',
      'clipwatching.com',
      'mystream.to',
      'openload.',
      'streamango.'
    ];
    
    return iframePatterns.some(pattern => url.toLowerCase().includes(pattern));
  };

  // Extract YouTube video ID
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Create an embeddable URL
  const getEmbedUrl = (url: string): string => {
    if (isYouTubeUrl(url)) {
      const videoId = getYouTubeVideoId(url);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&fs=1`;
      }
    }
    
    // For vimeo
    if (url.includes('vimeo.com') && !url.includes('player.vimeo.com')) {
      const vimeoId = url.split('/').pop();
      if (vimeoId) {
        return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
      }
    }
    
    // For external video sites that need "/e/" in the URL
    if (url.includes('/e/')) {
      return url;
    }
    
    // If the URL already contains embed or iframe, use it directly
    if (url.includes('embed') || url.includes('iframe')) {
      return url;
    }
    
    // If none of the above, but should use iframe, just wrap the URL in an iframe
    if (shouldUseIframe(url)) {
      // For most streaming sites, just use the URL directly
      return url;
    }
    
    // For all other URLs that should use iframe, return as is
    return url;
  };

  return (
    <div className="flex flex-col w-full">
      <div 
        ref={videoContainerRef} 
        className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group"
      >
        {showPlayer ? (
          <>
            {shouldUseIframe(activeServer) ? (
              <iframe
                src={getEmbedUrl(activeServer)}
                title={title}
                className="w-full h-full"
                allowFullScreen
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="no-referrer"
              ></iframe>
            ) : (
              <video
                ref={videoRef}
                src={activeServer}
                className="w-full h-full"
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                muted={isMuted}
                controls={false}
                playsInline
              ></video>
            )}
            
            {/* Custom controls for non-iframe videos */}
            {!shouldUseIframe(activeServer) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-100 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-col space-y-2">
                  <div className="w-full" onClick={handleSeek}>
                    <Progress value={progress} className="h-1 cursor-pointer" />
                  </div>
                  
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={handleSkipBackward}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600/80 hover:bg-blue-600 transition-colors"
                      >
                        <SkipBack className="w-5 h-5" />
                      </button>
                      
                      <button 
                        onClick={togglePlay}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        {isPlaying ? 
                          <Pause className="w-6 h-6" /> : 
                          <Play className="w-6 h-6 ml-1" />}
                      </button>
                      
                      <button 
                        onClick={handleSkipForward}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600/80 hover:bg-blue-600 transition-colors"
                      >
                        <SkipForward className="w-5 h-5" />
                      </button>
                      
                      <span className="text-sm font-medium ml-2">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={toggleMute}
                        className="hover:text-primary transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      
                      <button 
                        onClick={toggleFullscreen}
                        className="hover:text-primary transition-colors"
                      >
                        <Maximize className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-900 cursor-pointer" onClick={() => {
            setShowPlayer(true);
            setIsPlaying(true);
            if (videoRef.current && !shouldUseIframe(activeServer)) {
              videoRef.current.play().catch(err => {
                console.error("Error playing video:", err);
                toast.error("Error playing video. Please try another server.");
              });
            }
          }}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Play className="w-10 h-10 text-primary" />
              </div>
              <p className="mt-2 text-gray-400">Click to play</p>
            </div>
          </div>
        )}
      </div>

      {/* Video servers */}
      {videoServers && videoServers.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Available Servers</h3>
          <div className="flex flex-wrap gap-2">
            {videoServers.map((server, index) => (
              <Button
                key={index}
                variant={activeServer === server.url ? "default" : "outline"}
                className="flex items-center justify-between gap-2"
                onClick={() => handleServerChange(server.url, server.name)}
              >
                <span>{server.name}</span>
                {activeServer === server.url && (
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
