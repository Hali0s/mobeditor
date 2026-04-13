import React from 'react';
import { Layers } from 'lucide-react';
import ActionButton from './action-button';
import { editorActions } from '../../../shared/store';

export const AddTrackAction: React.FC = () => {
  return (
    <ActionButton onClick={() => editorActions.addTrack({ name: 'Новая дорожка' })}>
      <Layers size={18} />
      <span className="text-[10px] opacity-80">Дорожка</span>
    </ActionButton>
  );
};

export default AddTrackAction;
