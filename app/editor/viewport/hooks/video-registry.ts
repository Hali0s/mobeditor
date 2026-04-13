/**
 * Global registry of active HTMLVideoElement instances keyed by clip ID.
 * Used by the export pipeline to seek all videos before capturing a frame.
 */
const _registry = new Map<string, HTMLVideoElement>();

export const videoRegistry = {
  register(clipId: string, video: HTMLVideoElement) {
    _registry.set(clipId, video);
  },
  unregister(clipId: string) {
    _registry.delete(clipId);
  },
  getAll(): ReadonlyMap<string, HTMLVideoElement> {
    return _registry;
  },
};
