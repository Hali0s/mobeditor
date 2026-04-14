import React from 'react';
import { Film, FilePlus } from 'lucide-react';
import { CompositionSettingsDrawer } from './settings/composition-drawer';
import { ExportSettingsDrawer } from './settings/export-drawer';
import ExportToast from './settings/export-toast';
import { editorActions } from '../shared/store';
import { clearPersistedProject } from '../shared/persistence';

interface HeaderBarProps {
  onHome?: () => void;
  onExport?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onHome, onExport }) => {
  const handleNewProject = () => {
    if (!window.confirm('Начать новый проект? Все несохранённые изменения будут потеряны.')) return;
    clearPersistedProject().catch(() => {});
    editorActions.resetProject();
  };

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-black/95 text-white backdrop-blur supports-[backdrop-filter]:bg-black/70">
      <div className="flex items-center gap-1">
        <CompositionSettingsDrawer>
          <button
            aria-label="Composition Settings"
            className="p-2 rounded-xl bg-white/5 active:bg-white/10"
          >
            <Film size={18} />
          </button>
        </CompositionSettingsDrawer>
        <button
          aria-label="Новый проект"
          title="Новый проект"
          className="p-2 rounded-xl bg-white/5 active:bg-white/10 text-white/60 hover:text-white/90"
          onClick={handleNewProject}
        >
          <FilePlus size={16} />
        </button>
      </div>
      <div className="text-sm font-medium opacity-80">FZ-Editor</div>
      <div className="relative flex items-center gap-1.5">
        <a
          href="https://fotozhivi.ru"
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-xs font-medium text-white/70 hover:text-white/90"
        >
          Главная
        </a>
        <ExportSettingsDrawer>
          <button
            aria-label="Экспорт"
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-xs font-medium"
            onClick={onExport}
          >
            Экспорт
          </button>
        </ExportSettingsDrawer>
        <ExportToast />
      </div>
    </div>
  );
};

export default HeaderBar;
