import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Exercise, SessionSet, WeightUnit } from '../../types';
import { Card } from '../atoms/Card';
import { Typography } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { SetInputRow } from '../molecules/SetInputRow';

export interface LocalSetState {
  id: string;
  weight: string;
  reps: string;
}

interface ActiveSetLoggerProps {
  exercise: Exercise;
  sets: LocalSetState[];
  unit: WeightUnit;
  onAddSet: () => void;
  onRemoveSet: (index: number) => void;
  onUpdateSet: (index: number, field: 'weight' | 'reps', value: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export const ActiveSetLogger: React.FC<ActiveSetLoggerProps> = ({
  exercise,
  sets,
  unit,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}) => {
  const muscleList = exercise.muscle_groups
    ? exercise.muscle_groups.split(',').map((m) => m.trim())
    : [];

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Typography variant="h3" color="#F8FAFC" style={styles.exerciseName}>
            {exercise.name}
          </Typography>
          <View style={styles.reorderControls}>
            {onMoveUp ? (
              <Button
                title="▲"
                variant="secondary"
                size="small"
                disabled={!canMoveUp}
                onPress={onMoveUp}
                style={styles.reorderBtn}
                textStyle={{ fontSize: 12, lineHeight: 14 }}
              />
            ) : null}
            {onMoveDown ? (
              <Button
                title="▼"
                variant="secondary"
                size="small"
                disabled={!canMoveDown}
                onPress={onMoveDown}
                style={styles.reorderBtn}
                textStyle={{ fontSize: 12, lineHeight: 14 }}
              />
            ) : null}
          </View>
        </View>
        <View style={styles.badges}>
          {muscleList.map((m, idx) => (
            <Badge key={idx} label={m} variant="primary" />
          ))}
        </View>
      </View>

      <View style={styles.setList}>
        {sets.map((item, index) => (
          <SetInputRow
            key={item.id}
            setNumber={index + 1}
            weight={item.weight}
            reps={item.reps}
            unit={unit}
            onUpdateWeight={(val) => onUpdateSet(index, 'weight', val)}
            onUpdateReps={(val) => onUpdateSet(index, 'reps', val)}
            onRemoveSet={() => onRemoveSet(index)}
          />
        ))}
      </View>

      <Button
        title="+ Add Set"
        variant="secondary"
        size="small"
        onPress={onAddSet}
        style={styles.addBtn}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    flex: 1,
    marginRight: 8,
  },
  reorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reorderBtn: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  setList: {
    marginVertical: 4,
  },
  addBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
});
