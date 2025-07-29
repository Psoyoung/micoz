import React from 'react';
import styled, { css } from 'styled-components';

export interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  hover?: boolean;
  clickable?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const StyledCard = styled.div<CardProps>`
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background-color: ${({ theme }) => theme.colors.secondary.ivory};
  transition: all ${({ theme }) => theme.transitions.normal};
  position: relative;
  overflow: hidden;

  /* Padding variants */
  ${({ padding, theme }) => {
    switch (padding) {
      case 'none':
        return css`
          padding: 0;
        `;
      case 'small':
        return css`
          padding: ${theme.spacing[4]};
        `;
      case 'large':
        return css`
          padding: ${theme.spacing[8]};
        `;
      default: // medium
        return css`
          padding: ${theme.spacing[6]};
        `;
    }
  }}

  /* Variant styles */
  ${({ variant, theme }) => {
    switch (variant) {
      case 'elevated':
        return css`
          box-shadow: ${theme.shadows.lg};
          border: 1px solid ${theme.colors.gray[200]};
        `;
      case 'outlined':
        return css`
          border: 2px solid ${theme.colors.gray[300]};
          box-shadow: none;
        `;
      default: // default
        return css`
          box-shadow: ${theme.shadows.base};
          border: 1px solid ${theme.colors.gray[200]};
        `;
    }
  }}

  /* Hover effects */
  ${({ hover, clickable, theme }) =>
    (hover || clickable) &&
    css`
      cursor: ${clickable ? 'pointer' : 'default'};

      &:hover {
        transform: translateY(-2px);
        box-shadow: ${theme.shadows.xl};
        border-color: ${theme.colors.primary.sage};
      }
    `}

  /* Clickable state */
  ${({ clickable }) =>
    clickable &&
    css`
      cursor: pointer;

      &:active {
        transform: translateY(0);
      }
    `}
`;

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'medium',
  hover = false,
  clickable = false,
  children,
  className,
  onClick,
  ...props
}) => {
  return (
    <StyledCard
      variant={variant}
      padding={padding}
      hover={hover}
      clickable={clickable || !!onClick}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </StyledCard>
  );
};