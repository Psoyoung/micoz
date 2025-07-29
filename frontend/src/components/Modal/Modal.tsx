import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  children: React.ReactNode;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[4]};
  z-index: ${({ theme }) => theme.zIndex.modal};
  backdrop-filter: blur(4px);
`;

const ModalContainer = styled(motion.div)<{ size?: string }>`
  background-color: ${({ theme }) => theme.colors.secondary.ivory};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows['2xl']};
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;

  ${({ size }) => {
    switch (size) {
      case 'small':
        return css`
          max-width: 400px;
        `;
      case 'large':
        return css`
          max-width: 800px;
        `;
      case 'fullscreen':
        return css`
          max-width: 95vw;
          max-height: 95vh;
        `;
      default: // medium
        return css`
          max-width: 600px;
        `;
    }
  }}

  /* Mobile responsive */
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    max-width: 95vw;
    max-height: 90vh;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const ModalTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin: 0;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: ${({ theme }) => theme.borderRadius.base};
  color: ${({ theme }) => theme.colors.gray[500]};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.gray[700]};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary.sage};
    outline-offset: 2px;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ModalBody = styled.div<{ hasHeader?: boolean }>`
  padding: ${({ hasHeader, theme }) =>
    hasHeader
      ? `${theme.spacing[4]} ${theme.spacing[6]} ${theme.spacing[6]}`
      : `${theme.spacing[6]}`};
`;

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'medium',
  children,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className,
}) => {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <Overlay
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          onClick={handleOverlayClick}
        >
          <ModalContainer
            size={size}
            className={className}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {(title || showCloseButton) && (
              <ModalHeader>
                {title && <ModalTitle>{title}</ModalTitle>}
                {showCloseButton && (
                  <CloseButton onClick={onClose} aria-label="Close modal">
                    <CloseIcon />
                  </CloseButton>
                )}
              </ModalHeader>
            )}
            <ModalBody hasHeader={!!(title || showCloseButton)}>
              {children}
            </ModalBody>
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>,
    document.body
  );
};