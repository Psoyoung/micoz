import React, { forwardRef } from 'react';
import styled, { css } from 'styled-components';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioProps {
  name: string;
  options: RadioOption[];
  value?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  direction?: 'horizontal' | 'vertical';
  error?: boolean;
  onChange?: (value: string) => void;
  className?: string;
}

export interface SingleRadioProps {
  name: string;
  value: string;
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  error?: boolean;
  onChange?: (value: string) => void;
  className?: string;
}

const RadioContainer = styled.div<{ direction?: 'horizontal' | 'vertical' }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  
  ${({ direction }) =>
    direction === 'vertical'
      ? css`
          flex-direction: column;
          gap: ${({ theme }) => theme.spacing[2]};
        `
      : css`
          flex-direction: row;
          flex-wrap: wrap;
        `}
`;

const RadioItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  cursor: pointer;
  
  &:has(input:disabled) {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const HiddenRadio = styled.input.attrs({ type: 'radio' })`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
`;

const StyledRadio = styled.div<{ 
  checked?: boolean; 
  size?: 'small' | 'medium' | 'large';
  error?: boolean;
}>`
  position: relative;
  border-radius: 50%;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${({ size, theme }) => {
    switch (size) {
      case 'small':
        return css`
          width: 16px;
          height: 16px;
        `;
      case 'large':
        return css`
          width: 24px;
          height: 24px;
        `;
      default: // medium
        return css`
          width: 20px;
          height: 20px;
        `;
    }
  }}

  ${({ checked, error, theme }) => {
    const borderColor = error ? theme.colors.error : theme.colors.gray[400];
    const checkedColor = error ? theme.colors.error : theme.colors.primary.sage;
    
    return css`
      background-color: ${theme.colors.secondary.ivory};
      border: 2px solid ${checked ? checkedColor : borderColor};
      
      &:hover {
        border-color: ${theme.colors.primary.sage};
      }
    `;
  }}

  ${HiddenRadio}:focus + & {
    outline: 2px solid ${({ theme }) => theme.colors.primary.sage};
    outline-offset: 2px;
  }

  ${HiddenRadio}:disabled + & {
    background-color: ${({ theme }) => theme.colors.gray[100]};
    border-color: ${({ theme }) => theme.colors.gray[300]};
  }
`;

const RadioDot = styled.div<{ 
  checked?: boolean; 
  size?: 'small' | 'medium' | 'large';
  error?: boolean;
}>`
  border-radius: 50%;
  background-color: ${({ checked, error, theme }) => 
    checked ? (error ? theme.colors.error : theme.colors.primary.sage) : 'transparent'
  };
  transition: all ${({ theme }) => theme.transitions.fast};
  
  ${({ size }) => {
    switch (size) {
      case 'small':
        return css`
          width: 6px;
          height: 6px;
        `;
      case 'large':
        return css`
          width: 10px;
          height: 10px;
        `;
      default: // medium
        return css`
          width: 8px;
          height: 8px;
        `;
    }
  }}
`;

const Label = styled.label<{ size?: 'small' | 'medium' | 'large' }>`
  cursor: pointer;
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  user-select: none;
  
  ${({ size, theme }) => {
    switch (size) {
      case 'small':
        return css`
          font-size: ${theme.typography.fontSize.sm};
        `;
      case 'large':
        return css`
          font-size: ${theme.typography.fontSize.lg};
        `;
      default: // medium
        return css`
          font-size: ${theme.typography.fontSize.base};
        `;
    }
  }}
`;

export const SingleRadio = forwardRef<HTMLInputElement, SingleRadioProps>(
  (
    {
      name,
      value,
      label,
      checked = false,
      disabled = false,
      size = 'medium',
      error = false,
      onChange,
      className,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <RadioItem className={className}>
        <HiddenRadio
          ref={ref}
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          {...props}
        />
        <StyledRadio checked={checked} size={size} error={error}>
          <RadioDot checked={checked} size={size} error={error} />
        </StyledRadio>
        {label && <Label size={size}>{label}</Label>}
      </RadioItem>
    );
  }
);

export const Radio: React.FC<RadioProps> = ({
  name,
  options,
  value,
  disabled = false,
  size = 'medium',
  direction = 'vertical',
  error = false,
  onChange,
  className,
}) => {
  const handleChange = (optionValue: string) => {
    if (onChange) {
      onChange(optionValue);
    }
  };

  return (
    <RadioContainer direction={direction} className={className}>
      {options.map((option) => (
        <SingleRadio
          key={option.value}
          name={name}
          value={option.value}
          label={option.label}
          checked={value === option.value}
          disabled={disabled || option.disabled}
          size={size}
          error={error}
          onChange={handleChange}
        />
      ))}
    </RadioContainer>
  );
};