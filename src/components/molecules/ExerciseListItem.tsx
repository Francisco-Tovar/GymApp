import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Exercise } from '../../types';
import { Card } from '../atoms/Card';
import { Typography } from '../atoms/Typography';
import { Badge } from '../atoms/Badge';

interface ExerciseListItemProps {
  exercise: Exercise;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  selected?: boolean;
}

export const ExerciseListItem: React.FC<ExerciseListItemProps> = ({
  exercise,
  onPress,
  onEdit,
  onDelete,
  selected = false,
}) => {
  const muscleList = exercise.muscle_groups
    ? exercise.muscle_groups.split(',').map((m) => m.trim())
    : [];

  return (
    <Card
      onPress={onPress}
      style={selected ? styles.selectedCard : undefined}
    >
      <View style={styles.header}>
        <Typography variant="h3" color="#F8FAFC" style={styles.title}>
          {exercise.name}
        </Typography>
        <View style={styles.actionRow}>
          {onEdit ? (
            <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
              <Typography variant="caption" color="#6366F1" bold>
                Edit
              </Typography>
            </TouchableOpacity>
          ) : null}
          {onDelete ? (
            <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
              <Typography variant="caption" color="#EF4444" bold>
                Remove
              </Typography>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <View style={styles.badgeRow}>
        {muscleList.map((muscle, idx) => (
          <Badge key={idx} label={muscle} variant={selected ? 'accent' : 'primary'} />
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  selectedCard: {
    borderColor: '#6366F1',
    backgroundColor: '#1E1B4B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
