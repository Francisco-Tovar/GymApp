import React, { useState, useEffect, useRef } from 'react';
import { useActiveWorkoutStore } from '../store/useActiveWorkoutStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';
import { t } from '../utils/i18n';
import { fetchWorkoutById, fetchHeaviestWeightsMap, saveCompletedSession } from '../db/db';
import { Exercise, SessionSet, WeightUnit } from '../types';
import { Typography } from '../components/atoms/Typography';
import { Button } from '../components/atoms/Button';
import { Modal } from '../components/atoms/Modal';
import { ActiveSetLogger } from '../components/organisms/ActiveSetLogger';
import { ExerciseGuideModal } from '../components/organisms/ExerciseGuideModal';
import { BodyMuscleMap } from '../components/organisms/BodyMuscleMap';
import { ShareWorkoutModal } from '../components/organisms/ShareWorkoutModal';
import { requestWakeLock, releaseWakeLock, triggerVibration, playTimerPing } from '../utils/hardwareApis';
import { ArrowLeft, Clock, Timer, Check, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Trophy, Share2, MessageCircle } from 'lucide-react';

interface ActiveSessionScreenProps {
  workoutId?: number | null;
  workoutName?: string;
  onFinishOrCancel: () => void;
}

export const ActiveSessionScreen: React.FC<ActiveSessionScreenProps> = ({
  workoutId,
  workoutName,
  onFinishOrCancel,
}) => {
  const { unit, toggleUnit, language } = useSettingsStore();
  const { showToast } = useToastStore();

  const {
    isActive,
    workoutId: activeWorkoutId,
    workoutName: activeWorkoutName,
    exercises,
    exerciseSetsMap,
    completedExerciseIds,
    unit: activeUnit,
    startTime,
    startWorkout,
    addSet,
    removeSet,
    updateSet,
    toggleExerciseCompleted,
    moveExerciseUp,
    moveExerciseDown,
    convertUnit,
    clearActiveWorkout,
  } = useActiveWorkoutStore();

  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedGuideExercise, setSelectedGuideExercise] = useState<Exercise | null>(null);

  // Rest Timer State
  const [restTimerSeconds, setRestTimerSeconds] = useState<number | null>(null);
  const restTimerRef = useRef<number | null>(null);

  // Wake Lock state
  const [wakeLockActive, setWakeLockActive] = useState(false);

  // Activate Wake Lock when session is open
  useEffect(() => {
    let mounted = true;
    requestWakeLock().then((active) => {
      if (mounted) setWakeLockActive(active);
    });

    return () => {
      mounted = false;
      releaseWakeLock();
    };
  }, []);

  // Sync unit changes from global settings
  useEffect(() => {
    if (isActive && unit !== activeUnit) {
      convertUnit(unit);
    }
  }, [unit, isActive, activeUnit]);

  // Load workout details if starting new or switching
  useEffect(() => {
    if (workoutId) {
      if (!isActive || activeWorkoutId !== workoutId) {
        initSession(workoutId, workoutName);
      }
    }
  }, [workoutId]);

  // Elapsed time counter
  useEffect(() => {
    if (!startTime) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Rest timer countdown
  useEffect(() => {
    if (restTimerSeconds === null) return;

    if (restTimerSeconds <= 0) {
      playTimerPing();
      triggerVibration([300, 150, 300]);
      setRestTimerSeconds(null);
      return;
    }

    restTimerRef.current = window.setTimeout(() => {
      setRestTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => {
      if (restTimerRef.current) clearTimeout(restTimerRef.current);
    };
  }, [restTimerSeconds]);

  const initSession = async (id: number, name?: string) => {
    try {
      setLoading(true);
      const workout = await fetchWorkoutById(id);
      if (workout && workout.exercises) {
        const exerciseIds = workout.exercises.map((e) => e.id as number);
        const maxWeightsMap = await fetchHeaviestWeightsMap(exerciseIds, unit);

        const initialMap: Record<number, any[]> = {};
        workout.exercises.forEach((ex) => {
          const maxW = maxWeightsMap[ex.id as number];
          const initialWeight = maxW !== undefined && maxW > 0 ? maxW.toString() : '0';
          initialMap[ex.id as number] = [{ id: '1', weight: initialWeight, reps: '0' }];
        });

        startWorkout(
          id,
          name || workout.name || 'Active Workout',
          workout.exercises,
          initialMap,
          unit
        );
      }
    } catch (err) {
      console.error('Failed to init session:', err);
    } finally {
      setLoading(false);
    }
  };

  const startRestTimer = (seconds: number) => {
    setRestTimerSeconds(seconds);
  };

  const handleFinish = async () => {
    if (loading || !activeWorkoutId) return;

    const sessionSets: SessionSet[] = [];
    exercises.forEach((ex) => {
      const sets = exerciseSetsMap[ex.id as number] || [];
      const isTimeBased = ex.exercise_type === 'time_based';
      let validSetIdx = 1;

      sets.forEach((setItem) => {
        const weightNum = parseFloat(setItem.weight) || 0;
        const repsNum = parseInt(setItem.reps, 10) || 0;
        const durationSecs =
          (parseInt(setItem.durationMinutes || '0', 10) || 0) * 60 +
          (parseInt(setItem.durationSeconds || '0', 10) || 0);

        // Only record sets with valid non-zero values
        const isValid = isTimeBased ? durationSecs > 0 : (weightNum > 0 && repsNum > 0);
        if (!isValid) return;

        sessionSets.push({
          exercise_id: ex.id as number,
          set_number: validSetIdx++,
          weight: weightNum,
          reps: repsNum,
          unit: activeUnit,
          exercise_type: ex.exercise_type || 'weight_reps',
          duration_seconds: durationSecs,
          notes: setItem.notes?.trim() || null,
        });
      });
    });

    if (sessionSets.length === 0) {
      showToast(t('no_work_done_warning', language), 'warning', 3500);
      triggerVibration([80, 50, 80]);
      setShowFinishModal(false);
      return;
    }

    try {
      setLoading(true);
      await saveCompletedSession(activeWorkoutId, new Date().toISOString(), sessionSets);
      triggerVibration([100, 100, 200]);
      showToast(t('workout_completed_toast', language), 'success', 4000);
      setShowFinishModal(false);
      clearActiveWorkout();
      releaseWakeLock();
      onFinishOrCancel();
    } catch (err) {
      console.error('Failed to save session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWorkout = () => {
    clearActiveWorkout();
    releaseWakeLock();
    setShowCancelModal(false);
    onFinishOrCancel();
  };

  const formatTimer = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const muscleGroups = exercises.map((e) => e.muscle_groups);
  const totalSetsCount = exercises.reduce((acc, ex) => {
    const sets = exerciseSetsMap[ex.id as number] || [];
    const isTimeBased = ex.exercise_type === 'time_based';
    const validCount = sets.filter((s) => {
      if (isTimeBased) {
        return (
          (parseInt(s.durationMinutes || '0', 10) || 0) * 60 +
          (parseInt(s.durationSeconds || '0', 10) || 0) > 0
        );
      }
      return (parseFloat(s.weight) || 0) > 0 && (parseInt(s.reps, 10) || 0) > 0;
    }).length;
    return acc + validCount;
  }, 0);
  const finishedExercisesCount = (completedExerciseIds || []).filter((id) =>
    exercises.some((e) => e.id === id)
  ).length;

  const handleOpenFinishModal = () => {
    if (totalSetsCount === 0) {
      showToast(t('no_work_done_warning', language), 'warning', 3500);
      triggerVibration([80, 50, 80]);
      return;
    }
    setShowFinishModal(true);
  };

  const currentValidSets: SessionSet[] = [];
  exercises.forEach((ex) => {
    const sets = exerciseSetsMap[ex.id as number] || [];
    const isTimeBased = ex.exercise_type === 'time_based';
    let idx = 1;
    sets.forEach((setItem) => {
      const weightNum = parseFloat(setItem.weight) || 0;
      const repsNum = parseInt(setItem.reps, 10) || 0;
      const durationSecs =
        (parseInt(setItem.durationMinutes || '0', 10) || 0) * 60 +
        (parseInt(setItem.durationSeconds || '0', 10) || 0);

      const isValid = isTimeBased ? durationSecs > 0 : (weightNum > 0 && repsNum > 0);
      if (!isValid) return;

      currentValidSets.push({
        exercise_id: ex.id as number,
        exercise_name: ex.name,
        set_number: idx++,
        weight: weightNum,
        reps: repsNum,
        unit: activeUnit,
        exercise_type: ex.exercise_type || 'weight_reps',
        duration_seconds: durationSecs,
        notes: setItem.notes?.trim() || null,
      });
    });
  });

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Top Session Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <button
          type="button"
          onClick={onFinishOrCancel}
          className="btn btn-secondary btn-icon"
          title="Back to workouts"
          style={{ width: '36px', height: '36px' }}
        >
          <ArrowLeft size={18} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <Typography variant="h2" style={{ fontSize: '18px' }}>
            {activeWorkoutName || 'Active Workout'}
          </Typography>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent)' }}>
              <Clock size={12} /> {formatTimer(elapsedSeconds)}
            </span>
            {wakeLockActive && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '10px',
                  color: 'var(--success)',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <ShieldCheck size={10} /> {t('screen_awake', language)}
              </span>
            )}
          </div>
        </div>

        {/* Unit Toggle Button */}
        <button
          type="button"
          onClick={toggleUnit}
          title={t('toggle_unit', language)}
          className="btn btn-secondary btn-sm"
          style={{
            fontWeight: 700,
            fontSize: '12px',
            padding: '6px 10px',
            backgroundColor: 'var(--primary-subtle)',
            borderColor: 'var(--primary)',
            color: 'var(--primary)',
          }}
        >
          <RefreshCw size={12} /> {activeUnit.toUpperCase()}
        </button>
      </div>

      {/* Sticky Rest Timer Floating Strip */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 35,
          backgroundColor: 'var(--bg-main)',
          paddingTop: 'calc(var(--safe-top, 0px) + 8px)',
          paddingBottom: '8px',
          marginTop: '-8px',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Timer size={16} color="var(--primary)" />
            <Typography variant="label" color="var(--text-secondary)">
              {t('rest', language)}:
            </Typography>
            {restTimerSeconds !== null ? (
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: restTimerSeconds < 10 ? 'var(--danger)' : 'var(--accent)',
                }}
              >
                {formatTimer(restTimerSeconds)}
              </span>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('off', language)}</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {[30, 60, 90, 120].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => startRestTimer(s)}
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: restTimerSeconds === s ? 'var(--primary)' : 'var(--bg-main)',
                  color: restTimerSeconds === s ? '#ffffff' : 'var(--text-secondary)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {s}s
              </button>
            ))}
            {restTimerSeconds !== null && (
              <button
                type="button"
                onClick={() => setRestTimerSeconds(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--danger)',
                  padding: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {t('reset', language)}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Muscle Heatmap Diagram */}
      <BodyMuscleMap
        selectedMuscleGroups={muscleGroups}
        title={t('session_muscle_activation', language)}
        collapsible={true}
        defaultCollapsed={true}
      />

      {/* Exercises & Set Loggers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {exercises.map((ex, index) => (
          <ActiveSetLogger
            key={ex.id}
            exercise={ex}
            sets={exerciseSetsMap[ex.id as number] || []}
            unit={activeUnit}
            isCompleted={(completedExerciseIds || []).includes(ex.id as number)}
            onToggleComplete={() => toggleExerciseCompleted(ex.id as number)}
            onAddSet={() => addSet(ex.id as number)}
            onRemoveSet={(setIdx) => removeSet(ex.id as number, setIdx)}
            onUpdateSet={(setIdx, field, val) => updateSet(ex.id as number, setIdx, field, val)}
            canMoveUp={index > 0}
            canMoveDown={index < exercises.length - 1}
            onMoveUp={() => moveExerciseUp(index)}
            onMoveDown={() => moveExerciseDown(index)}
            onOpenGuide={setSelectedGuideExercise}
          />
        ))}
      </div>

      {/* Inline Session Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: '28px',
          paddingTop: '8px',
        }}
      >
        <Button
          type="button"
          variant="danger"
          size="lg"
          onClick={() => setShowCancelModal(true)}
          style={{ flex: 1 }}
        >
          {t('cancel', language)}
        </Button>
        <Button
          type="button"
          variant="success"
          size="lg"
          leftIcon={<Check size={18} />}
          onClick={handleOpenFinishModal}
          disabled={loading}
          style={{ flex: 2, opacity: totalSetsCount === 0 ? 0.75 : 1 }}
          title={totalSetsCount === 0 ? t('no_work_done_warning', language) : undefined}
        >
          {loading ? t('saving', language) : t('finish_workout', language)}
        </Button>
      </div>

      {/* Finish Workout Confirmation Modal */}
      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        position="center"
        maxWidth="440px"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Trophy size={20} />
          </div>
          <Typography variant="h2">{t('finish_workout_title', language)}</Typography>
        </div>

        <Typography variant="body" color="var(--text-secondary)" style={{ marginBottom: '16px' }}>
          {t('finish_workout_desc', language)}
        </Typography>

        {/* Workout Stats Summary Box */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            backgroundColor: 'var(--bg-main)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          <div>
            <Typography variant="caption" color="var(--text-muted)">
              {t('duration', language)}
            </Typography>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--primary)', marginTop: '2px' }}>
              {formatTimer(elapsedSeconds)}
            </div>
          </div>
          <div>
            <Typography variant="caption" color="var(--text-muted)">
              {t('exercises', language)}
            </Typography>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginTop: '2px' }}>
              {finishedExercisesCount}/{exercises.length}
            </div>
          </div>
          <div>
            <Typography variant="caption" color="var(--text-muted)">
              {t('sets', language)}
            </Typography>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginTop: '2px' }}>
              {totalSetsCount}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setShowFinishModal(false)} style={{ flex: 1 }}>
              {t('keep_going', language)}
            </Button>
            <Button
              variant="success"
              onClick={handleFinish}
              disabled={loading}
              leftIcon={<Check size={16} />}
              style={{ flex: 1.3 }}
            >
              {loading ? t('saving', language) : t('confirm_finish', language)}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: 'rgba(37, 211, 102, 0.12)',
              borderColor: 'rgba(37, 211, 102, 0.35)',
              color: '#25D366',
              fontWeight: 700,
              padding: '8px 12px',
            }}
          >
            <MessageCircle size={16} />
            <span>{t('share_via_whatsapp', language)}</span>
          </button>
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        position="center"
        maxWidth="440px"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <AlertTriangle size={24} color="var(--danger)" />
          <Typography variant="h2">{t('cancel_session_title', language)}</Typography>
        </div>
        <Typography variant="body" color="var(--text-secondary)" style={{ marginBottom: '20px' }}>
          {t('cancel_session_desc', language)}
        </Typography>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)} style={{ flex: 1 }}>
            {t('keep_going', language)}
          </Button>
          <Button variant="danger" onClick={handleCancelWorkout} style={{ flex: 1 }}>
            {t('discard_workout', language)}
          </Button>
        </div>
      </Modal>

      {/* Exercise Guide Modal */}
      <ExerciseGuideModal
        isOpen={Boolean(selectedGuideExercise)}
        exercise={selectedGuideExercise}
        onClose={() => setSelectedGuideExercise(null)}
      />

      {/* Share Workout Modal */}
      <ShareWorkoutModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        workoutName={activeWorkoutName || 'Active Workout'}
        date={new Date().toISOString()}
        sets={currentValidSets}
        unit={activeUnit}
      />
    </div>
  );
};
