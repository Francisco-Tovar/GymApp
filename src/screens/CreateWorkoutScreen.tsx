import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenLayout } from '../components/templates/ScreenLayout';
import { WorkoutBuilderForm } from '../components/organisms/WorkoutBuilderForm';
import { Exercise, Workout } from '../types';
import { fetchExercises, insertWorkout, updateWorkout, fetchWorkoutById } from '../db/crud';

export const CreateWorkoutScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const rawWorkoutId = route.params?.workoutId;
  const workoutId = rawWorkoutId !== undefined && rawWorkoutId !== null ? Number(rawWorkoutId) : null;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [existingWorkout, setExistingWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [workoutId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const exData = await fetchExercises();
      setExercises(exData);

      if (workoutId) {
        const wData = await fetchWorkoutById(workoutId);
        if (wData) {
          setExistingWorkout(wData);
        }
      }
    } catch (err) {
      console.error('Failed to load data for workout screen:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (name: string, exerciseIds: number[]) => {
    try {
      if (workoutId) {
        await updateWorkout(workoutId, name, exerciseIds);
      } else {
        await insertWorkout(name, exerciseIds);
      }
      navigation.goBack();
    } catch (err) {
      console.error('Failed to save workout:', err);
      throw err;
    }
  };

  const isEditing = Boolean(workoutId);

  return (
    <ScreenLayout
      title={isEditing ? 'Edit Routine' : 'New Routine'}
      subtitle={isEditing ? 'Update workout routine details and exercises' : 'Assemble exercises into a workout routine'}
      showUnitToggle={false}
    >
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : (
          <WorkoutBuilderForm
            key={workoutId ? `edit-${workoutId}` : 'new-workout'}
            exercises={exercises}
            initialName={existingWorkout?.name || ''}
            initialSelectedIds={existingWorkout?.exercise_ids || []}
            onSubmit={handleSave}
            onCancel={() => navigation.goBack()}
          />
        )}
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
});
