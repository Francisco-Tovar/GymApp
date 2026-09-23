import React from 'react';
import { WeightUnit } from '../../types';
import { Typography } from '../atoms/Typography';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Minus, Plus, X } from 'lucide-react';

interface SetInputRowProps {
  setNumber: number;
  weight: string;
  reps: string;
  unit: WeightUnit;
  onUpdateWeight: (val: string) => void;
  onUpdateReps: (val: string) => void;
  onRemoveSet: () => void;
}

export const SetInputRow: React.FC<SetInputRowProps> = ({
  setNumber,
  weight,
  reps,
  unit,
  onUpdateWeight,
  onUpdateReps,
  onRemoveSet,
}) => {
  const { language } = useSettingsStore();

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

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
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
  );
};
