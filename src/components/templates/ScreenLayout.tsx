import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../atoms/Typography';
import { UnitToggle } from '../molecules/UnitToggle';

interface ScreenLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showUnitToggle?: boolean;
  headerRight?: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  title,
  subtitle,
  children,
  showUnitToggle = true,
  headerRight,
  style,
}) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Typography variant="h1" color="#F8FAFC">
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="caption" color="#94A3B8" style={styles.subtitle}>
              {subtitle}
            </Typography>
          ) : null}
        </View>

        <View style={styles.headerRight}>
          {showUnitToggle ? <UnitToggle /> : null}
          {headerRight}
        </View>
      </View>

      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark Slate background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#1E293B',
  },
  titleContainer: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
});
