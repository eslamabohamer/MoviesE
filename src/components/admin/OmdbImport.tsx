
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchIcon, FilePlusIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { importMovieOrSeriesFromTmdb, importMultipleFromTmdb } from '@/services/contentService';

interface OmdbImportProps {
  onClose?: () => void;
}

const OmdbImport: React.FC<OmdbImportProps> = ({ onClose }) => {
  const [singleTitle, setSingleTitle] = useState('');
  const [singleType, setSingleType] = useState<'movie' | 'series'>('movie');
  const [isImporting, setIsImporting] = useState(false);
  
  const [bulkTitles, setBulkTitles] = useState('');
  const [bulkType, setBulkType] = useState<'movie' | 'series'>('movie');
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  
  const queryClient = useQueryClient();
  
  const handleSingleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleTitle.trim()) {
      toast.error('Please enter a title to import');
      return;
    }
    
    setIsImporting(true);
    try {
      const result = await importMovieOrSeriesFromTmdb(singleTitle, singleType);
      if (result.success) {
        toast.success(`Successfully imported ${singleTitle}`);
        setSingleTitle('');
        
        // Refresh the content lists
        queryClient.invalidateQueries({ queryKey: ['movies'] });
        queryClient.invalidateQueries({ queryKey: ['series'] });
        queryClient.invalidateQueries({ queryKey: ['admin-content'] });
        
        if (onClose) {
          onClose();
        }
      } else {
        if (result.error?.includes('401')) {
          toast.error(`API authentication error. Please check your TMDB API key.`);
        } else {
          toast.error(`Failed to import ${singleTitle}: ${result.error || 'Unknown error'}`);
        }
      }
    } catch (error: any) {
      console.error('Import error:', error);
      if (error.message?.includes('401')) {
        toast.error('TMDB API authentication error. Please check your API key.');
      } else {
        toast.error(error.message || 'An error occurred during import');
      }
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTitles.trim()) {
      toast.error('Please enter titles to import');
      return;
    }
    
    const titles = bulkTitles
      .split('\n')
      .map(title => title.trim())
      .filter(title => title !== '');
    
    if (titles.length === 0) {
      toast.error('No valid titles found');
      return;
    }
    
    setIsBulkImporting(true);
    try {
      const result = await importMultipleFromTmdb(titles, bulkType);
      
      if (result.success > 0) {
        toast.success(`Successfully imported ${result.success} out of ${result.total} titles`);
      }
      
      if (result.failed.length > 0) {
        if (result.failed.some(err => err.includes('401'))) {
          toast.error(`TMDB API authentication error. Please check your API key.`, {
            description: "Unable to connect to TMDB API with the current credentials."
          });
        } else {
          toast(`${result.failed.length} titles failed to import`, {
            description: result.failed.slice(0, 3).join('\n') + (result.failed.length > 3 ? `\n...and ${result.failed.length - 3} more` : ''),
            icon: <AlertCircle className="h-5 w-5 text-amber-500" />
          });
        }
      }
      
      // Clear form on success
      if (result.success === result.total) {
        setBulkTitles('');
      }
      
      // Refresh the content lists
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['series'] });
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      
      if (onClose && result.success > 0) {
        onClose();
      }
    } catch (error: any) {
      console.error('Bulk import error:', error);
      if (error.message?.includes('401')) {
        toast.error(`TMDB API authentication error. Please check your API key.`);
      } else {
        toast.error(`Import failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsBulkImporting(false);
    }
  };
  
  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <FilePlusIcon className="h-5 w-5" /> Import from TMDB
          </CardTitle>
          <CardDescription>
            Add content to your database by importing from The Movie Database (TMDB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Import</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single">
              <form onSubmit={handleSingleImport} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <Input
                      placeholder="Enter movie or series title (e.g., 'Inception')"
                      value={singleTitle}
                      onChange={(e) => setSingleTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Select
                      value={singleType}
                      onValueChange={(value) => setSingleType(value as 'movie' | 'series')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="movie">Movie</SelectItem>
                        <SelectItem value="series">Series</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isImporting || !singleTitle.trim()}
                  className="w-full"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <SearchIcon className="mr-2 h-4 w-4" />
                      Import from TMDB
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="bulk">
              <form onSubmit={handleBulkImport} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Enter one title per line
                  </label>
                  <Textarea
                    placeholder="Inception&#10;The Dark Knight&#10;Interstellar"
                    value={bulkTitles}
                    onChange={(e) => setBulkTitles(e.target.value)}
                    rows={6}
                    required
                  />
                </div>
                
                <div className="w-full md:w-1/3">
                  <Select
                    value={bulkType}
                    onValueChange={(value) => setBulkType(value as 'movie' | 'series')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movie">Movies</SelectItem>
                      <SelectItem value="series">Series</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isBulkImporting || !bulkTitles.trim()}
                  className="w-full"
                >
                  {isBulkImporting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Importing {bulkTitles.split('\n').filter(t => t.trim()).length} titles...
                    </>
                  ) : (
                    <>
                      <FilePlusIcon className="mr-2 h-4 w-4" />
                      Bulk Import
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default OmdbImport;
