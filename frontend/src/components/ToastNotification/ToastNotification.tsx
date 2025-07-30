import React, { useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeToast } from '../../store/toastSlice';

const ToastContainer = styled.div`
  position: fixed;
  top: 100px;
  right: ${({ theme }) => theme.spacing[6]};
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  pointer-events: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    right: ${({ theme }) => theme.spacing[4]};
    left: ${({ theme }) => theme.spacing[4]};
  }
`;

const ToastItem = styled(motion.div)<{ type: 'success' | 'error' | 'info' | 'warning' }>`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  border-left: 4px solid ${({ type, theme }) => {
    switch (type) {
      case 'success':
        return theme.colors.green[500];
      case 'error':
        return theme.colors.red[500];
      case 'warning':
        return theme.colors.yellow[500];
      case 'info':
      default:
        return theme.colors.blue[500];
    }
  }};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  max-width: 400px;
  pointer-events: auto;
  cursor: pointer;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    max-width: none;
  }
`;

const ToastIcon = styled.div<{ type: 'success' | 'error' | 'info' | 'warning' }>`
  font-size: 20px;
  flex-shrink: 0;
  
  &::before {
    content: ${({ type }) => {
      switch (type) {
        case 'success':
          return '"✅"';
        case 'error':
          return '"❌"';
        case 'warning':
          return '"⚠️"';
        case 'info':
        default:
          return '"ℹ️"';
      }
    }};
  }
`;

const ToastMessage = styled.div`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.gray[400]};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[1]};
  font-size: 16px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

export const ToastNotification: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toasts } = useAppSelector(state => state.toast);

  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          dispatch(removeToast(toast.id));
        }, toast.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [toasts, dispatch]);

  const handleDismiss = (toastId: string) => {
    dispatch(removeToast(toastId));
  };

  return (
    <ToastContainer>
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            type={toast.type}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={() => handleDismiss(toast.id)}
          >
            <ToastIcon type={toast.type} />
            <ToastMessage>{toast.message}</ToastMessage>
            <CloseButton
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss(toast.id);
              }}
            >
              ×
            </CloseButton>
          </ToastItem>
        ))}
      </AnimatePresence>
    </ToastContainer>
  );
};