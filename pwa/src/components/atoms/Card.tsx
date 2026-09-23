import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  elevated = false,
  className = '',
  children,
  style,
  ...props
}) => {
  return (
    <div
      className={`glass-card ${className}`}
      style={{
        padding: '16px',
        backgroundColor: elevated ? 'var(--bg-elevated)' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};
