import React, { useState, useRef } from 'react';
import { Exercise, WeightUnit } from '../../types';
import { Card } from '../atoms/Card';
import { Typography } from '../atoms/Typography';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { SetInputRow } from '../molecules/SetInputRow';
import { LocalSetState } from '../../store/useActiveWorkoutStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import { t, translateMuscleGroup } from '../../utils/i18n';
import { resolveImageUrl } from '../../utils/imageUtils';
import { triggerVibration } from '../../utils/hardwareApis';
import { ChevronUp, ChevronDown, Plus, ChevronRight, Check, CheckCircle2, RotateCcw } from 'lucide-react';

interface ActiveSetLoggerProps {
  exercise: Exercise;
  sets: LocalSetState[];
  unit: WeightUnit;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
  onAddSet: () => void;
  onRemoveSet: (index: number) => void;
  onUpdateSet: (
    index: number,
    field: 'weight' | 'reps' | 'durationMinutes' | 'durationSeconds' | 'notes',
    value: string
  ) => void;
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
  isCompleted = false,
  onToggleComplete,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  onOpenGuide,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const { language } = useSettingsStore();
  const { showToast } = useToastStore();
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

  const isTimeBased = exercise.exercise_type === 'time_based';
  const totalReps = sets.reduce((sum, s) => sum + (parseInt(s.reps, 10) || 0), 0);
  const totalDurationSecs = sets.reduce(
    (sum, s) => sum + (parseInt(s.durationMinutes || '0', 10) * 60 + parseInt(s.durationSeconds || '0', 10)),
    0
  );

  const isSetValid = (s: LocalSetState) => {
    if (isTimeBased) {
      const durationSecs =
        (parseInt(s.durationMinutes || '0', 10) || 0) * 60 +
        (parseInt(s.durationSeconds || '0', 10) || 0);
      return durationSecs > 0;
    }
    const weightNum = parseFloat(s.weight) || 0;
    const repsNum = parseInt(s.reps, 10) || 0;
    return weightNum > 0 && repsNum > 0;
  };

  const hasValidSetsToFinish = sets.length > 0 && sets.every(isSetValid);

  const formatSummaryDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    if (mins > 0 && s > 0) return `${mins}m ${s}s`;
    if (mins > 0) return `${mins} min`;
    return `${s}s`;
  };

  const handleFinishExercise = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted) {
      if (!hasValidSetsToFinish) {
        showToast(t('invalid_set_warning', language), 'warning', 3500);
        triggerVibration([80, 50, 80]);
        return;
      }
      onToggleComplete?.();
      setCollapsed(true);
    } else {
      onToggleComplete?.();
    }
  };

  return (
    <Card
      style={{
        margin: '10px 0',
        border: isCompleted ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--border-color)',
        boxShadow: isCompleted ? '0 0 12px rgba(16, 185, 129, 0.08)' : undefined,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                  src={resolveImageUrl(exercise.imageUrl)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            )}

            <Typography variant="h3" color={isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)'}>
              {exercise.name}
            </Typography>

            {isCompleted && (
              <Badge
                variant="primary"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  borderColor: 'var(--success)',
                  color: 'var(--success)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontWeight: 700,
                  padding: '2px 8px',
                }}
              >
                <Check size={11} /> {t('exercise_finished', language)}
              </Badge>
            )}

            <span style={{ color: 'var(--text-muted)' }}>
              {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
            </span>
          </div>

          {collapsed ? (
            <div style={{ marginTop: '4px' }}>
              <Typography variant="caption" color="var(--text-muted)">
                {sets.length} {t('sets', language)} ·{' '}
                {isTimeBased
                  ? `${formatSummaryDuration(totalDurationSecs)} ${t('duration', language).toLowerCase()}`
                  : `${totalReps} ${t('total_reps', language)}`}
              </Typography>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
              {isTimeBased && (
                <Badge variant="accent" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                  ⏱️ {language === 'es' ? 'Por Tiempo' : 'Time-based'}
                </Badge>
              )}
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
                exerciseType={exercise.exercise_type || 'weight_reps'}
                weight={set.weight}
                reps={set.reps}
                durationMinutes={set.durationMinutes}
                durationSeconds={set.durationSeconds}
                notes={set.notes}
                unit={unit}
                onUpdateWeight={(val) => onUpdateSet(index, 'weight', val)}
                onUpdateReps={(val) => onUpdateSet(index, 'reps', val)}
                onUpdateDurationMinutes={(val) => onUpdateSet(index, 'durationMinutes', val)}
                onUpdateDurationSeconds={(val) => onUpdateSet(index, 'durationSeconds', val)}
                onUpdateNotes={(val) => onUpdateSet(index, 'notes', val)}
                onRemoveSet={() => onRemoveSet(index)}
              />
            ))
          )}

          {/* Action Buttons: Add Set & Finish/Reopen Exercise */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isCompleted}
              style={{
                flex: 1,
                opacity: isCompleted ? 0.45 : 1,
                cursor: isCompleted ? 'not-allowed' : 'pointer',
              }}
              leftIcon={<Plus size={16} />}
              onClick={onAddSet}
              title={
                isCompleted
                  ? language === 'es'
                    ? 'Ejercicio completado. Reabre para agregar series'
                    : 'Exercise completed. Reopen to add sets'
                  : undefined
              }
            >
              {t('add_set', language)}
            </Button>
            <Button
              type="button"
              variant={isCompleted ? 'secondary' : 'success'}
              size="sm"
              style={{
                flex: 1,
                backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.12)' : undefined,
                borderColor: isCompleted ? 'var(--success)' : !hasValidSetsToFinish ? 'var(--border-color)' : undefined,
                color: isCompleted ? 'var(--success)' : undefined,
                opacity: !isCompleted && !hasValidSetsToFinish ? 0.7 : 1,
                fontWeight: 600,
              }}
              leftIcon={isCompleted ? <RotateCcw size={15} /> : <Check size={16} />}
              onClick={handleFinishExercise}
              title={
                isCompleted
                  ? language === 'es'
                    ? 'Toca para reabrir y modificar el ejercicio'
                    : 'Click to reopen and edit exercise'
                  : !hasValidSetsToFinish
                  ? t('cannot_finish_exercise_desc', language)
                  : undefined
              }
            >
              {isCompleted ? t('reopen_exercise', language) : t('finish_exercise', language)}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
