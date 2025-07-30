import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const LoadingSpinner = styled(motion.div)`
  width: 48px;
  height: 48px;
  border: 3px solid ${({ theme }) => theme.colors.gray[200]};
  border-top: 3px solid ${({ theme }) => theme.colors.primary.sage};
  border-radius: 50%;
`;

const LoadingText = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary.korean};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const VerificationRequiredContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
`;

const VerificationIcon = styled.div`
  font-size: 64px;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const VerificationTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const VerificationMessage = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary.korean};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  max-width: 500px;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const VerificationActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  flex-wrap: wrap;
  justify-content: center;
`;

const ActionButton = styled.button`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.typography.fontFamily.primary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &.primary {
    background: ${({ theme }) => theme.colors.primary.sage};
    color: ${({ theme }) => theme.colors.secondary.ivory};

    &:hover {
      background: ${({ theme }) => theme.colors.primary.deepForest};
    }
  }

  &.secondary {
    background: transparent;
    color: ${({ theme }) => theme.colors.primary.sage};
    border: 1px solid ${({ theme }) => theme.colors.primary.sage};

    &:hover {
      background: ${({ theme }) => theme.colors.primary.sage};
      color: ${({ theme }) => theme.colors.secondary.ivory};
    }
  }
`;

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireVerification = true 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <LoadingText>로그인 상태를 확인하고 있습니다...</LoadingText>
      </LoadingContainer>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Show verification required message if email is not verified
  if (requireVerification && user && !user.verified) {
    const resendVerification = async () => {
      try {
        // TODO: Implement resend verification email API call
        alert('인증 이메일을 다시 발송했습니다. 메일함을 확인해 주세요.');
      } catch (error) {
        alert('인증 이메일 발송에 실패했습니다. 다시 시도해 주세요.');
      }
    };

    const goToHome = () => {
      window.location.href = '/';
    };

    return (
      <VerificationRequiredContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <VerificationIcon>✉️</VerificationIcon>
          <VerificationTitle>이메일 인증이 필요합니다</VerificationTitle>
          <VerificationMessage>
            이 페이지에 접근하려면 먼저 이메일 인증을 완료해야 합니다.
            <br />
            회원가입 시 입력하신 이메일 주소로 발송된 인증 링크를 클릭해 주세요.
            <br />
            <br />
            인증 이메일을 받지 못하셨나요? 스팸함도 확인해 보세요.
          </VerificationMessage>
          <VerificationActions>
            <ActionButton 
              className="primary" 
              onClick={resendVerification}
            >
              인증 이메일 다시 발송
            </ActionButton>
            <ActionButton 
              className="secondary" 
              onClick={goToHome}
            >
              홈으로 돌아가기
            </ActionButton>
          </VerificationActions>
        </motion.div>
      </VerificationRequiredContainer>
    );
  }

  // Render protected content
  return <>{children}</>;
};