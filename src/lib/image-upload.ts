// Image upload helpers.
//
// The upload itself happens server-side in `src/app/api/upload/route.ts`, which
// holds the ImgBB API key in `IMGBB_API_KEY` and re-checks that the caller is an
// admin. Nothing in this module carries a credential, so it is safe to import
// from a 'use client' component.

const UPLOAD_ENDPOINT = '/api/upload';

/** ImgBB's own ceiling is 32MB; the server enforces the same limit. */
const MAX_UPLOAD_BYTES = 32 * 1024 * 1024;

const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

export interface ImageUploadResult {
  url: string;
  deleteUrl?: string;
  filename: string;
  size: number;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

async function postToUploadApi(
  body: FormData,
  signal?: AbortSignal
): Promise<ImageUploadResult> {
  const response = await fetch(UPLOAD_ENDPOINT, {
    method: 'POST',
    body,
    credentials: 'same-origin',
    ...(signal ? { signal } : {})
  });

  const payload = (await response.json().catch(() => null)) as
    | Partial<ImageUploadResult> & { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || `Image upload failed (HTTP ${response.status}).`);
  }

  if (!payload || typeof payload.url !== 'string' || !payload.url) {
    throw new Error('Image upload failed: the server did not return an image URL.');
  }

  return {
    url: payload.url,
    ...(payload.deleteUrl ? { deleteUrl: payload.deleteUrl } : {}),
    filename: payload.filename || 'upload',
    size: typeof payload.size === 'number' ? payload.size : 0
  };
}

export const uploadImageFile = async (
  file: File,
  controller?: AbortController
): Promise<ImageUploadResult> => {
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid image file');
  }

  const formData = new FormData();
  formData.append('file', file, file.name);

  try {
    return await postToUploadApi(formData, controller?.signal);
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to upload image: ${message}`);
  }
};

// Helper function to validate image file
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'File must be an image' };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { isValid: false, error: 'Image size must be less than 32MB' };
  }

  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return { isValid: false, error: 'Supported formats: JPEG, PNG, GIF, WebP' };
  }

  return { isValid: true };
};

// Helper function to compress image if needed
export const compressImage = (file: File, maxWidth = 1920, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    const finish = (result: File) => {
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            finish(
              new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
            );
          } else {
            finish(file); // Return original if compression fails
          }
        },
        file.type,
        quality
      );
    };

    // If the browser cannot decode the image, fall back to the original file
    // rather than leaving the promise pending forever.
    img.onerror = () => finish(file);

    img.src = objectUrl;
  });
};
