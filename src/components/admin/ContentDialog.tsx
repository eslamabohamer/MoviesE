
import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContent,
  updateContent,
  fetchGenres,
  fetchPeople,
  createPerson,
  updateContentWithVideoSources
} from "@/services/adminService";
import { Content as AppContent, Movie as AppMovie, Series as AppSeries, Cast, VideoServer, GenreInput } from "@/types/content";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { useUpload } from "@/hooks/use-upload";

export interface ContentFormData {
  id?: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  backdropUrl: string;
  type: "movie" | "series";
  releaseYear: number;
  rating: number;
  isFeatured: boolean;
  genres: string;
  duration?: number;
  seasons?: number;
  cast: string;
}

interface ContentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialContent?: ContentFormData;
  onSuccess?: () => void;
}

const ContentDialog: React.FC<ContentDialogProps> = ({ isOpen, onOpenChange, initialContent, onSuccess }) => {
  const [formData, setFormData] = useState<ContentFormData>({
    title: "",
    description: "",
    thumbnailUrl: "",
    backdropUrl: "",
    type: "movie",
    releaseYear: new Date().getFullYear(),
    rating: 0,
    isFeatured: false,
    genres: "",
    cast: "",
  });
  const [castMembers, setCastMembers] = useState<Cast[]>([]);
  const [newCastMemberName, setNewCastMemberName] = useState("");
  const [newCastMemberRole, setNewCastMemberRole] = useState("");
  const [newCastMemberPhoto, setNewCastMemberPhoto] = useState<File | null>(null);
  const [availablePeople, setAvailablePeople] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [videoLabels, setVideoLabels] = useState<string[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoLabel, setNewVideoLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);

  const queryClient = useQueryClient();
  const { uploadFile, isUploading: isThumbnailUploading, progress: thumbnailProgress } = useUpload();
  const { uploadFile: uploadBackdrop, isUploading: isBackdropUploading, progress: backdropProgress } = useUpload();

  const { data: genres = [], isLoading: isLoadingGenres } = useQuery({
    queryKey: ["genres"],
    queryFn: fetchGenres,
  });

  const { data: people = [], isLoading: isLoadingPeople } = useQuery({
    queryKey: ["people"],
    queryFn: fetchPeople,
  });

  useEffect(() => {
    if (people) {
      setAvailablePeople(people);
    }
  }, [people]);

  useEffect(() => {
    if (initialContent) {
      setFormData({
        id: initialContent.id,
        title: initialContent.title,
        description: initialContent.description,
        thumbnailUrl: initialContent.thumbnailUrl,
        backdropUrl: initialContent.backdropUrl,
        type: initialContent.type,
        releaseYear: initialContent.releaseYear,
        rating: initialContent.rating,
        isFeatured: initialContent.isFeatured,
        genres: initialContent.genres,
        cast: initialContent.cast,
        duration: initialContent.duration,
        seasons: initialContent.seasons,
      });

      if (initialContent.cast) {
        const parsedCastMembers = initialContent.cast.split(", ").map((cast) => {
          const [name, role] = cast.split(":");
          return {
            id: uuidv4(),
            name: name.trim(),
            role: role.trim(),
            photo: "",
          };
        });
        setCastMembers(parsedCastMembers);
      }
    } else {
      setFormData({
        title: "",
        description: "",
        thumbnailUrl: "",
        backdropUrl: "",
        type: "movie",
        releaseYear: new Date().getFullYear(),
        rating: 0,
        isFeatured: false,
        genres: "",
        cast: "",
      });
      setCastMembers([]);
    }
  }, [initialContent]);

  const createContentMutation = useMutation({
    mutationFn: (content: AppContent) => createContent(content, formData.genres.split(",").map((genre) => genre.trim())),
    onSuccess: () => {
      toast.success("Content created successfully");
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create content: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: (content: AppContent) => updateContent(content),
    onSuccess: () => {
      toast.success("Content updated successfully");
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update content: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      type: value as "movie" | "series",
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prevData) => ({
      ...prevData,
      isFeatured: checked,
    }));
  };

  const handleAddCastMember = async () => {
    if (!newCastMemberName) {
      toast.error("Cast member name is required");
      return;
    }

    setIsSubmitting(true);

    if (selectedPerson) {
      setCastMembers((prevCastMembers) => [
        ...prevCastMembers,
        {
          id: selectedPerson,
          name: availablePeople.find((p) => p.id === selectedPerson)?.name || newCastMemberName,
          role: newCastMemberRole || "Actor",
          photo: availablePeople.find((p) => p.id === selectedPerson)?.photo_url || "",
        },
      ]);
      setIsSubmitting(false);
    } else if (newCastMemberPhoto) {
      try {
        const photoUrl = await uploadFile(newCastMemberPhoto, 'cast');
        if (photoUrl) {
          const person = await createPerson(newCastMemberName, photoUrl);
          if (person) {
            setCastMembers((prevCastMembers) => [
              ...prevCastMembers,
              {
                id: person.id,
                name: newCastMemberName,
                role: newCastMemberRole || "Actor",
                photo: photoUrl,
              },
            ]);
          } else {
            toast.error("Failed to create person");
          }
        } else {
          toast.error("Failed to upload cast member photo");
        }
      } catch (error) {
        console.error("Error uploading cast member photo:", error);
        toast.error("Failed to upload cast member photo");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const person = await createPerson(newCastMemberName, "");

      if (person) {
        setCastMembers((prevCastMembers) => [
          ...prevCastMembers,
          {
            id: person.id,
            name: newCastMemberName,
            role: newCastMemberRole || "Actor",
            photo: "",
          },
        ]);
      } else {
        toast.error("Failed to create person");
      }
      setIsSubmitting(false);
    }

    setNewCastMemberName("");
    setNewCastMemberRole("");
    setNewCastMemberPhoto(null);
    setSelectedPerson(null);
  };

  const handleRemoveCastMember = (id: string) => {
    setCastMembers((prevCastMembers) => prevCastMembers.filter((member) => member.id !== id));
  };

  const handleAddVideoSource = () => {
    if (!newVideoUrl || !newVideoLabel) {
      toast.error("Video URL and label are required");
      return;
    }

    setVideoUrls((prevUrls) => [...prevUrls, newVideoUrl]);
    setVideoLabels((prevLabels) => [...prevLabels, newVideoLabel]);
    setNewVideoUrl("");
    setNewVideoLabel("");
  };

  const handleRemoveVideoSource = (index: number) => {
    setVideoUrls((prevUrls) => prevUrls.filter((_, i) => i !== index));
    setVideoLabels((prevLabels) => prevLabels.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.thumbnailUrl || !formData.backdropUrl) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    const contentData: Omit<AppContent, 'tags'> = {
      id: formData.id || uuidv4(),
      title: formData.title,
      description: formData.description,
      thumbnailUrl: formData.thumbnailUrl,
      backdropUrl: formData.backdropUrl,
      type: formData.type,
      releaseYear: formData.releaseYear,
      rating: formData.rating,
      isFeatured: formData.isFeatured,
      genres: formData.genres.split(",").map((genre) => genre.trim()) as GenreInput[],
      cast: castMembers,
      visitCount: 0
    };

    if (formData.type === "movie") {
      (contentData as AppMovie).duration = formData.duration || 0;
      (contentData as AppMovie).videoUrl = videoUrls[0] || "";
      
      const videoServers: VideoServer[] = videoUrls.map((url, index) => ({
        name: videoLabels[index] || `Server ${index + 1}`,
        url: url,
      }));
      
      (contentData as AppMovie).videoServers = videoServers;
    } else {
      (contentData as AppSeries).seasons = formData.seasons || 1;
    }

    try {
      if (formData.id) {
        await updateContentMutation.mutateAsync(contentData as AppContent);
      } else {
        await createContentMutation.mutateAsync(contentData as AppContent);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnailFile(file);

    try {
      const url = await uploadFile(file, 'thumbnails');
      if (url) {
        setFormData(prevData => ({ ...prevData, thumbnailUrl: url }));
      } else {
        toast.error('Failed to upload thumbnail');
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error('Failed to upload thumbnail');
    }
  };

  const handleBackdropChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackdropFile(file);

    try {
      const url = await uploadBackdrop(file, 'backdrops');
      if (url) {
        setFormData(prevData => ({ ...prevData, backdropUrl: url }));
      } else {
        toast.error('Failed to upload backdrop');
      }
    } catch (error) {
      console.error('Error uploading backdrop:', error);
      toast.error('Failed to upload backdrop');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formData.id ? "Edit Content" : "Add Content"}</DialogTitle>
          <DialogDescription>
            {formData.id ? "Edit the content details." : "Create new content."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          {/* Title field */}
          <div className="grid grid-cols-6 items-center gap-4">
            <Label htmlFor="title" className="text-right col-span-1">
              Title
            </Label>
            <Input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="col-span-5"
              required
            />
          </div>
          
          {/* Description field */}
          <div className="grid grid-cols-6 items-start gap-4">
            <Label htmlFor="description" className="text-right col-span-1 mt-2.5">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="col-span-5"
              required
            />
          </div>
          
          {/* Thumbnail URL field */}
          <div className="grid grid-cols-6 items-center gap-4">
            <Label htmlFor="thumbnailUrl" className="text-right col-span-1">
              Thumbnail URL
            </Label>
            <div className="col-span-5 flex items-center space-x-2">
              <Input
                type="text"
                id="thumbnailUrl"
                name="thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={handleInputChange}
                className="flex-grow"
                required
              />
              <Input
                type="file"
                id="thumbnailFile"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
              />
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="thumbnailFile" className="cursor-pointer">
                  {isThumbnailUploading ? `Uploading... (${thumbnailProgress}%)` : "Upload"}
                </label>
              </Button>
            </div>
          </div>
          
          {/* Backdrop URL field */}
          <div className="grid grid-cols-6 items-center gap-4">
            <Label htmlFor="backdropUrl" className="text-right col-span-1">
              Backdrop URL
            </Label>
            <div className="col-span-5 flex items-center space-x-2">
              <Input
                type="text"
                id="backdropUrl"
                name="backdropUrl"
                value={formData.backdropUrl}
                onChange={handleInputChange}
                className="flex-grow"
                required
              />
              <Input
                type="file"
                id="backdropFile"
                accept="image/*"
                onChange={handleBackdropChange}
                className="hidden"
              />
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="backdropFile" className="cursor-pointer">
                  {isBackdropUploading ? `Uploading... (${backdropProgress}%)` : "Upload"}
                </label>
              </Button>
            </div>
          </div>
          
          {/* Type field */}
          <div className="grid grid-cols-6 items-center gap-4">
            <Label htmlFor="type" className="text-right col-span-1">
              Type
            </Label>
            <Select onValueChange={handleSelectChange} defaultValue={formData.type}>
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="movie">Movie</SelectItem>
                <SelectItem value="series">Series</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Two columns for Release Year and Rating */}
          <div className="grid grid-cols-6 gap-4">
            <Label htmlFor="releaseYear" className="text-right col-span-1 self-center">
              Release Year
            </Label>
            <Input
              type="number"
              id="releaseYear"
              name="releaseYear"
              value={formData.releaseYear}
              onChange={handleInputChange}
              className="col-span-2"
              required
            />
            
            <Label htmlFor="rating" className="text-right col-span-1 self-center">
              Rating
            </Label>
            <Input
              type="number"
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              className="col-span-2"
              required
            />
          </div>
          
          {/* Featured toggle */}
          <div className="grid grid-cols-6 items-center gap-4">
            <Label htmlFor="isFeatured" className="text-right col-span-1">
              Featured
            </Label>
            <div className="col-span-5 flex items-center">
              <Switch
                id="isFeatured"
                checked={formData.isFeatured}
                onCheckedChange={handleSwitchChange}
              />
            </div>
          </div>
          
          {/* Genres field */}
          <div className="grid grid-cols-6 items-center gap-4">
            <Label htmlFor="genres" className="text-right col-span-1">
              Genres
            </Label>
            <Input
              type="text"
              id="genres"
              name="genres"
              value={formData.genres}
              onChange={handleInputChange}
              className="col-span-5"
              placeholder="Comma-separated genres"
            />
          </div>

          {/* Conditional fields based on content type */}
          {formData.type === "movie" && (
            <>
              <div className="grid grid-cols-6 items-center gap-4">
                <Label htmlFor="duration" className="text-right col-span-1">
                  Duration (min)
                </Label>
                <Input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration || ""}
                  onChange={handleInputChange}
                  className="col-span-2"
                />
              </div>
              
              {/* Video Sources */}
              <div className="grid grid-cols-6 items-start gap-4">
                <Label htmlFor="videoUrl" className="text-right col-span-1 mt-2.5">
                  Video Sources
                </Label>
                <div className="col-span-5">
                  {videoUrls.map((url, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <Input
                        type="text"
                        value={url}
                        readOnly
                        className="flex-grow"
                      />
                      <Input
                        type="text"
                        value={videoLabels[index] || `Server ${index + 1}`}
                        readOnly
                        className="w-32"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveVideoSource(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      placeholder="Video URL"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      className="flex-grow"
                    />
                    <Input
                      type="text"
                      placeholder="Label"
                      value={newVideoLabel}
                      onChange={(e) => setNewVideoLabel(e.target.value)}
                      className="w-32"
                    />
                    <Button variant="outline" size="sm" onClick={handleAddVideoSource}>
                      <Plus className="mr-2 h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {formData.type === "series" && (
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="seasons" className="text-right col-span-1">
                Seasons
              </Label>
              <Input
                type="number"
                id="seasons"
                name="seasons"
                value={formData.seasons || ""}
                onChange={handleInputChange}
                className="col-span-2"
              />
            </div>
          )}

          {/* Cast Members */}
          <div className="grid grid-cols-6 items-start gap-4">
            <Label htmlFor="cast" className="text-right col-span-1 mt-2.5">
              Cast Members
            </Label>
            <div className="col-span-5">
              {castMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-2 mb-2">
                  <Input
                    type="text"
                    value={member.name}
                    readOnly
                    className="flex-grow"
                  />
                  <Input
                    type="text"
                    value={member.role}
                    readOnly
                    className="w-32"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCastMember(member.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="flex items-center space-x-2 mb-2">
                <Input
                  type="text"
                  placeholder="Name"
                  value={newCastMemberName}
                  onChange={(e) => setNewCastMemberName(e.target.value)}
                  className="flex-grow"
                />
                <Input
                  type="text"
                  placeholder="Role"
                  value={newCastMemberRole}
                  onChange={(e) => setNewCastMemberRole(e.target.value)}
                  className="w-32"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  id="castPhoto"
                  accept="image/*"
                  onChange={(e) => setNewCastMemberPhoto(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="castPhoto" className="cursor-pointer">
                    Upload Photo
                  </label>
                </Button>
                <Select onValueChange={setSelectedPerson}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Person" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePeople.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleAddCastMember} disabled={isSubmitting}>
                  <Plus className="mr-2 h-4 w-4" /> Add Cast
                </Button>
              </div>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {formData.id ? "Update Content" : "Create Content"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContentDialog;
