import React, { useState, useEffect } from 'react';
import { Exercise } from '../../types';
import { Typography } from '../atoms/Typography';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Modal } from '../atoms/Modal';
import { BodyMuscleMap } from './BodyMuscleMap';
import { ChevronUp, ChevronDown, Check, X, Search } from 'lucide-react';

interface WorkoutBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, exerciseIds: number[]) => Promise<void>;
  availableExercises: Exercise[];
  initialWorkout?: { id?: number; name: string; exerciseIds: number[] } | null;
}

export const WorkoutBuilderModal: React.FC<WorkoutBuilderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableExercises,
  initialWorkout,
}) => {
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialWorkout) {
      setName(initialWorkout.name);
      setSelectedIds(initialWorkout.exerciseIds);
    } else {
      setName('');
      setSelectedIds([]);
    }
    setSearch('');
    setError('');
  }, [initialWorkout, isOpen]);

  if (!isOpen) return null;

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const list = [...selectedIds];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    setSelectedIds(list);
  };

  const moveDown = (index: number) => {
    if (index >= selectedIds.length - 1) return;
    const list = [...selectedIds];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    setSelectedIds(list);
  };

  const selectedExercises = selectedIds
    .map((id) => availableExercises.find((e) => e.id === id))
    .filter(Boolean) as Exercise[];

  const muscleGroups = selectedExercises.map((e) => e.muscle_groups);

  const filteredExercises = availableExercises.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.muscle_groups.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Workout routine name is required.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Please select at least one exercise.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await onSubmit(name.trim(), selectedIds);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save workout routine.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} position="center" maxWidth="580px">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Typography variant="h2">
            {initialWorkout?.id ? 'Edit Routine' : 'Create Routine'}
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

        <form onSubmit={handleSubmit}>
          <Input
            label="Routine Name"
            placeholder="e.g. Upper Body Hypertrophy"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
          />

          {/* Muscle Heatmap Preview */}
          <BodyMuscleMap
            selectedMuscleGroups={muscleGroups}
            title="Routine Muscle Coverage"
            collapsible={true}
            defaultCollapsed={false}
          />

          {/* Selected Exercises Ordering */}
          {selectedExercises.length > 0 && (
            <div style={{ margin: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <Typography variant="label" color="var(--accent)" weight="bold">
                  Routine Order ({selectedExercises.length})
                </Typography>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedExercises.map((ex, index) => (
                  <div
                    key={ex.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--bg-main)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700 }}>
                        #{index + 1}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ex.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveUp(index)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: index === 0 ? 'var(--text-subtle)' : 'var(--text-muted)',
                          cursor: index === 0 ? 'default' : 'pointer',
                          padding: '2px',
                        }}
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={index === selectedExercises.length - 1}
                        onClick={() => moveDown(index)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: index === selectedExercises.length - 1 ? 'var(--text-subtle)' : 'var(--text-muted)',
                          cursor: index === selectedExercises.length - 1 ? 'default' : 'pointer',
                          padding: '2px',
                        }}
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSelect(ex.id!)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          padding: '2px',
                          marginLeft: '4px',
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exercise Library Picker */}
          <div style={{ margin: '16px 0' }}>
            <Typography variant="label" color="var(--text-secondary)" weight="bold" style={{ marginBottom: '8px' }}>
              Select Exercises from Library
            </Typography>

            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search exercises by name or muscle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <div
              style={{
                maxHeight: '220px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                paddingRight: '4px',
              }}
            >
              {filteredExercises.map((ex) => {
                const isSelected = selectedIds.includes(ex.id!);
                return (
                  <div
                    key={ex.id}
                    onClick={() => toggleSelect(ex.id!)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-main)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <Typography variant="h3" style={{ fontSize: '13px', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {ex.name}
                      </Typography>
                      <Typography variant="caption" color="var(--text-subtle)">
                        {ex.muscle_groups}
                      </Typography>
                    </div>

                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                        backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                      }}
                    >
                      {isSelected && <Check size={14} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving} style={{ flex: 1.5 }}>
              {saving ? 'Saving...' : initialWorkout?.id ? 'Update Routine' : 'Save Routine'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
