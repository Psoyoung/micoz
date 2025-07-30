import React, { forwardRef } from 'react';
import styled, { css } from 'styled-components';

export interface CheckboxProps {
  label?: string;
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  error?: boolean;
  name?: string;
  id?: string;
  onChange?: ((checked: boolean) => void) | ((e: React.ChangeEvent<HTMLInputElement>) => void);
  className?: string;
}

const CheckboxContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  cursor: pointer;
  
  &:has(input:disabled) {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
`;

const StyledCheckbox = styled.div<{ 
  checked?: boolean; 
  indeterminate?: boolean; 
  size?: 'small' | 'medium' | 'large';
  error?: boolean;
}>`
  position: relative;
  border-radius: ${({ theme }) => theme.borderRadius.base};
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

  ${({ checked, indeterminate, error, theme }) => {
    const borderColor = error ? theme.colors.error : theme.colors.gray[400];
    const checkedColor = error ? theme.colors.error : theme.colors.primary.sage;
    
    if (checked || indeterminate) {
      return css`
        background-color: ${checkedColor};
        border: 2px solid ${checkedColor};
        color: ${theme.colors.secondary.ivory};
      `;
    }
    
    return css`
      background-color: ${theme.colors.secondary.ivory};
      border: 2px solid ${borderColor};
      
      &:hover {
        border-color: ${theme.colors.primary.sage};
      }
    `;
  }}

  ${HiddenCheckbox}:focus + & {
    outline: 2px solid ${({ theme }) => theme.colors.primary.sage};
    outline-offset: 2px;
  }

  ${HiddenCheckbox}:disabled + & {
    background-color: ${({ theme }) => theme.colors.gray[100]};
    border-color: ${({ theme }) => theme.colors.gray[300]};
  }
`;

const CheckIcon = styled.svg<{ size?: 'small' | 'medium' | 'large' }>`
  ${({ size }) => {
    switch (size) {
      case 'small':
        return css`
          width: 10px;
          height: 10px;
        `;
      case 'large':
        return css`
          width: 16px;
          height: 16px;
        `;
      default: // medium
        return css`
          width: 12px;
          height: 12px;
        `;
    }
  }}
`;

const IndeterminateIcon = styled.div<{ size?: 'small' | 'medium' | 'large' }>`
  background-color: currentColor;
  
  ${({ size }) => {
    switch (size) {
      case 'small':
        return css`
          width: 8px;
          height: 2px;
        `;
      case 'large':
        return css`
          width: 12px;
          height: 3px;
        `;
      default: // medium
        return css`
          width: 10px;
          height: 2px;
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

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      checked = false,
      indeterminate = false,
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
        // Check if onChange expects an event or just a boolean
        if (onChange.length > 1 || onChange.toString().includes('target')) {
          (onChange as (e: React.ChangeEvent<HTMLInputElement>) => void)(e);
        } else {
          (onChange as (checked: boolean) => void)(e.target.checked);
        }
      }
    };

    return (
      <CheckboxContainer className={className}>
        <HiddenCheckbox
          ref={ref}
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          {...props}
        />
        <StyledCheckbox
          checked={checked}
          indeterminate={indeterminate}
          size={size}
          error={error}
        >
          {indeterminate ? (
            <IndeterminateIcon size={size} />
          ) : checked ? (
            <CheckIcon size={size} viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </CheckIcon>
          ) : null}
        </StyledCheckbox>
        {label && <Label size={size}>{label}</Label>}
      </CheckboxContainer>
    );
  }
);