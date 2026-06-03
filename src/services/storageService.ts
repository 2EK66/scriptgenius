import { supabase } from "@/integrations/supabase/client";

export type BucketType = 'comic-images' | 'script-covers';

/**
 * Upload an image to Supabase Storage
 * @param base64Data - Base64 encoded image data (with or without data: prefix)
 * @param bucket - Target bucket ('comic-images' or 'script-covers')
 * @param userId - User ID for folder organization
 * @param fileName - Optional custom filename
 * @returns Public URL of the uploaded image
 */
export const uploadImageToStorage = async (
  base64Data: string,
  bucket: BucketType,
  userId: string,
  fileName?: string
): Promise<string> => {
  try {
    // Remove data:image/xxx;base64, prefix if present
    const base64Clean = base64Data.includes(',') 
      ? base64Data.split(',')[1] 
      : base64Data;
    
    // Detect image type from base64 prefix
    let mimeType = 'image/png';
    let extension = 'png';
    
    if (base64Data.includes('data:image/jpeg') || base64Data.includes('data:image/jpg')) {
      mimeType = 'image/jpeg';
      extension = 'jpg';
    } else if (base64Data.includes('data:image/webp')) {
      mimeType = 'image/webp';
      extension = 'webp';
    }
    
    // Convert base64 to Blob
    const byteCharacters = atob(base64Clean);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    // Generate unique filename
    const uniqueFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    const filePath = `${userId}/${uniqueFileName}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType: mimeType,
        upsert: false
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Échec de l'upload: ${error.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    console.log('Image uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Storage
 * @param images - Array of base64 encoded images
 * @param bucket - Target bucket
 * @param userId - User ID
 * @returns Array of public URLs
 */
export const uploadMultipleImages = async (
  images: string[],
  bucket: BucketType,
  userId: string
): Promise<string[]> => {
  const uploadPromises = images.map((img, index) => 
    uploadImageToStorage(img, bucket, userId, `panel-${index}-${Date.now()}.png`)
  );
  
  return Promise.all(uploadPromises);
};

/**
 * Delete an image from Storage
 * @param imageUrl - Public URL of the image
 * @param bucket - Bucket name
 */
export const deleteImageFromStorage = async (
  imageUrl: string,
  bucket: BucketType
): Promise<void> => {
  try {
    // Extract path from URL
    const urlParts = imageUrl.split(`/${bucket}/`);
    if (urlParts.length < 2) {
      console.warn('Invalid image URL format:', imageUrl);
      return;
    }
    
    const filePath = urlParts[1];
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
    
    console.log('Image deleted successfully:', filePath);
  } catch (error) {
    console.error('Error deleting image from storage:', error);
    throw error;
  }
};

/**
 * Check if a string is a base64 image
 */
export const isBase64Image = (str: string): boolean => {
  return str.startsWith('data:image/') || 
         (str.length > 100 && /^[A-Za-z0-9+/=]+$/.test(str.substring(0, 100)));
};

/**
 * Check if a string is a storage URL
 */
export const isStorageUrl = (str: string): boolean => {
  return str.includes('supabase.co/storage/v1/object/public/');
};

/**
 * Get optimized image URL with transformations
 * @param imageUrl - Original image URL
 * @param options - Transformation options
 */
export const getOptimizedImageUrl = (
  imageUrl: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string => {
  if (!isStorageUrl(imageUrl)) {
    return imageUrl;
  }
  
  // Supabase Storage doesn't have built-in transformations for external projects
  // But we can append query params for future CDN optimization
  const url = new URL(imageUrl);
  
  if (options?.width) {
    url.searchParams.set('width', options.width.toString());
  }
  if (options?.height) {
    url.searchParams.set('height', options.height.toString());
  }
  if (options?.quality) {
    url.searchParams.set('quality', options.quality.toString());
  }
  
  return url.toString();
};
