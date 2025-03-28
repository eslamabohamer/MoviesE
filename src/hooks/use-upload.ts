
import { useState } from 'react';
import { uploadMediaFile } from '@/services/adminService';

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const uploadFile = async (file: File, path: string = 'images'): Promise<string | null> => {
    if (!file) return null;
    
    try {
      setIsUploading(true);
      setProgress(10);
      
      // Simple progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.floor(Math.random() * 10);
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
      
      const url = await uploadMediaFile(file, path);
      
      clearInterval(progressInterval);
      setProgress(100);
      setIsUploading(false);
      
      return url;
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsUploading(false);
      return null;
    }
  };
  
  return {
    uploadFile,
    isUploading,
    progress
  };
}
