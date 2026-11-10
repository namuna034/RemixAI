import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  History,
  Smile,
  Camera,
  Scissors,
  Sliders,
  Sun,
  RotateCcw,
  Check,
  Layers,
  Loader2,
  Wand2,
  Eye,
  Film,
  Aperture,
  Palette,
  ShieldCheck,
} from 'lucide-react';
import {
  EnhanceOptions,
  DEFAULT_ENHANCE_OPTIONS,
  RestoreOptions,
  DEFAULT_RESTORE_OPTIONS,
  RestoreMode,
  HeadshotToonStyle,
  PhotoshootStyle,
} from '../utils/freeImageEngine';

export interface CssFilterSettings {
  grayscale: number; // 0 - 100%
  sepia: number;     // 0 - 100%
  invert: number;    // 0 - 100%
  brightness: number;// 0 - 200% (default 100%)
}

export const DEFAULT_CSS_FILTERS: CssFilterSettings = {
  grayscale: 0,
  sepia: 0,
  invert: 0,
  brightness: 100,
};

export function getCssFilterString(f: CssFilterSettings): string {
  return `grayscale(${f.grayscale}%) sepia(${f.sepia}%) invert(${f.invert}%) brightness(${f.brightness}%)`;
}

export function isFilterActive(f: CssFilterSettings): boolean {
  return f.grayscale > 0 || f.sepia > 0 || f.invert > 0 || f.brightness !== 100;
}

export type ReminiMode = 'enhance' | 'restore' | 'toon' | 'photoshoot' | 'utilities';

interface EditingToolsProps {
  hasImage: boolean;
  isProcessing: boolean;
  processingTask: string | null;
  onEnhance: (options: EnhanceOptions) => void;
  onRestore: (options: RestoreOptions) => void;
  onApplyHeadshotToon: (style: HeadshotToonStyle, intensity: number) => void;
  onApplyPhotoshoot: (style: PhotoshootStyle, strength: number) => void;
  onRemoveBackground: (tolerance?: number, feather?: number) => void;
  cssFilters: CssFilterSettings;
  setCssFilters: React.Dispatch<React.SetStateAction<CssFilterSettings>>;
  onBakeFilter?: () => void;
}

