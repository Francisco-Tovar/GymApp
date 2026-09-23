import React, { useState, useEffect } from 'react';
import { Exercise } from '../../types';
import { Typography } from '../atoms/Typography';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { Modal } from '../atoms/Modal';
import { useSettingsStore } from '../../store/useSettingsStore';
import { t, translateMuscleGroup } from '../../utils/i18n';
import { X, Plus } from 'lucide-react';

interface ExerciseFormModalProps {
  isOpen: boolean;
  exerciseToEdit?: Exercise | null;
  onClose: () => void;
  onSubmit: (name: string, muscleGroups: string) => Promise<void>;
}

const COMMON_MUSCLES = [
  'Chest',
  'Upper Back',
  'Lats',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Abs',
  'Lower Back',
];

export const ExerciseFormModal: React.FC<ExerciseFormModalProps> = ({
  isOpen,
  exerciseToEdit,
  onClose,
  onSubmit,
}) => {
  const { language } = useSettingsStore();
  const [name, setName] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [customMuscle, setCustomMuscle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (exerciseToEdit) {
      setName(exerciseToEdit.name);
      const muscles = exerciseToEdit.muscle_groups
        ? exerciseToEdit.muscle_groups.split(',').map((m) => m.trim()).filter(Boolean)
        : [];
      setSelectedMuscles(muscles);
    } else {
      setName('');
      setSelectedMuscles([]);
    }
    setCustomMuscle('');
    setError('');
  }, [exerciseToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleMuscle = (muscle: string) => {
    if (selectedMuscles.includes(muscle)) {
      setSelectedMuscles(selectedMuscles.filter((m) => m !== muscle));
    } else {
      setSelectedMuscles([...selectedMuscles, muscle]);
    }
  };

  const addCustomMuscle = () => {
    const trimmed = customMuscle.trim();
    if (trimmed && !selectedMuscles.includes(trimmed)) {
      setSelectedMuscles([...selectedMuscles, trimmed]);
      setCustomMuscle('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === 'es' ? 'El nombre del ejercicio es obligatorio.' : 'Exercise name is required.');
      return;
    }
    if (selectedMuscles.length === 0) {
      setError(language === 'es' ? 'Selecciona al menos un grupo muscular objetivo.' : 'Select at least one targeted muscle group.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit(name.trim(), selectedMuscles.join(', '));
      onClose();
    } catch (err: any) {
      setError(err?.message || (language === 'es' ? 'Error al guardar el ejercicio.' : 'Failed to save exercise.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} position="center" maxWidth="500px">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Typography variant="h2">
            {exerciseToEdit ? t('edit_exercise', language) : t('add_new_exercise', language)}
          </Typography>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <Input
            label={t('exercise_name', language)}
            placeholder={t('exercise_name_placeholder', language)}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
          />

          <div style={{ margin: '18px 0 10px' }}>
            <Typography variant="label" color="var(--text-secondary)" weight="bold" style={{ marginBottom: '8px' }}>
              {t('target_muscle_groups', language)} ({selectedMuscles.length})
            </Typography>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {COMMON_MUSCLES.map((muscle) => {
                const isSelected = selectedMuscles.includes(muscle);
                return (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => toggleMuscle(muscle)}
                    style={{
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-main)',
                      color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                      borderRadius: 'var(--radius-full)',
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {translateMuscleGroup(muscle, language)} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>

            {/* Custom Muscle Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder={t('custom_muscle_placeholder', language)}
                value={customMuscle}
                onChange={(e) => setCustomMuscle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomMuscle();
                  }
                }}
                className="input-field"
                style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
              />
              <Button type="button" variant="secondary" size="sm" onClick={addCustomMuscle} leftIcon={<Plus size={14} />}>
                {language === 'es' ? 'Agregar' : 'Add'}
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
              {t('cancel', language)}
            </Button>
            <Button type="submit" variant="primary" disabled={loading} style={{ flex: 1.5 }}>
              {loading
                ? (language === 'es' ? 'Guardando...' : 'Saving...')
                : exerciseToEdit
                ? t('save_changes', language)
                : t('create_exercise', language)}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
