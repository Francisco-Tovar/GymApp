import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDatabase } from './src/db/database';
import { WorkoutsScreen } from './src/screens/WorkoutsScreen';
import { CreateWorkoutScreen } from './src/screens/CreateWorkoutScreen';
import { ActiveSessionScreen } from './src/screens/ActiveSessionScreen';
import { ExercisesScreen } from './src/screens/ExercisesScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { Typography } from './src/components/atoms/Typography';
import { useActiveWorkoutStore } from './src/store/useActiveWorkoutStore';

const Tab = createBottomTabNavigator();
const WorkoutsStack = createNativeStackNavigator();

function WorkoutsStackNavigator() {
  return (
    <WorkoutsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F172A' },
      }}
    >
      <WorkoutsStack.Screen name="WorkoutsList" component={WorkoutsScreen} />
      <WorkoutsStack.Screen name="CreateWorkout" component={CreateWorkoutScreen} />
      <WorkoutsStack.Screen name="ActiveSession" component={ActiveSessionScreen} />
    </WorkoutsStack.Navigator>
  );
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function setupDb() {
      try {
        await initDatabase();
        setDbReady(true);
      } catch (err: any) {
        console.error('Failed to initialize SQLite database:', err);
        setDbError(err?.message || 'Database initialization error');
      }
    }
    setupDb();
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Typography variant="body" color="#94A3B8" style={styles.loadingText}>
          {dbError ? `Error: ${dbError}` : 'Initializing GymApp Database...'}
        </Typography>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: '#6366F1',
            background: '#0F172A',
            card: '#1E293B',
            text: '#F8FAFC',
            border: '#334155',
            notification: '#EF4444',
          },
        }}
      >
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#1E293B',
              borderTopColor: '#334155',
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: '#6366F1',
            tabBarInactiveTintColor: '#94A3B8',
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen
            name="WorkoutsTab"
            component={WorkoutsStackNavigator}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                const { isActive, workoutId, workoutName } = useActiveWorkoutStore.getState();
                if (isActive && workoutId) {
                  e.preventDefault();
                  navigation.navigate('WorkoutsTab', {
                    screen: 'ActiveSession',
                    params: { workoutId, workoutName },
                  });
                }
              },
            })}
            options={{
              tabBarLabel: 'Workouts',
              tabBarIcon: ({ color }) => (
                <Typography variant="body" bold color={color}>
                  🏋️
                </Typography>
              ),
            }}
          />
          <Tab.Screen
            name="ExercisesTab"
            component={ExercisesScreen}
            options={{
              tabBarLabel: 'Exercises',
              tabBarIcon: ({ color }) => (
                <Typography variant="body" bold color={color}>
                  💪
                </Typography>
              ),
            }}
          />
          <Tab.Screen
            name="HistoryTab"
            component={HistoryScreen}
            options={{
              tabBarLabel: 'History',
              tabBarIcon: ({ color }) => (
                <Typography variant="body" bold color={color}>
                  📋
                </Typography>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
  },
});