export const EditingTools: React.FC<EditingToolsProps> = ({
  hasImage,
  isProcessing,
  processingTask,
  onEnhance,
  onRestore,
  onApplyHeadshotToon,
  onApplyPhotoshoot,
  onRemoveBackground,
  cssFilters,
  setCssFilters,
  onBakeFilter,
}) => {
  const [activeTab, setActiveTab] = useState<ReminiMode>('enhance');

  // Mode 1: Enhance State
  const [enhanceOptions, setEnhanceOptions] = useState<EnhanceOptions>(DEFAULT_ENHANCE_OPTIONS);

  // Mode 2: Restore State
  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>(DEFAULT_RESTORE_OPTIONS);

  // Mode 3: Headshot & Toon State
  const [selectedToonStyle, setSelectedToonStyle] = useState<HeadshotToonStyle>('studio-headshot');
  const [toonIntensity, setToonIntensity] = useState<number>(80);

  // Mode 4: Photoshoot State
  const [selectedPhotoshoot, setSelectedPhotoshoot] = useState<PhotoshootStyle>('golden-hour');
  const [photoshootStrength, setPhotoshootStrength] = useState<number>(80);

  // Utilities State
  const [cutoutTolerance, setCutoutTolerance] = useState<number>(38);

  const filterActive = isFilterActive(cssFilters);

  const handleFilterChange = (key: keyof CssFilterSettings, value: number) => {
    setCssFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="w-full bg-[#13151f]/95 backdrop-blur-xl border border-pink-500/25 rounded-3xl shadow-xl shadow-pink-950/30 overflow-hidden text-white transition-all">
      {/* Remini Mode Header Bar */}
      <div className="p-3 border-b border-pink-500/15 bg-gradient-to-r from-pink-950/40 via-purple-950/20 to-pink-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-xs">
            <Wand2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-extrabold tracking-wider uppercase text-pink-200">
            Remini Studio Modes
          </span>
        </div>
        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          100% Client-Side Engine
        </span>
      </div>

      {/* Remini Signature Tabs */}
      <div className="grid grid-cols-5 p-1.5 gap-1 bg-black/40 border-b border-pink-500/10">
        {/* Tab 1: Enhance */}
        <button
          type="button"
          onClick={() => setActiveTab('enhance')}
          className={`py-2 px-1.5 rounded-2xl text-[11px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'enhance'
              ? 'bg-gradient-to-b from-pink-500 to-rose-600 text-white shadow-md shadow-pink-600/30 ring-1 ring-pink-400'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span className="truncate w-full text-center">Enhance</span>
        </button>

        {/* Tab 2: Restore */}
        <button
          type="button"
          onClick={() => setActiveTab('restore')}
          className={`py-2 px-1.5 rounded-2xl text-[11px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'restore'
              ? 'bg-gradient-to-b from-pink-500 to-rose-600 text-white shadow-md shadow-pink-600/30 ring-1 ring-pink-400'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <History className="w-4 h-4" />
          <span className="truncate w-full text-center">Restore</span>
        </button>

        {/* Tab 3: Headshot & Toon */}
        <button
          type="button"
          onClick={() => setActiveTab('toon')}
          className={`py-2 px-1.5 rounded-2xl text-[11px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'toon'
              ? 'bg-gradient-to-b from-pink-500 to-rose-600 text-white shadow-md shadow-pink-600/30 ring-1 ring-pink-400'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Smile className="w-4 h-4" />
          <span className="truncate w-full text-center">AI Toon</span>
        </button>

        {/* Tab 4: Photoshoot */}
        <button
          type="button"
          onClick={() => setActiveTab('photoshoot')}
          className={`py-2 px-1.5 rounded-2xl text-[11px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'photoshoot'
              ? 'bg-gradient-to-b from-pink-500 to-rose-600 text-white shadow-md shadow-pink-600/30 ring-1 ring-pink-400'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span className="truncate w-full text-center">Photoshoot</span>
        </button>

        {/* Tab 5: Tools & Cutout */}
        <button
          type="button"
          onClick={() => setActiveTab('utilities')}
          className={`py-2 px-1.5 rounded-2xl text-[11px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'utilities'
              ? 'bg-gradient-to-b from-pink-500 to-rose-600 text-white shadow-md shadow-pink-600/30 ring-1 ring-pink-400'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span className="truncate w-full text-center">Cutout & Filters</span>
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* ========================================================= */}
        {/* MODE 1: ENHANCE & FIX BLURRY PHOTOS                       */}
        {/* ========================================================= */}
        {activeTab === 'enhance' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-pink-400 fill-pink-400" />
                  Enhance & Fix Blurry Photos
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    High-Pass Unmask
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Synthesizes fine micro-details, eliminates motion & lens blur, and enhances facial clarity.
                </p>
              </div>
            </div>

            {/* Quick 1-Click Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-pink-300">Quick Enhancement Presets:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { name: 'Face Focus HD', s: 75, d: 70, cl: 55, co: 45 },
                  { name: 'Ultra Sharp', s: 95, d: 85, cl: 70, co: 50 },
                  { name: 'Soft De-blur', s: 50, d: 45, cl: 35, co: 30 },
                  { name: 'Micro Details', s: 85, d: 60, cl: 80, co: 40 },
                ].map((preset) => {
                  const isCurrent =
                    enhanceOptions.sharpness === preset.s &&
                    enhanceOptions.deblur === preset.d &&
                    enhanceOptions.clarity === preset.cl &&
                    enhanceOptions.contrast === preset.co;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        setEnhanceOptions({
                          sharpness: preset.s,
                          deblur: preset.d,
                          clarity: preset.cl,
                          contrast: preset.co,
                        })
                      }
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                        isCurrent
                          ? 'bg-pink-500/25 border-pink-400 text-pink-200 ring-1 ring-pink-400/50'
                          : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-bold">{preset.name}</div>
                      <div className="text-[10px] text-zinc-400">+{preset.s}% sharp</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fine-Tuning Sliders */}
            <div className="space-y-3 p-3.5 bg-black/40 rounded-2xl border border-white/10 text-xs">
              {/* Sharpness Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">Sharpness (Unsharp Mask):</span>
                  <span className="font-mono text-pink-400 font-bold bg-pink-950/60 px-2 py-0.5 rounded border border-pink-500/30">
                    {enhanceOptions.sharpness}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={enhanceOptions.sharpness}
                  onChange={(e) =>
                    setEnhanceOptions((prev) => ({ ...prev, sharpness: parseInt(e.target.value, 10) }))
                  }
                  className="w-full accent-pink-500 cursor-pointer"
                />
              </div>

              {/* De-blur Power */}
              <div className="space-y-1 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">De-blur Frequency Power:</span>
                  <span className="font-mono text-pink-400 font-bold bg-pink-950/60 px-2 py-0.5 rounded border border-pink-500/30">
                    {enhanceOptions.deblur}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={enhanceOptions.deblur}
                  onChange={(e) =>
                    setEnhanceOptions((prev) => ({ ...prev, deblur: parseInt(e.target.value, 10) }))
                  }
                  className="w-full accent-pink-500 cursor-pointer"
                />
              </div>

              {/* Clarity & Midtones */}
              <div className="space-y-1 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">Clarity & Feature Separation:</span>
                  <span className="font-mono text-pink-400 font-bold bg-pink-950/60 px-2 py-0.5 rounded border border-pink-500/30">
                    {enhanceOptions.clarity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={enhanceOptions.clarity}
                  onChange={(e) =>
                    setEnhanceOptions((prev) => ({ ...prev, clarity: parseInt(e.target.value, 10) }))
                  }
                  className="w-full accent-pink-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Action CTA */}
            <button
              type="button"
              disabled={!hasImage || isProcessing}
              onClick={() => onEnhance(enhanceOptions)}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] ${
                !hasImage
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : isProcessing && processingTask === 'enhance'
                  ? 'bg-pink-600 text-white cursor-wait'
                  : 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-pink-600/30 hover:shadow-pink-600/50'
              }`}
            >
              {isProcessing && processingTask === 'enhance' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enhancing Micro-Details...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-white" />
                  <span>Enhance & Fix Photo</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 2: RESTORE OLD PHOTOS                                */}
        {/* ========================================================= */}
        {activeTab === 'restore' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-pink-400" />
                Restore Old Photos
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Denoise & Sepia Repair
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Removes film noise, scratches, and yellowed fading. Restores rich dynamic range and vibrant colors.
              </p>
            </div>

            {/* Restoration Tone Mode Selection */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-pink-300">Choose Restoration Tone:</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'restore-color',
                    title: 'Revitalize Colors',
                    desc: 'Auto-corrects fading & boosts true color',
                    icon: '🎨',
                  },
                  {
                    id: 'clean-bw',
                    title: 'Archival Clean B&W',
                    desc: 'Pure crisp monochrome silver halide',
                    icon: '🎞️',
                  },
                  {
                    id: 'vintage-sepia',
                    title: 'Authentic 1900s Sepia',
                    desc: 'Rich warm vintage archival tones',
                    icon: '📜',
                  },
                  {
                    id: 'polaroid',
                    title: '1970s Polaroid Film',
                    desc: 'Nostalgic warm shadows and soft tones',
                    icon: '📷',
                  },
                ].map((m) => {
                  const isSelected = restoreOptions.mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setRestoreOptions((prev) => ({ ...prev, mode: m.id as RestoreMode }))
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-pink-500/25 border-pink-400 text-white ring-1 ring-pink-400/50'
                          : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span>{m.icon}</span>
                        <span>{m.title}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{m.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders: Denoise and Fade Recovery */}
            <div className="space-y-3 p-3.5 bg-black/40 rounded-2xl border border-white/10 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">Denoise & Scratch Smoothing:</span>
                  <span className="font-mono text-pink-400 font-bold bg-pink-950/60 px-2 py-0.5 rounded border border-pink-500/30">
                    {restoreOptions.denoise}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={restoreOptions.denoise}
                  onChange={(e) =>
                    setRestoreOptions((prev) => ({ ...prev, denoise: parseInt(e.target.value, 10) }))
                  }
                  className="w-full accent-pink-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">Fade Recovery (Contrast Stretch):</span>
                  <span className="font-mono text-pink-400 font-bold bg-pink-950/60 px-2 py-0.5 rounded border border-pink-500/30">
                    {restoreOptions.fadeRecovery}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={restoreOptions.fadeRecovery}
                  onChange={(e) =>
                    setRestoreOptions((prev) => ({ ...prev, fadeRecovery: parseInt(e.target.value, 10) }))
                  }
                  className="w-full accent-pink-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Action CTA */}
            <button
              type="button"
              disabled={!hasImage || isProcessing}
              onClick={() => onRestore(restoreOptions)}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] ${
                !hasImage
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : isProcessing && processingTask === 'restore'
                  ? 'bg-pink-600 text-white cursor-wait'
                  : 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-pink-600/30 hover:shadow-pink-600/50'
              }`}
            >
              {isProcessing && processingTask === 'restore' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Restoring Archival Photo...</span>
                </>
              ) : (
                <>
                  <History className="w-5 h-5" />
                  <span>Restore Old Photo</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 3: AI HEADSHOT & TOON FILTERS                        */}
        {/* ========================================================= */}
        {activeTab === 'toon' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Smile className="w-4 h-4 text-pink-400" />
                AI Headshot & Toon Filters
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Stylized Portraits
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Turn photos into polished studio headshots or iconic 3D animation and anime avatars.
              </p>
            </div>

            {/* Character / Headshot Style Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'studio-headshot', title: 'Studio Headshot', desc: 'Porcelain skin & studio rim light', icon: '👔' },
                { id: 'toon-3d', title: '3D Toon Animation', desc: 'Pixar / Disney character style', icon: '🧸' },
                { id: 'anime', title: 'Anime & Manga', desc: 'Cel-shading & ink contours', icon: '✨' },
                { id: 'comic', title: 'Pop Comic Art', desc: 'Warhol halftone & vibrant pop', icon: '💥' },
                { id: 'clay', title: 'Claymation Figure', desc: 'Tactile stop-motion matte look', icon: '🎨' },
              ].map((style) => {
                const isSelected = selectedToonStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedToonStyle(style.id as HeadshotToonStyle)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-pink-500/25 border-pink-400 text-white ring-1 ring-pink-400/50'
                        : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-base mb-1">{style.icon}</div>
                    <div className="font-bold text-xs">{style.title}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{style.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Intensity Slider */}
            <div className="space-y-1.5 p-3.5 bg-black/40 rounded-2xl border border-white/10 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200">Styling Strength / Detail Weight:</span>
                <span className="font-mono text-pink-400 font-bold bg-pink-950/60 px-2 py-0.5 rounded border border-pink-500/30">
                  {toonIntensity}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={toonIntensity}
                onChange={(e) => setToonIntensity(parseInt(e.target.value, 10))}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            {/* Action CTA */}
            <button
              type="button"
              disabled={!hasImage || isProcessing}
              onClick={() => onApplyHeadshotToon(selectedToonStyle, toonIntensity)}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] ${
                !hasImage
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : isProcessing && processingTask === 'toon'
                  ? 'bg-pink-600 text-white cursor-wait'
                  : 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-pink-600/30 hover:shadow-pink-600/50'
              }`}
            >
              {isProcessing && processingTask === 'toon' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating AI Portrait...</span>
                </>
              ) : (
                <>
                  <Smile className="w-5 h-5" />
                  <span>Generate {selectedToonStyle === 'studio-headshot' ? 'Pro Headshot' : 'AI Character'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 4: AESTHETIC PHOTOSHOOT STYLES                       */}
        {/* ========================================================= */}
        {activeTab === 'photoshoot' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-pink-400" />
                Aesthetic Photoshoot Styles
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Virtual Studio
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Applies cinematic lighting, golden hour washes, halation bloom, and 35mm editorial film curves.
              </p>
            </div>

            {/* Photoshoot Theme Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'golden-hour', title: 'Golden Hour Glow', desc: 'Warm 3200K sunset illumination', icon: '🌅' },
                { id: 'vogue-editorial', title: 'Vogue Editorial', desc: 'Velvet shadows & luminous skin', icon: '💎' },
                { id: 'cyberpunk-neon', title: 'Cyberpunk Neon', desc: 'Cyan highlights & magenta rims', icon: '⚡' },
                { id: 'y2k-dream', title: 'Y2K Dream Bloom', desc: 'Dreamy soft halation glow', icon: '🌸' },
                { id: 'kodak-portra', title: 'Kodak Portra 400', desc: 'Authentic 35mm film curve', icon: '🎞️' },
              ].map((style) => {
                const isSelected = selectedPhotoshoot === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedPhotoshoot(style.id as PhotoshootStyle)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-pink-500/25 border-pink-400 text-white ring-1 ring-pink-400/50'
                        : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-base mb-1">{style.icon}</div>
                    <div className="font-bold text-xs">{style.title}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{style.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Strength Slider */}
            <div className="space-y-1.5 p-3.5 bg-black/40 rounded-2xl border border-white/10 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200">Photoshoot Atmosphere Strength:</span>
                <span className="font-mono text-pink-400 font-bold bg-pink-950/60 px-2 py-0.5 rounded border border-pink-500/30">
                  {photoshootStrength}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={photoshootStrength}
                onChange={(e) => setPhotoshootStrength(parseInt(e.target.value, 10))}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            {/* Action CTA */}
            <button
              type="button"
              disabled={!hasImage || isProcessing}
              onClick={() => onApplyPhotoshoot(selectedPhotoshoot, photoshootStrength)}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] ${
                !hasImage
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : isProcessing && processingTask === 'photoshoot'
                  ? 'bg-pink-600 text-white cursor-wait'
                  : 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-pink-600/30 hover:shadow-pink-600/50'
              }`}
            >
              {isProcessing && processingTask === 'photoshoot' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Applying Photoshoot Lighting...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span>Apply Photoshoot Style</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 5: CUTOUT & LIVE CSS FILTERS                         */}
        {/* ========================================================= */}
        {activeTab === 'utilities' && (
          <div className="space-y-4 animate-fade-in">
            {/* Cutout Section */}
            <div className="p-3.5 bg-black/40 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-pink-400" />
                  Background Cutout
                </span>
                <span className="font-mono text-pink-400 text-xs font-bold">
                  Tol: {cutoutTolerance}
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="80"
                value={cutoutTolerance}
                onChange={(e) => setCutoutTolerance(parseInt(e.target.value, 10))}
                className="w-full accent-pink-500 cursor-pointer"
              />
              <button
                type="button"
                disabled={!hasImage || isProcessing}
                onClick={() => onRemoveBackground(cutoutTolerance, 3)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 transition-all flex items-center justify-center gap-1.5"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Remove Background Now</span>
              </button>
            </div>

            {/* Real-time CSS Filter Sliders */}
            <div className="p-3.5 bg-black/40 rounded-2xl border border-white/10 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-pink-400" />
                  Real-time Color & Exposure Sliders
                </span>
                {filterActive && (
                  <button
                    type="button"
                    onClick={() => setCssFilters(DEFAULT_CSS_FILTERS)}
                    className="text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-300 mb-1">
                    <span>Grayscale</span>
                    <span>{cssFilters.grayscale}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={cssFilters.grayscale}
                    onChange={(e) => handleFilterChange('grayscale', parseInt(e.target.value, 10))}
                    className="w-full accent-pink-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-300 mb-1">
                    <span>Sepia</span>
                    <span>{cssFilters.sepia}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={cssFilters.sepia}
                    onChange={(e) => handleFilterChange('sepia', parseInt(e.target.value, 10))}
                    className="w-full accent-pink-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-300 mb-1">
                    <span>Invert</span>
                    <span>{cssFilters.invert}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={cssFilters.invert}
                    onChange={(e) => handleFilterChange('invert', parseInt(e.target.value, 10))}
                    className="w-full accent-pink-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-300 mb-1">
                    <span>Brightness</span>
                    <span>{cssFilters.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={cssFilters.brightness}
                    onChange={(e) => handleFilterChange('brightness', parseInt(e.target.value, 10))}
                    className="w-full accent-pink-500"
                  />
                </div>
              </div>

              {onBakeFilter && filterActive && (
                <button
                  type="button"
                  onClick={onBakeFilter}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white transition-all shadow-md"
                >
                  Save Filter Adjustments into Photo
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
