import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { RegisterForm } from '../components/AuthForms/RegisterForm';
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
`;

const RegisterCard = styled.div`
  background: ${({ theme }) => theme.colors.secondary.ivory};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  padding: ${({ theme }) => theme.spacing[8]};
  width: 100%;
  max-width: 550px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  margin: ${({ theme }) => theme.spacing[8]} 0;
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
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const WelcomeText = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const WelcomeTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const WelcomeDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const LoginPrompt = styled.div`
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing[6]};
  padding-top: ${({ theme }) => theme.spacing[6]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const LoginText = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const LoginLink = styled(Link)`
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
  position: fixed;
  top: ${({ theme }) => theme.spacing[6]};
  left: ${({ theme }) => theme.spacing[6]};
  color: ${({ theme }) => theme.colors.gray[600]};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  transition: color ${({ theme }) => theme.transitions.fast};
  z-index: ${({ theme }) => theme.zIndex.sticky};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const SuccessMessage = styled.div`
  background: ${({ theme }) => theme.colors.green[50]};
  border: 1px solid ${({ theme }) => theme.colors.green[200]};
  color: ${({ theme }) => theme.colors.green[700]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  text-align: center;
`;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = React.useState(false);

  const handleRegisterSuccess = () => {
    setShowSuccess(true);
    // 3초 후 로그인 페이지로 이동
    setTimeout(() => {
      navigate('/login');
    }, 3000);
  };

  return (
    <>
      <SEOHead 
        title="회원가입 - MICOZ"
        description="MICOZ에 가입하여 개인 맞춤형 뷰티 제품과 특별한 혜택을 받아보세요."
      />
      
      <PageContainer>
        <BackToHome to="/">
          ← 홈으로 돌아가기
        </BackToHome>
        
        <RegisterCard>
          <BrandHeader>
            <BrandLogo>MICOZ</BrandLogo>
            <BrandTagline>자연스러운 아름다움의 시작</BrandTagline>
          </BrandHeader>

          {showSuccess ? (
            <SuccessMessage>
              <h3>회원가입이 완료되었습니다! 🎉</h3>
              <p>이메일 인증 후 로그인할 수 있습니다.</p>
              <p>잠시 후 로그인 페이지로 이동합니다...</p>
            </SuccessMessage>
          ) : (
            <>
              <WelcomeText>
                <WelcomeTitle>MICOZ와 함께 시작하세요</WelcomeTitle>
                <WelcomeDescription>
                  개인 맞춤형 뷰티 제품 추천과<br />
                  특별한 혜택을 받아보세요
                </WelcomeDescription>
              </WelcomeText>
              
              <RegisterForm onSuccess={handleRegisterSuccess} />
              
              <LoginPrompt>
                <LoginText>
                  이미 계정이 있으신가요?
                  <LoginLink to="/login">로그인</LoginLink>
                </LoginText>
              </LoginPrompt>
            </>
          )}
        </RegisterCard>
      </PageContainer>
    </>
  );
};