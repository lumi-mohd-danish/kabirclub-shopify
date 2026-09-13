'use client';

import { compressImage, uploadImageFile, validateImageFile } from '@/lib/image-upload';
import { useCallback, useRef, useState } from 'react';

import { errorMessage } from './admin-ui';

interface ImageUploadProps {
  // eslint-disable-next-line no-unused-vars
  onImageUploaded: (imageUrl: string) => void;
  // eslint-disable-next-line no-unused-vars
  onError?: (errorMessage: string) => void;
  className?: string;
  maxImages?: number;
  /**
   * What the form already holds. Used for the remaining-slots maths and the
   * counter only — the THUMBNAILS are the form's job, because the form is what
   * can remove one. This component used to render its own preview grid as
   * well, so every product page showed each image twice: once here without a
   * remove control, and again below it with one.
   */
  currentImages?: string[];
}

// A 1px dashed hairline, not a 2px slab: the drop target reads as a cut-out in
// the ink ground. Dragging over it takes the gold edge — the thread again — and
// lifts the well; there is no gold fill, which stays reserved for the one
// primary action on the surrounding page.
//
// The padding lives on the inner control, not on this well, so the whole area
// inside the hairline belongs to the real <button> and no strip of it is a
// dead click zone.
const DROPZONE =
  'relative rounded-control border border-dashed transition-colors duration-fast ease-cloth';
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

  const handleFiles = useCallback(
    async (files: FileList) => {
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
          const processedFile =
            file.size > 2 * 1024 * 1024 ? await compressImage(file, 1920, 0.8) : file;

          // Upload image
          const result = await uploadImageFile(processedFile, controllerRef.current);

          onImageUploadedProp(result.url);
          setUploadProgress(100);
        } catch (error) {
          // A cancelled upload is a choice, not a failure worth reporting.
          if (!(error instanceof Error) || error.name !== 'AbortError') {
            onErrorProp?.(errorMessage(error, 'Failed to upload image'));
          }
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
          controllerRef.current = null;
        }
      }
    },
    [currentImages.length, maxImages, onImageUploadedProp, onErrorProp]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      if (isUploading) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles, isUploading]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

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
            isUploading ? 'opacity-50' : ''
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* The input stays out of the tab order on purpose: the <button>
              below is the control, so there is exactly one stop here and it is
              the one that is visible and can take the focus ring. */}
          <input
            ref={fileInputRef}
            type="file"
            multiple={maxImages > 1}
            accept="image/*"
            onChange={handleFileSelect}
            tabIndex={-1}
            className="hidden"
          />

          {isUploading ? (
            <div className="space-y-4 p-6 text-center">
              <div className="mx-auto h-8 w-8 text-zari-500">
                <svg className="animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-body-sm text-paper">Uploading image…</p>
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
                  onClick={cancelUpload}
                  className="mt-3 rounded-control border border-ink-faint px-2 py-1 text-caption font-medium text-paper transition-colors duration-fast ease-cloth hover:border-madder hover:bg-madder active:translate-y-px"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // The one real control in this component. It was a <div onClick>
            // with the file input hidden behind it, which left the whole
            // uploader unreachable by keyboard.
            <button
              type="button"
              onClick={openFileDialog}
              className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-control p-6 text-center"
            >
              <span className="block h-8 w-8 text-paper-muted">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </span>
              <span className="block">
                <span className="block text-body-sm font-medium text-paper">
                  {dragActive ? 'Drop images here' : 'Click to upload or drag and drop'}
                </span>
                <span className="mt-1 block text-caption text-paper-muted">
                  PNG, JPG, GIF, WebP up to 32MB
                  {maxImages > 1 && ` (${currentImages.length}/${maxImages} uploaded)`}
                </span>
              </span>
            </button>
          )}
        </div>
      )}

      {/* Upload Instructions */}
      {maxImages > 1 && (
        <p className="text-caption text-paper-muted">
          Up to {maxImages} images. Anything over 2MB is compressed to 1920px wide before it is
          sent.
        </p>
      )}
    </div>
  );
}
