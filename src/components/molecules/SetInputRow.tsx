import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { WeightUnit } from '../../types';
import { Typography } from '../atoms/Typography';

interface SetInputRowProps {
  setNumber: number;
  weight: string;
  reps: string;
  unit: WeightUnit;
  onUpdateWeight: (val: string) => void;
  onUpdateReps: (val: string) => void;
  onRemoveSet: () => void;
}

export const SetInputRow: React.FC<SetInputRowProps> = ({
  setNumber,
  weight,
  reps,
  unit,
  onUpdateWeight,
  onUpdateReps,
  onRemoveSet,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.setNumberBox}>
        <Typography variant="body" bold color="#6366F1">
          #{setNumber}
        </Typography>
      </View>

      <View style={styles.inputGroup}>
        <TextInput
          style={styles.numericInput}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#64748B"
          value={weight}
          onChangeText={onUpdateWeight}
        />
        <Typography variant="caption" color="#94A3B8" style={styles.unitLabel}>
          {unit}
        </Typography>
      </View>

      <View style={styles.inputGroup}>
        <TextInput
          style={styles.numericInput}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#64748B"
          value={reps}
          onChangeText={onUpdateReps}
        />
        <Typography variant="caption" color="#94A3B8" style={styles.unitLabel}>
          reps
        </Typography>
      </View>

      <TouchableOpacity onPress={onRemoveSet} style={styles.removeBtn}>
        <Typography variant="body" color="#EF4444" bold>
          ✕
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 6,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  setNumberBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingLeft: 8,
    paddingRight: 28,
    marginHorizontal: 3,
    height: 40,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  numericInput: {
    flex: 1,
    minWidth: 0,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    padding: 0,
  },
  unitLabel: {
    position: 'absolute',
    right: 8,
    pointerEvents: 'none',
  },
  removeBtn: {
    width: 28,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
