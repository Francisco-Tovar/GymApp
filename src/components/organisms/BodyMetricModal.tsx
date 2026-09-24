import React, { useState, useEffect } from 'react';
import { BodyMetricLog, WeightUnit } from '../../types';
import { convertWeight } from '../../utils/unitConversion';
import { useSettingsStore } from '../../store/useSettingsStore';
import { t } from '../../utils/i18n';
import { Modal } from '../atoms/Modal';
import { Typography } from '../atoms/Typography';
import { Scale, Percent, Calendar, FileText, X, Check, Trash2 } from 'lucide-react';

export interface BodyMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit: BodyMetricLog | null;
  onSave: (entry: Omit<BodyMetricLog, 'id'>, editId?: number) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export const BodyMetricModal: React.FC<BodyMetricModalProps> = ({
  isOpen,
  onClose,
  entryToEdit,
  onSave,
  onDelete,
}) => {
  const { unit, language } = useSettingsStore();

  const [date, setDate] = useState('');
  const [weight, setWeight] = useState<string>('');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false);
      if (entryToEdit) {
        // Parse date
        const d = new Date(entryToEdit.date);
        setDate(!isNaN(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

        // Convert weight to current unit if logged in different unit
        const displayWeight = entryToEdit.unit === unit
          ? entryToEdit.weight
          : Math.round(convertWeight(entryToEdit.weight, entryToEdit.unit, unit) * 10) / 10;
        setWeight(String(displayWeight));

        setBodyFat(entryToEdit.bodyFatPercentage != null ? String(entryToEdit.bodyFatPercentage) : '');
        setNotes(entryToEdit.notes || '');
      } else {
        // New entry defaults
        setDate(new Date().toISOString().split('T')[0]);
        setWeight('');
        setBodyFat('');
        setNotes('');
      }
    }
  }, [isOpen, entryToEdit, unit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) return;

    setIsSaving(true);
    try {
      const fatNum = bodyFat.trim() !== '' ? parseFloat(bodyFat) : null;
      await onSave(
        {
          date: date ? new Date(date + 'T12:00:00.000Z').toISOString() : new Date().toISOString(),
          weight: weightNum,
          unit,
          bodyFatPercentage: fatNum !== null && !isNaN(fatNum) ? fatNum : null,
          notes: notes.trim() || null,
        },
        entryToEdit?.id
      );
      onClose();
    } catch (err) {
      console.error('Failed to save body metric:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entryToEdit?.id || !onDelete) return;
    setIsSaving(true);
    try {
      await onDelete(entryToEdit.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete body metric:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="460px">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <Scale size={18} />
          </div>
          <Typography variant="h3">
            {entryToEdit ? t('edit_log', language) : t('log_weight', language)}
          </Typography>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost btn-icon"
          style={{ width: '32px', height: '32px' }}
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Date Field */}
        <div className="form-group">
          <label className="form-label">
            <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
            {t('date', language)}
          </label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        {/* Body Weight Field */}
        <div className="form-group">
          <label className="form-label">
            <Scale size={13} style={{ display: 'inline', marginRight: '4px' }} />
            {t('body_weight', language)} ({unit.toUpperCase()})
          </label>
          <div className="form-input-group">
            <input
              type="number"
              step="0.1"
              min="20"
              max="500"
              className="form-input"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={unit === 'lb' ? '175.5' : '79.5'}
              required
              autoFocus
            />
            <span className="form-input-suffix">{unit.toUpperCase()}</span>
          </div>
        </div>

        {/* Optional Body Fat % Field */}
        <div className="form-group">
          <label className="form-label">
            <Percent size={13} style={{ display: 'inline', marginRight: '4px' }} />
            {t('body_fat_optional', language)}
          </label>
          <div className="form-input-group">
            <input
              type="number"
              step="0.1"
              min="3"
              max="60"
              className="form-input"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              placeholder="15.0"
            />
            <span className="form-input-suffix" style={{ color: 'var(--accent)' }}>%</span>
          </div>
        </div>

        {/* Optional Notes Field */}
        <div className="form-group">
          <label className="form-label">
            <FileText size={13} style={{ display: 'inline', marginRight: '4px' }} />
            {t('notes', language)}
          </label>
          <textarea
            className="form-input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('notes_placeholder', language)}
            style={{ resize: 'none' }}
          />
        </div>

        {/* Delete confirmation if editing */}
        {entryToEdit && onDelete && (
          <div>
            {!showDeleteConfirm ? (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowDeleteConfirm(true)}
                style={{ color: 'var(--danger)', fontSize: '13px', padding: '6px 8px' }}
              >
                <Trash2 size={14} style={{ marginRight: '6px' }} />
                {t('delete', language)}
              </button>
            ) : (
              <div
                style={{
                  padding: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--danger)',
                }}
              >
                <Typography variant="caption" style={{ color: 'var(--danger)', display: 'block', marginBottom: '8px' }}>
                  {t('delete_entry_desc', language)}
                </Typography>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{ flex: 1 }}
                  >
                    {t('cancel', language)}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleDelete}
                    style={{ flex: 1 }}
                    disabled={isSaving}
                  >
                    {t('delete', language)}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ flex: 1 }}
            disabled={isSaving}
          >
            {t('cancel', language)}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={isSaving || !weight}
          >
            <Check size={16} style={{ marginRight: '6px' }} />
            {isSaving ? t('saving', language) : t('save', language)}
          </button>
        </div>
      </form>
    </Modal>
  );
};
