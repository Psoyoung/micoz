import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth, User } from '../../contexts/AuthContext';
import { Input } from '../Input';
import { Button } from '../Button';
import { Select } from '../Select';
import { Checkbox } from '../Checkbox';

interface UserProfileProps {
  className?: string;
}

const ProfileContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[8]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[4]};
  }
`;

const ProfileHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[12]};
`;

const ProfileTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const ProfileSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const ProfileCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.secondary.ivory};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[8]};
  box-shadow: ${({ theme }) => theme.shadows.base};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[6]};
  }
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  padding-bottom: ${({ theme }) => theme.spacing[3]};
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary.sage};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
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

const AvatarSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    text-align: center;
  }
`;

const AvatarContainer = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    transform: scale(1.05);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const Avatar = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarPlaceholder = styled.div`
  font-size: 48px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const AvatarInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const UserEmail = styled.p`
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const UserStats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    justify-content: center;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.sage};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
`;

const SuccessMessage = styled(motion.div)`
  background: ${({ theme }) => theme.colors.primary.sage}20;
  border: 1px solid ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
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

export const UserProfile: React.FC<UserProfileProps> = ({ className }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
        gender: user.gender || undefined,
        skinType: user.skinType || undefined,
        skinConcerns: user.skinConcerns || [],
        newsletterSubscribed: user.newsletterSubscribed || false,
        marketingConsent: user.marketingConsent || false,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSkinConcernChange = (concern: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      skinConcerns: checked
        ? [...(prev.skinConcerns || []), concern]
        : (prev.skinConcerns || []).filter(c => c !== concern)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: API call to update user profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      updateUser(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarClick = () => {
    // TODO: Implement avatar upload
    alert('프로필 사진 업로드 기능은 준비 중입니다.');
  };

  if (!user) {
    return null;
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <ProfileContainer className={className}>
      <ProfileHeader>
        <ProfileTitle>내 프로필</ProfileTitle>
        <ProfileSubtitle>개인정보와 뷰티 프로필을 관리하세요</ProfileSubtitle>
      </ProfileHeader>

      <ProfileCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <AvatarSection>
          <AvatarContainer onClick={handleAvatarClick}>
            {user.avatar ? (
              <Avatar src={user.avatar} alt="프로필 사진" />
            ) : (
              <AvatarPlaceholder>👤</AvatarPlaceholder>
            )}
          </AvatarContainer>
          <AvatarInfo>
            <UserName>{`${user.lastName} ${user.firstName}`}</UserName>
            <UserEmail>{user.email}</UserEmail>
            <UserStats>
              <StatItem>
                <StatValue>{memberSince}</StatValue>
                <StatLabel>가입일</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{user.verified ? '인증됨' : '미인증'}</StatValue>
                <StatLabel>이메일</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>0</StatValue>
                <StatLabel>주문 수</StatLabel>
              </StatItem>
            </UserStats>
          </AvatarInfo>
        </AvatarSection>

        {showSuccess && (
          <SuccessMessage
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            프로필이 성공적으로 업데이트되었습니다.
          </SuccessMessage>
        )}

        <Form onSubmit={handleSubmit}>
          <div>
            <SectionTitle>기본 정보</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <InputRow>
                <Input
                  label="성"
                  type="text"
                  name="lastName"
                  value={formData.lastName || ''}
                  onChange={handleChange}
                  placeholder="성을 입력하세요"
                  fullWidth
                />
                <Input
                  label="이름"
                  type="text"
                  name="firstName"
                  value={formData.firstName || ''}
                  onChange={handleChange}
                  placeholder="이름을 입력하세요"
                  fullWidth
                />
              </InputRow>
              <Input
                label="연락처"
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="010-0000-0000"
                fullWidth
              />
              <InputRow>
                <Input
                  label="생년월일"
                  type="date"
                  name="birthDate"
                  value={formData.birthDate || ''}
                  onChange={handleChange}
                  fullWidth
                />
                <Select
                  label="성별"
                  name="gender"
                  value={formData.gender || ''}
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
            </div>
          </div>

          <div>
            <SectionTitle>뷰티 프로필</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Select
                label="피부 타입"
                name="skinType"
                value={formData.skinType || ''}
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
            </div>
          </div>

          <div>
            <SectionTitle>알림 설정</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Checkbox
                label="뉴스레터 및 마케팅 정보 수신 동의"
                name="newsletterSubscribed"
                checked={formData.newsletterSubscribed || false}
                onChange={handleChange}
              />
              <Checkbox
                label="개인정보 수집 및 이용 동의"
                name="marketingConsent"
                checked={formData.marketingConsent || false}
                onChange={handleChange}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={isSubmitting}
            style={{ alignSelf: 'flex-start' }}
          >
            프로필 업데이트
          </Button>
        </Form>
      </ProfileCard>
    </ProfileContainer>
  );
};