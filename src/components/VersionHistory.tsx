import React from 'react';
import { Layers, Scissors, Sparkles, Image as ImageIcon, Zap, History, Smile, Camera } from 'lucide-react';

export interface ImageVersion {
  id: string;
  label: string;
  type: 'original' | 'enhance' | 'restore' | 'toon' | 'photoshoot' | 'remove-bg' | 'style' | 'upscale';
  dataUrl: string;
  timestamp: string;
  resolutionBadge?: string;
  dimensionsText?: string;
}

interface VersionHistoryProps {
  versions: ImageVersion[];
  activeVersionId: string;
  onSelectVersion: (version: ImageVersion) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  activeVersionId,
  onSelectVersion,
}) => {
  if (versions.length <= 1) return null;

  const getIcon = (type: ImageVersion['type']) => {
    switch (type) {
      case 'enhance':
        return <Zap className="w-3 h-3 text-pink-400 shrink-0 fill-pink-400" />;
      case 'restore':
        return <History className="w-3 h-3 text-pink-400 shrink-0" />;
      case 'toon':
        return <Smile className="w-3 h-3 text-pink-400 shrink-0" />;
      case 'photoshoot':
        return <Camera className="w-3 h-3 text-pink-400 shrink-0" />;
      case 'remove-bg':
        return <Scissors className="w-3 h-3 text-pink-400 shrink-0" />;
      case 'upscale':
        return <Layers className="w-3 h-3 text-rose-400 shrink-0" />;
      default:
        return <ImageIcon className="w-3 h-3 text-zinc-400 shrink-0" />;
    }
  };

  return (
    <div className="w-full bg-[#13151f]/95 backdrop-blur-xl border border-pink-500/25 rounded-2xl p-3 md:p-3.5 shadow-xl shadow-pink-950/20 text-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-pink-200 flex items-center gap-1.5 uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-pink-400" />
          Remini Version History ({versions.length})
        </span>
        <span className="text-[10px] text-zinc-400">Click to compare or inspect</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {versions.map((ver, idx) => {
          const isActive = ver.id === activeVersionId;
          return (
            <button
              key={ver.id}
              type="button"
              onClick={() => onSelectVersion(ver)}
              className={`shrink-0 flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-pink-500/25 border-pink-400 ring-2 ring-pink-400/50 shadow-md'
                  : 'bg-black/40 border-white/10 hover:bg-white/5'
              }`}
            >
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-black/60 checkerboard-bg shrink-0 border border-white/10">
                <img
                  src={ver.dataUrl}
                  alt={ver.label}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="pr-2 max-w-[120px]">
                <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-100 truncate">
                  {getIcon(ver.type)}
                  <span className="truncate">{ver.label}</span>
                </div>
                <div className="text-[10px] text-pink-400 font-medium">
                  {ver.resolutionBadge ? `${ver.resolutionBadge} • ` : ''}v{idx + 1}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
