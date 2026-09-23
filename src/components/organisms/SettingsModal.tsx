import React, { useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { clearAllDataAndReset } from '../../db/db';
import { t } from '../../utils/i18n';
import { Typography } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { Modal } from '../atoms/Modal';
import {
  Settings,
  X,
  Moon,
  Sun,
  Languages,
  Scale,
  AlertTriangle,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataWiped?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onDataWiped,
}) => {
  const { theme, setTheme, language, setLanguage, unit, setUnit } = useSettingsStore();

  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [wipedFeedback, setWipedFeedback] = useState<string | null>(null);

  const handleConfirmWipe = async () => {
    try {
      setIsWiping(true);
      await clearAllDataAndReset();
      setWipedFeedback(t('data_wiped_success', language));
      setIsWipeConfirmOpen(false);

      if (onDataWiped) {
        onDataWiped();
      }

      setTimeout(() => {
        setWipedFeedback(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to wipe data:', err);
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} position="center" maxWidth="520px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}
              >
                <Settings size={20} />
              </div>
              <div>
                <Typography variant="h2" style={{ fontSize: '18px', fontWeight: 800 }}>
                  {t('settings_title', language)}
                </Typography>
                <Typography variant="caption" color="var(--text-muted)">
                  {t('settings_subtitle', language)}
                </Typography>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              title={t('close', language)}
              aria-label={t('close', language)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app, var(--bg-main))',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--text-muted)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Feedback Toast if data wiped */}
          {wipedFeedback && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: 'var(--success)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} />
              <span>{wipedFeedback}</span>
            </div>
          )}

          {/* Setting 1: Theme Toggle (Dark / Light) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Moon size={15} color="var(--primary)" />
              <Typography variant="h3" style={{ fontSize: '14px', fontWeight: 700 }}>
                {t('theme', language)}
              </Typography>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                backgroundColor: 'var(--bg-main)',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                gap: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => setTheme('dark')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: theme === 'dark' ? 700 : 500,
                  cursor: 'pointer',
                  backgroundColor: theme === 'dark' ? 'var(--primary)' : 'transparent',
                  color: theme === 'dark' ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: theme === 'dark' ? '0 2px 8px var(--primary-glow)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Moon size={15} />
                <span>{t('dark_mode', language)}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: theme === 'light' ? 700 : 500,
                  cursor: 'pointer',
                  backgroundColor: theme === 'light' ? 'var(--primary)' : 'transparent',
                  color: theme === 'light' ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: theme === 'light' ? '0 2px 8px var(--primary-glow)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Sun size={15} />
                <span>{t('light_mode', language)}</span>
              </button>
            </div>
          </div>

          {/* Setting 2: Language Toggle (English / Español) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Languages size={15} color="var(--primary)" />
              <Typography variant="h3" style={{ fontSize: '14px', fontWeight: 700 }}>
                {t('language', language)}
              </Typography>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                backgroundColor: 'var(--bg-main)',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                gap: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => setLanguage('en')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: language === 'en' ? 700 : 500,
                  cursor: 'pointer',
                  backgroundColor: language === 'en' ? 'var(--primary)' : 'transparent',
                  color: language === 'en' ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: language === 'en' ? '0 2px 8px var(--primary-glow)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>English</span>
              </button>

              <button
                type="button"
                onClick={() => setLanguage('es')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: language === 'es' ? 700 : 500,
                  cursor: 'pointer',
                  backgroundColor: language === 'es' ? 'var(--primary)' : 'transparent',
                  color: language === 'es' ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: language === 'es' ? '0 2px 8px var(--primary-glow)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>Español</span>
              </button>
            </div>
          </div>

          {/* Setting 3: Default Weight Unit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Scale size={15} color="var(--primary)" />
              <Typography variant="h3" style={{ fontSize: '14px', fontWeight: 700 }}>
                {t('weight_unit', language)}
              </Typography>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                backgroundColor: 'var(--bg-main)',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                gap: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => setUnit('lb')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: unit === 'lb' ? 700 : 500,
                  cursor: 'pointer',
                  backgroundColor: unit === 'lb' ? 'var(--primary)' : 'transparent',
                  color: unit === 'lb' ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: unit === 'lb' ? '0 2px 8px var(--primary-glow)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{t('pounds', language)}</span>
              </button>

              <button
                type="button"
                onClick={() => setUnit('kg')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: unit === 'kg' ? 700 : 500,
                  cursor: 'pointer',
                  backgroundColor: unit === 'kg' ? 'var(--primary)' : 'transparent',
                  color: unit === 'kg' ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: unit === 'kg' ? '0 2px 8px var(--primary-glow)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{t('kilograms', language)}</span>
              </button>
            </div>
          </div>

          {/* Danger Zone: Data Management */}
          <div
            style={{
              marginTop: '8px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="var(--danger)" />
              <Typography variant="h3" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--danger)' }}>
                {t('danger_zone', language)}
              </Typography>
            </div>

            <Typography variant="caption" color="var(--text-muted)" style={{ lineHeight: 1.4 }}>
              {t('clear_all_data_desc', language)}
            </Typography>

            <button
              type="button"
              onClick={() => setIsWipeConfirmOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--danger)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--danger)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                alignSelf: 'flex-start',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--danger)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
                e.currentTarget.style.color = 'var(--danger)';
              }}
            >
              <Trash2 size={15} />
              <span>{t('clear_all_data', language)}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Secondary Confirmation Modal for Data Wipe */}
      <Modal
        isOpen={isWipeConfirmOpen}
        onClose={() => !isWiping && setIsWipeConfirmOpen(false)}
        position="center"
        maxWidth="440px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--danger)',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <Typography variant="h2" style={{ fontSize: '18px', fontWeight: 800 }}>
              {t('wipe_confirm_title', language)}
            </Typography>
          </div>

          <Typography variant="body" color="var(--text-secondary)" style={{ fontSize: '13px', lineHeight: 1.5 }}>
            {t('wipe_confirm_desc', language)}
          </Typography>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <Button
              variant="secondary"
              onClick={() => setIsWipeConfirmOpen(false)}
              disabled={isWiping}
              style={{ flex: 1 }}
            >
              {t('cancel', language)}
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmWipe}
              disabled={isWiping}
              style={{ flex: 1 }}
            >
              {isWiping ? t('loading', language) : t('confirm_wipe_button', language)}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
