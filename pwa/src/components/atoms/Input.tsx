import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  style,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-field ${className}`}
        style={{
          borderColor: error ? 'var(--danger)' : undefined,
          ...style,
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
};
