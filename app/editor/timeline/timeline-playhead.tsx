import React, { useRef } from 'react';
import editorStore, { editorActions } from '../shared/store';

interface TimelinePlayheadProps {
  currentTime: number;
  pixelsPerSecond: number;
  timelineHeight: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export const TimelinePlayhead: React.FC<TimelinePlayheadProps> = ({
  currentTime,
  pixelsPerSecond,
  timelineHeight,
  scrollContainerRef,
}) => {
  const x = currentTime * pixelsPerSecond;
  const dragging = useRef(false);
  const wasPlaying = useRef(false);

  const getTimeFromClientX = (clientX: number) => {
    const container = scrollContainerRef?.current ?? document.querySelector<HTMLElement>('[data-timeline-scroll]');
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const contentX = clientX - rect.left + scrollLeft - 40;
    return Math.max(0, contentX / pixelsPerSecond);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragging.current = true;
    wasPlaying.current = editorStore.playback.isPlaying;
    if (wasPlaying.current) editorActions.setPlaying(false);
    (editorStore as any).isScrubbingPlayhead = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const t = getTimeFromClientX(e.clientX);
    if (t !== null) editorActions.setCurrentTime(t); // setCurrentTime, not seekTo — avoid scroll feedback
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    (editorStore as any).isScrubbingPlayhead = false;
    const t = getTimeFromClientX(e.clientX);
    if (t !== null) editorActions.seekTo(t);
    if (wasPlaying.current) editorActions.setPlaying(true);
    wasPlaying.current = false;
  };

  return (
    <div
      className="absolute pointer-events-none z-[3000]"
      style={{ left: `${40 + x}px`, top: 0, height: `${timelineHeight}px` }}
    >
      {/* Playhead line */}
      <div className="w-0.5 h-full bg-red-500" />

      {/* Draggable handle */}
      <div
        className="absolute -top-1 -translate-x-1/2 left-0 w-5 h-5 bg-red-500 rounded-full border-2 border-white/60 cursor-grab active:cursor-grabbing pointer-events-auto touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
};