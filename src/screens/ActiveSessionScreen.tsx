import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../components/templates/ScreenLayout';
import { ActiveSetLogger } from '../components/organisms/ActiveSetLogger';
import { BodyMuscleMap } from '../components/organisms/BodyMuscleMap';
import { Typography } from '../components/atoms/Typography';
import { Button } from '../components/atoms/Button';
import { useSettingsStore } from '../store/useSettingsStore';
import { useActiveWorkoutStore, ExerciseSetsMap } from '../store/useActiveWorkoutStore';
import { SessionSet } from '../types';
import { fetchWorkoutById, saveCompletedSession, fetchHeaviestWeightsMap } from '../db/crud';

export const ActiveSessionScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { unit } = useSettingsStore();

  const { workoutId, workoutName } = route.params || {};

  const {
    isActive,
    workoutId: activeWorkoutId,
    workoutName: activeWorkoutName,
    exercises,
    exerciseSetsMap,
    currentDate,
    unit: activeUnit,
    startWorkout,
    addSet,
    removeSet,
    updateSet,
    moveExerciseUp,
    moveExerciseDown,
    convertUnit,
    clearActiveWorkout,
  } = useActiveWorkoutStore();

  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Sync unit changes from global settings to active workout weights
  useEffect(() => {
    if (isActive && unit !== activeUnit) {
      convertUnit(unit);
    }
  }, [unit, isActive, activeUnit]);

  // Load workout details if starting new or switching
  useEffect(() => {
    if (workoutId) {
      if (!isActive || activeWorkoutId !== workoutId) {
        initWorkoutSession();
      }
    }
  }, [workoutId]);

  const initWorkoutSession = async () => {
    try {
      setLoading(true);
      const workout = await fetchWorkoutById(workoutId);
      if (workout && workout.exercises) {
        const exerciseIds = workout.exercises.map((e) => e.id);
        const maxWeightsMap = await fetchHeaviestWeightsMap(exerciseIds, unit);

        const initialMap: ExerciseSetsMap = {};
        workout.exercises.forEach((ex) => {
          const maxW = maxWeightsMap[ex.id];
          const initialWeight = maxW !== undefined && maxW > 0 ? maxW.toString() : '0';
          initialMap[ex.id] = [{ id: '1', weight: initialWeight, reps: '0' }];
        });

        startWorkout(
          workoutId,
          workoutName || workout.name || 'Active Workout',
          workout.exercises,
          initialMap,
          unit
        );
      }
    } catch (err) {
      console.error('Failed to load workout exercises:', err);
    } finally {
      setLoading(false);
    }
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
      await saveCompletedSession(workoutId || activeWorkoutId, currentDate, sessionSets);
      clearActiveWorkout();
      navigation.navigate('HistoryTab');
    } catch (err) {
      console.error('Failed to save session:', err);
      Alert.alert('Error', 'Could not save session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    setShowCancelModal(false);
    clearActiveWorkout();
    navigation.navigate('WorkoutsList');
  };

  const formattedDate = new Date(currentDate || Date.now()).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const selectedMuscleGroups = exercises.map((ex) => ex.muscle_groups);

  return (
    <ScreenLayout
      title={activeWorkoutName || workoutName || 'Active Workout'}
      subtitle={`Session Date: ${formattedDate}`}
      showUnitToggle
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Muscle Group Anatomy Heatmap - collapsed by default */}
        {exercises.length > 0 && (
          <View style={styles.anatomySection}>
            <BodyMuscleMap
              selectedMuscleGroups={selectedMuscleGroups}
              title="Muscle Coverage"
              collapsible
              defaultCollapsed={true}
            />
          </View>
        )}

        {exercises.length === 0 ? (
          <Typography variant="body" color="#94A3B8" align="center" style={styles.emptyText}>
            {loading ? 'Loading workout...' : 'No exercises assigned to this workout routine yet.'}
          </Typography>
        ) : (
          exercises.map((ex, idx) => (
            <ActiveSetLogger
              key={ex.id}
              exercise={ex}
              sets={exerciseSetsMap[ex.id] || []}
              unit={unit}
              onAddSet={() => addSet(ex.id)}
              onRemoveSet={(index) => removeSet(ex.id, index)}
              onUpdateSet={(index, field, value) => updateSet(ex.id, index, field, value)}
              onMoveUp={() => moveExerciseUp(idx)}
              onMoveDown={() => moveExerciseDown(idx)}
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
                onPress={handleDiscard}
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
  anatomySection: {
    marginBottom: 12,
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
