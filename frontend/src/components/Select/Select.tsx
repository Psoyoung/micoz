import React, { forwardRef, useState } from 'react';
import styled, { css } from 'styled-components';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'outlined';
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const SelectContainer = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  position: relative;
`;

const Label = styled.label<{ required?: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.secondary.charcoal};

  ${({ required, theme }) =>
    required &&
    css`
      &::after {
        content: ' *';
        color: ${theme.colors.error};
      }
    `}
`;

const StyledSelect = styled.select<SelectProps>`
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  transition: all ${({ theme }) => theme.transitions.fast};
  width: 100%;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='m0 0 2 2 2-2z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary.sage};
    outline-offset: -2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.gray[100]};
  }

  /* Size variants */
  ${({ size, theme }) => {
    switch (size) {
      case 'small':
        return css`
          padding: ${theme.spacing[2]} ${theme.spacing[8]} ${theme.spacing[2]} ${theme.spacing[3]};
          font-size: ${theme.typography.fontSize.sm};
          min-height: 36px;
        `;
      case 'large':
        return css`
          padding: ${theme.spacing[4]} ${theme.spacing[10]} ${theme.spacing[4]} ${theme.spacing[4]};
          font-size: ${theme.typography.fontSize.lg};
          min-height: 56px;
        `;
      default: // medium
        return css`
          padding: ${theme.spacing[3]} ${theme.spacing[8]} ${theme.spacing[3]} ${theme.spacing[4]};
          font-size: ${theme.typography.fontSize.base};
          min-height: 44px;
        `;
    }
  }}

  /* Variant styles */
  ${({ variant, error, theme }) => {
    const borderColor = error ? theme.colors.error : theme.colors.gray[300];
    const focusBorderColor = error ? theme.colors.error : theme.colors.primary.sage;

    switch (variant) {
      case 'filled':
        return css`
          background-color: ${theme.colors.gray[100]};
          border: 2px solid transparent;
          color: ${theme.colors.secondary.charcoal};

          &:focus {
            background-color: ${theme.colors.secondary.ivory};
            border-color: ${focusBorderColor};
          }

          &:hover:not(:disabled) {
            background-color: ${theme.colors.gray[200]};
          }
        `;
      case 'outlined':
        return css`
          background-color: transparent;
          border: 2px solid ${borderColor};
          color: ${theme.colors.secondary.charcoal};

          &:focus {
            border-color: ${focusBorderColor};
            background-color: ${theme.colors.secondary.ivory};
          }

          &:hover:not(:disabled) {
            border-color: ${theme.colors.gray[400]};
          }
        `;
      default: // default
        return css`
          background-color: ${theme.colors.secondary.ivory};
          border: 1px solid ${borderColor};
          color: ${theme.colors.secondary.charcoal};

          &:focus {
            border-color: ${focusBorderColor};
            box-shadow: 0 0 0 1px ${focusBorderColor};
          }

          &:hover:not(:disabled) {
            border-color: ${theme.colors.gray[400]};
          }
        `;
    }
  }}
`;

const ErrorMessage = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.error};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      placeholder,
      options,
      size = 'medium',
      variant = 'default',
      error = false,
      errorMessage,
      disabled = false,
      required = false,
      fullWidth = false,
      value,
      onChange,
      className,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <SelectContainer fullWidth={fullWidth} className={className}>
        {label && <Label required={required}>{label}</Label>}
        <StyledSelect
          ref={ref}
          size={size}
          variant={variant}
          error={error}
          disabled={disabled}
          required={required}
          value={value}
          onChange={handleChange}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </StyledSelect>
        {error && errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </SelectContainer>
    );
  }
);