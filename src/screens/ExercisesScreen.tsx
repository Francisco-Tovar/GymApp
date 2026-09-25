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
import { ExerciseGuideModal } from '../components/organisms/ExerciseGuideModal';
import { ProgressiveOverloadChart } from '../components/organisms/ProgressiveOverloadChart';
import { WorkoutSessionRecord } from '../utils/progressiveOverload';
import { resolveImageUrl } from '../utils/imageUtils';
import { t, translateMuscleGroup } from '../utils/i18n';
import { Plus, Search, Edit2, Trash2, Library, TrendingUp, Eye, Image as ImageIcon } from 'lucide-react';

export const ExercisesScreen: React.FC = () => {
  const { unit, language } = useSettingsStore();
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
  const [exerciseForGuide, setExerciseForGuide] = useState<Exercise | null>(null);

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

  const handleSaveExercise = async (
    name: string,
    muscleGroups: string,
    imageUrl?: string | null,
    notes?: string | null,
    exerciseType?: 'weight_reps' | 'time_based'
  ) => {
    if (exerciseToEdit?.id) {
      await updateExercise(exerciseToEdit.id, name, muscleGroups, imageUrl, notes, exerciseType);
    } else {
      await insertExercise(name, muscleGroups, imageUrl, notes, exerciseType);
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

  const categories = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Core', 'Cardio'];

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

    if (selectedCategory === 'Cardio') {
      return (
        ex.exercise_type === 'time_based' ||
        ex.muscle_groups.toLowerCase().includes('cardio') ||
        ex.muscle_groups.toLowerCase().includes('heart') ||
        ex.muscle_groups.toLowerCase().includes('running') ||
        ex.muscle_groups.toLowerCase().includes('treadmill')
      );
    }

    if (selectedCategory === 'Core') {
      return (
        ex.muscle_groups.toLowerCase().includes('core') ||
        ex.muscle_groups.toLowerCase().includes('abs') ||
        ex.muscle_groups.toLowerCase().includes('abdom') ||
        ex.muscle_groups.toLowerCase().includes('oblique')
      );
    }

    return ex.muscle_groups.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <Typography variant="h1">{t('exercise_library', language)}</Typography>
          <Typography variant="caption" color="var(--text-muted)">
            {exercises.length} {t('movements_available', language)}
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
          {t('add_exercise', language)}
        </Button>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder={t('search_movements_placeholder', language)}
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
              backgroundColor: selectedCategory === cat ? 'var(--primary-subtle)' : 'var(--bg-surface)',
              color: selectedCategory === cat ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {cat === 'All' ? t('all', language) : translateMuscleGroup(cat, language)}
          </button>
        ))}
      </div>

      {/* Exercise List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Typography variant="body" color="var(--text-muted)">
            {language === 'es' ? 'Cargando biblioteca...' : 'Loading library...'}
          </Typography>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Library size={48} style={{ color: 'var(--text-subtle)', marginBottom: '12px' }} />
          <Typography variant="h3" style={{ marginBottom: '6px' }}>
            {t('no_movements_found', language)}
          </Typography>
          <Typography variant="caption" color="var(--text-muted)">
            {t('no_movements_desc', language)}
          </Typography>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredExercises.map((ex) => (
            <Card
              key={ex.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '10px 12px',
              }}
            >
              {/* Row 1: Exercise Image + Name + Controls in one aligned line */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                {/* Left: Image (if exists) + Title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0, flex: 1 }}>
                  {ex.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => setExerciseForGuide(ex)}
                      title={language === 'es' ? 'Ver Guía del Ejercicio' : 'View Exercise Guide'}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: 'var(--radius-sm, 6px)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                        padding: 0,
                        cursor: 'pointer',
                        flexShrink: 0,
                        background: 'var(--bg-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '1px',
                      }}
                    >
                      <img
                        src={resolveImageUrl(ex.imageUrl)}
                        alt={ex.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  ) : null}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', minWidth: 0, flex: 1, flexWrap: 'wrap' }}>
                    <Typography
                      variant="h3"
                      style={{
                        fontSize: '14.5px',
                        fontWeight: 700,
                        lineHeight: 1.3,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    >
                      {ex.name}
                    </Typography>

                    {(ex.imageUrl || ex.notes) && !ex.imageUrl && (
                      <span
                        title={language === 'es' ? 'Tiene notas' : 'Has notes'}
                        style={{ color: 'var(--primary)', display: 'inline-flex', flexShrink: 0, marginTop: '2px' }}
                      >
                        <ImageIcon size={14} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Controls in-line with the name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginTop: '1px' }}>
                  {(ex.imageUrl || ex.notes) && (
                    <button
                      type="button"
                      onClick={() => setExerciseForGuide(ex)}
                      className="btn btn-secondary btn-icon"
                      style={{ width: '30px', height: '30px', color: 'var(--primary)' }}
                      title={language === 'es' ? 'Ver Guía del Ejercicio' : 'View Exercise Guide'}
                    >
                      <Eye size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setExerciseForChart(ex)}
                    className="btn btn-secondary btn-icon"
                    style={{ width: '30px', height: '30px', color: 'var(--accent)' }}
                    title={language === 'es' ? 'Ver Gráfico de Sobrecarga Progresiva' : 'View Progressive Overload Chart'}
                  >
                    <TrendingUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExerciseToEdit(ex);
                      setIsModalOpen(true);
                    }}
                    className="btn btn-secondary btn-icon"
                    style={{ width: '30px', height: '30px' }}
                    title={language === 'es' ? 'Editar Ejercicio' : 'Edit Exercise'}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setExerciseToDelete(ex)}
                    className="btn btn-danger btn-icon"
                    style={{ width: '30px', height: '30px' }}
                    title={language === 'es' ? 'Eliminar Ejercicio' : 'Delete Exercise'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Row 2: Muscle group pills + Type indicator in a single horizontal row */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  gap: '4px',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  paddingBottom: '2px',
                  paddingLeft: ex.imageUrl ? '42px' : '0px',
                }}
              >
                {ex.exercise_type === 'time_based' && (
                  <Badge
                    variant="accent"
                    style={{
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      padding: '2px 7px',
                      fontSize: '10.5px',
                      borderColor: 'var(--accent)',
                      color: 'var(--accent)',
                    }}
                  >
                    ⏱️ {language === 'es' ? 'Por Tiempo' : 'Time-based'}
                  </Badge>
                )}
                {ex.muscle_groups.split(',').map((m, idx) => (
                  <Badge
                    key={idx}
                    variant="primary"
                    style={{
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      padding: '2px 7px',
                      fontSize: '10.5px',
                    }}
                  >
                    {translateMuscleGroup(m.trim(), language)}
                  </Badge>
                ))}
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
          title={exerciseForChart ? `${exerciseForChart.name} ${language === 'es' ? 'Sobrecarga' : 'Overload'}` : undefined}
          style={{ border: 'none', padding: '0', background: 'transparent', boxShadow: 'none' }}
          onClose={() => setExerciseForChart(null)}
        />
      </Modal>

      {/* Exercise Guide Modal */}
      <ExerciseGuideModal
        isOpen={Boolean(exerciseForGuide)}
        exercise={exerciseForGuide}
        onClose={() => setExerciseForGuide(null)}
      />

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
          {t('delete_exercise_title', language)}
        </Typography>
        <Typography variant="body" color="var(--text-secondary)" style={{ marginBottom: '20px' }}>
          {language === 'es'
            ? `¿Estás seguro de que deseas eliminar "${exerciseToDelete?.name}"? También se eliminará de cualquier rutina e historial.`
            : `Are you sure you want to remove "${exerciseToDelete?.name}"? It will also be removed from any workouts and history.`}
        </Typography>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => setExerciseToDelete(null)} style={{ flex: 1 }}>
            {t('cancel', language)}
          </Button>
          <Button variant="danger" onClick={confirmDelete} style={{ flex: 1 }}>
            {t('delete_exercise', language)}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

