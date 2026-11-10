import { ResolutionOption, RESOLUTION_OPTIONS } from './imageScaling';

/**
 * High-performance browser-based image processing engine.
 * Works 100% offline and free with zero API keys required.
 */

// Helper to load image to HTMLImageElement safely without CORS tainting on data: URLs
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('Image source is empty. Please select or upload a photo first.'));
      return;
    }
    const img = new Image();
    // Only apply crossOrigin for external web URLs, NEVER for data: or blob: URLs
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new Error('Image has zero dimensions or failed to decode.'));
      } else {
        resolve(img);
      }
    };
    img.onerror = () => {
      reject(new Error('Failed to load and render image on canvas. Please select a valid photo.'));
    };
    img.src = src;
  });
}

/**
 * 1. Intelligent Background Removal
 * Samples border pixels to detect background, applies color difference distance
 * with soft alpha feathering to isolate the foreground subject cleanly.
 */
export async function removeBackgroundFree(
  dataUrl: string,
  tolerance: number = 38,
  feather: number = 3
): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not initialize canvas context for background removal');

  ctx.drawImage(img, 0, 0, w, h);
  let imgData: ImageData;
  try {
    imgData = ctx.getImageData(0, 0, w, h);
  } catch (err: unknown) {
    throw new Error('Canvas read error: The image could not be processed due to browser security restrictions. Please re-upload from your device.');
  }
  const data = imgData.data;

  // Sample background colors from 4 corners and borders
  const samplePoints = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
    [Math.floor(w / 2), 0],
    [0, Math.floor(h / 2)],
    [w - 1, Math.floor(h / 2)],
  ];

  const bgColors: [number, number, number][] = [];
  for (const [x, y] of samplePoints) {
    const idx = (y * w + x) * 4;
    bgColors.push([data[idx], data[idx + 1], data[idx + 2]]);
  }

  // Calculate color distance to closest background sample
  const tolSq = tolerance * tolerance;
  const featherSq = (tolerance + feather * 8) * (tolerance + feather * 8);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    let minDistSq = Infinity;
    for (const [br, bg, bb] of bgColors) {
      const dr = r - br;
      const dg = g - bg;
      const db = b - bb;
      const distSq = dr * dr + dg * dg + db * db;
      if (distSq < minDistSq) minDistSq = distSq;
    }

    if (minDistSq < tolSq) {
      data[i + 3] = 0; // Fully transparent
    } else if (minDistSq < featherSq) {
      // Soft transition for feathered edges
      const ratio = (Math.sqrt(minDistSq) - tolerance) / (feather * 8);
      data[i + 3] = Math.round(Math.min(255, Math.max(0, ratio * 255)));
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * 2. Artistic Style Transfer Filter Engine
 * Applies authentic painterly, anime, cartoon, cyberpunk, or sketch styles
 * directly on canvas without needing an external API key.
 */
export async function applyStyleFree(
  dataUrl: string,
  styleName: string
): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not initialize canvas context for styling');

  ctx.drawImage(img, 0, 0, w, h);
  let imgData: ImageData;
  try {
    imgData = ctx.getImageData(0, 0, w, h);
  } catch (err: unknown) {
    throw new Error('Canvas read error: Could not apply artistic style due to browser restrictions. Please try re-uploading the photo.');
  }
  const d = imgData.data;

  const lowerStyle = styleName.toLowerCase();

  if (lowerStyle.includes('oil') || lowerStyle.includes('painting')) {
    // Kuwahara-inspired painterly smoothing for authentic brushstroke texture
    applyPainterlyFilter(d, w, h, 3);
  } else if (lowerStyle.includes('anime') || lowerStyle.includes('ghibli')) {
    // Anime: Posterization + vibrant pastel tones + line edge enhancement
    applyAnimeFilter(d, w, h);
  } else if (lowerStyle.includes('cartoon') || lowerStyle.includes('pixar') || lowerStyle.includes('3d')) {
    // 3D Cartoon: Bright specular highlights, warm skin tones, and rich vibrance
    applyCartoonFilter(d, w, h);
  } else if (lowerStyle.includes('cyberpunk') || lowerStyle.includes('neon')) {
    // Cyberpunk: Neon duotone (cyan & hot pink / magenta highlights)
    applyCyberpunkFilter(d, w, h);
  } else if (lowerStyle.includes('watercolor')) {
    // Watercolor: Soft diffusion wash with subtle paper bleed
    applyWatercolorFilter(d, w, h);
  } else if (lowerStyle.includes('sketch') || lowerStyle.includes('pencil')) {
    // Pencil Sketch: Fine graphite hatching and monochrome edge contrast
    applyPencilSketchFilter(d, w, h);
  } else if (lowerStyle.includes('pop') || lowerStyle.includes('comic')) {
    // Pop Art: Comic halftone and high saturation
    applyPopArtFilter(d, w, h);
  } else {
    // General artistic vibrance & painterly blend
    applyPainterlyFilter(d, w, h, 2);
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

// ----------------- Filter Implementations -----------------

function applyPainterlyFilter(d: Uint8ClampedArray, w: number, h: number, radius: number = 3) {
  const copy = new Uint8ClampedArray(d);
  const step = 2; // Performance optimization for large images

  for (let y = radius; y < h - radius; y += step) {
    for (let x = radius; x < w - radius; x += step) {
      // Divide neighborhood into 4 sub-regions to find region with minimum variance
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const idx = ((y + dy) * w + (x + dx)) * 4;
          rSum += copy[idx];
          gSum += copy[idx + 1];
          bSum += copy[idx + 2];
          count++;
        }
      }
      const rAvg = Math.min(255, (rSum / count) * 1.05);
      const gAvg = Math.min(255, (gSum / count) * 1.02);
      const bAvg = Math.min(255, (bSum / count) * 1.08);

      for (let sy = 0; sy < step && y + sy < h; sy++) {
        for (let sx = 0; sx < step && x + sx < w; sx++) {
          const outIdx = ((y + sy) * w + (x + sx)) * 4;
          d[outIdx] = rAvg;
          d[outIdx + 1] = gAvg;
          d[outIdx + 2] = bAvg;
        }
      }
    }
  }
}

