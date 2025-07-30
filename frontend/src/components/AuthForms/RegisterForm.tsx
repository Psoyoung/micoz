import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth, RegisterData } from '../../contexts/AuthContext';
import { Input } from '../Input';
import { Button } from '../Button';
import { Select } from '../Select';
import { Checkbox } from '../Checkbox';

interface RegisterFormProps {
  onSuccess?: () => void;
  className?: string;
}

const FormContainer = styled(motion.div)`
  width: 100%;
  max-width: 500px;
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

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const SectionTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const InputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const SkinConcernsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[2]};
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

const SuccessMessage = styled(motion.div)`
  background: ${({ theme }) => theme.colors.primary.sage}20;
  border: 1px solid ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const TermsSection = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const FormFooter = styled.div`
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing[6]};
  padding-top: ${({ theme }) => theme.spacing[6]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const LoginPrompt = styled.p`
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const LoginLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary.sage};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.deepForest};
  }
`;

const genderOptions = [
  { value: '', label: '선택하지 않음' },
  { value: 'FEMALE', label: '여성' },
  { value: 'MALE', label: '남성' },
  { value: 'OTHER', label: '기타' },
  { value: 'PREFER_NOT_TO_SAY', label: '답변하지 않음' },
];

const skinTypeOptions = [
  { value: '', label: '잘 모르겠어요' },
  { value: 'OILY', label: '지성' },
  { value: 'DRY', label: '건성' },
  { value: 'COMBINATION', label: '복합성' },
  { value: 'SENSITIVE', label: '민감성' },
  { value: 'NORMAL', label: '보통' },
];

const skinConcernOptions = [
  '여드름/트러블',
  '모공',
  '블랙헤드',
  '각질',
  '주름/탄력',
  '피부톤',
  '색소침착',
  '건조함',
  '유분',
  '민감함',
  '다크서클',
  '붓기',
];

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, className }) => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    phone: '',
    birthDate: '',
    gender: '',
    skinType: '',
    skinConcerns: [],
    newsletterSubscribed: false,
    marketingConsent: false,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { register, error, clearError } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (error) clearError();
  };

  const handleSkinConcernChange = (concern: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      skinConcerns: checked
        ? [...(prev.skinConcerns || []), concern]
        : (prev.skinConcerns || []).filter(c => c !== concern)
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.password) {
      return '필수 정보를 모두 입력해 주세요.';
    }

    if (formData.password.length < 8) {
      return '비밀번호는 8자 이상이어야 합니다.';
    }

    if (formData.password !== confirmPassword) {
      return '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.marketingConsent) {
      return '개인정보 수집 및 이용에 동의해야 회원가입이 가능합니다.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await register(formData);
      setIsSuccess(true);
      onSuccess?.();
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <FormContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <SuccessMessage
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
          <strong>회원가입이 완료되었습니다!</strong>
          <br />
          <br />
          입력하신 이메일 주소로 인증 링크를 발송했습니다.
          <br />
          이메일을 확인하고 인증을 완료해 주세요.
          <br />
          <br />
          <small>
            인증 이메일이 도착하지 않으면 스팸함을 확인해 보세요.
          </small>
        </SuccessMessage>
        
        <FormFooter>
          <LoginPrompt>이미 인증을 완료하셨나요?</LoginPrompt>
          <LoginLink to="/login">로그인하기</LoginLink>
        </FormFooter>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <FormHeader>
        <Title>회원가입</Title>
        <Subtitle>자연스러운 아름다움을 위한 여정을 시작하세요</Subtitle>
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
        <FormSection>
          <SectionTitle>기본 정보</SectionTitle>
          <Input
            label="이메일 *"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="이메일을 입력하세요"
            required
            fullWidth
          />
          <InputRow>
            <Input
              label="성 *"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="성을 입력하세요"
              required
              fullWidth
            />
            <Input
              label="이름 *"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              required
              fullWidth
            />
          </InputRow>
          <Input
            label="연락처"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="010-0000-0000"
            fullWidth
          />
          <InputRow>
            <Input
              label="비밀번호 *"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="8자 이상 입력하세요"
              required
              fullWidth
            />
            <Input
              label="비밀번호 확인 *"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              required
              fullWidth
            />
          </InputRow>
        </FormSection>

        <FormSection>
          <SectionTitle>개인 정보 (선택)</SectionTitle>
          <InputRow>
            <Input
              label="생년월일"
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              fullWidth
            />
            <Select
              label="성별"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              fullWidth
            >
              {genderOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </InputRow>
        </FormSection>

        <FormSection>
          <SectionTitle>뷰티 프로필 (선택)</SectionTitle>
          <Select
            label="피부 타입"
            name="skinType"
            value={formData.skinType}
            onChange={handleChange}
            fullWidth
          >
            {skinTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <div>
            <label style={{ 
              fontWeight: 'bold', 
              marginBottom: '8px', 
              display: 'block',
              color: '#2F4F2F'
            }}>
              피부 고민 (복수 선택 가능)
            </label>
            <SkinConcernsGrid>
              {skinConcernOptions.map(concern => (
                <Checkbox
                  key={concern}
                  label={concern}
                  checked={(formData.skinConcerns || []).includes(concern)}
                  onChange={(checked: boolean) => handleSkinConcernChange(concern, checked)}
                />
              ))}
            </SkinConcernsGrid>
          </div>
        </FormSection>

        <TermsSection>
          <SectionTitle>약관 동의</SectionTitle>
          <Checkbox
            label="뉴스레터 및 마케팅 정보 수신 동의 (선택)"
            name="newsletterSubscribed"
            checked={formData.newsletterSubscribed || false}
            onChange={handleChange}
          />
          <Checkbox
            label="개인정보 수집 및 이용 동의 (필수) *"
            name="marketingConsent"
            checked={formData.marketingConsent || false}
            onChange={handleChange}
          />
        </TermsSection>

        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          loading={isSubmitting}
          disabled={!formData.email || !formData.firstName || !formData.lastName || !formData.password || !confirmPassword}
        >
          회원가입
        </Button>
      </Form>

      <FormFooter>
        <LoginPrompt>이미 계정이 있으신가요?</LoginPrompt>
        <LoginLink to="/login">로그인하기</LoginLink>
      </FormFooter>
    </FormContainer>
  );
};