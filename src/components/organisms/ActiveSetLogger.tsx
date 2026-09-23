import React, { useState, useRef } from 'react';
import { Exercise, WeightUnit } from '../../types';
import { Card } from '../atoms/Card';
import { Typography } from '../atoms/Typography';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { SetInputRow } from '../molecules/SetInputRow';
import { LocalSetState } from '../../store/useActiveWorkoutStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { t, translateMuscleGroup } from '../../utils/i18n';
import { ChevronUp, ChevronDown, Plus, ChevronRight, Image as ImageIcon } from 'lucide-react';

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
  onOpenGuide?: (exercise: Exercise) => void;
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
  onOpenGuide,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { language } = useSettingsStore();
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressTriggeredRef = useRef(false);

  const startLongPress = () => {
    isLongPressTriggeredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    if (exercise.imageUrl || exercise.notes) {
      longPressTimerRef.current = window.setTimeout(() => {
        isLongPressTriggeredRef.current = true;
        onOpenGuide?.(exercise);
      }, 500);
    }
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleHeaderClick = () => {
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }
    setCollapsed(!collapsed);
  };

  const muscleList = exercise.muscle_groups
    ? exercise.muscle_groups.split(',').map((m) => m.trim())
    : [];

  const totalReps = sets.reduce((sum, s) => sum + (parseInt(s.reps, 10) || 0), 0);

  return (
    <Card style={{ margin: '10px 0', border: '1px solid var(--border-color)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <div
          onClick={handleHeaderClick}
          onTouchStart={startLongPress}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}
          onMouseDown={startLongPress}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          style={{
            cursor: 'pointer',
            flex: 1,
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          title={
            exercise.imageUrl || exercise.notes
              ? language === 'es'
                ? 'Toca para contraer / Mantén presionado para ver la guía'
                : 'Tap to collapse / Long press to view guide'
              : undefined
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {exercise.imageUrl && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenGuide?.(exercise);
                }}
                title={language === 'es' ? 'Ver Guía del Ejercicio' : 'View Exercise Guide'}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  backgroundColor: 'var(--bg-elevated)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                <img
                  src={exercise.imageUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            )}

            <Typography variant="h3" color="var(--text-primary)">
              {exercise.name}
            </Typography>
            <span style={{ color: 'var(--text-muted)' }}>
              {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
            </span>
          </div>

          {collapsed ? (
            <div style={{ marginTop: '4px' }}>
              <Typography variant="caption" color="var(--text-muted)">
                {sets.length} {t('sets', language)} · {totalReps} {t('total_reps', language)}
              </Typography>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
              {muscleList.map((m, idx) => (
                <Badge key={idx} variant="primary">
                  {translateMuscleGroup(m, language)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Order Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {onMoveUp && (
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={onMoveUp}
              title={language === 'es' ? 'Mover Arriba' : 'Move Up'}
              className="btn btn-secondary btn-icon"
              style={{ width: '32px', height: '32px', opacity: canMoveUp ? 1 : 0.4 }}
            >
              <ChevronUp size={16} />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              disabled={!canMoveDown}
              onClick={onMoveDown}
              title={language === 'es' ? 'Mover Abajo' : 'Move Down'}
              className="btn btn-secondary btn-icon"
              style={{ width: '32px', height: '32px', opacity: canMoveDown ? 1 : 0.4 }}
            >
              <ChevronDown size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Body Sets */}
      {!collapsed && (
        <div style={{ marginTop: '14px' }}>
          {sets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Typography variant="caption" color="var(--text-subtle)">
                {t('no_sets_recorded', language)}
              </Typography>
            </div>
          ) : (
            sets.map((set, index) => (
              <SetInputRow
                key={set.id || index}
                setNumber={index + 1}
                weight={set.weight}
                reps={set.reps}
                unit={unit}
                onUpdateWeight={(val) => onUpdateSet(index, 'weight', val)}
                onUpdateReps={(val) => onUpdateSet(index, 'reps', val)}
                onRemoveSet={() => onRemoveSet(index)}
              />
            ))
          )}

          {/* Add Set Button */}
          <div style={{ marginTop: '10px' }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              fullWidth
              leftIcon={<Plus size={16} />}
              onClick={onAddSet}
            >
              {t('add_set', language)}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
