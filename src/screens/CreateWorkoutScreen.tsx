import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenLayout } from '../components/templates/ScreenLayout';
import { WorkoutBuilderForm } from '../components/organisms/WorkoutBuilderForm';
import { Exercise, Workout } from '../types';
import { fetchExercises, insertWorkout, updateWorkout, fetchWorkoutById } from '../db/crud';

export const CreateWorkoutScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const workoutId = route.params?.workoutId;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [existingWorkout, setExistingWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    loadData();
  }, [workoutId]);

  const loadData = async () => {
    try {
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
    }
  };

  const handleSave = async (name: string, exerciseIds: number[]) => {
    if (workoutId) {
      await updateWorkout(workoutId, name, exerciseIds);
    } else {
      await insertWorkout(name, exerciseIds);
    }
    navigation.goBack();
  };

  const isEditing = Boolean(workoutId);

  return (
    <ScreenLayout
      title={isEditing ? 'Edit Routine' : 'New Routine'}
      subtitle={isEditing ? 'Update workout routine details and exercises' : 'Assemble exercises into a workout routine'}
      showUnitToggle={false}
    >
      <View style={styles.container}>
        <WorkoutBuilderForm
          exercises={exercises}
          initialName={existingWorkout?.name || ''}
          initialSelectedIds={existingWorkout?.exercise_ids || []}
          onSubmit={handleSave}
          onCancel={() => navigation.goBack()}
        />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
