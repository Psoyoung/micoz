import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { 
  BeautyTipCategory, 
  TipDifficulty, 
  SkinType,
  getCategoryLabel, 
  getDifficultyLabel, 
  getSkinTypeLabel 
} from '../../services/beautyTipsService';

interface BeautyTipFormProps {
  onSubmit: (tipData: BeautyTipFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<BeautyTipFormData>;
}

export interface BeautyTipFormData {
  title: string;
  content: string;
  category: BeautyTipCategory;
  tags: string[];
  images: string[];
  skinTypes: SkinType[];
  difficulty: TipDifficulty;
}

const FormContainer = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacing[8]};
  max-width: 800px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[6]};
  }
`;

const FormHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const FormTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const FormSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const FormSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const SectionLabel = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const RequiredMark = styled.span`
  color: ${({ theme }) => theme.colors.red[500]};
  margin-left: ${({ theme }) => theme.spacing[1]};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: ${({ theme }) => theme.spacing[4]};
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-family: inherit;
  resize: vertical;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[500]};
  }
`;

const TagInput = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]};
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  min-height: 48px;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const Tag = styled.span`
  background: ${({ theme }) => theme.colors.primary.sage};
  color: white;
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const TagRemoveButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  padding: 0;
  margin: 0;
  line-height: 1;

  &:hover {
    opacity: 0.8;
  }
`;

const TagInputField = styled.input`
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  background: transparent;

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[500]};
  }
