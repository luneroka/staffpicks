import { useState, useCallback } from 'react';

export interface ImageUploadOptions {
  /**
   * Cloudinary folder to upload to
   * @example 'book-covers', 'user-avatars', 'company-logos', 'list-covers'
   */
  folder: string;

  /**
   * Maximum file size in bytes
   * @default 5242880 (5MB)
   */
  maxSize?: number;

  /**
   * Success message to display after upload
   */
  successMessage?: string;

  /**
   * Error message for invalid file type
   * @default 'Veuillez sélectionner une image valide'
   */
  invalidTypeMessage?: string;

  /**
   * Error message for file too large
   * @default 'L'image est trop grande (max 5MB)'
   */
  fileTooLargeMessage?: string;

  /**
   * Callback when upload succeeds
   */
  onSuccess?: (url: string) => void;

  /**
   * Callback when upload fails
   */
  onError?: (error: string) => void;
}

export interface ImageUploadResult {
  /**
   * Function to handle file input change
   */
  handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;

  /**
   * Whether an upload is currently in progress
   */
  isUploading: boolean;

  /**
   * The currently selected file (before upload completes)
   */
  selectedFile: File | null;

  /**
   * The uploaded image URL (after successful upload)
   */
  uploadedUrl: string | null;

  /**
   * Clear the selected file and uploaded URL
   */
  clearUpload: () => void;

  /**
   * Manually set the uploaded URL (useful for initializing with existing values)
   */
  setUploadedUrl: (url: string | null) => void;
}

/**
 * Custom hook for handling image uploads to Cloudinary
 * Provides consistent file validation, error handling, and loading states
 *
 * @example
 * ```tsx
 * const { handleUpload, isUploading, uploadedUrl } = useImageUpload({
 *   folder: 'book-covers',
 *   successMessage: 'Image uploadée avec succès!',
 *   onSuccess: (url) => setBookData(prev => ({ ...prev, coverImage: url })),
 *   onError: (error) => setError(error),
 * });
 *
 * return (
 *   <input
 *     type="file"
 *     accept="image/*"
 *     onChange={handleUpload}
 *     disabled={isUploading}
 *   />
 * );
 * ```
 */
export function useImageUpload(options: ImageUploadOptions): ImageUploadResult {
  const {
    folder,
    maxSize = 5 * 1024 * 1024, // 5MB default
    successMessage,
    invalidTypeMessage = 'Veuillez sélectionner une image valide',
    fileTooLargeMessage = "L'image est trop grande (max 5MB)",
    onSuccess,
    onError,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (!file) {
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        if (onError) {
          onError(invalidTypeMessage);
        }
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        if (onError) {
          onError(fileTooLargeMessage);
        }
        return;
      }

      setSelectedFile(file);
      setIsUploading(true);

      // Clear previous error if onError is provided
      if (onError) {
        onError('');
      }

      try {
        // Upload to Cloudinary via API
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload image');
        }

        // Set the uploaded URL
        setUploadedUrl(data.url);

        // Call success callback
        if (onSuccess) {
          onSuccess(data.url);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erreur lors de l'upload de l'image";

        if (onError) {
          onError(errorMessage);
        }

        setSelectedFile(null);
      } finally {
        setIsUploading(false);
      }
    },
    [
      folder,
      maxSize,
      invalidTypeMessage,
      fileTooLargeMessage,
      onSuccess,
      onError,
    ]
  );

  const clearUpload = useCallback(() => {
    setSelectedFile(null);
    setUploadedUrl(null);
  }, []);

  return {
    handleUpload,
    isUploading,
    selectedFile,
    uploadedUrl,
    clearUpload,
    setUploadedUrl,
  };
}
