import React from 'react';
import styled, { css } from 'styled-components';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: React.CSSProperties;
}

const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: inherit;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-decoration: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  position: relative;
  overflow: hidden;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary.sage};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  ${({ fullWidth }) =>
    fullWidth &&
    css`
      width: 100%;
    `}

  /* Size variants */
  ${({ size, theme }) => {
    switch (size) {
      case 'small':
        return css`
          padding: ${theme.spacing[2]} ${theme.spacing[4]};
          font-size: ${theme.typography.fontSize.sm};
          min-height: 36px;
        `;
      case 'large':
        return css`
          padding: ${theme.spacing[4]} ${theme.spacing[8]};
          font-size: ${theme.typography.fontSize.lg};
          min-height: 56px;
        `;
      default: // medium
        return css`
          padding: ${theme.spacing[3]} ${theme.spacing[6]};
          font-size: ${theme.typography.fontSize.base};
          min-height: 44px;
        `;
    }
  }}

  /* Variant styles */
  ${({ variant, theme }) => {
    switch (variant) {
      case 'secondary':
        return css`
          background-color: ${theme.colors.secondary.ivory};
          color: ${theme.colors.primary.deepForest};
          border: 2px solid ${theme.colors.primary.sage};

          &:hover:not(:disabled) {
            background-color: ${theme.colors.primary.sage};
            color: ${theme.colors.secondary.ivory};
            transform: translateY(-1px);
            box-shadow: ${theme.shadows.md};
          }

          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `;
      case 'text':
        return css`
          background-color: transparent;
          color: ${theme.colors.primary.sage};
          padding: ${theme.spacing[2]} ${theme.spacing[4]};

          &:hover:not(:disabled) {
            background-color: ${theme.colors.gray[100]};
            color: ${theme.colors.primary.deepForest};
          }

          &:active:not(:disabled) {
            background-color: ${theme.colors.gray[200]};
          }
        `;
      default: // primary
        return css`
          background-color: ${theme.colors.primary.sage};
          color: ${theme.colors.secondary.ivory};

          &:hover:not(:disabled) {
            background-color: ${theme.colors.primary.deepForest};
            transform: translateY(-1px);
            box-shadow: ${theme.shadows.md};
          }

          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `;
    }
  }}

  /* Loading state */
  ${({ loading }) =>
    loading &&
    css`
      color: transparent;
      pointer-events: none;

      &::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        color: inherit;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `}
`;

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  onClick,
  type = 'button',
  className,
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      disabled={disabled || loading}
      loading={loading}
      fullWidth={fullWidth}
      onClick={onClick}
      type={type}
      className={className}
      {...props}
    >
      {children}
    </StyledButton>
  );
};