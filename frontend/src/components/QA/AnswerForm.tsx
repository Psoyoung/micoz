import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from '../Button/Button';

interface AnswerFormProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  placeholder?: string;
}

const FormContainer = styled(motion.div)`
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const FormTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
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
  background: white;

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
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const HelpText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const FormActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  justify-content: flex-end;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const MAX_CONTENT_LENGTH = 2000;

export const AnswerForm: React.FC<AnswerFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  placeholder = "답변을 작성해주세요. 질문자에게 도움이 되는 구체적이고 정확한 정보를 제공해주세요."
}) => {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      alert(`답변은 ${MAX_CONTENT_LENGTH}자 이내로 작성해주세요.`);
      return;
    }

    onSubmit(content.trim());
    setContent('');
  };

  const isValid = content.trim() && content.length <= MAX_CONTENT_LENGTH;

  return (
    <FormContainer
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <FormTitle>답변 작성</FormTitle>

      <TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        maxLength={MAX_CONTENT_LENGTH}
        disabled={isSubmitting}
      />

      <CharCount over={content.length > MAX_CONTENT_LENGTH}>
        {content.length}/{MAX_CONTENT_LENGTH}
      </CharCount>

      <HelpText>
        • 질문과 관련된 구체적이고 유용한 정보를 제공해주세요.<br />
        • 개인적인 경험이나 전문적인 지식을 바탕으로 답변해주세요.<br />
        • 욕설이나 비방, 광고성 내용은 삭제될 수 있습니다.
      </HelpText>

      <FormActions>
        <Button 
          variant="secondary" 
          onClick={onCancel} 
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? '등록 중...' : '답변 등록'}
        </Button>
      </FormActions>
    </FormContainer>
  );
};