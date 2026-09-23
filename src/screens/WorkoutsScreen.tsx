import React, { useState, useEffect } from 'react';
import { Workout, Exercise } from '../types';
import { fetchWorkouts, fetchExercises, deleteWorkout, insertWorkout, updateWorkout, restoreOriginalWorkouts } from '../db/db';
import { cleanupFullBodyRoutine } from '../db/seedDummyData';
import { useActiveWorkoutStore } from '../store/useActiveWorkoutStore';
import { Typography } from '../components/atoms/Typography';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { Badge } from '../components/atoms/Badge';
import { Modal } from '../components/atoms/Modal';
import { WorkoutBuilderModal } from '../components/organisms/WorkoutBuilderModal';
import { Play, Plus, ChevronUp, ChevronDown, Trash2, Edit2, Dumbbell, Flame } from 'lucide-react';

interface WorkoutsScreenProps {
  onStartSession: (workoutId: number, workoutName: string) => void;
  onResumeSession: () => void;
}

const STORAGE_KEY = 'gymapp_workout_order_pwa';

export const WorkoutsScreen: React.FC<WorkoutsScreenProps> = ({
  onStartSession,
  onResumeSession,
}) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [deletingWorkout, setDeletingWorkout] = useState<Workout | null>(null);

  const { isActive, workoutName: activeWorkoutName } = useActiveWorkoutStore();

  const getSavedOrder = (): number[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveOrder = (ids: number[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      console.warn(e);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await restoreOriginalWorkouts();
      const [wList, eList] = await Promise.all([fetchWorkouts(), fetchExercises()]);
      const savedOrder = getSavedOrder();

      if (savedOrder.length > 0) {
        wList.sort((a, b) => {
          const idxA = savedOrder.indexOf(a.id);
          const idxB = savedOrder.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return 0;
        });
      }

      setWorkouts(wList);
      setExercises(eList);
    } catch (err) {
      console.error('Failed to load workouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const moveWorkoutUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...workouts];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setWorkouts(updated);
    saveOrder(updated.map((w) => w.id));
  };

  const moveWorkoutDown = (index: number) => {
    if (index >= workouts.length - 1) return;
    const updated = [...workouts];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setWorkouts(updated);
    saveOrder(updated.map((w) => w.id));
  };

  const handleSaveWorkout = async (name: string, exerciseIds: number[]) => {
    if (editingWorkout?.id) {
      await updateWorkout(editingWorkout.id, name, exerciseIds);
    } else {
      await insertWorkout(name, exerciseIds);
    }
    await loadData();
    setEditingWorkout(null);
  };

  const confirmDelete = async () => {
    if (!deletingWorkout || !deletingWorkout.id) return;
    try {
      await deleteWorkout(Number(deletingWorkout.id));
    } catch (err) {
      console.error('Failed to delete workout:', err);
    } finally {
      setDeletingWorkout(null);
      await loadData();
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Active Workout In-Progress Banner */}
      {isActive && (
        <div
          onClick={onResumeSession}
          className="pulse-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(99, 102, 241, 0.25)',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            marginBottom: '16px',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Flame size={20} />
            </div>
            <div>
              <Typography variant="label" color="#a5b4fc" weight="bold">
                Session In Progress
              </Typography>
              <Typography variant="h3" color="#ffffff">
                {activeWorkoutName || 'Active Routine'}
              </Typography>
            </div>
          </div>
          <Button variant="primary" size="sm" rightIcon={<Play size={14} />}>
            Resume
          </Button>
        </div>
      )}

      {/* Header with Title and Create Routine button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <Typography variant="h1">Workout Routines</Typography>
          <Typography variant="caption" color="var(--text-muted)">
            {workouts.length} routine{workouts.length !== 1 ? 's' : ''} configured
          </Typography>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => {
            setEditingWorkout(null);
            setIsBuilderOpen(true);
          }}
        >
          New Routine
        </Button>
      </div>

      {/* Routine Cards List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Typography variant="body" color="var(--text-muted)">
            Loading workouts...
          </Typography>
        </div>
      ) : workouts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Dumbbell size={48} style={{ color: 'var(--text-subtle)', marginBottom: '12px' }} />
          <Typography variant="h3" style={{ marginBottom: '6px' }}>
            No Workouts Found
          </Typography>
          <Typography variant="caption" color="var(--text-muted)" style={{ marginBottom: '16px' }}>
            Create your first workout routine to start tracking sets and weights.
          </Typography>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setIsBuilderOpen(true)}>
            Create First Routine
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {workouts.map((w, index) => (
            <Card key={w.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <Typography variant="h2" style={{ fontSize: '18px', marginBottom: '4px' }}>
                    {w.name}
                  </Typography>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <Badge variant="accent">
                      {w.exercises?.length || 0} Exercises
                    </Badge>
                  </div>
                </div>

                {/* Reorder Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveWorkoutUp(index)}
                    title="Move routine up"
                    className="btn btn-secondary btn-icon"
                    style={{ width: '30px', height: '30px', opacity: index === 0 ? 0.3 : 1 }}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={index === workouts.length - 1}
                    onClick={() => moveWorkoutDown(index)}
                    title="Move routine down"
                    className="btn btn-secondary btn-icon"
                    style={{ width: '30px', height: '30px', opacity: index === workouts.length - 1 ? 0.3 : 1 }}
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>

              {/* Exercise preview pills */}
              {w.exercises && w.exercises.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {w.exercises.slice(0, 5).map((ex) => (
                    <span
                      key={ex.id}
                      style={{
                        fontSize: '11px',
                        backgroundColor: 'var(--bg-main)',
                        border: '1px solid var(--border-color)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {ex.name}
                    </span>
                  ))}
                  {w.exercises.length > 5 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                      +{w.exercises.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {/* Bottom Card Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingWorkout(w);
                      setIsBuilderOpen(true);
                    }}
                    title="Edit Routine"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 10px' }}
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingWorkout(w)}
                    title="Delete Routine"
                    className="btn btn-danger btn-sm"
                    style={{ padding: '6px 10px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Play size={14} />}
                  onClick={() => onStartSession(w.id, w.name)}
                >
                  Start Workout
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Routine Builder Modal */}
      <WorkoutBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setEditingWorkout(null);
        }}
        onSubmit={handleSaveWorkout}
        availableExercises={exercises}
        initialWorkout={
          editingWorkout
            ? {
                id: editingWorkout.id,
                name: editingWorkout.name,
                exerciseIds: editingWorkout.exercise_ids || [],
              }
            : null
        }
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingWorkout)}
        onClose={() => setDeletingWorkout(null)}
        position="center"
        maxWidth="440px"
      >
        <Typography variant="h2" style={{ marginBottom: '8px' }}>
          Delete Workout Routine?
        </Typography>
        <Typography variant="body" color="var(--text-secondary)" style={{ marginBottom: '20px' }}>
          Are you sure you want to delete <strong>"{deletingWorkout?.name}"</strong>? This will remove the routine from your list.
        </Typography>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => setDeletingWorkout(null)} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} style={{ flex: 1 }}>
            Delete Routine
          </Button>
        </div>
      </Modal>
    </div>
  );
};
