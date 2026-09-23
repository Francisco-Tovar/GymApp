import React, { useState, useEffect } from 'react';
import { Session, SessionSet, Workout } from '../types';
import {
  fetchSessionsHistory,
  deleteSession,
  fetchSessionSetsDetail,
  fetchAllWorkoutSessionRecords,
  fetchRoutineSessionRecords,
  fetchWorkouts,
  seedDummyWorkouts,
  restoreOriginalWorkouts,
} from '../db/db';
import { useSettingsStore } from '../store/useSettingsStore';
import { convertWeight } from '../utils/unitConversion';
import { t } from '../utils/i18n';
import { Typography } from '../components/atoms/Typography';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { Badge } from '../components/atoms/Badge';
import { Modal } from '../components/atoms/Modal';
import { ProgressiveOverloadChart } from '../components/organisms/ProgressiveOverloadChart';
import { RoutineProgressionChart } from '../components/organisms/RoutineProgressionChart';
import { WorkoutSessionRecord } from '../utils/progressiveOverload';
import { RoutineSessionRecord } from '../utils/routineProgression';
import { Calendar, Trash2, ChevronDown, ChevronRight, History, CheckCircle2, TrendingUp, ListFilter, Layers, BarChart2 } from 'lucide-react';

export const HistoryScreen: React.FC = () => {
  const { unit, language } = useSettingsStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionRecords, setSessionRecords] = useState<WorkoutSessionRecord[]>([]);
  const [routineRecords, setRoutineRecords] = useState<RoutineSessionRecord[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'analytics' | 'logs'>('analytics');
  const [analyticsType, setAnalyticsType] = useState<'routine' | 'exercise'>('routine');
  const [loading, setLoading] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);
  const [sessionSetsMap, setSessionSetsMap] = useState<Record<number, SessionSet[]>>({});
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      await restoreOriginalWorkouts();
      await seedDummyWorkouts();
      const [data, records, rRecords, wList] = await Promise.all([
        fetchSessionsHistory(),
        fetchAllWorkoutSessionRecords(unit),
        fetchRoutineSessionRecords(selectedWorkoutId ?? undefined, unit),
        fetchWorkouts(),
      ]);
      setSessions(data);
      setSessionRecords(records);
      setRoutineRecords(rRecords);
      setWorkouts(wList);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [unit, selectedWorkoutId]);


  const toggleExpand = async (sessionId: number) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      return;
    }

    setExpandedSessionId(sessionId);
    if (!sessionSetsMap[sessionId]) {
      try {
        const details = await fetchSessionSetsDetail(sessionId);
        setSessionSetsMap((prev) => ({ ...prev, [sessionId]: details }));
      } catch (err) {
        console.error('Failed to load set details:', err);
      }
    }
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    try {
      await deleteSession(sessionToDelete.id);
      setSessionToDelete(null);
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <Typography variant="h1">{t('workout_history', language)}</Typography>
        <Typography variant="caption" color="var(--text-muted)">
          {sessions.length} {t('completed_sessions', language)}
        </Typography>
      </div>

      {/* Sub-tab view switch */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          backgroundColor: 'var(--bg-surface)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          gap: '4px',
          marginBottom: '16px',
        }}
      >
        <button
          type="button"
          onClick={() => setViewMode('analytics')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: viewMode === 'analytics' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'analytics' ? '#ffffff' : 'var(--text-muted)',
            boxShadow: viewMode === 'analytics' ? '0 2px 8px var(--primary-glow)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <TrendingUp size={15} />
          <span>{t('progressive_overload', language)}</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('logs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: viewMode === 'logs' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'logs' ? '#ffffff' : 'var(--text-muted)',
            boxShadow: viewMode === 'logs' ? '0 2px 8px var(--primary-glow)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <ListFilter size={15} />
          <span>{t('workout_logs', language)} ({sessions.length})</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Typography variant="body" color="var(--text-muted)">
            Loading logs...
          </Typography>
        </div>
      ) : viewMode === 'analytics' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Analytics Type Sub-switch */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--bg-surface)',
                padding: '3px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                gap: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => setAnalyticsType('routine')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: analyticsType === 'routine' ? 700 : 500,
                  cursor: 'pointer',
                  backgroundColor: analyticsType === 'routine' ? 'var(--primary)' : 'transparent',
                  color: analyticsType === 'routine' ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: analyticsType === 'routine' ? '0 1px 4px var(--primary-glow)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Layers size={13} />
                <span>{t('routines', language)}</span>
              </button>

              <button
                type="button"
                onClick={() => setAnalyticsType('exercise')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: analyticsType === 'exercise' ? 700 : 500,
                  cursor: 'pointer',
                  backgroundColor: analyticsType === 'exercise' ? 'var(--primary)' : 'transparent',
                  color: analyticsType === 'exercise' ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: analyticsType === 'exercise' ? '0 1px 4px var(--primary-glow)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <TrendingUp size={13} />
                <span>{t('exercises', language)}</span>
              </button>
            </div>
          </div>

          {analyticsType === 'routine' ? (
            <RoutineProgressionChart
              records={routineRecords}
              unit={unit}
              availableWorkouts={workouts}
              selectedWorkoutId={selectedWorkoutId}
              onSelectWorkoutId={setSelectedWorkoutId}
            />
          ) : (
            <ProgressiveOverloadChart records={sessionRecords} unit={unit} />
          )}
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <History size={48} style={{ color: 'var(--text-subtle)', marginBottom: '12px' }} />
          <Typography variant="h3" style={{ marginBottom: '6px' }}>
            No Completed Sessions
          </Typography>
          <Typography variant="caption" color="var(--text-muted)">
            Complete your first workout routine to view your training logs and progress here.
          </Typography>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sessions.map((s) => {
            const isExpanded = expandedSessionId === s.id;
            const sets = sessionSetsMap[s.id] || [];

            // Group sets by exercise
            const grouped = sets.reduce((acc, setItem) => {
              const name = setItem.exercise_name || `Exercise #${setItem.exercise_id}`;
              if (!acc[name]) acc[name] = [];
              acc[name].push(setItem);
              return acc;
            }, {} as Record<string, SessionSet[]>);

            return (
              <Card key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  onClick={() => toggleExpand(s.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} color="var(--success)" />
                      <Typography variant="h3" style={{ fontSize: '16px' }}>
                        {s.workout_name}
                      </Typography>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <Calendar size={12} color="var(--text-muted)" />
                      <Typography variant="caption" color="var(--text-muted)">
                        {formatDate(s.date)}
                      </Typography>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge variant="primary">{s.total_sets || 0} Sets</Badge>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>
                  </div>
                </div>

                {/* Expanded Session Sets Details */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '10px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    {sets.length === 0 ? (
                      <Typography variant="caption" color="var(--text-muted)">
                        Loading exercise breakdown...
                      </Typography>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Object.entries(grouped).map(([exName, exSets]) => (
                          <div
                            key={exName}
                            style={{
                              backgroundColor: 'var(--bg-main)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '10px 12px',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <Typography variant="h3" style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '6px' }}>
                              {exName}
                            </Typography>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {exSets.map((setItem, idx) => {
                                const convertedWeight = convertWeight(setItem.weight, setItem.unit || 'lb', unit);
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      fontSize: '12px',
                                      color: 'var(--text-secondary)',
                                      padding: '2px 0',
                                    }}
                                  >
                                    <span style={{ color: 'var(--text-muted)' }}>Set {setItem.set_number}</span>
                                    <span style={{ fontWeight: 600 }}>
                                      {convertedWeight} {unit} × {setItem.reps} reps
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete(s);
                        }}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '6px 12px' }}
                      >
                        <Trash2 size={14} />
                        <span>Delete Log</span>
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(sessionToDelete)}
        onClose={() => setSessionToDelete(null)}
        position="center"
        maxWidth="440px"
      >
        <Typography variant="h2" style={{ marginBottom: '8px' }}>
          Delete Workout Log?
        </Typography>
        <Typography variant="body" color="var(--text-secondary)" style={{ marginBottom: '20px' }}>
          Are you sure you want to delete this recorded session from {sessionToDelete ? formatDate(sessionToDelete.date) : ''}?
        </Typography>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => setSessionToDelete(null)} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} style={{ flex: 1 }}>
            Delete Log
          </Button>
        </div>
      </Modal>
    </div>
  );
};
