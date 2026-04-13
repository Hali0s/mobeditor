import React from 'react';
import { VideoViewport } from '../viewport/video-viewport';
import { useSnapshot } from 'valtio';
import editorStore, { editorActions } from '../shared/store';

const ASPECT_PRESETS = [
  { label: 'Авто', w: null as null, h: null as null },
  { label: '16:9', w: 16, h: 9 },
  { label: '9:16', w: 9, h: 16 },
  { label: '1:1', w: 1, h: 1 },
  { label: '4:3', w: 4, h: 3 },
];

export const PreviewArea: React.FC = () => {
  const snap = useSnapshot(editorStore);
  const { aspectW, aspectH } = snap.composition;

  const handleAuto = () => {
    // Find first video/image asset in any clip and use its dimensions
    for (const track of snap.tracks) {
      for (const clip of track.clips) {
        const asset = snap.assets[clip.assetId] as any;
        if ((asset?.type === 'video' || asset?.type === 'image') && asset.width && asset.height) {
          editorActions.setExportDimensions(asset.width, asset.height); // also updates aspect
          // compute gcd for aspect ratio
          const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
          const g = gcd(asset.width, asset.height) || 1;
          editorActions.setAspectRatio(Math.floor(asset.width / g), Math.floor(asset.height / g));
          return;
        }
      }
    }
    // No media found — reset to 16:9
    editorActions.setAspectRatio(16, 9);
  };

  const isPresetActive = (w: number, h: number) => aspectW === w && aspectH === h;

  return (
    <div className="flex flex-col gap-1.5 px-3">
      {/* Aspect ratio buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {ASPECT_PRESETS.map((p) => {
          const active = p.w !== null && isPresetActive(p.w, p.h);
          return (
            <button
              key={p.label}
              onClick={() => {
                if (p.w === null) {
                  handleAuto();
                } else {
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
