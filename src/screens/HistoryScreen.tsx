import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenLayout } from '../components/templates/ScreenLayout';
import { SessionSummaryCard } from '../components/organisms/SessionSummaryCard';
import { Typography } from '../components/atoms/Typography';
import { Button } from '../components/atoms/Button';
import { Session } from '../types';
import { fetchSessionsHistory, deleteSession } from '../db/crud';

export const HistoryScreen: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

  const loadHistory = async () => {
    try {
      const data = await fetchSessionsHistory();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions history:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await deleteSession(sessionToDelete.id);
      setSessionToDelete(null);
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  return (
    <ScreenLayout
      title="Workout History"
      subtitle="View your completed training sessions"
      showUnitToggle
    >
      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Typography variant="h3" color="#94A3B8" align="center">
            No Completed Sessions Yet
          </Typography>
          <Typography variant="body" color="#64748B" align="center" style={styles.emptySub}>
            Complete your first workout session to view log history here.
          </Typography>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <SessionSummaryCard
              session={item}
              onDelete={() => setSessionToDelete(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#6366F1"
            />
          }
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal visible={Boolean(sessionToDelete)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Typography variant="h2" color="#F8FAFC" style={{ marginBottom: 8 }}>
              Delete Workout Log?
            </Typography>
            <Typography variant="body" color="#94A3B8" style={{ marginBottom: 20 }}>
              Are you sure you want to delete the workout log for "{sessionToDelete?.workout_name || 'this session'}"? This action cannot be undone.
            </Typography>
            <View style={styles.modalButtonRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setSessionToDelete(null)}
                style={styles.flexBtn}
              />
              <Button
                title="Delete Log"
                variant="primary"
                onPress={confirmDeleteSession}
                style={[styles.flexBtn, { marginLeft: 10, backgroundColor: '#EF4444' }]}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptySub: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flexBtn: {
    flex: 1,
  },
});
