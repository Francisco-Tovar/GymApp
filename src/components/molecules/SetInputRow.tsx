import React from 'react';
import { WeightUnit } from '../../types';
import { Typography } from '../atoms/Typography';
import { useSettingsStore } from '../../store/useSettingsStore';
import { t } from '../../utils/i18n';
import { Minus, Plus, X } from 'lucide-react';

interface SetInputRowProps {
  setNumber: number;
  exerciseType?: 'weight_reps' | 'time_based';
  weight: string;
  reps: string;
  durationMinutes?: string;
  durationSeconds?: string;
  notes?: string;
  unit: WeightUnit;
  onUpdateWeight: (val: string) => void;
  onUpdateReps: (val: string) => void;
  onUpdateDurationMinutes?: (val: string) => void;
  onUpdateDurationSeconds?: (val: string) => void;
  onUpdateNotes?: (val: string) => void;
  onRemoveSet: () => void;
}

export const SetInputRow: React.FC<SetInputRowProps> = ({
  setNumber,
  exerciseType = 'weight_reps',
  weight,
  reps,
  durationMinutes = '0',
  durationSeconds = '0',
  notes = '',
  unit,
  onUpdateWeight,
  onUpdateReps,
  onUpdateDurationMinutes,
  onUpdateDurationSeconds,
  onUpdateNotes,
  onRemoveSet,
}) => {
  const { language } = useSettingsStore();
  const [showNoteInput, setShowNoteInput] = React.useState(Boolean(notes && notes.trim().length > 0));

  const adjustMinutes = (delta: number) => {
    const current = parseInt(durationMinutes, 10) || 0;
    const next = Math.max(0, current + delta);
    onUpdateDurationMinutes?.(next.toString());
  };

  const adjustSeconds = (delta: number) => {
    const current = parseInt(durationSeconds, 10) || 0;
    const next = Math.max(0, Math.min(59, current + delta));
    onUpdateDurationSeconds?.(next.toString());
  };

  const adjustWeight = (delta: number) => {
    const current = parseFloat(weight) || 0;
    const next = Math.max(0, current + delta);
    onUpdateWeight(next.toString());
  };

  const adjustReps = (delta: number) => {
    const current = parseInt(reps, 10) || 0;
    const next = Math.max(0, current + delta);
    onUpdateReps(next.toString());
  };

  const isTimeBased = exerciseType === 'time_based';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        backgroundColor: 'var(--bg-main)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 10px',
        margin: '6px 0',
        border: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--primary-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--primary)',
            fontWeight: 700,
            fontSize: '13px',
            flexShrink: 0,
          }}
        >
          #{setNumber}
        </div>

        {isTimeBased ? (
          /* Time Controls (Minutes + Seconds) */
          <>
            {/* Minutes */}
            <div style={{ flex: 1.2, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => adjustMinutes(-1)}
                  title="-1 min"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min="0"
                  value={durationMinutes}
                  onChange={(e) => onUpdateDurationMinutes?.(e.target.value)}
                  placeholder="0"
                  className="input-field"
                  style={{
                    padding: '6px 28px 6px 6px',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '15px',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '24px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                    fontWeight: 500,
                  }}
                >
                  {t('minutes', language)}
                </span>
                <button
                  type="button"
                  onClick={() => adjustMinutes(1)}
                  title="+1 min"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Seconds */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => adjustSeconds(-5)}
                  title="-5 sec"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={durationSeconds}
                  onChange={(e) => onUpdateDurationSeconds?.(e.target.value)}
                  placeholder="0"
                  className="input-field"
                  style={{
                    padding: '6px 28px 6px 6px',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '15px',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '24px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                    fontWeight: 500,
                  }}
                >
                  {t('seconds', language)}
                </span>
                <button
                  type="button"
                  onClick={() => adjustSeconds(5)}
                  title="+5 sec"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Weight & Reps Controls */
          <>
            {/* Weight Controls */}
            <div style={{ flex: 1.2, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => adjustWeight(-5)}
                  title="-5"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  step="any"
                  value={weight}
                  onChange={(e) => onUpdateWeight(e.target.value)}
                  placeholder="0"
                  className="input-field"
                  style={{
                    padding: '6px 28px 6px 6px',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '15px',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '26px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                    fontWeight: 500,
                  }}
                >
                  {unit}
                </span>
                <button
                  type="button"
                  onClick={() => adjustWeight(5)}
                  title="+5"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Reps Controls */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => adjustReps(-1)}
                  title="-1"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => onUpdateReps(e.target.value)}
                  placeholder="0"
                  className="input-field"
                  style={{
                    padding: '6px 32px 6px 6px',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '15px',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '24px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                    fontWeight: 500,
                  }}
                >
                  reps
                </span>
                <button
                  type="button"
                  onClick={() => adjustReps(1)}
                  title="+1"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Remove Button */}
        <button
          type="button"
          onClick={onRemoveSet}
          title={language === 'es' ? 'Eliminar Serie' : 'Remove Set'}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--danger)',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            opacity: 0.8,
            transition: 'opacity 0.15s ease',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Optional Note Row (Toggle or Active Field) */}
      <div style={{ paddingLeft: '34px', paddingRight: '28px' }}>
        {!showNoteInput ? (
          <button
            type="button"
            onClick={() => setShowNoteInput(true)}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--primary)',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 0',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            + {t('set_notes', language)}
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="text"
              value={notes}
              onChange={(e) => onUpdateNotes?.(e.target.value)}
              placeholder={t('set_notes_placeholder', language)}
              className="input-field"
              style={{
                fontSize: '11.5px',
                padding: '4px 8px',
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                flex: 1,
              }}
            />
            {(!notes || notes.trim() === '') && (
              <button
                type="button"
                onClick={() => setShowNoteInput(false)}
                title={t('close', language)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
