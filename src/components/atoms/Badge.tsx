import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'accent' | 'muted';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'muted',
  className = '',
  children,
  style,
  ...props
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`} style={style} {...props}>
      {children}
    </span>
  );
};
