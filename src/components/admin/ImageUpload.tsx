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

// A 1px dashed hairline, not a 2px slab: the drop target reads as a cut-out in
// the ink ground. Dragging over it takes the gold edge — the thread again — and
// lifts the well; there is no gold fill, which stays reserved for the one
// primary action on the surrounding page.
const DROPZONE =
  'relative cursor-pointer rounded-control border border-dashed p-6 text-center transition-colors duration-fast ease-cloth';
const DROPZONE_IDLE = 'border-ink-faint bg-transparent hover:border-paper-muted';
const DROPZONE_ACTIVE = 'border-zari-500 bg-ink-700';

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
          className={`${DROPZONE} ${dragActive ? DROPZONE_ACTIVE : DROPZONE_IDLE} ${
            isUploading ? 'pointer-events-none opacity-50' : ''
          }`}
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
              <div className="mx-auto h-8 w-8 text-zari-500">
                <svg className="animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div>
                <p className="text-body-sm text-paper">Uploading image...</p>
                {uploadProgress > 0 && (
                  <div className="mt-2 h-1 w-full bg-ink-700">
                    <div 
                      className="h-1 bg-zari-500 transition-[width] duration-fast ease-cloth"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelUpload();
                  }}
                  className="mt-3 rounded-control border border-ink-faint px-2 py-1 text-caption font-medium text-paper transition-colors duration-fast ease-cloth hover:border-madder hover:bg-madder active:translate-y-px"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto h-8 w-8 text-paper-muted">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-body-sm font-medium text-paper">
                  {dragActive ? 'Drop images here' : 'Click to upload or drag and drop'}
                </p>
                <p className="mt-1 text-caption text-paper-muted">
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {currentImages.map((imageUrl, index) => (
            <div key={index} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`Upload ${index + 1}`}
                className="h-24 w-full border border-ink-700 bg-paper-sunk object-cover"
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
        <div className="space-y-1 text-caption text-paper-muted">
          <p>• You can upload up to {maxImages} images</p>
          <p>• Images will be automatically compressed if larger than 2MB</p>
          <p>• Recommended size: 1920px width or less</p>
        </div>
      )}
    </div>
  );
}
