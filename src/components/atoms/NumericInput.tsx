import React, { useRef, useState, useEffect } from 'react';

export interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  allowDecimal?: boolean;
  maxNumber?: number;
  minNumber?: number;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  allowDecimal = false,
  maxNumber,
  minNumber,
  placeholder,
  className = '',
  style,
  onFocus,
  onBlur,
  inputMode,
  ...props
}) => {
  const previousValueRef = useRef<string>(value);
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState<string>(
    (value && value.trim() !== '') ? value.trim() : (placeholder || '0')
  );
  const [isFocused, setIsFocused] = useState(false);

  // Keep dynamic placeholder and previousValue in sync with value when input is not focused
  useEffect(() => {
    if (!isFocused) {
      previousValueRef.current = value;
      if (value && value.trim() !== '') {
        setDynamicPlaceholder(value.trim());
      }
    }
  }, [value, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);

    const current = (value || '').trim();
    // Save current value before clearing
    previousValueRef.current = value;

    // Use current value as the background/placeholder number
    if (current !== '') {
      setDynamicPlaceholder(current);
    } else if (placeholder) {
      setDynamicPlaceholder(placeholder);
    } else {
      setDynamicPlaceholder('0');
    }

    // Always clear the textbox completely for clean immediate number entry
    onChange('');

    onFocus?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    if (allowDecimal) {
      // Allow only numbers and at most one decimal point
      raw = raw.replace(/[^0-9.]/g, '');
      const parts = raw.split('.');
      if (parts.length > 2) {
        raw = parts[0] + '.' + parts.slice(1).join('');
      }
    } else {
      // Allow only digits
      raw = raw.replace(/\D/g, '');
    }

    // Optional numeric clamp for maxNumber if provided
    if (maxNumber !== undefined && raw !== '') {
      const numVal = allowDecimal ? parseFloat(raw) : parseInt(raw, 10);
      if (!isNaN(numVal) && numVal > maxNumber) {
        raw = maxNumber.toString();
      }
    }

    onChange(raw);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    const trimmed = (value || '').trim();

    // If left empty or just a stray decimal point, put back previous number like it was
    if (trimmed === '' || trimmed === '.') {
      const prev = previousValueRef.current;
      if (prev !== undefined && prev !== null && prev.trim() !== '') {
        onChange(prev);
        setDynamicPlaceholder(prev.trim());
      } else {
        onChange('0');
        setDynamicPlaceholder('0');
      }
    } else {
      let finalVal = trimmed;
      if (minNumber !== undefined) {
        const numVal = allowDecimal ? parseFloat(trimmed) : parseInt(trimmed, 10);
        if (!isNaN(numVal) && numVal < minNumber) {
          finalVal = minNumber.toString();
          onChange(finalVal);
        }
      }
      previousValueRef.current = finalVal;
      setDynamicPlaceholder(finalVal);
    }

    onBlur?.(e);
  };

  return (
    <input
      type="text"
      inputMode={inputMode || (allowDecimal ? 'decimal' : 'numeric')}
      pattern={allowDecimal ? '[0-9]*[.]?[0-9]*' : '[0-9]*'}
      value={value}
      placeholder={dynamicPlaceholder}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`input-field ${className}`}
      style={style}
      {...props}
    />
  );
};
