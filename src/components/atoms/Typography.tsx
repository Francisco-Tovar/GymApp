import React from 'react';
import { Text as RNText, TextStyle, StyleSheet, StyleProp } from 'react-native';

interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  color?: string;
  style?: StyleProp<TextStyle>;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color = '#F8FAFC',
  style,
  bold = false,
  align = 'left',
}) => {
  return (
    <RNText
      style={[
        styles.base,
        styles[variant],
        { color, textAlign: align },
        bold && styles.bold,
        style,
      ]}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: undefined,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94A3B8',
  },
  bold: {
    fontWeight: '700',
  },
});
