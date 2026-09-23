import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Modal } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../components/templates/ScreenLayout';
import { WorkoutListItem } from '../components/molecules/WorkoutListItem';
import { Typography } from '../components/atoms/Typography';
import { Button } from '../components/atoms/Button';
import { Workout } from '../types';
import { fetchWorkouts, deleteWorkout } from '../db/crud';

export const WorkoutsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);

  const loadWorkouts = async () => {
    try {
      const data = await fetchWorkouts();
      setWorkouts(data);
    } catch (err) {
      console.error('Error loading workouts:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWorkouts();
    setRefreshing(false);
  };

  const confirmDeleteWorkout = async () => {
    if (!workoutToDelete) return;
    try {
      await deleteWorkout(workoutToDelete.id);
      setWorkoutToDelete(null);
      await loadWorkouts();
    } catch (err) {
      console.error('Failed to delete workout:', err);
    }
  };

  const startSession = (workout: Workout) => {
    navigation.navigate('ActiveSession', { workoutId: workout.id, workoutName: workout.name });
  };

  return (
    <ScreenLayout
      title="Workouts"
      subtitle="Select or create a routine to start training"
      showUnitToggle
    >
      <View style={styles.topActions}>
        <Button
          title="+ Create Workout Routine"
          variant="primary"
          size="medium"
          onPress={() => navigation.navigate('CreateWorkout')}
          style={styles.createBtn}
        />
      </View>

      {workouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Typography variant="h3" color="#94A3B8" align="center">
            No Workout Routines Found
          </Typography>
          <Typography variant="body" color="#64748B" align="center" style={styles.emptySub}>
            Tap above to create your first routine and assign exercises.
          </Typography>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <WorkoutListItem
              workout={item}
              onStartSession={() => startSession(item)}
              onEdit={() => navigation.navigate('CreateWorkout', { workoutId: item.id })}
              onDelete={() => setWorkoutToDelete(item)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#6366F1"
            />
          }
        />
      )}

      {/* Delete Routine Confirmation Modal */}
      <Modal visible={Boolean(workoutToDelete)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Typography variant="h2" color="#F8FAFC" style={{ marginBottom: 8 }}>
              Delete Workout Routine?
            </Typography>
            <Typography variant="body" color="#94A3B8" style={{ marginBottom: 20 }}>
              Are you sure you want to delete the workout routine "{workoutToDelete?.name}"?
            </Typography>
            <View style={styles.modalButtonRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setWorkoutToDelete(null)}
                style={styles.flexBtn}
              />
              <Button
                title="Delete Routine"
                variant="primary"
                onPress={confirmDeleteWorkout}
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
  topActions: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  createBtn: {
    width: '100%',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptySub: {
    marginTop: 8,
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
