/**
 * Utility functions for client-side exercise image compression and validation.
 */

export interface ImageCompressionOptions {
  maxDimension?: number;
  quality?: number;
}

/**
 * Resizes and compresses an image file using an off-screen HTML canvas,
 * returning a lightweight base64 Data URL.
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const { maxDimension = 800, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image.'));
    }

    // For animated GIFs, drawing to a 2D canvas flattens the image to a single static frame.
    // Read directly as a base64 Data URL to preserve all animation frames.
    if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
      const MAX_GIF_BYTES = 5 * 1024 * 1024;
      if (file.size > MAX_GIF_BYTES) {
        return reject(new Error('GIF file is too large. Please select a GIF under 5MB.'));
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read GIF file.'));
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image for compression.'));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original data URL if canvas 2D is unavailable
          return resolve(dataUrl);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Attempt WebP first, fallback to JPEG
        let compressed = '';
        try {
          compressed = canvas.toDataURL('image/webp', quality);
          if (!compressed.startsWith('data:image/webp')) {
            compressed = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          compressed = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(compressed);
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validates whether a given string is a valid remote image URL or data URL.
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  if (trimmed.startsWith('data:image/')) return true;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
