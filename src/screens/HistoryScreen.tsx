import React, { useState, useEffect } from 'react';
import { Session, SessionSet } from '../types';
import { fetchSessionsHistory, deleteSession, fetchSessionSetsDetail } from '../db/db';
import { useSettingsStore } from '../store/useSettingsStore';
import { convertWeight } from '../utils/unitConversion';
import { Typography } from '../components/atoms/Typography';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { Badge } from '../components/atoms/Badge';
import { Modal } from '../components/atoms/Modal';
import { Calendar, Trash2, ChevronDown, ChevronRight, History, CheckCircle2 } from 'lucide-react';

export const HistoryScreen: React.FC = () => {
  const { unit } = useSettingsStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);
  const [sessionSetsMap, setSessionSetsMap] = useState<Record<number, SessionSet[]>>({});
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await fetchSessionsHistory();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

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
        <Typography variant="h1">Workout History</Typography>
        <Typography variant="caption" color="var(--text-muted)">
          {sessions.length} completed session{sessions.length !== 1 ? 's' : ''} recorded
        </Typography>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Typography variant="body" color="var(--text-muted)">
            Loading logs...
          </Typography>
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
