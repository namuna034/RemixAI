import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Columns,
  Layers,
  Sparkles,
  Scissors,
  ArrowRightLeft,
  Sliders,
  Loader2,
  ZoomIn,
  ZoomOut,
  Zap,
  Eye,
} from 'lucide-react';
import { bakeCssFilters } from '../utils/freeImageEngine';

interface ImagePreviewProps {
  originalImage: string | null;
  currentImage: string | null;
  activeLabel?: string;
  isEdited?: boolean;
  dimensionsText?: string;
  resolutionBadge?: string;
  onUseAsInput?: () => void;
  cssFilterString?: string;
  isFilterActive?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  originalImage,
  currentImage,
  activeLabel = 'Preview',
  isEdited = false,
  dimensionsText,
  resolutionBadge,
  onUseAsInput,
  cssFilterString,
  isFilterActive = false,
}) => {
  const [viewMode, setViewMode] = useState<'single' | 'compare' | 'split'>('single');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [bgStyle, setBgStyle] = useState<'dark' | 'checker' | 'white' | 'soft-pink'>('dark');
  const [copied, setCopied] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Automatically switch to split comparison slider whenever an edit/enhancement is generated
  useEffect(() => {
    if (isEdited && originalImage) {
      setViewMode('split');
    }
  }, [currentImage, isEdited]);

  useEffect(() => {
    setImgError(false);
  }, [currentImage, originalImage]);

  if (!currentImage) {
    return (
      <div className="w-full aspect-[4/3] max-h-[520px] rounded-3xl border-2 border-dashed border-pink-500/25 flex flex-col items-center justify-center p-8 bg-[#13151f]/80 backdrop-blur-xl text-pink-300/80 text-center shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white mb-3 shadow-md shadow-pink-500/30">
          <Zap className="w-8 h-8 fill-white" />
        </div>
        <p className="text-base font-bold text-white">No Photo Selected</p>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs">
          Upload a photo or select a test sample to unlock Remini AI Enhancement, Restoration, and Studio Headshots.
        </p>
      </div>
    );
  }

  const handleDownload = async (format: 'png' | 'jpeg' = 'png') => {
    if (!currentImage) return;
    setIsExporting(true);
    try {
      let downloadUrl = currentImage;
      if (cssFilterString && isFilterActive) {
        try {
          downloadUrl = await bakeCssFilters(currentImage, cssFilterString);
        } catch (e) {
          console.warn('Could not bake CSS filters, falling back to current image:', e);
        }
      }
      const link = document.createElement('a');
      link.href = downloadUrl;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `remini-${activeLabel.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    if (!currentImage) return;
    try {
      let copyUrl = currentImage;
      if (cssFilterString && isFilterActive) {
        try {
          copyUrl = await bakeCssFilters(currentImage, cssFilterString);
        } catch (e) {
          console.warn('Could not bake CSS filters for copy, falling back:', e);
        }
      }
      const res = await fetch(copyUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy image to clipboard:', err);
      await navigator.clipboard.writeText(currentImage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const getBackgroundClass = () => {
    switch (bgStyle) {
      case 'white':
        return 'bg-white';
      case 'soft-pink':
        return 'bg-[#ffd6e0]';
      case 'checker':
        return 'checkerboard-bg';
      case 'dark':
      default:
        return 'bg-[#0b0c12]';
    }
  };

  const displayedImage = showOriginal && originalImage ? originalImage : currentImage;

  return (
    <div className="w-full bg-[#13151f]/95 backdrop-blur-xl rounded-3xl border border-pink-500/25 shadow-2xl shadow-pink-950/40 overflow-hidden flex flex-col text-white">
      {/* Remini Studio Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gradient-to-r from-pink-950/40 via-purple-950/20 to-pink-950/40 border-b border-pink-500/15">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-pink-500 text-white flex items-center gap-1.5 shadow-md shadow-pink-500/30">
            <Zap className="w-3.5 h-3.5 fill-white" />
            {activeLabel}
          </span>
          {resolutionBadge && (
            <span className="text-[11px] font-extrabold text-white bg-gradient-to-r from-rose-500 to-pink-600 px-2.5 py-0.5 rounded-lg shadow-xs">
              {resolutionBadge}
            </span>
          )}
          {dimensionsText && (
            <span className="text-[11px] font-mono font-semibold text-pink-300 bg-pink-950/60 px-2 py-0.5 rounded-lg border border-pink-500/30">
              {dimensionsText}
            </span>
          )}
          {isFilterActive && (
            <span className="text-[11px] font-semibold text-pink-300 bg-pink-950/60 px-2.5 py-0.5 rounded-lg border border-pink-500/30 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-pink-400" />
              Filtered
            </span>
          )}
        </div>

        {/* View Mode Switcher (Current / Split / Side-by-Side) */}
        {(isEdited || isFilterActive) && originalImage && (
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                viewMode === 'split'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" /> Remini Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                viewMode === 'single'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Result
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compare')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                viewMode === 'compare'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Columns className="w-3 h-3" /> Side-by-Side
            </button>
          </div>
        )}

        {/* Backdrop color toggles & Zoom lens */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <button
            type="button"
            title={isZoomed ? 'Zoom Out' : 'Zoom 2x to Inspect Details'}
            onClick={() => setIsZoomed(!isZoomed)}
            className={`p-1.5 rounded-lg border transition-all ${
              isZoomed
                ? 'bg-pink-500/30 border-pink-400 text-pink-200'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            {isZoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Studio Dark Backdrop"
              onClick={() => setBgStyle('dark')}
              className={`w-5 h-5 rounded-md border transition-all ${
                bgStyle === 'dark' ? 'ring-2 ring-pink-500 border-pink-500 scale-110 bg-[#0b0c12]' : 'border-zinc-700 bg-[#0b0c12]'
              }`}
            />
            <button
              type="button"
              title="Transparent Checkerboard"
              onClick={() => setBgStyle('checker')}
              className={`w-5 h-5 rounded-md border text-[9px] font-bold checkerboard-bg transition-all ${
                bgStyle === 'checker' ? 'ring-2 ring-pink-500 border-pink-500 scale-110' : 'border-zinc-700'
              }`}
            />
            <button
              type="button"
              title="Clean White"
              onClick={() => setBgStyle('white')}
              className={`w-5 h-5 rounded-md border bg-white transition-all ${
                bgStyle === 'white' ? 'ring-2 ring-pink-500 border-pink-500 scale-110' : 'border-zinc-700'
              }`}
            />
            <button
              type="button"
              title="Soft Blush Pink"
              onClick={() => setBgStyle('soft-pink')}
              className={`w-5 h-5 rounded-md border bg-[#ffd6e0] transition-all ${
                bgStyle === 'soft-pink' ? 'ring-2 ring-pink-500 border-pink-500 scale-110' : 'border-zinc-700'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative w-full overflow-hidden flex items-center justify-center min-h-[360px] max-h-[580px] select-none">
        {/* MODE 1: Single image view */}
        {viewMode === 'single' && (
          <div className={`w-full h-full min-h-[360px] max-h-[580px] flex items-center justify-center p-4 ${getBackgroundClass()}`}>
            {imgError ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-rose-400 bg-black/60 rounded-2xl border border-rose-500/30">
                <span className="text-2xl mb-1">⚠️</span>
                <p className="text-sm font-bold">Image Failed to Render</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Please try re-uploading from your device or selecting another photo.
                </p>
              </div>
            ) : (
              <div className={`relative overflow-hidden transition-transform duration-200 ${isZoomed ? 'scale-150 cursor-grab' : ''}`}>
                <img
                  src={displayedImage}
                  alt="Photo preview"
                  onError={() => setImgError(true)}
                  style={!showOriginal && isFilterActive && cssFilterString ? { filter: cssFilterString } : undefined}
                  className="max-h-[520px] max-w-full object-contain rounded-xl shadow-lg transition-all duration-100"
                />
              </div>
            )}
          </div>
        )}

        {/* MODE 2: Signature Remini Interactive Split Slider */}
        {viewMode === 'split' && originalImage && (
          <div
            ref={containerRef}
            onMouseMove={(e) => e.buttons === 1 && handleSliderMove(e)}
            onTouchMove={handleSliderMove}
            onClick={handleSliderMove}
            className={`relative w-full h-[480px] cursor-ew-resize overflow-hidden flex items-center justify-center ${getBackgroundClass()}`}
          >
            {/* Background: Original Image (Before) */}
            <div className={`absolute inset-0 flex items-center justify-center p-4 transition-transform duration-200 ${isZoomed ? 'scale-150' : ''}`}>
              <img
                src={originalImage}
                alt="Before"
                className="max-h-full max-w-full object-contain pointer-events-none rounded-xl"
              />
            </div>

            {/* Foreground: Enhanced/Edited Image (After) with Clip */}
            <div
              className={`absolute inset-0 flex items-center justify-center p-4 overflow-hidden pointer-events-none transition-transform duration-200 ${isZoomed ? 'scale-150' : ''}`}
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img
                src={currentImage}
                alt="After"
                style={isFilterActive && cssFilterString ? { filter: cssFilterString } : undefined}
                className="max-h-full max-w-full object-contain pointer-events-none rounded-xl"
              />
            </div>

            {/* Floating Remini Badges: BEFORE (Left) & AFTER (Right) */}
            <div className="absolute top-4 left-4 pointer-events-none z-20">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-black/75 backdrop-blur-md text-white border border-white/20 shadow-md">
                Before
              </span>
            </div>
            <div className="absolute top-4 right-4 pointer-events-none z-20">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/40 ring-1 ring-pink-300">
                After
              </span>
            </div>

            {/* Glowing Vertical Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(236,72,153,0.9)] z-10 flex items-center justify-center pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              {/* Remini Circular Handle Pill */}
              <div className="w-10 h-10 rounded-full bg-black/80 backdrop-blur-md shadow-xl border-2 border-pink-400 flex items-center justify-center text-pink-300 text-xs font-bold transition-transform active:scale-110">
                <ArrowRightLeft className="w-4 h-4 text-pink-300" />
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: Side-by-side comparison */}
        {viewMode === 'compare' && originalImage && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-black/40">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider flex items-center gap-1">
                <span>Before (Original)</span>
              </span>
              <div className="w-full h-72 flex items-center justify-center bg-black/60 rounded-2xl border border-white/10 p-2 overflow-hidden">
                <img
                  src={originalImage}
                  alt="Original"
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-pink-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 fill-pink-400" />
                <span>After ({activeLabel})</span>
              </span>
              <div className={`w-full h-72 flex items-center justify-center rounded-2xl border border-pink-500/30 p-2 overflow-hidden ${getBackgroundClass()}`}>
                <img
                  src={currentImage}
                  alt="Edited"
                  style={isFilterActive && cssFilterString ? { filter: cssFilterString } : undefined}
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Hold to compare button in single mode */}
        {(isEdited || isFilterActive) && originalImage && viewMode === 'single' && (
          <div className="absolute top-4 left-4 z-10">
            <button
              type="button"
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onTouchStart={() => setShowOriginal(true)}
              onTouchEnd={() => setShowOriginal(false)}
              className="px-3.5 py-1.5 bg-black/75 backdrop-blur-md hover:bg-black/90 text-white text-xs font-semibold rounded-xl border border-white/20 shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-pink-400" />
              Hold for Before
            </button>
          </div>
        )}
      </div>

      {/* Action / Download Footer */}
      <div className="p-3 md:p-4 bg-black/60 border-t border-pink-500/15 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onUseAsInput && isEdited && (
            <button
              type="button"
              onClick={onUseAsInput}
              className="px-3.5 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 font-semibold text-xs rounded-xl border border-pink-500/40 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Use this edited image as the input for your next edit"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Use as Next Input
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-xs rounded-xl border border-white/10 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-pink-400" />
                <span>Copy Image</span>
              </>
            )}
          </button>
        </div>

        {/* Primary Download Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleDownload('png')}
            className={`inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-pink-600/30 hover:shadow-pink-600/50 transition-all active:scale-95 ${
              isExporting ? 'opacity-80 cursor-wait' : ''
            }`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing HD PNG...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download HD Result</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
