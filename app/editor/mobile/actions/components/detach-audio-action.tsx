import React from 'react';
import { AudioLines } from 'lucide-react';
import ActionButton from './action-button';
import { useSnapshot } from 'valtio';
import editorStore, { editorActions } from '../../../shared/store';

export const DetachAudioAction: React.FC<{ clipId: string }> = ({ clipId }) => {
  const snap = useSnapshot(editorStore);
  const clip = snap.tracks.flatMap(t => t.clips).find(c => c.id === clipId);
  const asset = clip ? snap.assets[clip.assetId] : null;
  if (!clip || !asset || asset.type !== 'video') return null;

  return (
    <ActionButton onClick={() => editorActions.detachAudio(clipId)}>
      <AudioLines size={18} />
      <span className="text-[10px] opacity-80">Звук отд.</span>
    </ActionButton>
  );
};

export default DetachAudioAction;
