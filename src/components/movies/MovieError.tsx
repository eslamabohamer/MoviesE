
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchContentById, importMovieOrSeriesFromTmdb } from "@/services/contentService";
import { Content } from "@/types/content";
import { Play, Film, RefreshCw } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { isValidContentType } from '@/utils/adapters';

interface MovieErrorProps {
  error?: any;
  isWrongType?: boolean;
  id?: string;
  onRetry?: () => void;
  tmdbId?: string;
}

interface ErrorInfo {
  id: string;
  title: string;
  type: string;
}

const MovieError: React.FC<MovieErrorProps> = ({ error, isWrongType = false, id, onRetry, tmdbId }) => {
  const params = useParams<{ id: string }>();
  const contentId = id || params.id;
  const navigate = useNavigate();
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [potentialTitle, setPotentialTitle] = useState<string>("");
  
  useEffect(() => {
    const loadErrorInfo = async () => {
      setIsLoading(true);
      if (contentId) {
        try {
          const content = await fetchContentById(contentId);
          if (content) {
            setErrorInfo({
              id: content.id,
              title: content.title,
              type: content.type,
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
      setIsLoading(false);
    };
    
    loadErrorInfo();
  }, [contentId]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }
  
  const handleImportSimilar = async () => {
    if (!potentialTitle) {
      toast.error("No title available to import");
      return;
    }
    
    setIsImporting(true);
    try {
      // Make sure to convert type to valid content type
      const contentType = errorInfo && isValidContentType(errorInfo.type) ? errorInfo.type : 'movie';
      await importMovieOrSeriesFromTmdb(potentialTitle, contentType);
      toast.success(`Successfully imported "${potentialTitle}"`);
      navigate(`/search?q=${encodeURIComponent(potentialTitle)}`);
    } catch (error) {
      console.error("Error importing content:", error);
      toast.error("Failed to import content");
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="container mx-auto pt-24 pb-12 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="flex flex-col items-start space-y-1">
            <CardTitle className="text-2xl font-bold">
              Content Not Found
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              We couldn't find "{errorInfo.title}" in our database.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-muted-foreground">
              But don't worry, you can try importing it from TMDB!
            </p>
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                disabled={isImporting}
                onClick={handleImportSimilar}
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Film className="mr-2 h-4 w-4" />
                    Import from TMDB
                  </>
                )}
              </Button>
              <Link to="/" className="ml-auto">
                <Button>
                  <Play className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MovieError;
