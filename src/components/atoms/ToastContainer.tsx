import React from 'react';
import { useToastStore } from '../../store/useToastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  const getIcon = (type?: string) => {
    switch (type) {
      case 'danger':
        return <AlertCircle size={18} color="var(--danger)" />;
      case 'warning':
        return <AlertTriangle size={18} color="var(--warning)" />;
      case 'info':
        return <Info size={18} color="var(--primary)" />;
      case 'success':
      default:
        return <CheckCircle2 size={18} color="var(--success)" />;
    }
  };

  const getBorderColor = (type?: string) => {
    switch (type) {
      case 'danger':
        return 'rgba(239, 68, 68, 0.4)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.4)';
      case 'info':
        return 'rgba(249, 115, 22, 0.4)';
      case 'success':
      default:
        return 'rgba(16, 185, 129, 0.4)';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(var(--safe-top, 0px) + 16px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '90%',
        maxWidth: '420px',
        pointerEvents: 'none',
      }}
      aria-live="polite"
      role="status"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-fade-in"
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--bg-surface)',
            border: `1px solid ${getBorderColor(toast.type)}`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(12px)',
            color: 'var(--text-primary)',
            fontSize: '13.5px',
            fontWeight: 600,
          }}
        >
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {getIcon(toast.type)}
          </div>
          <div style={{ flex: 1, lineHeight: '1.35' }}>
            {toast.message}
          </div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
            }}
            aria-label="Close notification"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
};
