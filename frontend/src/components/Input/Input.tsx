import React, { forwardRef } from 'react';
import styled, { css } from 'styled-components';

export interface InputProps {
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date';
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'outlined';
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  value?: string;
  name?: string;
  id?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
}

const InputContainer = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
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

const StyledInput = styled.input<InputProps>`
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  transition: all ${({ theme }) => theme.transitions.fast};
  width: 100%;

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }

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
          padding: ${theme.spacing[2]} ${theme.spacing[3]};
          font-size: ${theme.typography.fontSize.sm};
          min-height: 36px;
        `;
      case 'large':
        return css`
          padding: ${theme.spacing[4]} ${theme.spacing[4]};
          font-size: ${theme.typography.fontSize.lg};
          min-height: 56px;
        `;
      default: // medium
        return css`
          padding: ${theme.spacing[3]} ${theme.spacing[4]};
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

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      placeholder,
      type = 'text',
      size = 'medium',
      variant = 'default',
      error = false,
      errorMessage,
      disabled = false,
      required = false,
      fullWidth = false,
      value,
      onChange,
      onFocus,
      onBlur,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <InputContainer fullWidth={fullWidth} className={className}>
        {label && <Label required={required}>{label}</Label>}
        <StyledInput
          ref={ref}
          type={type}
          placeholder={placeholder}
          size={size}
          variant={variant}
          error={error}
          disabled={disabled}
          required={required}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          {...props}
        />
        {error && errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </InputContainer>
    );
  }
);