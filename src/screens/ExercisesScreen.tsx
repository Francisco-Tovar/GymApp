import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenLayout } from '../components/templates/ScreenLayout';
import { ExerciseListItem } from '../components/molecules/ExerciseListItem';
import { ExerciseFormModal } from '../components/organisms/ExerciseFormModal';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Typography } from '../components/atoms/Typography';
import { Exercise } from '../types';
import { fetchExercises, insertExercise, updateExercise, deleteExercise } from '../db/crud';

export const ExercisesScreen: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadExercises = async () => {
    try {
      const data = await fetchExercises();
      setExercises(data);
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadExercises();
    setRefreshing(false);
  };

  const handleOpenAdd = () => {
    setEditingExercise(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setModalVisible(true);
  };

  const handleSaveExercise = async (name: string, muscleGroups: string) => {
    if (editingExercise) {
      await updateExercise(editingExercise.id, name, muscleGroups);
    } else {
      await insertExercise(name, muscleGroups);
    }
    setEditingExercise(null);
    await loadExercises();
  };

  const confirmDeleteExercise = async () => {
    if (!exerciseToDelete) return;
    try {
      await deleteExercise(exerciseToDelete.id);
      setExerciseToDelete(null);
      await loadExercises();
    } catch (err) {
      console.error('Failed to delete exercise:', err);
    }
  };

  const filteredExercises = exercises.filter((ex) => {
    const q = searchQuery.toLowerCase();
    return (
      ex.name.toLowerCase().includes(q) ||
      ex.muscle_groups.toLowerCase().includes(q)
    );
  });

  return (
    <ScreenLayout
      title="Exercises"
      subtitle="Manage exercise library and target muscles"
      showUnitToggle={false}
    >
      <View style={styles.headerArea}>
        <Button
          title="+ Add Custom Exercise"
          variant="primary"
          onPress={handleOpenAdd}
          style={styles.addBtn}
        />
        <Input
          placeholder="Search by exercise name or muscle..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
      </View>

      {filteredExercises.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Typography variant="body" color="#94A3B8" align="center">
            No exercises match your search.
          </Typography>
        </View>
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ExerciseListItem
              exercise={item}
              onEdit={() => handleOpenEdit(item)}
              onDelete={() => setExerciseToDelete(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#6366F1"
            />
          }
        />
      )}

      <ExerciseFormModal
        visible={modalVisible}
        exerciseToEdit={editingExercise}
        onClose={() => {
          setModalVisible(false);
          setEditingExercise(null);
        }}
        onSubmit={handleSaveExercise}
      />

      {/* Delete Exercise Confirmation Modal */}
      <Modal visible={Boolean(exerciseToDelete)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Typography variant="h2" color="#F8FAFC" style={{ marginBottom: 8 }}>
              Delete Exercise?
            </Typography>
            <Typography variant="body" color="#94A3B8" style={{ marginBottom: 20 }}>
              Are you sure you want to delete "{exerciseToDelete?.name}" from your exercise library?
            </Typography>
            <View style={styles.modalButtonRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setExerciseToDelete(null)}
                style={styles.flexBtn}
              />
              <Button
                title="Delete Exercise"
                variant="primary"
                onPress={confirmDeleteExercise}
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
  headerArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  addBtn: {
    marginBottom: 8,
  },
  searchInput: {
    marginVertical: 4,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
