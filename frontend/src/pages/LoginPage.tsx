import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { LoginForm } from '../components/AuthForms/LoginForm';
import { SEOHead } from '../components/SEO/SEOHead';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.primary.softMint}20 0%, 
    ${({ theme }) => theme.colors.secondary.warmBeige}40 100%);
  padding: ${({ theme }) => theme.spacing[6]};
  will-change: auto;
`;

const LoginCard = styled.div`
  background: ${({ theme }) => theme.colors.secondary.ivory};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  padding: ${({ theme }) => theme.spacing[8]};
  width: 100%;
  max-width: 450px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const BrandHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const BrandLogo = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.english};
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  letter-spacing: -1px;
`;

const BrandTagline = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const SignupPrompt = styled.div`
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing[6]};
  padding-top: ${({ theme }) => theme.spacing[6]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const SignupText = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const SignupLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary.sage};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-left: ${({ theme }) => theme.spacing[2]};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.deepForest};
    text-decoration: underline;
  }
`;

const BackToHome = styled(Link)`
  position: absolute;
  top: ${({ theme }) => theme.spacing[6]};
  left: ${({ theme }) => theme.spacing[6]};
  color: ${({ theme }) => theme.colors.gray[600]};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 로그인 성공 후 리다이렉트할 경로
  const from = (location.state as any)?.from?.pathname || '/';

  const handleLoginSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <>
      <SEOHead 
        title="로그인 - MICOZ"
        description="MICOZ에 로그인하여 개인 맞춤형 뷰티 제품을 만나보세요."
      />
      
      <PageContainer>
        <BackToHome to="/">
          ← 홈으로 돌아가기
        </BackToHome>
        
        <LoginCard>
          <BrandHeader>
            <BrandLogo>MICOZ</BrandLogo>
            <BrandTagline>자연스러운 아름다움의 시작</BrandTagline>
          </BrandHeader>
          
          <LoginForm onSuccess={handleLoginSuccess} />
          
          <SignupPrompt>
            <SignupText>
              아직 계정이 없으신가요?
              <SignupLink to="/register">회원가입</SignupLink>
            </SignupText>
          </SignupPrompt>
        </LoginCard>
      </PageContainer>
    </>
  );
};