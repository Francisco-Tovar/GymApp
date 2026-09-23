import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Workout } from '../../types';
import { Card } from '../atoms/Card';
import { Typography } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';

interface WorkoutListItemProps {
  workout: Workout;
  onStartSession: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const WorkoutListItem: React.FC<WorkoutListItemProps> = ({
  workout,
  onStartSession,
  onEdit,
  onDelete,
}) => {
  const exerciseCount = workout.exercises ? workout.exercises.length : 0;

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.info}>
          <Typography variant="h2" color="#F8FAFC">
            {workout.name}
          </Typography>
          <Typography variant="caption" color="#94A3B8" style={styles.subtext}>
            {exerciseCount} {exerciseCount === 1 ? 'Exercise' : 'Exercises'} included
          </Typography>
        </View>
        <View style={styles.headerButtons}>
          {onEdit ? (
            <Button
              title="Edit"
              variant="ghost"
              size="small"
              onPress={onEdit}
              textStyle={{ color: '#6366F1' }}
            />
          ) : null}
          {onDelete ? (
            <Button
              title="Delete"
              variant="ghost"
              size="small"
              onPress={onDelete}
              textStyle={{ color: '#EF4444' }}
            />
          ) : null}
        </View>
      </View>

      {workout.exercises && workout.exercises.length > 0 ? (
        <View style={styles.exerciseList}>
          {workout.exercises.map((ex) => (
            <Badge key={ex.id} label={ex.name} variant="neutral" />
          ))}
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Button
          title="Start Workout"
          variant="primary"
          size="medium"
          onPress={onStartSession}
          style={styles.startBtn}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subtext: {
    marginTop: 2,
  },
  exerciseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  actionRow: {
    marginTop: 16,
  },
  startBtn: {
    width: '100%',
  },
});
