import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Typography } from '../atoms/Typography';

export const UnitToggle: React.FC = () => {
  const { unit, toggleUnit } = useSettingsStore();

  return (
    <View style={styles.container}>
      <Typography variant="caption" color="#94A3B8" style={styles.label}>
        UNIT
      </Typography>
      <TouchableOpacity onPress={toggleUnit} style={styles.togglePill} activeOpacity={0.8}>
        <View style={[styles.unitOption, unit === 'kg' && styles.unitActive]}>
          <Typography variant="caption" bold color={unit === 'kg' ? '#FFFFFF' : '#94A3B8'}>
            KG
          </Typography>
        </View>
        <View style={[styles.unitOption, unit === 'lb' && styles.unitActive]}>
          <Typography variant="caption" bold color={unit === 'lb' ? '#FFFFFF' : '#94A3B8'}>
            LB
          </Typography>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginRight: 8,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  unitOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  unitActive: {
    backgroundColor: '#6366F1',
  },
});
