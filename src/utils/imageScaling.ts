export type ResolutionOption = '144p' | '480p' | '720p' | '1080p' | '4K';

export interface ResolutionConfig {
  id: ResolutionOption;
  label: string;
  badge: string;
  description: string;
  targetDimension: number; // reference dimension
}

export const RESOLUTION_OPTIONS: ResolutionConfig[] = [
  {
    id: '144p',
    label: '144p',
    badge: 'Preview',
    description: 'Ultra-compact thumbnail (256×144)',
    targetDimension: 144,
  },
  {
    id: '480p',
    label: '480p',
    badge: 'SD',
    description: 'Standard Definition (854×480)',
    targetDimension: 480,
  },
  {
    id: '720p',
    label: '720p',
    badge: 'HD',
    description: 'High Definition (1280×720)',
    targetDimension: 720,
  },
  {
    id: '1080p',
    label: '1080p',
    badge: 'Full HD',
    description: 'Crisp Full HD resolution (1920×1080)',
    targetDimension: 1080,
  },
  {
    id: '4K',
    label: '4K',
    badge: 'Ultra HD',
    description: 'Maximum 4K Ultra detail (3840×2160)',
    targetDimension: 2160,
  },
];

/**
 * Ensures the input image does not exceed Stability AI's 1MP (1024x1024) limit
 * for the Creative Upscale endpoint.
 */
export async function prepareImageForCreativeUpscale(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      const maxDim = 1024;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // If within 1024x1024, no resizing needed
      if (width <= maxDim && height <= maxDim && width * height <= 1048576) {
        resolve(dataUrl);
        return;
      }

      // Scale down keeping aspect ratio
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image for upscale preparation'));
    img.src = dataUrl;
  });
}

/**
 * Resizes the upscaled image to the exact target resolution preserving aspect ratio.
 */
export async function scaleImageToResolution(
  dataUrl: string,
  resolution: ResolutionOption
): Promise<{ dataUrl: string; width: number; height: number; dimensionsText: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      const aspectRatio = origW / origH;

      const config = RESOLUTION_OPTIONS.find((r) => r.id === resolution) || RESOLUTION_OPTIONS[3];
      const targetDim = config.targetDimension;

      let targetW: number;
      let targetH: number;

      if (aspectRatio >= 1) {
        // Landscape or Square: scale height to targetDim
        targetH = targetDim;
        targetW = Math.round(targetDim * aspectRatio);
      } else {
        // Portrait: scale width to targetDim
        targetW = targetDim;
        targetH = Math.round(targetDim / aspectRatio);
      }

      // If user selected 4K and targetW exceeds 3840 in landscape, cap at 3840
      if (resolution === '4K') {
        if (targetW > 3840 && aspectRatio >= 1) {
          targetW = 3840;
          targetH = Math.round(3840 / aspectRatio);
        } else if (targetH > 3840 && aspectRatio < 1) {
          targetH = 3840;
          targetW = Math.round(3840 * aspectRatio);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          dataUrl,
          width: origW,
          height: origH,
          dimensionsText: `${origW} × ${origH} px`,
        });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const scaledDataUrl = canvas.toDataURL('image/png');
      resolve({
        dataUrl: scaledDataUrl,
        width: targetW,
        height: targetH,
        dimensionsText: `${targetW} × ${targetH} px`,
      });
    };
    img.onerror = () => reject(new Error('Failed to load image for resolution scaling'));
    img.src = dataUrl;
  });
}
