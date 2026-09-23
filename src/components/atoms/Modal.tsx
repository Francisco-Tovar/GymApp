import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'center' | 'bottom';
  maxWidth?: string;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  position = 'center',
  maxWidth = '460px',
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Lock background scrolling when modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCenter = position === 'center';

  return createPortal(
    <div
      className="modal-portal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: isCenter ? 'center' : 'flex-end',
        justifyContent: 'center',
        padding: isCenter ? '16px' : '0',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        className={`modal-portal-content ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: isCenter ? 'var(--radius-lg)' : 'var(--radius-lg) var(--radius-lg) 0 0',
          padding: '24px',
          width: '100%',
          maxWidth,
          maxHeight: '90dvh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
          animation: isCenter ? 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)' : 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
