import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Exercise } from '../../types';
import { Typography } from '../atoms/Typography';
import { Badge } from '../atoms/Badge';
import { useSettingsStore } from '../../store/useSettingsStore';
import { t, translateMuscleGroup } from '../../utils/i18n';
import { resolveImageUrl } from '../../utils/imageUtils';
import { FileText, Image as ImageIcon } from 'lucide-react';

interface ExerciseGuideModalProps {
  isOpen: boolean;
  exercise: Exercise | null;
  onClose: () => void;
}

export const ExerciseGuideModal: React.FC<ExerciseGuideModalProps> = ({
  isOpen,
  exercise,
  onClose,
}) => {
  const { language } = useSettingsStore();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !exercise || typeof document === 'undefined') return null;

  const muscles = exercise.muscle_groups
    ? exercise.muscle_groups.split(',').map((m) => m.trim()).filter(Boolean)
    : [];

  return createPortal(
    <div
      className="modal-portal-backdrop animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 10003,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="modal-portal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '94dvh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
          animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'default',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          <Typography variant="h3" style={{ fontSize: '18px', fontWeight: 800 }}>
            {exercise.name}
          </Typography>
          {muscles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              {muscles.map((m, idx) => (
                <Badge key={idx} variant="primary" style={{ fontSize: '10px', padding: '1px 6px' }}>
                  {translateMuscleGroup(m, language)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            padding: '12px 16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flex: 1,
          }}
        >
          {/* Image Container */}
          {exercise.imageUrl ? (
            <div
              style={{
                width: '100%',
                maxHeight: '75vh',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
              }}
            >
              <img
                src={resolveImageUrl(exercise.imageUrl)}
                alt={exercise.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '73vh',
                  objectFit: 'contain',
                  borderRadius: 'calc(var(--radius-md) - 2px)',
                  display: 'block',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                height: '180px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--text-muted)',
              }}
            >
              <ImageIcon size={36} />
              <Typography variant="caption" color="var(--text-muted)">
                {language === 'es' ? 'Sin imagen adjunta' : 'No visual guide image attached'}
              </Typography>
            </div>
          )}

          {/* Form Cues & Notes */}
          {exercise.notes ? (
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid var(--primary)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} color="var(--primary)" />
                <Typography variant="label" color="var(--primary)" weight="bold" style={{ fontSize: '12px' }}>
                  {t('form_cues', language)}
                </Typography>
              </div>
              <Typography
                variant="body"
                style={{
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {exercise.notes}
              </Typography>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
};
