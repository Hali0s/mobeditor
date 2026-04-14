import React from 'react';
import { ChevronFirst, ChevronLast, Pause, Play, ZoomIn, ZoomOut } from 'lucide-react';
import { usePlayback } from '../timeline/controls/hooks/use-playback';
import editorStore, { editorActions } from '../shared/store';
import { useSnapshot } from 'valtio';

export const ControlsArea: React.FC = () => {
  const { snapshot: pb, handlePlayPause, handleStop, handleSpeedChange, formatTime } = usePlayback();
  const snap = useSnapshot(editorStore);

  const atStart = pb.playback.currentTime <= 0.001;
  const atEnd = pb.playback.currentTime >= snap.totalDuration - 0.001;

  return (
    <div className="px-3 py-2 text-white">
      <div className="flex items-center gap-2">
        <button
          className="p-3 rounded-2xl bg-white/5 active:bg-white/10 flex items-center justify-center"
          aria-label="Jump to start"
          onClick={() => editorActions.seekTo(0)}
          disabled={atStart}
        >
          <ChevronFirst size={18} />
        </button>

        <button
          className="flex-1 py-3 rounded-2xl bg-white/10 active:bg-white/15 font-medium"
          onClick={handlePlayPause}
          aria-label={pb.playback.isPlaying ? 'Pause' : 'Play'}
        >
          <div className="flex items-center justify-center gap-2">
            {pb.playback.isPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span>{pb.playback.isPlaying ? 'Пауза' : 'Играть'}</span>
          </div>
        </button>

        <button
          className="p-3 rounded-2xl bg-white/5 active:bg-white/10 flex items-center justify-center"
          aria-label="Jump to end"
          onClick={() => editorActions.seekTo(snap.totalDuration)}
          disabled={atEnd}
        >
          <ChevronLast size={18} />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-white/70">
        <div>
          {formatTime(pb.playback.currentTime)} / {formatTime(snap.totalDuration)}
        </div>
        <div className="flex items-center gap-2">
          {/* Timeline zoom */}
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 rounded-lg bg-white/5 active:bg-white/10"
              aria-label="Уменьшить масштаб"
              onClick={() => editorActions.setTimelineZoom(Math.max(1, snap.timelineZoom / 1.5))}
            >
              <ZoomOut size={14} />
            </button>
            <span className="w-8 text-center opacity-60">{Math.round(snap.timelineZoom)}px</span>
            <button
              className="p-1.5 rounded-lg bg-white/5 active:bg-white/10"
              aria-label="Увеличить масштаб"
              onClick={() => editorActions.setTimelineZoom(Math.min(100, snap.timelineZoom * 1.5))}
            >
              <ZoomIn size={14} />
            </button>
          </div>
          <label className="flex items-center gap-1.5">
            <span className="opacity-70">Скорость</span>
            <select
              className="bg-black/60 rounded-lg px-2 py-1 outline-none"
              value={pb.playback.playbackRate}
              onChange={handleSpeedChange}
            >
              {[0.25, 0.5, 1, 1.5, 2, 3, 4].map(v => (
                <option key={v} value={v}>{v}x</option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ControlsArea;
