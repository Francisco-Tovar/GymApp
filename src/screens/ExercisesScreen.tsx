import React, { useState, useEffect } from 'react';
import { Exercise } from '../types';
import { fetchExercises, insertExercise, updateExercise, deleteExercise, fetchAllWorkoutSessionRecords } from '../db/db';
import { useSettingsStore } from '../store/useSettingsStore';
import { Typography } from '../components/atoms/Typography';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { Badge } from '../components/atoms/Badge';
import { Modal } from '../components/atoms/Modal';
import { ExerciseFormModal } from '../components/organisms/ExerciseFormModal';
import { ProgressiveOverloadChart } from '../components/organisms/ProgressiveOverloadChart';
import { WorkoutSessionRecord } from '../utils/progressiveOverload';
import { Plus, Search, Edit2, Trash2, Library, Dumbbell, TrendingUp } from 'lucide-react';

export const ExercisesScreen: React.FC = () => {
  const { unit } = useSettingsStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessionRecords, setSessionRecords] = useState<WorkoutSessionRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [exerciseForChart, setExerciseForChart] = useState<Exercise | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, records] = await Promise.all([
        fetchExercises(),
        fetchAllWorkoutSessionRecords(unit),
      ]);
      setExercises(data);
      setSessionRecords(records);
    } catch (err) {
      console.error('Failed to load exercises:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);

  const handleSaveExercise = async (name: string, muscleGroups: string) => {
    if (exerciseToEdit?.id) {
      await updateExercise(exerciseToEdit.id, name, muscleGroups);
    } else {
      await insertExercise(name, muscleGroups);
    }
    await loadData();
    setExerciseToEdit(null);
  };

  const confirmDelete = async () => {
    if (!exerciseToDelete?.id) return;
    await deleteExercise(exerciseToDelete.id);
    setExerciseToDelete(null);
    await loadData();
  };

  const categories = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs'];

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscle_groups.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === 'All') return true;

    if (selectedCategory === 'Legs') {
      return (
        ex.muscle_groups.toLowerCase().includes('quad') ||
        ex.muscle_groups.toLowerCase().includes('hamstring') ||
        ex.muscle_groups.toLowerCase().includes('glute') ||
        ex.muscle_groups.toLowerCase().includes('calf')
      );
    }

    return ex.muscle_groups.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <Typography variant="h1">Exercise Library</Typography>
          <Typography variant="caption" color="var(--text-muted)">
            {exercises.length} movements available
          </Typography>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => {
            setExerciseToEdit(null);
            setIsModalOpen(true);
          }}
        >
          Add Exercise
        </Button>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search movements or muscles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '36px' }}
        />
      </div>

      {/* Category Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '12px',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${selectedCategory === cat ? 'var(--primary)' : 'var(--border-color)'}`,
              backgroundColor: selectedCategory === cat ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-surface)',
              color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercise List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Typography variant="body" color="var(--text-muted)">
            Loading library...
          </Typography>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Library size={48} style={{ color: 'var(--text-subtle)', marginBottom: '12px' }} />
          <Typography variant="h3" style={{ marginBottom: '6px' }}>
            No Movements Found
          </Typography>
          <Typography variant="caption" color="var(--text-muted)">
            Try adjusting your search filter or add a new exercise to your library.
          </Typography>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredExercises.map((ex) => (
            <Card key={ex.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                <Typography variant="h3" style={{ fontSize: '15px', marginBottom: '4px' }}>
                  {ex.name}
                </Typography>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {ex.muscle_groups.split(',').map((m, idx) => (
                    <Badge key={idx} variant="primary">
                      {m.trim()}
                    </Badge>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setExerciseForChart(ex)}
                  className="btn btn-secondary btn-icon"
                  style={{ width: '32px', height: '32px', color: 'var(--accent)' }}
                  title="View Progressive Overload Chart"
                >
                  <TrendingUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExerciseToEdit(ex);
                    setIsModalOpen(true);
                  }}
                  className="btn btn-secondary btn-icon"
                  style={{ width: '32px', height: '32px' }}
                  title="Edit Exercise"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setExerciseToDelete(ex)}
                  className="btn btn-danger btn-icon"
                  style={{ width: '32px', height: '32px' }}
                  title="Delete Exercise"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Progressive Overload Progression Modal */}
      <Modal
        isOpen={Boolean(exerciseForChart)}
        onClose={() => setExerciseForChart(null)}
        position="center"
        maxWidth="620px"
      >
        <ProgressiveOverloadChart
          records={sessionRecords}
          defaultExerciseId={String(exerciseForChart?.id ?? exerciseForChart?.name ?? '')}
          unit={unit}
          title={exerciseForChart ? `${exerciseForChart.name} Overload` : undefined}
          style={{ border: 'none', padding: '0', background: 'transparent', boxShadow: 'none' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button variant="secondary" onClick={() => setExerciseForChart(null)}>
            Close
          </Button>
        </div>
      </Modal>

      {/* Form Modal */}
      <ExerciseFormModal
        isOpen={isModalOpen}
        exerciseToEdit={exerciseToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setExerciseToEdit(null);
        }}
        onSubmit={handleSaveExercise}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(exerciseToDelete)}
        onClose={() => setExerciseToDelete(null)}
        position="center"
        maxWidth="440px"
      >
        <Typography variant="h2" style={{ marginBottom: '8px' }}>
          Delete Exercise?
        </Typography>
        <Typography variant="body" color="var(--text-secondary)" style={{ marginBottom: '20px' }}>
          Are you sure you want to remove <strong>"{exerciseToDelete?.name}"</strong>? It will also be removed from any workouts and history.
        </Typography>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => setExerciseToDelete(null)} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} style={{ flex: 1 }}>
            Delete Exercise
          </Button>
        </div>
      </Modal>
    </div>
  );
};

