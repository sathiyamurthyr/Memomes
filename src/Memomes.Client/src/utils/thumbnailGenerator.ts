/**
 * Client-side 200x200px Low-Resolution Encrypted Thumbnail Generator
 * Generates low-res canvas thumbnails for images and video keyframes
 * prior to main file chunk encryption.
 */

export class ThumbnailGenerator {
  /**
   * Generate a 200x200px Data URI thumbnail for images or video keyframes
   */
  static async generateThumbnail(file: File): Promise<string | null> {
    const fileType = file.type.toLowerCase();

    if (fileType.startsWith('image/')) {
      return ThumbnailGenerator.generateImageThumbnail(file);
    } else if (fileType.startsWith('video/')) {
      return ThumbnailGenerator.generateVideoThumbnail(file);
    }

    return null;
  }

  private static generateImageThumbnail(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);

          // Calculate center crop fill for 200x200 aspect ratio
          const scale = Math.max(200 / img.width, 200 / img.height);
          const x = (200 - img.width * scale) / 2;
          const y = (200 - img.height * scale) / 2;

          ctx.fillStyle = '#10141F';
          ctx.fillRect(0, 0, 200, 200);
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => resolve(null);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  private static generateVideoThumbnail(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadeddata = () => {
        video.currentTime = Math.min(1.0, video.duration / 2);
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          return resolve(null);
        }

        const scale = Math.max(200 / video.videoWidth, 200 / video.videoHeight);
        const x = (200 - video.videoWidth * scale) / 2;
        const y = (200 - video.videoHeight * scale) / 2;

        ctx.fillStyle = '#10141F';
        ctx.fillRect(0, 0, 200, 200);
        ctx.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale);

        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
    });
  }
}
