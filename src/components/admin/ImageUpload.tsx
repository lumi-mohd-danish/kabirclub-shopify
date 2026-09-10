'use client';

import { compressImage, uploadImageFile, validateImageFile } from '@/lib/image-upload';
import { useCallback, useRef, useState } from 'react';

interface ImageUploadProps {
  // eslint-disable-next-line no-unused-vars
  onImageUploaded: (imageUrl: string) => void;
  // eslint-disable-next-line no-unused-vars
  onError?: (errorMessage: string) => void;
  className?: string;
  maxImages?: number;
  currentImages?: string[];
}

export default function ImageUpload({ 
  onImageUploaded: onImageUploadedProp, 
  onError: onErrorProp, 
  className = '', 
  maxImages = 1,
  currentImages = []
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    if (currentImages.length >= maxImages) {
      onErrorProp?.(`Maximum ${maxImages} images allowed`);
      return;
    }

    const remainingSlots = maxImages - currentImages.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToUpload) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        onErrorProp?.(validation.error || 'Invalid image file');
        continue;
      }

      try {
        setIsUploading(true);
        setUploadProgress(0);
        
        // Create abort controller for this upload
        controllerRef.current = new AbortController();

        // Compress image if it's too large
        const processedFile = file.size > 2 * 1024 * 1024 
          ? await compressImage(file, 1920, 0.8)
          : file;

        // Upload image
        const result = await uploadImageFile(processedFile, controllerRef.current);
        
        onImageUploadedProp(result.url);
        setUploadProgress(100);
        
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          onErrorProp?.(error.message || 'Failed to upload image');
        }
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        controllerRef.current = null;
      }
    }
  }, [currentImages.length, maxImages, onImageUploadedProp, onErrorProp]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const cancelUpload = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const canUploadMore = currentImages.length < maxImages;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {canUploadMore && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={maxImages > 1}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {isUploading ? (
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto text-blue-500">
                <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div>
                <p className="text-white text-sm">Uploading image...</p>
                {uploadProgress > 0 && (
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelUpload();
                  }}
                  className="mt-2 text-red-400 hover:text-red-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {dragActive ? 'Drop images here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  PNG, JPG, GIF, WebP up to 32MB
                  {maxImages > 1 && ` (${currentImages.length}/${maxImages} uploaded)`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current Images Preview */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentImages.map((imageUrl, index) => (
            <div key={index} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`Upload ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-600"
                onError={(e) => {
                  e.currentTarget.src = '/images/placeholder.png';
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Upload Instructions */}
      {maxImages > 1 && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>• You can upload up to {maxImages} images</p>
          <p>• Images will be automatically compressed if larger than 2MB</p>
          <p>• Recommended size: 1920px width or less</p>
        </div>
      )}
    </div>
  );
}
