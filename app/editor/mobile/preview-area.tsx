import React from 'react';
import { VideoViewport } from '../viewport/video-viewport';
import { useSnapshot } from 'valtio';
import editorStore, { editorActions } from '../shared/store';

const ASPECT_PRESETS = [
  { label: 'Авто', w: null, h: null },
  { label: '16:9', w: 16, h: 9 },
  { label: '9:16', w: 9, h: 16 },
  { label: '1:1', w: 1, h: 1 },
  { label: '4:3', w: 4, h: 3 },
] as const;

export const PreviewArea: React.FC = () => {
  const snap = useSnapshot(editorStore);
  const { aspectW, aspectH } = snap.composition;

  const isActive = (w: number | null, h: number | null) => {
    if (w === null) return false; // Авто never "active" by ratio
    return aspectW === w && aspectH === h;
  };

  return (
    <div className="flex flex-col gap-1.5 px-3">
      {/* Aspect ratio buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {ASPECT_PRESETS.map((p) => {
          const active = p.w !== null && isActive(p.w, p.h);
          return (
            <button
              key={p.label}
              onClick={() => {
                if (p.w !== null && p.h !== null) {
                  editorActions.setAspectRatio(p.w, p.h);
                }
              }}
              className={[
                'shrink-0 px-3 py-1 rounded-xl text-xs font-medium border transition-colors',
                active
                  ? 'bg-white text-black border-white'
                  : 'bg-white/5 text-white/70 border-white/10 active:bg-white/10',
              ].join(' ')}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Preview canvas */}
      <div className="relative" style={{ height: '38dvh' }}>
        <div className="absolute inset-0 rounded-2xl overflow-hidden bg-black/80 backdrop-blur">
          <VideoViewport />
        </div>
      </div>
    </div>
  );
};

export default PreviewArea;
