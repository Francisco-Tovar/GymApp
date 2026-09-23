import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Typography } from './Typography';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'accent' | 'neutral';
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary', style }) => {
  const getBadgeStyle = () => {
    if (variant === 'accent') return styles.accent;
    if (variant === 'neutral') return styles.neutral;
    return styles.primary;
  };

  const getTextColor = () => {
    if (variant === 'accent') return '#818CF8';
    if (variant === 'neutral') return '#CBD5E1';
    return '#A5B4FC';
  };

  return (
    <View style={[styles.badge, getBadgeStyle(), style]}>
      <Typography variant="caption" color={getTextColor()} bold>
        {label}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginRight: 6,
    marginBottom: 4,
  },
  primary: {
    backgroundColor: '#312E81',
  },
  accent: {
    backgroundColor: '#1E1B4B',
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  neutral: {
    backgroundColor: '#334155',
  },
});
