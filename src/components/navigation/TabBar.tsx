import React from 'react';
import { Dumbbell, Library, History } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { t } from '../../utils/i18n';

export type TabType = 'workouts' | 'exercises' | 'history';

interface TabBarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  hasActiveWorkout?: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onSelectTab,
  hasActiveWorkout = false,
}) => {
  const { language } = useSettingsStore();

  return (
    <nav className="bottom-nav">
      <button
        type="button"
        className={`nav-tab-btn ${activeTab === 'workouts' ? 'active' : ''}`}
        onClick={() => onSelectTab('workouts')}
      >
        <div style={{ position: 'relative' }}>
          <Dumbbell size={20} />
          {hasActiveWorkout && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-4px',
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--success)',
                borderRadius: '50%',
                boxShadow: '0 0 6px var(--success-glow)',
              }}
            />
          )}
        </div>
        <span>{t('workouts', language)}</span>
      </button>

      <button
        type="button"
        className={`nav-tab-btn ${activeTab === 'exercises' ? 'active' : ''}`}
        onClick={() => onSelectTab('exercises')}
      >
        <Library size={20} />
        <span>{t('exercises', language)}</span>
      </button>

      <button
        type="button"
        className={`nav-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => onSelectTab('history')}
      >
        <History size={20} />
        <span>{t('history', language)}</span>
      </button>
    </nav>
  );
};
