import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../Input';
import { Button } from '../Button';

interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

const FormContainer = styled(motion.div)`
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
`;

const FormHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Subtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary.korean};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const ErrorMessage = styled(motion.div)`
  background: ${({ theme }) => theme.colors.accent.softCoral}20;
  border: 1px solid ${({ theme }) => theme.colors.accent.softCoral};
  color: ${({ theme }) => theme.colors.accent.softCoral};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

const ForgotPasswordLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary.sage};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
  display: block;
  margin-top: ${({ theme }) => theme.spacing[2]};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.deepForest};
  }
`;


const SocialLoginSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[6]};
`;

const SocialDivider = styled.div`
  display: flex;
  align-items: center;
  margin: ${({ theme }) => theme.spacing[6]} 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.gray[200]};
  }
  
  span {
    margin: 0 ${({ theme }) => theme.spacing[4]};
    color: ${({ theme }) => theme.colors.gray[500]};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const SocialButton = styled.button<{ provider: 'google' | 'kakao' | 'naver' }>`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.secondary.ivory};
  font-family: ${({ theme }) => theme.typography.fontFamily.primary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};

  ${({ provider, theme }) => {
    switch (provider) {
      case 'google':
        return css`
          &:hover {
            background: #f8f9fa;
            border-color: #dadce0;
          }
        `;
      case 'kakao':
        return css`
          background: #fee500;
          border-color: #fee500;
          color: #000;

          &:hover {
            background: #fdd835;
          }
        `;
      case 'naver':
        return css`
          background: #03c75a;
          border-color: #03c75a;
          color: white;

          &:hover {
            background: #02b351;
          }
        `;
    }
  }}
`;

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, className }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error, clearError } = useAuth();

  // Clear auth errors only if they're session-related
  React.useEffect(() => {
    if (error && error.includes('No token found')) {
      clearError();
    }
  }, []); // Remove dependencies to prevent unnecessary re-runs

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  }, [error, clearError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(formData.email, formData.password);
      onSuccess?.();
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  }, [formData.email, formData.password, login, onSuccess]);

  const handleSocialLogin = useCallback((provider: 'google' | 'kakao' | 'naver') => {
    // TODO: Implement social login
    alert(`${provider} 로그인은 준비 중입니다.`);
  }, []);

  return (
    <FormContainer
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <FormHeader>
        <Title>로그인</Title>
        <Subtitle>MICOZ에 오신 것을 환영합니다</Subtitle>
      </FormHeader>

      {error && (
        <ErrorMessage
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </ErrorMessage>
      )}

      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <Input
            label="이메일"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="이메일을 입력하세요"
            required
            fullWidth
          />
          <Input
            label="비밀번호"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력하세요"
            required
            fullWidth
          />
        </InputGroup>

        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          loading={isSubmitting}
          disabled={!formData.email || !formData.password}
        >
          로그인
        </Button>

        <ForgotPasswordLink to="/forgot-password">
          비밀번호를 잊으셨나요?
        </ForgotPasswordLink>
      </Form>

      <SocialLoginSection>
        <SocialDivider>
          <span>또는</span>
        </SocialDivider>

        <SocialButton
          type="button"
          provider="google"
          onClick={() => handleSocialLogin('google')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 로그인
        </SocialButton>

        <SocialButton
          type="button"
          provider="kakao"
          onClick={() => handleSocialLogin('kakao')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 3C7.03 3 3 6.14 3 10.1c0 2.53 1.64 4.76 4.09 6.05l-.91 3.34c-.09.34.22.63.54.5l4.12-2.12c.38.02.76.03 1.16.03 4.97 0 9-3.14 9-7.1S16.97 3 12 3z" fill="#000"/>
          </svg>
          카카오로 로그인
        </SocialButton>

        <SocialButton
          type="button"
          provider="naver"
          onClick={() => handleSocialLogin('naver')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M16.273 12.845L7.376 0H0v24h7.726V11.155L16.624 24H24V0h-7.727v12.845z" fill="#fff"/>
          </svg>
          네이버로 로그인
        </SocialButton>
      </SocialLoginSection>

    </FormContainer>
  );
};