`;

const CheckboxGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const CharCount = styled.div<{ over: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ over, theme }) => 
    over ? theme.colors.red[500] : theme.colors.gray[500]
  };
  text-align: right;
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

const HelpText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-top: ${({ theme }) => theme.spacing[2]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const FormActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  justify-content: flex-end;
  padding-top: ${({ theme }) => theme.spacing[6]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const categories: { value: BeautyTipCategory; label: string }[] = [
  { value: 'SKINCARE', label: getCategoryLabel('SKINCARE') },
  { value: 'MAKEUP', label: getCategoryLabel('MAKEUP') },
  { value: 'HAIRCARE', label: getCategoryLabel('HAIRCARE') },
  { value: 'NAILCARE', label: getCategoryLabel('NAILCARE') },
  { value: 'BODYCARE', label: getCategoryLabel('BODYCARE') },
  { value: 'ROUTINE', label: getCategoryLabel('ROUTINE') },
  { value: 'PRODUCT_REVIEW', label: getCategoryLabel('PRODUCT_REVIEW') },
  { value: 'TUTORIAL', label: getCategoryLabel('TUTORIAL') },
  { value: 'LIFESTYLE', label: getCategoryLabel('LIFESTYLE') },
];

const difficulties: { value: TipDifficulty; label: string }[] = [
  { value: 'BEGINNER', label: getDifficultyLabel('BEGINNER') },
  { value: 'INTERMEDIATE', label: getDifficultyLabel('INTERMEDIATE') },
  { value: 'ADVANCED', label: getDifficultyLabel('ADVANCED') },
];

const skinTypes: { value: SkinType; label: string }[] = [
  { value: 'OILY', label: getSkinTypeLabel('OILY') },
  { value: 'DRY', label: getSkinTypeLabel('DRY') },
  { value: 'COMBINATION', label: getSkinTypeLabel('COMBINATION') },
  { value: 'SENSITIVE', label: getSkinTypeLabel('SENSITIVE') },
  { value: 'NORMAL', label: getSkinTypeLabel('NORMAL') },
];

const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 5000;
const MAX_TAGS = 10;

export const BeautyTipForm: React.FC<BeautyTipFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialData
}) => {
  const [formData, setFormData] = useState<BeautyTipFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    category: initialData?.category || 'SKINCARE',
    tags: initialData?.tags || [],
    images: initialData?.images || [],
    skinTypes: initialData?.skinTypes || [],
    difficulty: initialData?.difficulty || 'BEGINNER'
  });

  const [tagInput, setTagInput] = useState('');

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !formData.tags.includes(tag) && formData.tags.length < MAX_TAGS) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
        setTagInput('');
      }
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSkinTypeChange = (skinType: SkinType, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      skinTypes: checked 
        ? [...prev.skinTypes, skinType]
        : prev.skinTypes.filter(type => type !== skinType)
    }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!formData.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    if (formData.title.length > MAX_TITLE_LENGTH) {
      alert(`제목은 ${MAX_TITLE_LENGTH}자 이내로 입력해주세요.`);
      return;
    }

    if (formData.content.length > MAX_CONTENT_LENGTH) {
      alert(`내용은 ${MAX_CONTENT_LENGTH}자 이내로 입력해주세요.`);
      return;
    }

    onSubmit(formData);
  };

  const isValid = formData.title.trim() && 
                  formData.content.trim() && 
                  formData.title.length <= MAX_TITLE_LENGTH && 
                  formData.content.length <= MAX_CONTENT_LENGTH;

  return (
    <FormContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <FormHeader>
        <FormTitle>{initialData ? '뷰티 팁 수정' : '뷰티 팁 작성'}</FormTitle>
        <FormSubtitle>
          여러분의 뷰티 노하우를 다른 사용자들과 공유해보세요!
        </FormSubtitle>
      </FormHeader>

      <FormSection>
        <SectionLabel>
          제목 <RequiredMark>*</RequiredMark>
        </SectionLabel>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="뷰티 팁의 제목을 입력해주세요"
          maxLength={MAX_TITLE_LENGTH}
        />
        <CharCount over={formData.title.length > MAX_TITLE_LENGTH}>
          {formData.title.length}/{MAX_TITLE_LENGTH}
        </CharCount>
      </FormSection>

      <FormRow>
        <FormSection>
          <SectionLabel>
            카테고리 <RequiredMark>*</RequiredMark>
          </SectionLabel>
          <Select
            options={categories}
            value={formData.category}
            onChange={(value) => setFormData(prev => ({ ...prev, category: value as BeautyTipCategory }))}
          />
        </FormSection>

        <FormSection>
          <SectionLabel>
            난이도 <RequiredMark>*</RequiredMark>
          </SectionLabel>
          <Select
            options={difficulties}
            value={formData.difficulty}
            onChange={(value) => setFormData(prev => ({ ...prev, difficulty: value as TipDifficulty }))}
          />
        </FormSection>
      </FormRow>

      <FormSection>
        <SectionLabel>
          내용 <RequiredMark>*</RequiredMark>
        </SectionLabel>
        <TextArea
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="뷰티 팁의 상세한 내용을 작성해주세요. 단계별 설명이나 주의사항 등을 포함하면 더욱 유용합니다."
          maxLength={MAX_CONTENT_LENGTH}
        />
        <CharCount over={formData.content.length > MAX_CONTENT_LENGTH}>
          {formData.content.length}/{MAX_CONTENT_LENGTH}
        </CharCount>
      </FormSection>

      <FormSection>
        <SectionLabel>
          태그
        </SectionLabel>
        <TagInput>
          {formData.tags.map((tag, index) => (
            <Tag key={index}>
              #{tag}
              <TagRemoveButton
                type="button"
                onClick={() => handleTagRemove(tag)}
              >
                ×
              </TagRemoveButton>
            </Tag>
          ))}
          <TagInputField
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagAdd}
            placeholder={formData.tags.length === 0 ? "태그를 입력하고 Enter를 누르세요" : ""}
            disabled={formData.tags.length >= MAX_TAGS}
          />
        </TagInput>
        <HelpText>
          • 태그는 최대 {MAX_TAGS}개까지 추가할 수 있습니다.<br />
          • Enter 키나 쉼표(,)로 태그를 구분합니다.<br />
          • 예: 수분크림, 민감피부, 겨울스킨케어
        </HelpText>
      </FormSection>

      <FormSection>
        <SectionLabel>
          적합한 피부타입
        </SectionLabel>
        <CheckboxGrid>
          {skinTypes.map((skinType) => (
            <CheckboxItem key={skinType.value}>
              <Checkbox
                type="checkbox"
                checked={formData.skinTypes.includes(skinType.value)}
                onChange={(e) => handleSkinTypeChange(skinType.value, e.target.checked)}
              />
              {skinType.label}
            </CheckboxItem>
          ))}
        </CheckboxGrid>
        <HelpText>
          이 뷰티 팁이 특히 도움이 될 피부타입을 선택해주세요. (선택사항)
        </HelpText>
      </FormSection>

      <FormActions>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          취소
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? '등록 중...' : (initialData ? '수정하기' : '등록하기')}
        </Button>
      </FormActions>
    </FormContainer>
  );
};