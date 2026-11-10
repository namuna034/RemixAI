import React, { useState } from 'react';
import {
  Sparkles,
  Scissors,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Camera,
  Heart,
  Maximize2,
  ShieldCheck,
  Zap,
  History,
  Smile,
  X,
  Aperture,
} from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { ImagePreview } from './components/ImagePreview';
import {
  EditingTools,
  CssFilterSettings,
  DEFAULT_CSS_FILTERS,
  getCssFilterString,
  isFilterActive,
} from './components/EditingTools';
import { UpscalePanel } from './components/UpscalePanel';
import { VersionHistory, ImageVersion } from './components/VersionHistory';
import { ResolutionOption } from './utils/imageScaling';
import {
  removeBackgroundFree,
  upscaleImageFree,
  bakeCssFilters,
  enhanceAndFixBlurry,
  EnhanceOptions,
  restoreOldPhoto,
  RestoreOptions,
  applyHeadshotAndToon,
  HeadshotToonStyle,
  applyAestheticPhotoshoot,
  PhotoshootStyle,
} from './utils/freeImageEngine';

export default function App() {
  // Image states
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState<string>('Original');
  const [currentDimensionsText, setCurrentDimensionsText] = useState<string>('');
  const [currentResolutionBadge, setCurrentResolutionBadge] = useState<string>('');
  const [versions, setVersions] = useState<ImageVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string>('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingTask, setProcessingTask] = useState<
    'enhance' | 'restore' | 'toon' | 'photoshoot' | 'remove-bg' | 'style' | 'upscale' | null
  >(null);

  // Upscale state
  const [selectedResolution, setSelectedResolution] = useState<ResolutionOption>('1080p');
  const [upscalePrompt, setUpscalePrompt] = useState<string>('ultra high quality, crystal clear, sharp details, masterwork');
  const [upscaleProgressText, setUpscaleProgressText] = useState<string>('');

  // CSS Filters state (Grayscale, Sepia, Invert, Brightness)
  const [cssFilters, setCssFilters] = useState<CssFilterSettings>(DEFAULT_CSS_FILTERS);
  const filterActive = isFilterActive(cssFilters);
  const cssFilterString = getCssFilterString(cssFilters);

  // Notifications / Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  // Handle image upload from device or sample
  const handleImageSelected = (dataUrl: string, fileName?: string) => {
    try {
      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
        const errorMsg = 'Invalid image format received. Please select a valid photo file (JPG, PNG, WebP).';
        alert(errorMsg);
        showToast('error', errorMsg);
        return;
      }

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const initialVersion: ImageVersion = {
        id: `ver-${Date.now()}`,
        label: fileName || 'Original Photo',
        type: 'original',
        dataUrl,
        timestamp,
      };

      setOriginalImage(dataUrl);
      setCurrentImage(dataUrl);
      setActiveLabel('Original');
      setCurrentDimensionsText('');
      setCurrentResolutionBadge('');
      setCssFilters(DEFAULT_CSS_FILTERS);
      setVersions([initialVersion]);
      setActiveVersionId(initialVersion.id);
      showToast('success', `Photo "${fileName || 'selected'}" loaded! Ready for Remini enhancement.`);
    } catch (err: unknown) {
      console.error('handleImageSelected error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load and preview image.';
      alert(`Image Load Error: ${msg}`);
      showToast('error', msg);
    }
  };

  // Switch between versions in history
  const handleSelectVersion = (version: ImageVersion) => {
    setCurrentImage(version.dataUrl);
    setActiveLabel(version.label);
    setActiveVersionId(version.id);
    setCurrentDimensionsText(version.dimensionsText || '');
    setCurrentResolutionBadge(version.resolutionBadge || '');
    setCssFilters(DEFAULT_CSS_FILTERS);
  };

  // Use current edited image as the next base input
  const handleUseAsInput = () => {
    if (!currentImage) return;
    setOriginalImage(currentImage);
    showToast('success', 'Current result set as the base input for next edit.');
  };

  // 1. Remini Mode 1: Enhance & Fix Blurry Photos
  const handleEnhance = async (options: EnhanceOptions) => {
    if (!currentImage) {
      const msg = 'Please upload or select a photo first.';
      alert(msg);
      showToast('error', msg);
      return;
    }

    setIsProcessing(true);
    setProcessingTask('enhance');

    try {
      const resultDataUrl = await enhanceAndFixBlurry(currentImage, options);
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newVersion: ImageVersion = {
        id: `ver-${Date.now()}`,
        label: 'HD Enhanced',
        type: 'enhance',
        dataUrl: resultDataUrl,
        timestamp,
      };

      setCurrentImage(resultDataUrl);
      setActiveLabel('HD Enhanced');
      setCurrentDimensionsText('');
      setCurrentResolutionBadge('');
      setVersions((prev) => [...prev, newVersion]);
      setActiveVersionId(newVersion.id);
      showToast('success', 'Photo enhanced! Drag the Remini slider to compare Before & After.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error enhancing photo.';
      alert(`Enhance Error: ${msg}`);
      showToast('error', msg);
    } finally {
      setIsProcessing(false);
      setProcessingTask(null);
    }
  };

  // 2. Remini Mode 2: Restore Old Photos
  const handleRestore = async (options: RestoreOptions) => {
    if (!currentImage) {
      const msg = 'Please upload or select a photo first.';
      alert(msg);
      showToast('error', msg);
      return;
    }

    setIsProcessing(true);
    setProcessingTask('restore');

    try {
      const resultDataUrl = await restoreOldPhoto(currentImage, options);
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let modeLabel = 'Restored Photo';
      if (options.mode === 'clean-bw') modeLabel = 'Archival B&W';
      else if (options.mode === 'vintage-sepia') modeLabel = 'Vintage Sepia';
      else if (options.mode === 'polaroid') modeLabel = 'Polaroid Film';
      else if (options.mode === 'restore-color') modeLabel = 'Color Restored';

      const newVersion: ImageVersion = {
        id: `ver-${Date.now()}`,
        label: modeLabel,
        type: 'restore',
        dataUrl: resultDataUrl,
        timestamp,
      };

      setCurrentImage(resultDataUrl);
      setActiveLabel(modeLabel);
      setCurrentDimensionsText('');
      setCurrentResolutionBadge('');
      setVersions((prev) => [...prev, newVersion]);
      setActiveVersionId(newVersion.id);
      showToast('success', `${modeLabel} complete! Scratches smoothed and colors restored.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error restoring photo.';
      alert(`Restore Error: ${msg}`);
      showToast('error', msg);
    } finally {
      setIsProcessing(false);
      setProcessingTask(null);
    }
  };

  // 3. Remini Mode 3: AI Headshot & Toon Filters
  const handleApplyHeadshotToon = async (style: HeadshotToonStyle, intensity: number) => {
    if (!currentImage) {
      showToast('error', 'Please upload a photo first.');
      return;
    }

    setIsProcessing(true);
    setProcessingTask('toon');

    try {
      const resultDataUrl = await applyHeadshotAndToon(currentImage, style, intensity);
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const styleLabels: Record<HeadshotToonStyle, string> = {
        'studio-headshot': 'Pro Headshot',
        'toon-3d': '3D Pixar Toon',
        'anime': 'Anime Character',
        'comic': 'Pop Comic',
        'clay': 'Claymation',
      };
      const label = styleLabels[style] || 'AI Avatar';

      const newVersion: ImageVersion = {
        id: `ver-${Date.now()}`,
        label,
        type: 'toon',
        dataUrl: resultDataUrl,
        timestamp,
      };

      setCurrentImage(resultDataUrl);
      setActiveLabel(label);
      setCurrentDimensionsText('');
      setCurrentResolutionBadge('');
      setVersions((prev) => [...prev, newVersion]);
      setActiveVersionId(newVersion.id);
      showToast('success', `${label} generated! Slide to inspect details.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating portrait style.';
      alert(`Portrait Styling Error: ${msg}`);
      showToast('error', msg);
    } finally {
      setIsProcessing(false);
      setProcessingTask(null);
    }
  };

  // 4. Remini Mode 4: Aesthetic Photoshoot Styles
  const handleApplyPhotoshoot = async (style: PhotoshootStyle, strength: number) => {
    if (!currentImage) {
      showToast('error', 'Please upload a photo first.');
      return;
    }

    setIsProcessing(true);
    setProcessingTask('photoshoot');

    try {
      const resultDataUrl = await applyAestheticPhotoshoot(currentImage, style, strength);
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const shootLabels: Record<PhotoshootStyle, string> = {
        'golden-hour': 'Golden Hour',
        'vogue-editorial': 'Vogue Editorial',
        'cyberpunk-neon': 'Cyberpunk Neon',
        'y2k-dream': 'Y2K Dream Bloom',
        'kodak-portra': 'Kodak Portra 400',
      };
      const label = shootLabels[style] || 'Photoshoot Style';

      const newVersion: ImageVersion = {
        id: `ver-${Date.now()}`,
        label,
        type: 'photoshoot',
        dataUrl: resultDataUrl,
        timestamp,
      };

      setCurrentImage(resultDataUrl);
      setActiveLabel(label);
      setCurrentDimensionsText('');
      setCurrentResolutionBadge('');
      setVersions((prev) => [...prev, newVersion]);
      setActiveVersionId(newVersion.id);
      showToast('success', `Aesthetic photoshoot "${label}" applied!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error applying photoshoot style.';
      alert(`Photoshoot Error: ${msg}`);
      showToast('error', msg);
    } finally {
      setIsProcessing(false);
      setProcessingTask(null);
    }
  };

  // 5. Background Cutout
  const handleRemoveBackground = async (tolerance: number = 38, feather: number = 3) => {
    if (!currentImage) {
      const msg = 'Please upload or select a photo first.';
      alert(msg);
      showToast('error', msg);
      return;
    }

    setIsProcessing(true);
    setProcessingTask('remove-bg');

    try {
      const resultDataUrl = await removeBackgroundFree(currentImage, tolerance, feather);
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newVersion: ImageVersion = {
        id: `ver-${Date.now()}`,
        label: 'Cutout Transparent',
        type: 'remove-bg',
        dataUrl: resultDataUrl,
        timestamp,
      };

      setCurrentImage(resultDataUrl);
      setActiveLabel('Cutout Transparent');
      setCurrentDimensionsText('');
      setCurrentResolutionBadge('');
      setVersions((prev) => [...prev, newVersion]);
      setActiveVersionId(newVersion.id);
      showToast('success', 'Background removed cleanly with transparency!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing background removal.';
      alert(`Background Removal Failed: ${msg}`);
      showToast('error', msg);
    } finally {
      setIsProcessing(false);
      setProcessingTask(null);
    }
  };

  // 6. Resolution Upscaler (144p to 4K)
  const handleUpscale = async () => {
    if (!currentImage) {
      const msg = 'Please upload or edit an image first.';
      alert(msg);
      showToast('error', msg);
      return;
    }

    setIsProcessing(true);
    setProcessingTask('upscale');
    setUpscaleProgressText(`Upscaling to ${selectedResolution} with super-resolution sharpening...`);

    try {
      await new Promise((r) => setTimeout(r, 350));

      const { dataUrl: finalScaledImage, dimensionsText } = await upscaleImageFree(
        currentImage,
        selectedResolution
      );

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newVersion: ImageVersion = {
        id: `ver-${Date.now()}`,
        label: `${selectedResolution} Upscaled`,
        type: 'upscale',
        dataUrl: finalScaledImage,
        timestamp,
        resolutionBadge: selectedResolution,
        dimensionsText,
      };

      setCurrentImage(finalScaledImage);
      setActiveLabel(`${selectedResolution} Upscaled`);
      setCurrentDimensionsText(dimensionsText);
      setCurrentResolutionBadge(selectedResolution);
      setVersions((prev) => [...prev, newVersion]);
      setActiveVersionId(newVersion.id);

      showToast('success', `Photo upscaled to ${selectedResolution} (${dimensionsText})! Ready to download.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error upscaling image.';
      alert(`Upscale Error: ${msg}`);
      showToast('error', msg);
    } finally {
      setIsProcessing(false);
      setProcessingTask(null);
      setUpscaleProgressText('');
    }
  };

  // 7. Save Filtered Image as New Version
  const handleBakeFilter = async () => {
    if (!currentImage) return;
    if (!filterActive) {
      showToast('error', 'No active filters to save.');
      return;
    }
    setIsProcessing(true);
    try {
      const baked = await bakeCssFilters(currentImage, cssFilterString);
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newVersion: ImageVersion = {
        id: `ver-${Date.now()}`,
        label: 'Filtered Photo',
        type: 'style',
        dataUrl: baked,
        timestamp,
      };
      setCurrentImage(baked);
      setActiveLabel('Filtered Photo');
      setVersions((prev) => [...prev, newVersion]);
      setActiveVersionId(newVersion.id);
      setCssFilters(DEFAULT_CSS_FILTERS);
      showToast('success', 'Filtered photo saved as a new version!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save filtered photo.';
      alert(`Filter Save Error: ${msg}`);
      showToast('error', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const isEditedPhoto = versions.length > 1;

  return (
    <div className="min-h-screen bg-[#0b0c12] text-zinc-100 flex flex-col selection:bg-pink-500 selection:text-white bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(236,72,153,0.18),rgba(255,255,255,0))]">
      {/* Toast notification banner */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] transition-all animate-bounce-once">
          <div
            className={`p-3.5 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-[#13151f]/95 border-emerald-500/40 text-emerald-200 shadow-emerald-950/40'
                : 'bg-[#13151f]/95 border-rose-500/40 text-rose-200 shadow-rose-950/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#13151f]/85 backdrop-blur-xl border-b border-pink-500/20 shadow-xl shadow-black/40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-pink-400 via-rose-300 to-pink-200 bg-clip-text text-transparent">
                  Remini Studio
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-pink-400 fill-pink-400" />
                  Free & Instant
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
                AI Photo Enhancer, Old Photo Restore, 3D Toon & 4K Upscaler (No API Keys)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentImage && (
              <button
                type="button"
                onClick={() => {
                  setOriginalImage(null);
                  setCurrentImage(null);
                  setVersions([]);
                  setCurrentDimensionsText('');
                  setCurrentResolutionBadge('');
                  setCssFilters(DEFAULT_CSS_FILTERS);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-pink-300 hover:text-white bg-pink-500/10 hover:bg-pink-500/20 rounded-xl border border-pink-500/30 transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Photo</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Remini Feature Highlights Bar */}
        <div className="w-full bg-[#13151f]/90 backdrop-blur-xl border border-pink-500/25 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-pink-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 shrink-0">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  Remini Quality Enhancement Suite
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  100% Client-Side Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Fix blurry photos, restore vintage archival portraits, generate 3D toon characters, and upscale to 4K with interactive Before/After sliders.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-pink-300 bg-black/40 px-3 py-1.5 rounded-xl border border-pink-500/20">
            <span className="flex items-center gap-1">⚡ Enhance</span>
            <span>•</span>
            <span className="flex items-center gap-1">🕰️ Restore</span>
            <span>•</span>
            <span className="flex items-center gap-1">🎭 AI Toon</span>
            <span>•</span>
            <span className="flex items-center gap-1">📸 Photoshoot</span>
            <span>•</span>
            <span className="flex items-center gap-1">🚀 4K</span>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Upload, Tools & Upscaler */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Upload Photo */}
            <ImageUploader
              onImageSelected={handleImageSelected}
              currentImage={currentImage}
            />

            {/* 2. Remini Editing Modes */}
            <EditingTools
              hasImage={Boolean(currentImage)}
              isProcessing={isProcessing}
              processingTask={processingTask}
              onEnhance={handleEnhance}
              onRestore={handleRestore}
              onApplyHeadshotToon={handleApplyHeadshotToon}
              onApplyPhotoshoot={handleApplyPhotoshoot}
              onRemoveBackground={handleRemoveBackground}
              cssFilters={cssFilters}
              setCssFilters={setCssFilters}
              onBakeFilter={handleBakeFilter}
            />

            {/* 3. Resolution Selector & Upscale Button */}
            <UpscalePanel
              hasImage={Boolean(currentImage)}
              isProcessing={isProcessing}
              processingTask={processingTask}
              selectedResolution={selectedResolution}
              setSelectedResolution={setSelectedResolution}
              upscalePrompt={upscalePrompt}
              setUpscalePrompt={setUpscalePrompt}
              onUpscale={handleUpscale}
              upscaleProgressText={upscaleProgressText}
              isEdited={isEditedPhoto}
            />
          </div>

          {/* Right Column: Preview & Output */}
          <div className="lg:col-span-7 space-y-4">
            {/* Version History Drawer (if multiple edits exist) */}
            <VersionHistory
              versions={versions}
              activeVersionId={activeVersionId}
              onSelectVersion={handleSelectVersion}
            />

            {/* Main Preview with Download & Remini Before/After Split Comparison */}
            <ImagePreview
              originalImage={originalImage}
              currentImage={currentImage}
              activeLabel={activeLabel}
              dimensionsText={currentDimensionsText}
              resolutionBadge={currentResolutionBadge}
              isEdited={versions.length > 1 && activeLabel !== 'Original'}
              onUseAsInput={handleUseAsInput}
              cssFilterString={filterActive ? cssFilterString : undefined}
              isFilterActive={filterActive}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-pink-500/20 bg-[#13151f]/80 backdrop-blur-md py-4 text-center text-xs text-zinc-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-pink-300 font-bold">Remini Studio</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Crafted with <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" /> for instant enhancement
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-pink-400 font-semibold">
            <span>100% Client-Side Engine • Zero API Keys Required</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
