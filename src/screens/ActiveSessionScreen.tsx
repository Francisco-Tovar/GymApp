import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../components/templates/ScreenLayout';
import { ActiveSetLogger, LocalSetState } from '../components/organisms/ActiveSetLogger';
import { Typography } from '../components/atoms/Typography';
import { Button } from '../components/atoms/Button';
import { useSettingsStore } from '../store/useSettingsStore';
import { Exercise, SessionSet } from '../types';
import { fetchWorkoutById, saveCompletedSession, fetchHeaviestWeightsMap } from '../db/crud';

interface ExerciseSetsMap {
  [exerciseId: number]: LocalSetState[];
}

export const ActiveSessionScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { unit } = useSettingsStore();

  const { workoutId, workoutName } = route.params || {};

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseSetsMap, setExerciseSetsMap] = useState<ExerciseSetsMap>({});
  const [currentDate] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (workoutId) {
      loadWorkoutDetails();
    }
  }, [workoutId]);

  const loadWorkoutDetails = async () => {
    try {
      const workout = await fetchWorkoutById(workoutId);
      if (workout && workout.exercises) {
        setExercises(workout.exercises);
        const exerciseIds = workout.exercises.map((e) => e.id);
        const maxWeightsMap = await fetchHeaviestWeightsMap(exerciseIds);

        const initialMap: ExerciseSetsMap = {};
        workout.exercises.forEach((ex) => {
          const maxW = maxWeightsMap[ex.id];
          const initialWeight = maxW !== undefined && maxW > 0 ? maxW.toString() : '0';
          initialMap[ex.id] = [{ id: '1', weight: initialWeight, reps: '0' }];
        });
        setExerciseSetsMap(initialMap);
      }
    } catch (err) {
      console.error('Failed to load workout exercises:', err);
    }
  };

  const handleAddSet = (exerciseId: number) => {
    setExerciseSetsMap((prev) => {
      const currentSets = prev[exerciseId] || [];
      const lastWeight = currentSets.length > 0 ? currentSets[currentSets.length - 1].weight : '0';
      const newSet: LocalSetState = {
        id: (currentSets.length + 1).toString() + '-' + Date.now(),
        weight: lastWeight,
        reps: '0',
      };
      return {
        ...prev,
        [exerciseId]: [...currentSets, newSet],
      };
    });
  };

  const handleRemoveSet = (exerciseId: number, index: number) => {
    setExerciseSetsMap((prev) => {
      const currentSets = prev[exerciseId] || [];
      const updated = currentSets.filter((_, i) => i !== index);
      return {
        ...prev,
        [exerciseId]: updated,
      };
    });
  };

  const handleUpdateSet = (
    exerciseId: number,
    index: number,
    field: 'weight' | 'reps',
    value: string
  ) => {
    setExerciseSetsMap((prev) => {
      const currentSets = prev[exerciseId] || [];
      const updated = [...currentSets];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
      }
      return {
        ...prev,
        [exerciseId]: updated,
      };
    });
  };

  const handleMoveExerciseUp = (index: number) => {
    if (index <= 0) return;
    setExercises((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return updated;
    });
  };

  const handleMoveExerciseDown = (index: number) => {
    if (index >= exercises.length - 1) return;
    setExercises((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return updated;
    });
  };

  const handleFinishWorkout = async () => {
    if (loading) return;

    // Compile all sets
    const sessionSets: SessionSet[] = [];
    exercises.forEach((ex) => {
      const sets = exerciseSetsMap[ex.id] || [];
      sets.forEach((setItem, index) => {
        const weightNum = parseFloat(setItem.weight) || 0;
        const repsNum = parseInt(setItem.reps, 10) || 0;
        sessionSets.push({
          exercise_id: ex.id,
          set_number: index + 1,
          weight: weightNum,
          reps: repsNum,
          unit: unit,
        });
      });
    });

    if (sessionSets.length === 0) {
      Alert.alert('No Sets Logged', 'Please add at least one set before saving.');
      return;
    }

    try {
      setLoading(true);
      await saveCompletedSession(workoutId, currentDate, sessionSets);
      navigation.navigate('HistoryTab');
    } catch (err) {
      console.error('Failed to save session:', err);
      Alert.alert('Error', 'Could not save session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date(currentDate).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <ScreenLayout
      title={workoutName || 'Active Workout'}
      subtitle={`Session Date: ${formattedDate}`}
      showUnitToggle
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {exercises.length === 0 ? (
          <Typography variant="body" color="#94A3B8" align="center" style={styles.emptyText}>
            No exercises assigned to this workout routine yet.
          </Typography>
        ) : (
          exercises.map((ex, idx) => (
            <ActiveSetLogger
              key={ex.id}
              exercise={ex}
              sets={exerciseSetsMap[ex.id] || []}
              unit={unit}
              onAddSet={() => handleAddSet(ex.id)}
              onRemoveSet={(index) => handleRemoveSet(ex.id, index)}
              onUpdateSet={(index, field, value) => handleUpdateSet(ex.id, index, field, value)}
              onMoveUp={() => handleMoveExerciseUp(idx)}
              onMoveDown={() => handleMoveExerciseDown(idx)}
              canMoveUp={idx > 0}
              canMoveDown={idx < exercises.length - 1}
            />
          ))
        )}

        <View style={styles.actionContainer}>
          <Button
            title="Cancel Workout"
            variant="ghost"
            size="large"
            onPress={() => setShowCancelModal(true)}
            style={styles.discardBtn}
            textStyle={{ color: '#EF4444' }}
          />
          <Button
            title="Finish & Save Workout"
            variant="primary"
            size="large"
            loading={loading}
            onPress={handleFinishWorkout}
            style={styles.finishBtn}
          />
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Typography variant="h2" color="#F8FAFC" style={{ marginBottom: 8 }}>
              Cancel Workout?
            </Typography>
            <Typography variant="body" color="#94A3B8" style={{ marginBottom: 20 }}>
              Are you sure you want to exit? All logged sets for this workout session will be discarded.
            </Typography>
            <View style={styles.modalButtonRow}>
              <Button
                title="Keep Training"
                variant="secondary"
                onPress={() => setShowCancelModal(false)}
                style={styles.flexBtn}
              />
              <Button
                title="Discard Workout"
                variant="primary"
                onPress={() => {
                  setShowCancelModal(false);
                  navigation.goBack();
                }}
                style={[styles.flexBtn, { marginLeft: 10, backgroundColor: '#EF4444' }]}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    marginVertical: 40,
  },
  actionContainer: {
    marginVertical: 24,
    marginBottom: 40,
    gap: 12,
  },
  discardBtn: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  finishBtn: {
    backgroundColor: '#10B981', // Emerald green finish button
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flexBtn: {
    flex: 1,
  },
});
