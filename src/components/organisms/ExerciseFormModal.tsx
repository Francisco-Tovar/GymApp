import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Typography } from '../atoms/Typography';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Exercise } from '../../types';

interface ExerciseFormModalProps {
  visible: boolean;
  exerciseToEdit?: Exercise | null;
  onClose: () => void;
  onSubmit: (name: string, muscleGroups: string) => Promise<void>;
}

const COMMON_MUSCLES = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Abs',
];

export const ExerciseFormModal: React.FC<ExerciseFormModalProps> = ({
  visible,
  exerciseToEdit,
  onClose,
  onSubmit,
}) => {
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
    setError('');
  }, [exerciseToEdit, visible]);

  const toggleMuscle = (muscle: string) => {
    if (selectedMuscles.includes(muscle)) {
      setSelectedMuscles(selectedMuscles.filter((m) => m !== muscle));
    } else {
      setSelectedMuscles([...selectedMuscles, muscle]);
    }
  };

  const addCustomMuscle = () => {
    if (customMuscle.trim() && !selectedMuscles.includes(customMuscle.trim())) {
      setSelectedMuscles([...selectedMuscles, customMuscle.trim()]);
      setCustomMuscle('');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Exercise name is required.');
      return;
    }
    if (selectedMuscles.length === 0) {
      setError('Select or type at least one muscle group.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit(name.trim(), selectedMuscles.join(', '));
      setName('');
      setSelectedMuscles([]);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save exercise.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Typography variant="h2" color="#F8FAFC">
              {exerciseToEdit ? 'Edit Exercise' : 'Add New Exercise'}
            </Typography>
            <TouchableOpacity onPress={onClose}>
              <Typography variant="h3" color="#94A3B8">
                ✕
              </Typography>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <Input
              label="Exercise Name"
              placeholder="e.g. Barbell Squat"
              value={name}
              onChangeText={setName}
              error={error && !name.trim() ? error : undefined}
            />

            <Typography variant="label" color="#94A3B8" style={styles.sectionLabel}>
              Select Muscle Groups
            </Typography>
            <View style={styles.chipRow}>
              {COMMON_MUSCLES.map((muscle) => {
                const isSelected = selectedMuscles.includes(muscle);
                return (
                  <TouchableOpacity key={muscle} onPress={() => toggleMuscle(muscle)}>
                    <Badge
                      label={muscle}
                      variant={isSelected ? 'accent' : 'neutral'}
                      style={isSelected ? styles.chipSelected : undefined}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Or Add Custom Muscle Group"
              placeholder="e.g. Forearms"
              value={customMuscle}
              onChangeText={setCustomMuscle}
              onSubmitEditing={addCustomMuscle}
            />
            {customMuscle ? (
              <Button
                title="+ Add Tag"
                variant="outline"
                size="small"
                onPress={addCustomMuscle}
                style={styles.addTagBtn}
              />
            ) : null}

            {error ? (
              <Typography variant="caption" color="#EF4444" style={styles.errorText}>
                {error}
              </Typography>
            ) : null}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onClose}
              style={styles.flexBtn}
            />
            <Button
              title="Save Exercise"
              variant="primary"
              loading={loading}
              onPress={handleSave}
              style={[styles.flexBtn, { marginLeft: 10 }]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  body: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginTop: 12,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chipSelected: {
    backgroundColor: '#6366F1',
  },
  addTagBtn: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  errorText: {
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flexBtn: {
    flex: 1,
  },
});
