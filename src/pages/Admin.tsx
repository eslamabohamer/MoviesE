
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Play, Video, TrendingUp, Clock, Activity, Film, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ContentDialog, { ContentFormData } from "@/components/admin/ContentDialog";
import { fetchContent, deleteContent, fetchMostViewedContent, fetchRecentContent } from "@/services/adminService";
import { Content } from "@/types/content";
import Navbar from "@/components/layout/Navbar";
import OmdbImport from "@/components/admin/OmdbImport";
import VideoSourcesManager from "@/components/admin/VideoSourcesManager";
import { toast } from "sonner";
import { getGenreName } from "@/types/content";
import UserManagement from "@/components/admin/UserManagement";

const Admin = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isVideoSourcesOpen, setIsVideoSourcesOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState<Content | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [adminSection, setAdminSection] = useState<'content' | 'users'>('content');

  const queryClient = useQueryClient();

  const {
    data: contentList = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-content"],
    queryFn: fetchContent,
  });
  
  const {
    data: mostViewedContent = [],
    isLoading: isMostViewedLoading,
  } = useQuery({
    queryKey: ["most-viewed-content"],
    queryFn: () => fetchMostViewedContent(10),
    enabled: activeTab === "popular",
  });
  
  const {
    data: recentContent = [],
    isLoading: isRecentLoading,
  } = useQuery({
    queryKey: ["recent-content"],
    queryFn: () => fetchRecentContent(10),
    enabled: activeTab === "recent",
  });

  const deleteContentMutation = useMutation({
    mutationFn: (id: string) => deleteContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      queryClient.invalidateQueries({ queryKey: ["most-viewed-content"] });
      queryClient.invalidateQueries({ queryKey: ["recent-content"] });
      toast.success("Content deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete content: ${error.message}`);
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    queryClient.invalidateQueries({ queryKey: ["most-viewed-content"] });
    queryClient.invalidateQueries({ queryKey: ["recent-content"] });
    setIsRefreshing(false);
  };

  const handleEdit = (content: Content) => {
    setCurrentContent(content);
    setIsOpen(true);
  };

  const handleManageVideoSources = (content: Content) => {
    if (content.type !== 'movie') {
      toast.error("Video sources can only be added to movies");
      return;
    }
    setCurrentContent(content);
    setIsVideoSourcesOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this content?")) {
      deleteContentMutation.mutate(id);
    }
  };

  const handleAdd = () => {
    setCurrentContent(null);
    setIsOpen(true);
  };

  const formatContentData = (content: Content): ContentFormData => {
    let genresString = "";
    if (Array.isArray(content.genres)) {
      genresString = content.genres.join(", ");
    } else if (typeof content.genres === "string") {
      genresString = content.genres;
    }

    const formattedContent: ContentFormData = {
      id: content.id,
      title: content.title,
      description: content.description,
      thumbnailUrl: content.thumbnailUrl,
      backdropUrl: content.backdropUrl,
      type: content.type,
      releaseYear: content.releaseYear,
      rating: content.rating,
      isFeatured: content.isFeatured,
      genres: genresString,
      cast: Array.isArray(content.cast) 
        ? content.cast.map((c) => `${c.name}:${c.role}`).join(", ")
        : "",
    };

    if (content.type === "movie" && "duration" in content) {
      formattedContent.duration = content.duration;
    } else if (content.type === "series" && "seasons" in content) {
      formattedContent.seasons = content.seasons;
    }

    return formattedContent;
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["most-viewed-content"] });
      queryClient.invalidateQueries({ queryKey: ["recent-content"] });
    }
  };

  const handleImportDialogClose = () => {
    setIsImportOpen(false);
    refetch();
    queryClient.invalidateQueries({ queryKey: ["most-viewed-content"] });
    queryClient.invalidateQueries({ queryKey: ["recent-content"] });
  };

  const handleVideoSourcesDialogClose = () => {
    setIsVideoSourcesOpen(false);
    refetch();
  };
  
  const displayContent = 
    activeTab === "popular" ? mostViewedContent :
    activeTab === "recent" ? recentContent :
    contentList;
  
  const isTabLoading = 
    activeTab === "popular" ? isMostViewedLoading :
    activeTab === "recent" ? isRecentLoading :
    isLoading;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="container mx-auto pt-24 pb-12 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <div className="flex gap-4">
            <Button 
              variant={adminSection === 'content' ? 'default' : 'outline'}
              onClick={() => setAdminSection('content')}
            >
              <Film className="mr-2 h-4 w-4" />
              Content Management
            </Button>
            <Button
              variant={adminSection === 'users' ? 'default' : 'outline'}
              onClick={() => setAdminSection('users')}
            >
              <Users className="mr-2 h-4 w-4" />
              User Management
            </Button>
          </div>
        </div>
        
        {adminSection === 'content' && (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold">Content Management</h2>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
                <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Import from TMDB</Button>
                  </DialogTrigger>
                  {isImportOpen && (
                    <DialogContent className="sm:max-w-[800px]">
                      <OmdbImport onClose={handleImportDialogClose} />
                    </DialogContent>
                  )}
                </Dialog>
                <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
                  <DialogTrigger asChild>
                    <Button onClick={handleAdd}>
                      <Plus className="mr-2 h-4 w-4" /> Add Content
                    </Button>
                  </DialogTrigger>
                  <ContentDialog
                    isOpen={isOpen}
                    onOpenChange={handleDialogOpenChange}
                    initialContent={currentContent ? formatContentData(currentContent) : undefined}
                    onSuccess={handleRefresh}
                  />
                </Dialog>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Content
                  </CardTitle>
                  <Film className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contentList.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {contentList.filter(c => c.type === 'movie').length} movies, {contentList.filter(c => c.type === 'series').length} series
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Views
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {contentList.reduce((sum, content) => sum + (content.visit_count || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all content
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Featured Content
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {contentList.filter(c => c.is_featured).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Items in featured carousel
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="all">All Content</TabsTrigger>
                  <TabsTrigger value="popular">Most Viewed</TabsTrigger>
                  <TabsTrigger value="recent">Recently Added</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="all" className="mt-0">
                {/* All content tab content */}
              </TabsContent>
              
              <TabsContent value="popular" className="mt-0">
                {/* Most viewed tab content */}
              </TabsContent>
              
              <TabsContent value="recent" className="mt-0">
                {/* Recently added tab content */}
              </TabsContent>
            </Tabs>

            {isTabLoading && (
              <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {isError && (
              <div className="text-center py-8 glass-card rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Error Loading Content</h2>
                <p className="text-muted-foreground mb-4">
                  {error instanceof Error ? error.message : "Unknown error occurred"}
                </p>
                <Button onClick={handleRefresh}>Try Again</Button>
              </div>
            )}

            {!isTabLoading && !isError && displayContent && displayContent.length === 0 && (
              <div className="text-center py-8 glass-card rounded-lg">
                <h2 className="text-xl font-semibold mb-2">No Content Available</h2>
                <p className="text-muted-foreground mb-4">
                  {activeTab === "all" ? "Start by adding your first movie or series!" :
                  activeTab === "popular" ? "No viewed content yet." :
                  "No recently added content."}
                </p>
                {activeTab === "all" && (
                  <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
                    <DialogTrigger asChild>
                      <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" /> Add Content
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            )}

            {!isTabLoading && !isError && displayContent && displayContent.length > 0 && (
              <div className="overflow-x-auto relative shadow-md rounded-lg">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Genres</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayContent && displayContent.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell className="font-medium">{content.title}</TableCell>
                        <TableCell>{content.type}</TableCell>
                        <TableCell>{content.releaseYear}</TableCell>
                        <TableCell>
                          {Array.isArray(content.genres) 
                            ? content.genres.map((genre) => getGenreName(genre)).join(", ")
                            : typeof content.genres === "string" 
                              ? content.genres 
                              : ""}
                        </TableCell>
                        <TableCell>
                          {content.is_featured ? "✓" : ""}
                        </TableCell>
                        <TableCell>{content.visit_count || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(content)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {content.type === 'movie' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleManageVideoSources(content)}
                                title="Manage Video Sources"
                              >
                                <Video className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(content.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Link
                              to={
                                content.type === "movie"
                                  ? `/movies/${content.id}`
                                  : `/series/${content.id}`
                              }
                            >
                              <Button variant="ghost" size="icon">
                                <Play className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}

        {adminSection === 'users' && (
          <UserManagement />
        )}
      </div>

      <Dialog open={isVideoSourcesOpen} onOpenChange={setIsVideoSourcesOpen}>
        <DialogContent className="sm:max-w-[800px]">
          {currentContent && (
            <VideoSourcesManager 
              contentId={currentContent.id} 
              onClose={handleVideoSourcesDialogClose} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
