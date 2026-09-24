import React, { useState, useEffect } from 'react';
import { UserProfile, Gender, HeightUnit } from '../../types';
import { calculateAge, cmToFeetInches, feetInchesToCm } from '../../utils/vitals';
import { useSettingsStore } from '../../store/useSettingsStore';
import { t } from '../../utils/i18n';
import { Modal } from '../atoms/Modal';
import { Typography } from '../atoms/Typography';
import { Badge } from '../atoms/Badge';
import { User, Calendar, Ruler, X, Check, Sparkles } from 'lucide-react';

export interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (updated: Partial<UserProfile>) => Promise<void>;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const { language } = useSettingsStore();

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender>('unspecified');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [heightCm, setHeightCm] = useState(175);
  const [heightFeet, setHeightFeet] = useState(5);
  const [heightInches, setHeightInches] = useState(9);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize state when modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setName(profile?.name || '');
      setDob(profile?.dob || '');
      setGender(profile?.gender || 'unspecified');
      const hUnit = profile?.heightUnit || 'cm';
      setHeightUnit(hUnit);

      const hCm = profile?.heightCm || 175;
      setHeightCm(hCm);

      const { feet, inches } = cmToFeetInches(hCm);
      setHeightFeet(feet);
      setHeightInches(inches);
    }
  }, [isOpen, profile]);

  // Derived automatic age
  const age = calculateAge(dob);

  const handleHeightUnitChange = (newUnit: HeightUnit) => {
    if (newUnit === heightUnit) return;
    setHeightUnit(newUnit);
    if (newUnit === 'ft_in') {
      const { feet, inches } = cmToFeetInches(heightCm);
      setHeightFeet(feet);
      setHeightInches(inches);
    } else {
      const convertedCm = feetInchesToCm(heightFeet, heightInches);
      setHeightCm(convertedCm);
    }
  };

  const handleFeetChange = (newFeet: number) => {
    setHeightFeet(newFeet);
    const convertedCm = feetInchesToCm(newFeet, heightInches);
    setHeightCm(convertedCm);
  };

  const handleInchesChange = (newInches: number) => {
    setHeightInches(newInches);
    const convertedCm = feetInchesToCm(heightFeet, newInches);
    setHeightCm(convertedCm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const finalHeightCm = heightUnit === 'ft_in'
        ? feetInchesToCm(heightFeet, heightInches)
        : Number(heightCm);

      await onSave({
        name: name.trim(),
        dob: dob || undefined,
        gender,
        heightCm: finalHeightCm > 0 ? finalHeightCm : 175,
        heightUnit,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="480px">
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
            <User size={18} />
          </div>
          <Typography variant="h3">{t('edit_profile', language)}</Typography>
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Name input */}
        <div className="form-group">
          <label className="form-label">{t('name', language)}</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('name_placeholder', language)}
          />
        </div>

        {/* Date of Birth & Automatic Age */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              <Calendar size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              {t('dob', language)}
            </label>
            {age !== null && (
              <Badge variant="primary">
                <Sparkles size={11} style={{ marginRight: '3px' }} />
                {age} {t('years_old', language)}
              </Badge>
            )}
          </div>
          <input
            type="date"
            className="form-input"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
            {language === 'es' ? 'Tu edad se calculará automáticamente a partir de tu fecha de nacimiento.' : 'Your age is automatically computed from your date of birth.'}
          </span>
        </div>

        {/* Gender Selection */}
        <div className="form-group">
          <label className="form-label">{t('gender', language)}</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {[
              { val: 'male' as Gender, label: t('male', language) },
              { val: 'female' as Gender, label: t('female', language) },
              { val: 'other' as Gender, label: t('other', language) },
              { val: 'unspecified' as Gender, label: t('unspecified', language) },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                className={`btn btn-secondary ${gender === opt.val ? 'active' : ''}`}
                onClick={() => setGender(opt.val)}
                style={{
                  padding: '8px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-md)',
                  borderColor: gender === opt.val ? 'var(--primary)' : 'var(--border-color)',
                  background: gender === opt.val ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-elevated)',
                  color: gender === opt.val ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: gender === opt.val ? 600 : 400,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Height Input with Unit Switch */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              <Ruler size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              {t('height', language)}
            </label>
            <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-elevated)', padding: '2px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => handleHeightUnitChange('cm')}
                style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: 'none',
                  background: heightUnit === 'cm' ? 'var(--primary)' : 'transparent',
                  color: heightUnit === 'cm' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                cm
              </button>
              <button
                type="button"
                onClick={() => handleHeightUnitChange('ft_in')}
                style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: 'none',
                  background: heightUnit === 'ft_in' ? 'var(--primary)' : 'transparent',
                  color: heightUnit === 'ft_in' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                ft / in
              </button>
            </div>
          </div>

          {heightUnit === 'cm' ? (
            <div className="form-input-group">
              <input
                type="number"
                className="form-input"
                min="50"
                max="260"
                step="1"
                value={heightCm || ''}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                placeholder="175"
              />
              <span className="form-input-suffix">cm</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="form-input-group">
                <input
                  type="number"
                  className="form-input"
                  min="2"
                  max="8"
                  value={heightFeet}
                  onChange={(e) => handleFeetChange(Number(e.target.value))}
                  placeholder="5"
                />
                <span className="form-input-suffix">ft</span>
              </div>
              <div className="form-input-group">
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max="11"
                  value={heightInches}
                  onChange={(e) => handleInchesChange(Number(e.target.value))}
                  placeholder="9"
                />
                <span className="form-input-suffix">in</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
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
            disabled={isSaving}
          >
            <Check size={16} style={{ marginRight: '6px' }} />
            {isSaving ? t('saving', language) : t('save_profile', language)}
          </button>
        </div>
      </form>
    </Modal>
  );
};
