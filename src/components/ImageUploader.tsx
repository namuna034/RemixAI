import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Sparkles, AlertCircle, Loader2, Zap } from 'lucide-react';
import { SAMPLE_IMAGES, SampleImage } from '../sampleImages';
import heic2any from 'heic2any';

interface ImageUploaderProps {
  onImageSelected: (dataUrl: string, fileName?: string) => void;
  currentImage: string | null;
  onSelectSamplePrompt?: (prompt: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  currentImage,
  onSelectSamplePrompt,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined | null) => {
    setUploadError(null);
    if (!file) return;

    let processedFile = file;

    // Check for HEIC/HEIF and convert to JPEG automatically
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || /\.(heic|heif)$/i.test(file.name);
    if (isHeic) {
      try {
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.85,
        });
        const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        processedFile = new File([blobToUse], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
          type: 'image/jpeg',
        });
      } catch (err) {
        console.error('HEIC conversion error:', err);
      }
    }

    // Check if it's an image
    const isImageMime = processedFile.type.startsWith('image/');
    const isImageExt = /\.(jpe?g|png|webp|gif|bmp|svg|avif|heic|heif)$/i.test(processedFile.name);
    if (!isImageMime && !isImageExt) {
      const msg = `Selected file "${processedFile.name}" is not a supported image. Please select a JPG, PNG, WebP, GIF, or BMP photo.`;
      setUploadError(msg);
      alert(msg);
      return;
    }

    // Limit size to 30MB
    const maxSizeBytes = 30 * 1024 * 1024;
    if (processedFile.size > maxSizeBytes) {
      const sizeMB = (processedFile.size / (1024 * 1024)).toFixed(1);
      const msg = `File is too large (${sizeMB} MB). Maximum allowed size is 30 MB.`;
      setUploadError(msg);
      alert(msg);
      return;
    }

    setIsReading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result || typeof result !== 'string') {
        setIsReading(false);
        const msg = 'Failed to read image data from your device. Please try again.';
        setUploadError(msg);
        alert(msg);
        return;
      }

      const testImg = new Image();
      testImg.onload = () => {
        setIsReading(false);
        setUploadError(null);
        onImageSelected(result, processedFile.name);
      };
      testImg.onerror = () => {
        setIsReading(false);
        const msg = `Could not decode image "${processedFile.name}". The file may be corrupted or in an unsupported format.`;
        setUploadError(msg);
        alert(msg);
      };
      testImg.src = result;
    };

    reader.onerror = (err) => {
      setIsReading(false);
      console.error('FileReader error:', err);
      const msg = 'FileReader error: Failed to read file from your device. Please try again.';
      setUploadError(msg);
      alert(msg);
    };

    reader.onabort = () => {
      setIsReading(false);
      setUploadError('Image read was cancelled.');
    };

    reader.readAsDataURL(processedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSampleClick = (sample: SampleImage) => {
    try {
      setLoadingSample(sample.id);
      setUploadError(null);
      const dataUrl = sample.getDataUrl();
      if (!dataUrl) {
        throw new Error('Failed to generate sample image data.');
      }
      onImageSelected(dataUrl, `${sample.title}.png`);
      if (onSelectSamplePrompt) {
        onSelectSamplePrompt(sample.suggestedPrompt);
      }
    } catch (err: unknown) {
      console.error('Failed to load sample image:', err);
      const msg = err instanceof Error ? err.message : 'Error loading sample photo.';
      setUploadError(msg);
      alert(msg);
    } finally {
      setLoadingSample(null);
    }
  };

  return (
    <div className="space-y-4 text-white">
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
          e.target.value = '';
        }}
      />

      {/* Error alert banner */}
      {uploadError && (
        <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-2xl flex items-start gap-2.5 text-xs text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Image Load Failed: </span>
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-rose-400 hover:text-rose-200 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Remini Upload Box */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isReading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-6 md:p-7 text-center cursor-pointer transition-all duration-200 group ${
          isDragging
            ? 'border-pink-500 bg-pink-500/20 scale-[0.99]'
            : 'border-pink-500/30 hover:border-pink-400 bg-[#13151f]/95 hover:bg-[#1a1c2a] shadow-xl shadow-pink-950/20'
        } ${isReading ? 'opacity-80 pointer-events-none' : ''}`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:scale-105 transition-transform">
            {isReading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors">
              {isReading
                ? 'Decoding Photo...'
                : currentImage
                ? 'Replace Photo from Device'
                : 'Upload Photo to Enhance'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Select or drop a blurry, vintage, or portrait photo (JPG, PNG, WebP, HEIC)
            </p>
          </div>

          <button
            type="button"
            disabled={isReading}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-pink-500/30 transition-all active:scale-95"
          >
            {isReading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reading File...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Select Photo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Remini Test Samples */}
      <div className="bg-[#13151f]/95 backdrop-blur-md border border-pink-500/25 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-pink-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            Try Remini Test Samples:
          </span>
          <span className="text-[10px] text-zinc-400 font-medium">1-click test</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_IMAGES.map((sample) => {
            const samplePreviewUrl = sample.getDataUrl();
            return (
              <button
                key={sample.id}
                type="button"
                disabled={loadingSample === sample.id || isReading}
                onClick={() => handleSampleClick(sample)}
                className="flex flex-col items-start text-left p-1.5 bg-black/40 hover:bg-white/5 border border-white/10 hover:border-pink-500/40 rounded-xl transition-all group overflow-hidden"
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black/60 mb-1.5">
                  <img
                    src={samplePreviewUrl}
                    alt={sample.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {loadingSample === sample.id && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-zinc-100 truncate w-full">
                  {sample.title}
                </span>
                <span className="text-[10px] text-pink-400 truncate w-full">
                  {sample.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
