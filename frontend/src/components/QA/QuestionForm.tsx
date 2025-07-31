import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { QuestionCategory, getCategoryLabel } from '../../services/qaService';

interface QuestionFormProps {
  productId: string;
  productName: string;
  onSubmit: (questionData: QuestionFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface QuestionFormData {
  title: string;
  content: string;
  category: QuestionCategory;
}

const FormContainer = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacing[8]};
  max-width: 600px;
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

const ProductName = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.primary.sage};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
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

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const CategoryButton = styled.button<{ selected: boolean; category: QuestionCategory }>`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[2]};
  border: 2px solid ${({ selected, theme }) => 
    selected ? theme.colors.primary.sage : theme.colors.gray[300]
  };
  background: ${({ selected, theme }) => 
    selected ? theme.colors.primary.sage : 'white'
  };
  color: ${({ selected, theme }) => 
    selected ? theme.colors.secondary.ivory : theme.colors.secondary.charcoal
  };
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  text-align: center;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.sage};
    background: ${({ selected, theme }) => 
      selected ? theme.colors.primary.deepForest : `${theme.colors.primary.sage}15`
    };
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
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

const categories: QuestionCategory[] = [
  'GENERAL',
  'USAGE',
  'INGREDIENTS',
  'EFFECTS',
  'SHIPPING',
  'RETURN',
  'SIZE',
  'COLOR'
];

const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 1000;

export const QuestionForm: React.FC<QuestionFormProps> = ({
  productId,
  productName,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<QuestionFormData>({
    title: '',
    content: '',
    category: 'GENERAL'
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert('질문 제목을 입력해주세요.');
      return;
    }

    if (!formData.content.trim()) {
      alert('질문 내용을 입력해주세요.');
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
        <FormTitle>상품 문의</FormTitle>
        <ProductName>{productName}</ProductName>
      </FormHeader>

      <FormSection>
        <SectionLabel>
          문의 유형 <RequiredMark>*</RequiredMark>
        </SectionLabel>
        <CategoryGrid>
          {categories.map((category) => (
            <CategoryButton
              key={category}
              selected={formData.category === category}
              category={category}
              onClick={() => setFormData(prev => ({ ...prev, category }))}
              type="button"
            >
              {getCategoryLabel(category)}
            </CategoryButton>
          ))}
        </CategoryGrid>
      </FormSection>

      <FormSection>
        <SectionLabel>
          질문 제목 <RequiredMark>*</RequiredMark>
        </SectionLabel>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="궁금한 점을 간단히 요약해주세요"
          maxLength={MAX_TITLE_LENGTH}
        />
        <CharCount over={formData.title.length > MAX_TITLE_LENGTH}>
          {formData.title.length}/{MAX_TITLE_LENGTH}
        </CharCount>
      </FormSection>

      <FormSection>
        <SectionLabel>
          질문 내용 <RequiredMark>*</RequiredMark>
        </SectionLabel>
        <TextArea
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="구체적인 질문 내용을 작성해주세요. 제품 사용법, 성분, 효과 등에 대해 궁금한 점이 있으시면 자세히 설명해주세요."
          maxLength={MAX_CONTENT_LENGTH}
        />
        <CharCount over={formData.content.length > MAX_CONTENT_LENGTH}>
          {formData.content.length}/{MAX_CONTENT_LENGTH}
        </CharCount>
        <HelpText>
          • 구체적이고 명확한 질문일수록 정확한 답변을 받을 수 있습니다.<br />
          • 개인정보(전화번호, 주소 등)는 입력하지 마세요.<br />
          • 욕설이나 비방글은 삭제될 수 있습니다.
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
          {isSubmitting ? '등록 중...' : '문의 등록'}
        </Button>
      </FormActions>
    </FormContainer>
  );
};