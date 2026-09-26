import React, { useState } from 'react';
import { SessionSet, WeightUnit } from '../../types';
import { Modal } from '../atoms/Modal';
import { Typography } from '../atoms/Typography';
import { Button } from '../atoms/Button';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import { t } from '../../utils/i18n';
import {
  generateWorkoutShareText,
  shareViaWhatsApp,
  shareViaNavigator,
  copyToClipboard,
} from '../../utils/shareUtils';
import { Share2, Copy, Check, MessageCircle, Send } from 'lucide-react';

interface ShareWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutName?: string;
  date: string;
  sets: SessionSet[];
  unit: WeightUnit;
}

export const ShareWorkoutModal: React.FC<ShareWorkoutModalProps> = ({
  isOpen,
  onClose,
  workoutName,
  date,
  sets,
  unit,
}) => {
  const { language } = useSettingsStore();
  const { showToast } = useToastStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = generateWorkoutShareText(
    { workout_name: workoutName, date },
    sets,
    unit,
    language
  );

  const handleWhatsAppShare = () => {
    shareViaWhatsApp(shareText);
  };

  const handleSystemShare = async () => {
    const success = await shareViaNavigator(
      `GymApp - ${workoutName || 'Workout'}`,
      shareText
    );
    if (!success) {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(shareText);
    if (success) {
      setCopied(true);
      showToast(t('copied_to_clipboard', language), 'success', 3000);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} position="center" maxWidth="480px">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(37, 211, 102, 0.15)',
            color: '#25D366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Share2 size={20} />
        </div>
        <div>
          <Typography variant="h2">{t('share_workout', language)}</Typography>
          <Typography variant="caption" color="var(--text-muted)">
            {workoutName || 'Active Workout'}
          </Typography>
        </div>
      </div>

      {/* Message Preview Box */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <Typography variant="label" color="var(--text-secondary)">
            {t('share_preview', language)}
          </Typography>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              border: 'none',
              background: 'transparent',
              color: copied ? 'var(--success)' : 'var(--primary)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 6px',
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? (language === 'es' ? 'Copiado' : 'Copied') : t('copy_summary', language)}</span>
          </button>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            maxHeight: '180px',
            overflowY: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            color: 'var(--text-primary)',
            lineHeight: 1.45,
          }}
        >
          {shareText}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* WhatsApp Button (Prominent Brand Green) */}
        <Button
          type="button"
          size="md"
          fullWidth
          leftIcon={<MessageCircle size={18} />}
          onClick={handleWhatsAppShare}
          style={{
            backgroundColor: '#25D366',
            borderColor: '#25D366',
            color: '#ffffff',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
          }}
        >
          {t('share_via_whatsapp', language)}
        </Button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Native System Share */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              style={{ flex: 1 }}
              leftIcon={<Send size={15} />}
              onClick={handleSystemShare}
            >
              {t('share_via_apps', language)}
            </Button>
          )}

          {/* Copy Button */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            style={{ flex: 1 }}
            leftIcon={copied ? <Check size={15} /> : <Copy size={15} />}
            onClick={handleCopy}
          >
            {copied ? (language === 'es' ? '¡Copiado!' : 'Copied!') : t('copy_summary', language)}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
