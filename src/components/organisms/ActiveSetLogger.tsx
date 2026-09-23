import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Exercise, WeightUnit } from '../../types';
import { Card } from '../atoms/Card';
import { Typography } from '../atoms/Typography';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
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
  const [collapsed, setCollapsed] = useState(false);

  const muscleList = exercise.muscle_groups
    ? exercise.muscle_groups.split(',').map((m) => m.trim())
    : [];

  const totalReps = sets.reduce((sum, s) => sum + (parseInt(s.reps, 10) || 0), 0);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => setCollapsed(!collapsed)}
          activeOpacity={0.7}
          style={styles.headerLeft}
        >
          <Typography variant="h3" color="#F8FAFC" style={styles.exerciseName}>
            {exercise.name}
          </Typography>

          {collapsed ? (
            <View style={styles.collapsedSummary}>
              <Typography variant="caption" color="#94A3B8">
                {sets.length} set{sets.length !== 1 ? 's' : ''} · {totalReps} total reps
              </Typography>
            </View>
          ) : (
            <View style={styles.badges}>
              {muscleList.map((m, idx) => (
                <Badge key={idx} label={m} variant="primary" />
              ))}
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.headerRightControls}>
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
          <TouchableOpacity
            onPress={() => setCollapsed(!collapsed)}
            activeOpacity={0.7}
            style={styles.togglePill}
          >
            <Typography variant="caption" color="#6366F1" bold>
              {collapsed ? '▼' : '▲'}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      {!collapsed && (
        <>
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
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  exerciseName: {
    marginBottom: 2,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  togglePill: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  collapsedSummary: {
    marginTop: 4,
  },
  setList: {
    marginVertical: 4,
  },
  addBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
});
