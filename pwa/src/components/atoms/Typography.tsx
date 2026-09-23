import React from 'react';

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  color?: string;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  as?: React.ElementType;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color,
  weight,
  align = 'left',
  as,
  className = '',
  style,
  children,
  ...props
}) => {
  const Component = as || (variant === 'h1' ? 'h1' : variant === 'h2' ? 'h2' : variant === 'h3' ? 'h3' : 'p');

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'h1':
        return { fontSize: '24px', fontWeight: weight || 'bold', lineHeight: 1.25 };
      case 'h2':
        return { fontSize: '20px', fontWeight: weight || 'bold', lineHeight: 1.3 };
      case 'h3':
        return { fontSize: '16px', fontWeight: weight || 'semibold', lineHeight: 1.4 };
      case 'caption':
        return { fontSize: '12px', color: color || 'var(--text-muted)', lineHeight: 1.4 };
      case 'label':
        return { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' };
      case 'body':
      default:
        return { fontSize: '14px', lineHeight: 1.5 };
    }
  };

  return (
    <Component
      className={`typography-${variant} ${className}`}
      style={{
        ...getVariantStyles(),
        ...(color ? { color } : {}),
        ...(weight ? { fontWeight: weight } : {}),
        textAlign: align,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
};