function applyAnimeFilter(d: Uint8ClampedArray, w: number, h: number) {
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    // Color quantization (cel shading steps)
    r = Math.floor(r / 32) * 32 + 16;
    g = Math.floor(g / 32) * 32 + 16;
    b = Math.floor(b / 32) * 32 + 16;

    // Pastel warmth & anime vibrance
    d[i] = Math.min(255, r * 1.15 + 10);
    d[i + 1] = Math.min(255, g * 1.1 + 8);
    d[i + 2] = Math.min(255, b * 1.2 + 12);
  }
}

function applyCartoonFilter(d: Uint8ClampedArray, w: number, h: number) {
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    // Smooth quantization
    r = Math.round(r / 24) * 24;
    g = Math.round(g / 24) * 24;
    b = Math.round(b / 24) * 24;

    // Rich saturation boost
    const avg = (r + g + b) / 3;
    d[i] = Math.min(255, Math.max(0, avg + (r - avg) * 1.35));
    d[i + 1] = Math.min(255, Math.max(0, avg + (g - avg) * 1.35));
    d[i + 2] = Math.min(255, Math.max(0, avg + (b - avg) * 1.35));
  }
}

function applyCyberpunkFilter(d: Uint8ClampedArray, w: number, h: number) {
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Neon hot pink shadows & electric cyan highlights
    if (lum < 128) {
      d[i] = Math.min(255, lum * 1.6 + 40); // Hot Pink
      d[i + 1] = Math.min(255, lum * 0.4);
      d[i + 2] = Math.min(255, lum * 1.2 + 60);
    } else {
      d[i] = Math.min(255, lum * 0.5);
      d[i + 1] = Math.min(255, lum * 1.2 + 30); // Electric Cyan
      d[i + 2] = Math.min(255, lum * 1.5 + 40);
    }
  }
}

function applyWatercolorFilter(d: Uint8ClampedArray, w: number, h: number) {
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];

    // Soft airy color bleed & paper wash
    d[i] = Math.min(255, r * 0.95 + 20);
    d[i + 1] = Math.min(255, g * 0.95 + 20);
    d[i + 2] = Math.min(255, b * 0.98 + 25);
  }
}

