import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Exercise } from '../../types';
import { Typography } from '../atoms/Typography';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { ExerciseListItem } from '../molecules/ExerciseListItem';

interface WorkoutBuilderFormProps {
  exercises: Exercise[];
  initialName?: string;
  initialSelectedIds?: number[];
  onSubmit: (name: string, selectedExerciseIds: number[]) => Promise<void>;
  onCancel: () => void;
}

export const WorkoutBuilderForm: React.FC<WorkoutBuilderFormProps> = ({
  exercises,
  initialName = '',
  initialSelectedIds = [],
  onSubmit,
  onCancel,
}) => {
  const [workoutName, setWorkoutName] = useState(initialName);
  const [selectedIds, setSelectedIds] = useState<number[]>(initialSelectedIds);
  const [isOrderCollapsed, setIsOrderCollapsed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setWorkoutName(initialName);
  }, [initialName]);

  useEffect(() => {
    setSelectedIds(initialSelectedIds);
  }, [initialSelectedIds]);

  const toggleExerciseSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSave = async () => {
    if (!workoutName.trim()) {
      setError('Workout routine name is required.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Select at least one exercise for this workout.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit(workoutName.trim(), selectedIds);
    } catch (err: any) {
      setError(err?.message || 'Failed to save workout routine.');
    } finally {
      setLoading(false);
    }
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...selectedIds];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setSelectedIds(updated);
  };

  const moveDown = (index: number) => {
    if (index >= selectedIds.length - 1) return;
    const updated = [...selectedIds];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setSelectedIds(updated);
  };

  const exerciseMap = new Map<number, Exercise>();
  exercises.forEach((ex) => exerciseMap.set(ex.id, ex));
  const selectedExercises = selectedIds.map((id) => exerciseMap.get(id)).filter(Boolean) as Exercise[];

  return (
    <View style={styles.container}>
      <Input
        label="Workout Routine Name"
        placeholder="e.g. Upper Body Power"
        value={workoutName}
        onChangeText={setWorkoutName}
        error={error && !workoutName.trim() ? error : undefined}
      />

      {/* Selected Exercise Order & Reorder Controls */}
      {selectedExercises.length > 0 ? (
        <View style={styles.reorderContainer}>
          <TouchableOpacity
            onPress={() => setIsOrderCollapsed(!isOrderCollapsed)}
            activeOpacity={0.7}
            style={styles.reorderHeaderToggle}
          >
            <Typography variant="label" color="#6366F1">
              Routine Order ({selectedExercises.length} selected)
            </Typography>
            <Typography variant="caption" color="#6366F1" bold>
              {isOrderCollapsed ? '▼ Expand Order' : '▲ Collapse Order'}
            </Typography>
          </TouchableOpacity>

          {!isOrderCollapsed ? (
            <ScrollView
              nestedScrollEnabled
              style={styles.reorderList}
              keyboardShouldPersistTaps="handled"
            >
              {selectedExercises.map((ex, index) => (
                <View key={ex.id} style={styles.reorderRow}>
                  <View style={styles.reorderNumberBox}>
                    <Typography variant="caption" bold color="#6366F1">
                      #{index + 1}
                    </Typography>
                  </View>

                  <View style={styles.reorderInfo}>
                    <Typography variant="body" bold color="#F8FAFC">
                      {ex.name}
                    </Typography>
                  </View>

                  <View style={styles.reorderActionButtons}>
                    <Button
                      title="▲"
                      variant="secondary"
                      size="small"
                      disabled={index === 0}
                      onPress={() => moveUp(index)}
                      style={styles.arrowBtn}
                      textStyle={{ fontSize: 12, lineHeight: 14 }}
                    />
                    <Button
                      title="▼"
                      variant="secondary"
                      size="small"
                      disabled={index === selectedExercises.length - 1}
                      onPress={() => moveDown(index)}
                      style={styles.arrowBtn}
                      textStyle={{ fontSize: 12, lineHeight: 14 }}
                    />
                    <Button
                      title="✕"
                      variant="ghost"
                      size="small"
                      onPress={() => toggleExerciseSelection(ex.id)}
                      style={styles.removeBtn}
                      textStyle={{ color: '#EF4444', fontSize: 14, fontWeight: '700' }}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>
      ) : null}

      <Typography variant="label" color="#94A3B8" style={styles.sectionLabel}>
        Exercise Library (Tap to add/remove)
      </Typography>

      {exercises.length === 0 ? (
        <Typography variant="body" color="#94A3B8" style={styles.emptyText}>
          No exercises available. Please create an exercise first.
        </Typography>
      ) : (
        <ScrollView style={styles.exerciseScroll} keyboardShouldPersistTaps="handled">
          {exercises.map((ex) => {
            const isSelected = selectedIds.includes(ex.id);
            return (
              <ExerciseListItem
                key={ex.id}
                exercise={ex}
                selected={isSelected}
                onPress={() => toggleExerciseSelection(ex.id)}
              />
            );
          })}
        </ScrollView>
      )}

      {error ? (
        <Typography variant="caption" color="#EF4444" style={styles.errorText}>
          {error}
        </Typography>
      ) : null}

      <View style={styles.buttonRow}>
        <Button title="Cancel" variant="secondary" onPress={onCancel} style={styles.flexBtn} />
        <Button
          title="Save Workout"
          variant="primary"
          loading={loading}
          onPress={handleSave}
          style={[styles.flexBtn, { marginLeft: 10 }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
  },
  reorderContainer: {
    marginVertical: 4,
  },
  reorderHeaderToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  reorderList: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: 220,
    overflow: 'hidden',
  },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reorderNumberBox: {
    width: 28,
    alignItems: 'center',
  },
  reorderInfo: {
    flex: 1,
    marginHorizontal: 8,
  },
  reorderActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowBtn: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtn: {
    minWidth: 28,
    height: 32,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseScroll: {
    flex: 1,
    maxHeight: 260,
    marginVertical: 8,
  },
  emptyText: {
    marginVertical: 20,
    textAlign: 'center',
  },
  errorText: {
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  flexBtn: {
    flex: 1,
  },
});
