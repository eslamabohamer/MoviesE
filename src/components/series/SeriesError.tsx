
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, Film, RefreshCw, Tv, Download } from 'lucide-react';
import { toast } from 'sonner';
import { importMovieOrSeriesFromTmdb, importFromTmdbByTitle, fetchContentById } from '@/services/contentService';
import { useAuth } from '@/contexts/AuthContext';
import { isValidContentType } from '@/utils/adapters';

interface SeriesErrorProps {
  message?: string;
  isWrongType?: boolean;
  id?: string;
  error?: any;
  onRetry?: () => void;
  tmdbId?: string;
}

interface ErrorInfo {
  id: string;
  title: string;
  type: string;
}

const SeriesError: React.FC<SeriesErrorProps> = ({ 
  message = "The series you're looking for doesn't exist or has been removed.", 
  isWrongType = false,
  id,
  error,
  onRetry,
  tmdbId
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [potentialTitle, setPotentialTitle] = useState<string>("");
  
  useEffect(() => {
    if (error) {
      console.error('Series error details:', error);
    }
    
    // Try to extract a title from the ID or URL if available
    const loadErrorInfo = async () => {
      if (id) {
        try {
          const content = await fetchContentById(id);
          if (content) {
            setErrorInfo({
              id: content.id,
              title: content.title,
              type: content.type
            });
            setPotentialTitle(content.title);
          }
        } catch (err) {
          // Extract potential title from URL or ID
          const pathSegments = window.location.pathname.split('/');
          const lastSegment = pathSegments[pathSegments.length - 1];
          
          // Replace hyphens and underscores with spaces
          const extractedTitle = lastSegment
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            // Remove UUIDs
            .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '')
            .trim();
            
          if (extractedTitle && extractedTitle.length > 2) {
            setPotentialTitle(extractedTitle);
          }
        }
      }
    };
    
    loadErrorInfo();
  }, [id, error]);

  const handleRefresh = () => {
    if (onRetry) {
      toast.info("Retrying...");
      onRetry();
    } else {
      toast.info("Refreshing page...");
      window.location.reload();
    }
  };
  
  const handleBrowseSeries = () => {
    navigate('/series');
    toast.info('Browsing all series');
  };
  
  const handleImportSeries = async () => {
    if (!potentialTitle) {
      toast.error("No title available to import");
      return;
    }
    
    setIsImporting(true);
    try {
      const contentType = errorInfo && isValidContentType(errorInfo.type) ? errorInfo.type : 'series';
      await importFromTmdbByTitle(potentialTitle, contentType);
      toast.success(`Successfully imported "${potentialTitle}"`);
      navigate(`/search?q=${encodeURIComponent(potentialTitle)}`);
    } catch (error) {
      console.error("Error importing content:", error);
      toast.error("Failed to import content");
    } finally {
      setIsImporting(false);
    }
  };

  const isTmdbId = id?.startsWith('tmdb-tv-') || !!tmdbId;
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg border border-border">
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
              <AlertTriangle className="h-10 w-10 text-orange-500" />
            </div>
            
            <h1 className="text-2xl font-bold mb-4">
              {isWrongType ? "Invalid Content Type" : (isTmdbId ? "Series Not In Database" : "Series Not Found")}
            </h1>
            
            <p className="mb-4 text-muted-foreground">
              {isWrongType 
                ? "This content is not a series. Would you like to go to the movie page?" 
                : (isTmdbId 
                    ? "This series exists in TMDB but hasn't been imported to your database yet." 
                    : message)
              }
            </p>
            
            {error && !isTmdbId && 
              <div className="bg-muted p-3 rounded-md mb-6 text-left w-full overflow-auto">
                <p className="text-xs text-muted-foreground break-all">
                  <span className="font-semibold">Error:</span> {
                    typeof error === 'object' 
                      ? error.message || JSON.stringify(error) 
                      : String(error)
                  }
                </p>
              </div>
            }
            
            {isWrongType ? (
              <div className="flex gap-4 w-full">
                <Button 
                  asChild
                  className="flex-1"
                  variant="default"
                >
                  <Link to={`/movies/${id}`}>
                    <Film className="mr-2 h-4 w-4" />
                    Go to Movie
                  </Link>
                </Button>
                
                <Button 
                  asChild
                  className="flex-1"
                  variant="outline"
                >
                  <Link to="/series">
                    <Home className="mr-2 h-4 w-4" />
                    Back to Series
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 w-full">
                {isTmdbId && isAdmin && (
                  <Button 
                    className="w-full"
                    onClick={handleImportSeries}
                    disabled={isImporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isImporting ? "Importing..." : "Import to Database"}
                  </Button>
                )}
                
                <Button 
                  className="w-full"
                  onClick={handleBrowseSeries}
                >
                  <Tv className="mr-2 h-4 w-4" />
                  Browse Series
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full"
                  asChild
                >
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Go to Home
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SeriesError;