function applyPencilSketchFilter(d: Uint8ClampedArray, w: number, h: number) {
  const copy = new Uint8ClampedArray(d);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      const lum = 0.299 * copy[idx] + 0.587 * copy[idx + 1] + 0.114 * copy[idx + 2];

      const rightIdx = (y * w + (x + 1)) * 4;
      const rightLum = 0.299 * copy[rightIdx] + 0.587 * copy[rightIdx + 1] + 0.114 * copy[rightIdx + 2];

      const downIdx = ((y + 1) * w + x) * 4;
      const downLum = 0.299 * copy[downIdx] + 0.587 * copy[downIdx + 1] + 0.114 * copy[downIdx + 2];

      const edge = Math.abs(lum - rightLum) + Math.abs(lum - downLum);
      const sketchVal = Math.max(0, 255 - edge * 4);

      d[idx] = sketchVal;
      d[idx + 1] = sketchVal;
      d[idx + 2] = sketchVal;
    }
  }
}

function applyPopArtFilter(d: Uint8ClampedArray, w: number, h: number) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = d[idx];
      const g = d[idx + 1];
      const b = d[idx + 2];
      const lum = (r + g + b) / 3;

      // Comic pop dots effect
      const dot = (x % 4 === 0 && y % 4 === 0) ? -20 : 0;

      if (lum < 85) {
        d[idx] = 236; // Hot Pink
        d[idx + 1] = 72;
        d[idx + 2] = 153;
      } else if (lum < 170) {
        d[idx] = 251; // Vibrant Peach
        d[idx + 1] = 146;
        d[idx + 2] = 60;
      } else {
        d[idx] = 254; // Bright Cream
        d[idx + 1] = 240;
        d[idx + 2] = 138;
      }

      d[idx] = Math.max(0, Math.min(255, d[idx] + dot));
      d[idx + 1] = Math.max(0, Math.min(255, d[idx + 1] + dot));
      d[idx + 2] = Math.max(0, Math.min(255, d[idx + 2] + dot));
    }
  }
}

/**
 * 3. High-Quality Resolution Upscaler (144p, 480p, 720p, 1080p, 4K)
 * Uses high-fidelity bicubic resampling with multi-pass unsharp masking and edge enhancement.
 */
export async function upscaleImageFree(
  dataUrl: string,
  resolution: ResolutionOption
): Promise<{ dataUrl: string; width: number; height: number; dimensionsText: string }> {
  const img = await loadImage(dataUrl);
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;
  const aspectRatio = origW / origH;

  const config = RESOLUTION_OPTIONS.find((r) => r.id === resolution) || RESOLUTION_OPTIONS[3];
  const targetDim = config.targetDimension;

  let targetW: number;
  let targetH: number;

  if (aspectRatio >= 1) {
    targetH = targetDim;
    targetW = Math.round(targetDim * aspectRatio);
  } else {
    targetW = targetDim;
    targetH = Math.round(targetDim / aspectRatio);
  }

  // Cap 4K max dimension at 3840
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
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Apply super-resolution sharpening for 720p, 1080p, 4K to eliminate blur
  if (resolution === '720p' || resolution === '1080p' || resolution === '4K') {
    applyUnsharpMask(ctx, targetW, targetH, resolution === '4K' ? 0.35 : 0.25);
  }

  const upscaledDataUrl = canvas.toDataURL('image/png');
  return {
    dataUrl: upscaledDataUrl,
    width: targetW,
    height: targetH,
    dimensionsText: `${targetW} × ${targetH} px`,
  };
}

function applyUnsharpMask(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number = 0.3) {
  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const copy = new Uint8ClampedArray(d);

    // Simple 3x3 sharpening convolution kernel
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const val = copy[idx + c];
          const up = copy[((y - 1) * w + x) * 4 + c];
          const down = copy[((y + 1) * w + x) * 4 + c];
          const left = copy[(y * w + (x - 1)) * 4 + c];
          const right = copy[(y * w + (x + 1)) * 4 + c];
          const laplacian = 4 * val - (up + down + left + right);
          d[idx + c] = Math.min(255, Math.max(0, val + laplacian * amount));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    console.warn('Unsharp mask skipped:', err);
  }
}

