import React from 'react';
import { Maximize2, Sparkles, Loader2 } from 'lucide-react';
import { RESOLUTION_OPTIONS, ResolutionOption } from '../utils/imageScaling';

interface UpscalePanelProps {
  hasImage: boolean;
  isProcessing: boolean;
  processingTask: string | null;
  selectedResolution: ResolutionOption;
  setSelectedResolution: (res: ResolutionOption) => void;
  upscalePrompt: string;
  setUpscalePrompt: (prompt: string) => void;
  onUpscale: () => void;
  upscaleProgressText?: string;
  isEdited: boolean;
}

export const UpscalePanel: React.FC<UpscalePanelProps> = ({
  hasImage,
  isProcessing,
  processingTask,
  selectedResolution,
  setSelectedResolution,
  upscalePrompt,
  setUpscalePrompt,
  onUpscale,
  upscaleProgressText,
  isEdited,
}) => {
  const isUpscaling = isProcessing && processingTask === 'upscale';

  return (
    <div className="w-full bg-[#13151f]/95 backdrop-blur-xl border border-pink-500/25 rounded-3xl shadow-xl shadow-pink-950/20 p-4 sm:p-5 space-y-4 text-white">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-pink-500/15">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-pink-400" />
            Remini Ultra 4K Quality Upscaler
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
              144p to 4K
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Scales outputs up to 3840×2160 Ultra HD with multi-pass bicubic unsharp masking.
          </p>
        </div>
      </div>

      {/* Resolution Selector Options */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-zinc-200">
          Target Output Resolution:
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {RESOLUTION_OPTIONS.map((res) => {
            const isSelected = selectedResolution === res.id;
            return (
              <button
                key={res.id}
                type="button"
                onClick={() => setSelectedResolution(res.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all ${
                  isSelected
                    ? 'bg-gradient-to-b from-pink-500 to-rose-600 text-white border-pink-400 shadow-lg shadow-pink-600/30 ring-2 ring-pink-400/50 scale-[1.02]'
                    : 'bg-black/40 hover:bg-white/5 text-zinc-300 border-white/10'
                }`}
              >
                <span className="text-sm font-extrabold text-white">
                  {res.label}
                </span>
                <span
                  className={`text-[9px] font-semibold mt-0.5 px-1.5 py-0.2 rounded ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-pink-950/60 text-pink-300'
                  }`}
                >
                  {res.badge}
                </span>
                <span className={`text-[9px] mt-0.5 truncate max-w-full ${isSelected ? 'text-pink-100' : 'text-zinc-500'}`}>
                  {res.id === '4K' ? '3840×2160' : res.id === '1080p' ? '1920×1080' : res.id === '720p' ? '1280×720' : res.id === '480p' ? '854×480' : '256×144'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live progress banner when upscaling */}
      {isUpscaling && (
        <div className="p-3 bg-pink-950/60 border border-pink-500/40 rounded-2xl space-y-2 animate-pulse text-xs">
          <div className="flex items-center gap-2 font-bold text-pink-200">
            <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
            <span>{upscaleProgressText || `Synthesizing ${selectedResolution} sharp pixels...`}</span>
          </div>
          <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-full w-2/3 animate-[pulse_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        type="button"
        disabled={!hasImage || isProcessing}
        onClick={onUpscale}
        className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] ${
          !hasImage
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
            : isUpscaling
            ? 'bg-pink-600 text-white cursor-wait'
            : 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-pink-600/30 hover:shadow-pink-600/50'
        }`}
      >
        {isUpscaling ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Upscaling to {selectedResolution}...</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-5 h-5" />
            <span>Upscale to {selectedResolution}</span>
          </>
        )}
      </button>
    </div>
  );
};
