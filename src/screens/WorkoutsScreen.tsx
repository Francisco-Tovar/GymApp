import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Modal, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../components/templates/ScreenLayout';
import { WorkoutListItem } from '../components/molecules/WorkoutListItem';
import { Typography } from '../components/atoms/Typography';
import { Button } from '../components/atoms/Button';
import { Workout } from '../types';
import { fetchWorkouts, deleteWorkout } from '../db/crud';
import { useActiveWorkoutStore } from '../store/useActiveWorkoutStore';

const STORAGE_KEY = 'gymapp_workout_order';

const getSavedOrder = (): number[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    }
  } catch (e) {
    // ignore
  }
  return [];
};

const saveOrder = (ids: number[]) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }
  } catch (e) {
    // ignore
  }
};

export const WorkoutsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);
  const { isActive, workoutId: activeWorkoutId, workoutName: activeWorkoutName } = useActiveWorkoutStore();

  const loadWorkouts = async () => {
    try {
      const data = await fetchWorkouts();
      const savedOrder = getSavedOrder();
      if (savedOrder.length > 0) {
        // Sort by saved order, putting any unranked workouts at the end
        data.sort((a, b) => {
          const idxA = savedOrder.indexOf(a.id);
          const idxB = savedOrder.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return 0;
        });
      }
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

  const moveWorkoutUp = (index: number) => {
    if (index <= 0) return;
    setWorkouts((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      saveOrder(updated.map((w) => w.id));
      return updated;
    });
  };

  const moveWorkoutDown = (index: number) => {
    if (index >= workouts.length - 1) return;
    setWorkouts((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      saveOrder(updated.map((w) => w.id));
      return updated;
    });
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
      {isActive && (
        <TouchableOpacity
          style={styles.activeBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ActiveSession', { workoutId: activeWorkoutId, workoutName: activeWorkoutName })}
        >
          <View style={styles.activeBannerLeft}>
            <View style={styles.liveDot} />
            <View>
              <Typography variant="body" bold color="#10B981">
                Workout in Progress
              </Typography>
              <Typography variant="caption" color="#CBD5E1">
                {activeWorkoutName || 'Active Workout'} — Tap to resume
              </Typography>
            </View>
          </View>
          <Typography variant="body" bold color="#10B981">
            Resume →
          </Typography>
        </TouchableOpacity>
      )}

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
          renderItem={({ item, index }) => (
            <WorkoutListItem
              workout={item}
              onStartSession={() => startSession(item)}
              onEdit={() => navigation.navigate('CreateWorkout', { workoutId: item.id })}
              onDelete={() => setWorkoutToDelete(item)}
              onMoveUp={() => moveWorkoutUp(index)}
              onMoveDown={() => moveWorkoutDown(index)}
              canMoveUp={index > 0}
              canMoveDown={index < workouts.length - 1}
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
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#064E3B',
    borderColor: '#059669',
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
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
