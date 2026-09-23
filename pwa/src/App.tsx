import React, { useEffect, useState } from 'react';
import { initDatabase } from './db/db';
import { useSettingsStore } from './store/useSettingsStore';
import { useActiveWorkoutStore } from './store/useActiveWorkoutStore';
import { TabBar, TabType } from './components/navigation/TabBar';
import { WorkoutsScreen } from './screens/WorkoutsScreen';
import { ExercisesScreen } from './screens/ExercisesScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ActiveSessionScreen } from './screens/ActiveSessionScreen';
import { Typography } from './components/atoms/Typography';
import { Dumbbell, Wifi, WifiOff } from 'lucide-react';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('workouts');
  const [inSessionView, setInSessionView] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [selectedWorkout, setSelectedWorkout] = useState<{ id: number; name: string } | null>(null);

  const { unit, toggleUnit } = useSettingsStore();
  const { isActive, workoutId: activeWorkoutId, workoutName: activeWorkoutName } = useActiveWorkoutStore();

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        setDbReady(true);
      } catch (err) {
        console.error('Failed to initialize GymApp IndexedDB:', err);
      }
    }
    setup();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleStartSession = (workoutId: number, workoutName: string) => {
    setSelectedWorkout({ id: workoutId, name: workoutName });
    setInSessionView(true);
  };

  const handleResumeSession = () => {
    setSelectedWorkout(null);
    setInSessionView(true);
  };

  if (!dbReady) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--bg-main)',
          gap: '16px',
        }}
      >
        <div className="pulse-primary" style={{ color: 'var(--primary)' }}>
          <Dumbbell size={48} />
        </div>
        <Typography variant="body" color="var(--text-muted)">
          Initializing GymApp PWA...
        </Typography>
      </div>
    );
  }

  return (
    <>
      {/* Top Header */}
      {!inSessionView && (
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              <Dumbbell size={18} />
            </div>
            <div>
              <Typography variant="h3" style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                GYM<span style={{ color: 'var(--primary)' }}>APP</span>
              </Typography>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Offline PWA Indicator */}
            {!isOnline && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color: 'var(--warning)',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <WifiOff size={12} /> Offline
              </span>
            )}

            {/* Global Unit Switcher */}
            <button
              type="button"
              onClick={toggleUnit}
              title="Toggle Weight Unit (LB / KG)"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 10px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ color: unit === 'lb' ? 'var(--primary)' : 'var(--text-muted)' }}>LB</span>
              <span style={{ color: 'var(--text-subtle)' }}>/</span>
              <span style={{ color: unit === 'kg' ? 'var(--primary)' : 'var(--text-muted)' }}>KG</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {inSessionView ? (
          <ActiveSessionScreen
            workoutId={selectedWorkout?.id || activeWorkoutId}
            workoutName={selectedWorkout?.name || activeWorkoutName}
            onFinishOrCancel={() => {
              setSelectedWorkout(null);
              setInSessionView(false);
            }}
          />
        ) : activeTab === 'workouts' ? (
          <WorkoutsScreen
            onStartSession={handleStartSession}
            onResumeSession={handleResumeSession}
          />
        ) : activeTab === 'exercises' ? (
          <ExercisesScreen />
        ) : (
          <HistoryScreen />
        )}
      </main>

      {/* Bottom Navigation */}
      {!inSessionView && (
        <TabBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          hasActiveWorkout={isActive}
        />
      )}
    </>
  );
}