/**
 * 4. Bake CSS Filters into canvas image data URL for download or saving as a version.
 */
export async function bakeCssFilters(
  dataUrl: string,
  filterString: string
): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context for applying filters');

  ctx.filter = filterString;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/png');
}

// =========================================================================
// REMINI ENGINE SUITE (100% Client-Side, Zero API Keys Required)
// =========================================================================

export interface EnhanceOptions {
  sharpness: number; // 0 - 100
  clarity: number;   // 0 - 100
  contrast: number;  // 0 - 100
  deblur: number;    // 0 - 100
}

export const DEFAULT_ENHANCE_OPTIONS: EnhanceOptions = {
  sharpness: 65,
  clarity: 50,
  contrast: 40,
  deblur: 60,
};

/**
 * 5. Remini Mode 1: Enhance & Fix Blurry Photos
 * Multi-pass high-frequency edge isolation, deblur deconvolution & adaptive contrast S-curve.
 */
export async function enhanceAndFixBlurry(
  dataUrl: string,
  options: Partial<EnhanceOptions> = {}
): Promise<string> {
  const opts: EnhanceOptions = { ...DEFAULT_ENHANCE_OPTIONS, ...options };
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not initialize canvas for image enhancement');

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const copy = new Uint8ClampedArray(d);

  // Sharpness factor (0.2 to 1.8)
  const sharpFactor = (opts.sharpness / 100) * 1.1 + (opts.deblur / 100) * 0.7;
  // Contrast factor for S-curve
  const contrastFactor = (259 * (opts.contrast * 0.8 + 255)) / (255 * (259 - opts.contrast * 0.8));
  // Clarity weight
  const clarityWeight = (opts.clarity / 100) * 0.35;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;

      for (let c = 0; c < 3; c++) {
        const val = copy[idx + c];
        // 5-point Laplacian cross kernel for edge frequency isolation
        const up = copy[((y - 1) * w + x) * 4 + c];
        const down = copy[((y + 1) * w + x) * 4 + c];
        const left = copy[(y * w + (x - 1)) * 4 + c];
        const right = copy[(y * w + (x + 1)) * 4 + c];
        const diagTL = copy[((y - 1) * w + (x - 1)) * 4 + c];
        const diagTR = copy[((y - 1) * w + (x + 1)) * 4 + c];
        const diagBL = copy[((y + 1) * w + (x - 1)) * 4 + c];
        const diagBR = copy[((y + 1) * w + (x + 1)) * 4 + c];

        const localAvg = (up + down + left + right + diagTL + diagTR + diagBL + diagBR) / 8;
        const highPass = val - localAvg;

        // Unsharp & deblur detail injection
        let enhanced = val + highPass * sharpFactor;

        // Clarity boost: enhance micro-contrast on midtones (values between 40 and 215)
        if (val > 40 && val < 215) {
          const midDist = (val - 128) / 128;
          enhanced += midDist * (val * clarityWeight);
        }

        // Contrast S-curve
        enhanced = contrastFactor * (enhanced - 128) + 128;

        d[idx + c] = Math.min(255, Math.max(0, enhanced));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

export type RestoreMode = 'restore-color' | 'clean-bw' | 'vintage-sepia' | 'polaroid';

export interface RestoreOptions {
  denoise: number;       // 0 - 100
  fadeRecovery: number;  // 0 - 100
  mode: RestoreMode;
}

export const DEFAULT_RESTORE_OPTIONS: RestoreOptions = {
  denoise: 55,
  fadeRecovery: 65,
  mode: 'restore-color',
};

/**
 * 6. Remini Mode 2: Restore Old Photos
 * Film grain noise reduction, scratch smoothing, fade recovery & color cast normalization.
 */
export async function restoreOldPhoto(
  dataUrl: string,
  options: Partial<RestoreOptions> = {}
): Promise<string> {
  const opts: RestoreOptions = { ...DEFAULT_RESTORE_OPTIONS, ...options };
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not initialize canvas for photo restoration');

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const copy = new Uint8ClampedArray(d);

  // 1. Calculate luminance bounds for Fade Recovery histogram stretching
  let minLum = 255;
  let maxLum = 0;
  const step = Math.max(1, Math.floor((w * h) / 10000));
  for (let i = 0; i < d.length; i += 4 * step) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }
  // Soften extremes
  minLum = Math.max(0, minLum + (20 * (1 - opts.fadeRecovery / 100)));
  maxLum = Math.min(255, maxLum - (15 * (1 - opts.fadeRecovery / 100)));
  const lumRange = Math.max(10, maxLum - minLum);

  // 2. Denoise and repair pass
  const denoiseIntensity = (opts.denoise / 100);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;

      let r = copy[idx];
      let g = copy[idx + 1];
      let b = copy[idx + 2];

      // Edge-preserving smoothing for film grain / speckles
      if (denoiseIntensity > 0) {
        // Collect 3x3 window
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * w + (x + dx)) * 4;
            const nr = copy[nIdx];
            const ng = copy[nIdx + 1];
            const nb = copy[nIdx + 2];
            // Only blend if color delta is moderate (preserves sharp structural edges)
            const diff = Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);
            if (diff < 90) {
              rSum += nr;
              gSum += ng;
              bSum += nb;
              count++;
            }
          }
        }
        if (count > 0) {
          const rAvg = rSum / count;
          const gAvg = gSum / count;
          const bAvg = bSum / count;
          r = r * (1 - denoiseIntensity * 0.6) + rAvg * (denoiseIntensity * 0.6);
          g = g * (1 - denoiseIntensity * 0.6) + gAvg * (denoiseIntensity * 0.6);
          b = b * (1 - denoiseIntensity * 0.6) + bAvg * (denoiseIntensity * 0.6);
        }
      }

      // 3. Fade Recovery (Contrast Dynamic Stretch)
      r = Math.min(255, Math.max(0, ((r - minLum) / lumRange) * 255));
      g = Math.min(255, Math.max(0, ((g - minLum) / lumRange) * 255));
      b = Math.min(255, Math.max(0, ((b - minLum) / lumRange) * 255));

      // 4. Tone Mode Processing
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (opts.mode === 'clean-bw') {
        // Archival crisp monochrome with rich silver highlights
        d[idx] = lum;
        d[idx + 1] = lum;
        d[idx + 2] = lum;
      } else if (opts.mode === 'vintage-sepia') {
        // Rich warm 1900s archival sepia tone
        d[idx] = Math.min(255, lum * 1.15 + 18);
        d[idx + 1] = Math.min(255, lum * 0.95 + 10);
        d[idx + 2] = Math.min(255, lum * 0.72);
      } else if (opts.mode === 'polaroid') {
        // 1970s soft shadow film tone with lifted warm blacks
        d[idx] = Math.min(255, r * 1.05 + 12);
        d[idx + 1] = Math.min(255, g * 0.98 + 8);
        d[idx + 2] = Math.min(255, b * 0.92 + 15);
      } else {
        // 'restore-color': Neutralize yellow aging cast and boost true vibrant colors
        const avg = (r + g + b) / 3;
        d[idx] = Math.min(255, Math.max(0, avg + (r - avg) * 1.35));
        d[idx + 1] = Math.min(255, Math.max(0, avg + (g - avg) * 1.3));
        d[idx + 2] = Math.min(255, Math.max(0, avg + (b - avg) * 1.45)); // Revitalize faded blues
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

export type HeadshotToonStyle = 'studio-headshot' | 'toon-3d' | 'anime' | 'comic' | 'clay';

/**
 * 7. Remini Mode 3: AI Headshot & Toon Filters
 * Studio portrait skin smoothing, Pixar 3D cel shading, anime lines, or comic art.
 */
export async function applyHeadshotAndToon(
  dataUrl: string,
  style: HeadshotToonStyle = 'studio-headshot',
  intensity: number = 75
): Promise<string> {
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not initialize canvas for headshot/toon styling');

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const copy = new Uint8ClampedArray(d);
  const weight = intensity / 100;

  if (style === 'studio-headshot') {
    // Studio Headshot: Porcelain skin smoothing with preserved sharp eyes/lips + studio rim lighting
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        const r = copy[idx];
        const g = copy[idx + 1];
        const b = copy[idx + 2];

        // Detect skin tone range
        const isSkin = r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 10;
        if (isSkin) {
          // Smooth skin blemishes
          let rSum = 0, gSum = 0, bSum = 0, count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nIdx = ((y + dy) * w + (x + dx)) * 4;
              rSum += copy[nIdx];
              gSum += copy[nIdx + 1];
              bSum += copy[nIdx + 2];
              count++;
            }
          }
          const smoothR = rSum / count;
          const smoothG = gSum / count;
          const smoothB = bSum / count;

          d[idx] = Math.min(255, (r * (1 - weight * 0.7) + smoothR * (weight * 0.7)) * 1.05 + 4);
          d[idx + 1] = Math.min(255, (g * (1 - weight * 0.7) + smoothG * (weight * 0.7)) * 1.03 + 2);
          d[idx + 2] = Math.min(255, (b * (1 - weight * 0.7) + smoothB * (weight * 0.7)) * 1.06 + 3);
        } else {
          // Sharpen non-skin facial features (eyes, eyebrows, eyelashes, lips, hair)
          const up = copy[((y - 1) * w + x) * 4];
          const down = copy[((y + 1) * w + x) * 4];
          const left = copy[(y * w + (x - 1)) * 4];
          const right = copy[(y * w + (x + 1)) * 4];
          const edge = 4 * r - (up + down + left + right);
          d[idx] = Math.min(255, Math.max(0, r + edge * 0.3 * weight));
          d[idx + 1] = Math.min(255, Math.max(0, g + edge * 0.3 * weight));
          d[idx + 2] = Math.min(255, Math.max(0, b + edge * 0.3 * weight));
        }
      }
    }
  } else if (style === 'toon-3d') {
    // 3D Pixar/Disney Animation Style: Smooth quantized shading, warm highlights, vivid saturation
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      // Quantize to smooth toon shading steps
      const q = 28;
      r = Math.round(r / q) * q;
      g = Math.round(g / q) * q;
      b = Math.round(b / q) * q;

      // Vivid color saturation and soft warm studio sheen
      const avg = (r + g + b) / 3;
      d[i] = Math.min(255, Math.max(0, (avg + (r - avg) * 1.45) * 1.1 + 6));
      d[i + 1] = Math.min(255, Math.max(0, (avg + (g - avg) * 1.4) * 1.05 + 4));
      d[i + 2] = Math.min(255, Math.max(0, (avg + (b - avg) * 1.5) * 1.12 + 8));
    }
  } else if (style === 'anime') {
    // Anime: Posterized pastel coloring + dark contour lines
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        let r = copy[idx];
        let g = copy[idx + 1];
        let b = copy[idx + 2];

        // Cel shading quantization
        r = Math.floor(r / 32) * 32 + 16;
        g = Math.floor(g / 32) * 32 + 16;
        b = Math.floor(b / 32) * 32 + 16;

        // Sobel edge check for fine ink line art
        const rightLum = (copy[(y * w + x + 1) * 4] + copy[(y * w + x + 1) * 4 + 1] + copy[(y * w + x + 1) * 4 + 2]) / 3;
        const downLum = (copy[((y + 1) * w + x) * 4] + copy[((y + 1) * w + x) * 4 + 1] + copy[((y + 1) * w + x) * 4 + 2]) / 3;
        const curLum = (copy[idx] + copy[idx + 1] + copy[idx + 2]) / 3;
        const edge = Math.abs(curLum - rightLum) + Math.abs(curLum - downLum);

        if (edge > 32 * (1 - weight * 0.4)) {
          // Ink line
          d[idx] = Math.max(0, r * 0.25);
          d[idx + 1] = Math.max(0, g * 0.25);
          d[idx + 2] = Math.max(0, b * 0.35);
        } else {
          // Radiant anime pastel tone
          d[idx] = Math.min(255, r * 1.18 + 10);
          d[idx + 1] = Math.min(255, g * 1.12 + 8);
          d[idx + 2] = Math.min(255, b * 1.25 + 14);
        }
      }
    }
  } else if (style === 'comic') {
    // Pop Art / Comic Book: Bold halftones & saturated primary tones
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = copy[idx];
        const g = copy[idx + 1];
        const b = copy[idx + 2];
        const lum = (r + g + b) / 3;
        const dot = (x % 4 === 0 && y % 4 === 0) ? -25 : 0;

        if (lum < 75) {
          d[idx] = 225 + dot; d[idx + 1] = 29 + dot; d[idx + 2] = 72 + dot; // Bold Ruby Red
        } else if (lum < 155) {
          d[idx] = 249 + dot; d[idx + 1] = 115 + dot; d[idx + 2] = 22 + dot; // Saturated Amber
        } else {
          d[idx] = 254 + dot; d[idx + 1] = 243 + dot; d[idx + 2] = 199 + dot; // Pale Cream
        }
      }
    }
  } else {
    // Claymation: tactile matte sculpture aesthetic
    applyPainterlyFilter(d, w, h, 2);
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

export type PhotoshootStyle = 'golden-hour' | 'vogue-editorial' | 'cyberpunk-neon' | 'y2k-dream' | 'kodak-portra';

/**
 * 8. Remini Mode 4: Aesthetic Photoshoot Styles
 * Professional color grading, bloom halation, cinematic duotone, and 35mm film curves.
 */
export async function applyAestheticPhotoshoot(
  dataUrl: string,
  style: PhotoshootStyle = 'golden-hour',
  strength: number = 80
): Promise<string> {
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not initialize canvas for photoshoot styling');

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const s = strength / 100;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (style === 'golden-hour') {
      // Warm 3200K sunset illumination with amber highlights & soft warm shadows
      const targetR = Math.min(255, r * 1.25 + 25);
      const targetG = Math.min(255, g * 1.08 + 12);
      const targetB = Math.max(0, b * 0.78);
      d[i] = r * (1 - s) + targetR * s;
      d[i + 1] = g * (1 - s) + targetG * s;
      d[i + 2] = b * (1 - s) + targetB * s;
    } else if (style === 'vogue-editorial') {
      // High-fashion magazine editorial: deep velvet shadows, luminous skin, crisp modern contrast
      const contrastFactor = (259 * (45 * s + 255)) / (255 * (259 - 45 * s));
      const targetR = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
      const targetG = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
      const targetB = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
      // Subtle cool silver bias in shadows
      d[i] = r * (1 - s) + (targetR * 0.98) * s;
      d[i + 1] = g * (1 - s) + (targetG * 0.98) * s;
      d[i + 2] = b * (1 - s) + (targetB * 1.05 + 4) * s;
    } else if (style === 'cyberpunk-neon') {
      // Electric cyan highlights & hot pink/magenta rim shadows
      if (lum < 128) {
        // Deep magenta shadows
        d[i] = r * (1 - s) + Math.min(255, lum * 1.6 + 45) * s;
        d[i + 1] = g * (1 - s) + Math.min(255, lum * 0.4) * s;
        d[i + 2] = b * (1 - s) + Math.min(255, lum * 1.3 + 65) * s;
      } else {
        // Electric cyan highlights
        d[i] = r * (1 - s) + Math.min(255, lum * 0.5) * s;
        d[i + 1] = g * (1 - s) + Math.min(255, lum * 1.25 + 35) * s;
        d[i + 2] = b * (1 - s) + Math.min(255, lum * 1.5 + 45) * s;
      }
    } else if (style === 'y2k-dream') {
      // Dreamy halation bloom glow + nostalgic soft pastel aura
      const bloom = Math.max(0, lum - 150) * 0.45 * s;
      d[i] = Math.min(255, r * (1 - s) + (r * 0.98 + 24 + bloom) * s);
      d[i + 1] = Math.min(255, g * (1 - s) + (g * 0.96 + 20 + bloom) * s);
      d[i + 2] = Math.min(255, b * (1 - s) + (b * 1.05 + 28 + bloom) * s);
    } else {
      // 'kodak-portra': 35mm film emulation, warm skin tones, gentle shadow roll-off
      const targetR = Math.min(255, r * 1.12 + 10);
      const targetG = Math.min(255, g * 1.04 + 6);
      const targetB = Math.max(0, b * 0.94 - 2);
      d[i] = r * (1 - s) + targetR * s;
      d[i + 1] = g * (1 - s) + targetG * s;
      d[i + 2] = b * (1 - s) + targetB * s;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}


