import React, { useState } from 'react';
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

const FormFooter = styled.div`
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing[6]};
  padding-top: ${({ theme }) => theme.spacing[6]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const SignupPrompt = styled.p`
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const SignupLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary.sage};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  const handleSocialLogin = (provider: 'google' | 'kakao' | 'naver') => {
    // TODO: Implement social login
    alert(`${provider} 로그인은 준비 중입니다.`);
  };

  return (
    <FormContainer
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <FormHeader>
        <Title>로그인</Title>
        <Subtitle>MICOZ에 오신 것을 환영합니다</Subtitle>
      </FormHeader>

      {error && (
        <ErrorMessage
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
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
          <span>🌐</span>
          Google로 로그인
        </SocialButton>

        <SocialButton
          type="button"
          provider="kakao"
          onClick={() => handleSocialLogin('kakao')}
        >
          <span>💬</span>
          카카오로 로그인
        </SocialButton>

        <SocialButton
          type="button"
          provider="naver"
          onClick={() => handleSocialLogin('naver')}
        >
          <span>🟢</span>
          네이버로 로그인
        </SocialButton>
      </SocialLoginSection>

      <FormFooter>
        <SignupPrompt>아직 계정이 없으신가요?</SignupPrompt>
        <SignupLink to="/register">
          회원가입하기
        </SignupLink>
      </FormFooter>
    </FormContainer>
  );
};