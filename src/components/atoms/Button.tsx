import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Typography } from './Typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getContainerStyle = () => {
    let bgStyle: ViewStyle = styles.primaryBg;
    if (variant === 'secondary') bgStyle = styles.secondaryBg;
    if (variant === 'danger') bgStyle = styles.dangerBg;
    if (variant === 'outline') bgStyle = styles.outlineBg;
    if (variant === 'ghost') bgStyle = styles.ghostBg;

    let sizeStyle: ViewStyle = styles.mediumSize;
    if (size === 'small') sizeStyle = styles.smallSize;
    if (size === 'large') sizeStyle = styles.largeSize;

    return [
      styles.button,
      bgStyle,
      sizeStyle,
      disabled && styles.disabled,
      style,
    ];
  };

  const getTextColor = () => {
    if (variant === 'outline' || variant === 'ghost') return '#6366F1';
    if (variant === 'secondary') return '#F8FAFC';
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={getContainerStyle()}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Typography
            variant={size === 'small' ? 'caption' : 'body'}
            bold
            color={getTextColor()}
            style={[icon ? { marginLeft: 6 } : undefined, textStyle]}
          >
            {title}
          </Typography>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  smallSize: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  mediumSize: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  largeSize: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryBg: {
    backgroundColor: '#6366F1', // Indigo primary
  },
  secondaryBg: {
    backgroundColor: '#334155', // Slate secondary
  },
  dangerBg: {
    backgroundColor: '#EF4444',
  },
  outlineBg: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  ghostBg: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
});
