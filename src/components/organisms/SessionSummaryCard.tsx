import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Session, SessionSet } from '../../types';
import { Card } from '../atoms/Card';
import { Typography } from '../atoms/Typography';
import { Badge } from '../atoms/Badge';
import { fetchSessionSetsDetail } from '../../db/crud';
import { useSettingsStore } from '../../store/useSettingsStore';
import { convertWeight } from '../../utils/unitConversion';

interface SessionSummaryCardProps {
  session: Session;
  onDelete?: () => void;
}

export const SessionSummaryCard: React.FC<SessionSummaryCardProps> = ({ session, onDelete }) => {
  const { unit } = useSettingsStore();
  const [expanded, setExpanded] = useState(false);
  const [sets, setSets] = useState<SessionSet[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleExpand = async () => {
    if (!expanded && sets.length === 0) {
      setLoading(true);
      try {
        const details = await fetchSessionSetsDetail(session.id);
        setSets(details);
      } catch (err) {
        console.error('Failed to load session set details:', err);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  const formattedDate = new Date(session.date).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Group sets by exercise
  const groupedSets = sets.reduce((acc, setItem) => {
    const exName = setItem.exercise_name || 'Exercise';
    if (!acc[exName]) acc[exName] = [];
    acc[exName].push(setItem);
    return acc;
  }, {} as Record<string, SessionSet[]>);

  return (
    <Card style={styles.card}>
      <View style={styles.topBarRow}>
        <TouchableOpacity onPress={toggleExpand} activeOpacity={0.8} style={styles.header}>
          <View style={styles.headerText}>
            <Typography variant="h3" color="#F8FAFC">
              {session.workout_name || 'Workout Session'}
            </Typography>
            <Typography variant="caption" color="#94A3B8" style={styles.dateText}>
              {formattedDate}
            </Typography>
          </View>

          <View style={styles.headerRight}>
            <Badge label={`${session.total_sets || 0} Sets`} variant="primary" />
            <Typography variant="caption" color="#6366F1" bold style={styles.arrow}>
              {expanded ? '▲ Hide' : '▼ Details'}
            </Typography>
          </View>
        </TouchableOpacity>

        {onDelete ? (
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Typography variant="caption" color="#EF4444" bold>
              Delete Log
            </Typography>
          </TouchableOpacity>
        ) : null}
      </View>

      {expanded ? (
        <View style={styles.detailsContainer}>
          {loading ? (
            <Typography variant="caption" color="#94A3B8">
              Loading sets...
            </Typography>
          ) : Object.keys(groupedSets).length === 0 ? (
            <Typography variant="caption" color="#94A3B8">
              No set details recorded for this session.
            </Typography>
          ) : (
            Object.entries(groupedSets).map(([exName, setList]) => (
              <View key={exName} style={styles.exerciseSection}>
                <Typography variant="body" bold color="#818CF8" style={styles.exTitle}>
                  {exName}
                </Typography>
                  {setList.map((s) => {
                    const displayWeight = convertWeight(s.weight, (s.unit as any) || 'lb', unit);
                    return (
                      <View key={s.id} style={styles.setRow}>
                        <Typography variant="caption" color="#CBD5E1">
                          Set {s.set_number}:
                        </Typography>
                        <Typography variant="caption" bold color="#F8FAFC" style={styles.setData}>
                          {displayWeight} {unit} × {s.reps} reps
                        </Typography>
                      </View>
                    );
                  })}
              </View>
            ))
          )}
        </View>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  topBarRow: {
    flexDirection: 'column',
  },
  deleteBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  dateText: {
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  arrow: {
    marginTop: 6,
  },
  detailsContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  exerciseSection: {
    marginBottom: 10,
  },
  exTitle: {
    marginBottom: 4,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  setData: {
    marginLeft: 8,
  },
});
