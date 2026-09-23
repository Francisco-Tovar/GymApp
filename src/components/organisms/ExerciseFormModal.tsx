import React, { useState, useEffect, useRef } from 'react';
import { Exercise } from '../../types';
import { Typography } from '../atoms/Typography';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { Modal } from '../atoms/Modal';
import { useSettingsStore } from '../../store/useSettingsStore';
import { t, translateMuscleGroup } from '../../utils/i18n';
import { compressImage, isValidImageUrl } from '../../utils/imageUtils';
import { X, Plus, Upload, Trash2, Link, FileText, Image as ImageIcon, Check } from 'lucide-react';

interface ExerciseFormModalProps {
  isOpen: boolean;
  exerciseToEdit?: Exercise | null;
  onClose: () => void;
  onSubmit: (
    name: string,
    muscleGroups: string,
    imageUrl?: string | null,
    notes?: string | null
  ) => Promise<void>;
}

const COMMON_MUSCLES = [
  'Chest',
  'Upper Back',
  'Lats',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Abs',
  'Lower Back',
];

export const ExerciseFormModal: React.FC<ExerciseFormModalProps> = ({
  isOpen,
  exerciseToEdit,
  onClose,
  onSubmit,
}) => {
  const { language } = useSettingsStore();
  const [name, setName] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [customMuscle, setCustomMuscle] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (exerciseToEdit) {
      setName(exerciseToEdit.name);
      const muscles = exerciseToEdit.muscle_groups
        ? exerciseToEdit.muscle_groups.split(',').map((m) => m.trim()).filter(Boolean)
        : [];
      setSelectedMuscles(muscles);
      setImageUrl(exerciseToEdit.imageUrl || null);
      setNotes(exerciseToEdit.notes || '');
    } else {
      setName('');
      setSelectedMuscles([]);
      setImageUrl(null);
      setNotes('');
    }
    setUrlInput('');
    setShowUrlField(false);
    setCustomMuscle('');
    setError('');
  }, [exerciseToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleMuscle = (muscle: string) => {
    if (selectedMuscles.includes(muscle)) {
      setSelectedMuscles(selectedMuscles.filter((m) => m !== muscle));
    } else {
      setSelectedMuscles([...selectedMuscles, muscle]);
    }
  };

  const addCustomMuscle = () => {
    const trimmed = customMuscle.trim();
    if (trimmed && !selectedMuscles.includes(trimmed)) {
      setSelectedMuscles([...selectedMuscles, trimmed]);
      setCustomMuscle('');
    }
  };

  const handleFile = async (file: File) => {
    try {
      setCompressing(true);
      setError('');
      const compressed = await compressImage(file, { maxDimension: 800, quality: 0.8 });
      setImageUrl(compressed);
      setShowUrlField(false);
    } catch (err: any) {
      setError(err?.message || (language === 'es' ? 'Error al procesar la imagen' : 'Failed to process image'));
    } finally {
      setCompressing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (isValidImageUrl(trimmed)) {
      setImageUrl(trimmed);
      setUrlInput('');
      setShowUrlField(false);
      setError('');
    } else {
      setError(language === 'es' ? 'URL de imagen no válida.' : 'Invalid image URL.');
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === 'es' ? 'El nombre del ejercicio es obligatorio.' : 'Exercise name is required.');
      return;
    }
    if (selectedMuscles.length === 0) {
      setError(language === 'es' ? 'Selecciona al menos un grupo muscular objetivo.' : 'Select at least one targeted muscle group.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit(name.trim(), selectedMuscles.join(', '), imageUrl, notes.trim() || null);
      onClose();
    } catch (err: any) {
      setError(err?.message || (language === 'es' ? 'Error al guardar el ejercicio.' : 'Failed to save exercise.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} position="center" maxWidth="540px">
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Typography variant="h2">
            {exerciseToEdit ? t('edit_exercise', language) : t('add_new_exercise', language)}
          </Typography>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close', language)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Exercise Name */}
          <Input
            label={t('exercise_name', language)}
            placeholder={t('exercise_name_placeholder', language)}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
          />

          {/* Muscle Groups Selection */}
          <div>
            <Typography variant="label" color="var(--text-secondary)" weight="bold" style={{ marginBottom: '8px', display: 'block' }}>
              {t('target_muscle_groups', language)} ({selectedMuscles.length})
            </Typography>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {COMMON_MUSCLES.map((muscle) => {
                const isSelected = selectedMuscles.includes(muscle);
                return (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => toggleMuscle(muscle)}
                    style={{
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-main)',
                      color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                      borderRadius: 'var(--radius-full)',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {translateMuscleGroup(muscle, language)} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>

            {/* Custom Muscle Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder={t('custom_muscle_placeholder', language)}
                value={customMuscle}
                onChange={(e) => setCustomMuscle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomMuscle();
                  }
                }}
                className="input-field"
                style={{ flex: 1, padding: '7px 10px', fontSize: '12px' }}
              />
              <Button type="button" variant="secondary" size="sm" onClick={addCustomMuscle} leftIcon={<Plus size={14} />}>
                {language === 'es' ? 'Agregar' : 'Add'}
              </Button>
            </div>
          </div>

          {/* Visual Guide / Photo Attachment Section */}
          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <ImageIcon size={15} color="var(--primary)" />
              <Typography variant="label" color="var(--text-primary)" weight="bold" style={{ fontSize: '13px' }}>
                {t('guide_image', language)}
              </Typography>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {imageUrl ? (
              /* Image Preview + Action Buttons */
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px',
                }}
              >
                <div
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="Guide preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <Typography variant="caption" color="var(--text-muted)" style={{ fontSize: '11px' }}>
                    {language === 'es' ? 'Imagen adjunta lista para guardar' : 'Attached image ready to save'}
                  </Typography>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={compressing}
                      leftIcon={<Upload size={13} />}
                    >
                      {t('change_image', language)}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleRemoveImage}
                      leftIcon={<Trash2 size={13} />}
                    >
                      {t('remove_image', language)}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Dropzone & URL Input Toggle */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${isDragging ? 'var(--primary)' : 'var(--border-color)'}`,
                    backgroundColor: isDragging ? 'var(--primary-subtle)' : 'var(--bg-main)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Upload size={22} color={isDragging ? 'var(--primary)' : 'var(--text-muted)'} />
                  <Typography variant="body" style={{ fontSize: '13px', fontWeight: 600 }}>
                    {compressing
                      ? (language === 'es' ? 'Comprimiendo imagen...' : 'Compressing image...')
                      : t('drop_image_here', language)}
                  </Typography>
                  <Typography variant="caption" color="var(--text-muted)" style={{ fontSize: '11px' }}>
                    {t('image_formats_hint', language)}
                  </Typography>
                </div>

                {/* Optional URL input toggle */}
                {!showUrlField ? (
                  <button
                    type="button"
                    onClick={() => setShowUrlField(true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      alignSelf: 'flex-start',
                      padding: '2px 0',
                    }}
                  >
                    <Link size={12} />
                    {t('or_enter_image_url', language)}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                    <input
                      type="url"
                      placeholder={t('image_url_placeholder', language)}
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="input-field"
                      style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={handleApplyUrl} leftIcon={<Check size={13} />}>
                      {language === 'es' ? 'Aplicar' : 'Apply'}
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setShowUrlField(false)}>
                      <X size={13} />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Cues & Notes Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <FileText size={14} color="var(--primary)" />
              <Typography variant="label" color="var(--text-secondary)" weight="bold" style={{ fontSize: '12px' }}>
                {t('form_cues', language)}
              </Typography>
            </div>
            <textarea
              rows={3}
              placeholder={t('form_cues_placeholder', language)}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '12px',
                lineHeight: 1.5,
                resize: 'vertical',
                minHeight: '68px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Form Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
              {t('cancel', language)}
            </Button>
            <Button type="submit" variant="primary" disabled={loading || compressing} style={{ flex: 1.5 }}>
              {loading
                ? (language === 'es' ? 'Guardando...' : 'Saving...')
                : exerciseToEdit
                ? t('save_changes', language)
                : t('create_exercise', language)}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
