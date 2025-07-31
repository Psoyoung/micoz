import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';

interface ReviewFormProps {
  productId: string;
  productName: string;
  onSubmit: (reviewData: ReviewFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface ReviewFormData {
  rating: number;
  title?: string;
  comment: string;
  images?: File[];
  skinType?: string;
  skinConcerns?: string[];
  effectsExperienced?: string[];
  wouldRecommend: boolean;
  repurchaseIntent: boolean;
  usageDuration?: string;
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

const RatingSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[6]};
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const StarRating = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Star = styled.button<{ filled: boolean; hover: boolean }>`
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: ${({ filled, hover, theme }) => 
    filled || hover ? theme.colors.accent.roseGold : theme.colors.gray[300]
  };
  transition: color ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    transform: scale(1.1);
  }
`;

const RatingText = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.primary.deepForest};
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

const ImageUploadSection = styled.div`
  border: 2px dashed ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const ImageUploadInput = styled.input`
  display: none;
`;

const ImageUploadButton = styled.button`
  background: ${({ theme }) => theme.colors.primary.sage};
  color: white;
  border: none;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.deepForest};
  }
`;

const ImageUploadText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: 0;
`;

const ImagePreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const ImagePreview = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing[1]};
  right: ${({ theme }) => theme.spacing[1]};
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: ${({ theme }) => theme.colors.primary.sage};
`;

const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]};
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const RecommendationSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const RecommendationCard = styled.div<{ selected: boolean }>`
  padding: ${({ theme }) => theme.spacing[4]};
  border: 2px solid ${({ selected, theme }) => 
    selected ? theme.colors.primary.sage : theme.colors.gray[200]
  };
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  text-align: center;
  transition: all ${({ theme }) => theme.transitions.fast};
  background: ${({ selected, theme }) => 
    selected ? `${theme.colors.primary.sage}10` : 'white'
  };

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }
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

const skinTypeOptions = [
  { value: 'OILY', label: '지성' },
  { value: 'DRY', label: '건성' },
  { value: 'COMBINATION', label: '복합성' },
  { value: 'SENSITIVE', label: '민감성' },
  { value: 'NORMAL', label: '보통' }
];

const skinConcernOptions = [
  '여드름', '블랙헤드', '화이트헤드', '모공', '색소침착', 
  '주름', '탄력', '건조함', '유분', '트러블', '민감함'
];

const effectOptions = [
  '수분공급', '유분조절', '모공축소', '각질제거', '미백효과',
  '주름개선', '탄력증진', '진정효과', '트러블완화', '톤업효과'
];

const usageDurationOptions = [
  '1주 미만', '1-2주', '2-4주', '1-2개월', '2-3개월', '3개월 이상'
];

const ratingLabels = ['', '별로예요', '그냥 그래요', '좋아요', '매우 좋아요', '최고예요'];

export const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  productName,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    title: '',
    comment: '',
    images: [],
    skinType: '',
    skinConcerns: [],
    effectsExperienced: [],
    wouldRecommend: true,
    repurchaseIntent: false,
    usageDuration: ''
  });

  const [hoverRating, setHoverRating] = useState(0);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleRatingHover = (rating: number) => {
    setHoverRating(rating);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const currentImages = formData.images || [];
    const totalImages = currentImages.length + files.length;

    if (totalImages > 5) {
      alert('최대 5장까지 업로드할 수 있습니다.');
      return;
    }

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);

    setFormData(prev => ({
      ...prev,
      images: [...currentImages, ...files]
    }));

    // Reset input
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    const currentImages = formData.images || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // Revoke URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index]);

    setFormData(prev => ({ ...prev, images: newImages }));
    setImagePreviews(newPreviews);
  };

  const handleSkinConcernChange = (concern: string, checked: boolean) => {
    const currentConcerns = formData.skinConcerns || [];
    if (checked) {
      setFormData(prev => ({
        ...prev,
        skinConcerns: [...currentConcerns, concern]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        skinConcerns: currentConcerns.filter(c => c !== concern)
      }));
    }
  };

  const handleEffectChange = (effect: string, checked: boolean) => {
    const currentEffects = formData.effectsExperienced || [];
    if (checked) {
      setFormData(prev => ({
        ...prev,
        effectsExperienced: [...currentEffects, effect]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        effectsExperienced: currentEffects.filter(e => e !== effect)
      }));
    }
  };

  const handleSubmit = () => {
    if (formData.rating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }

    if (!formData.comment.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <FormContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <FormHeader>
        <FormTitle>리뷰 작성</FormTitle>
        <ProductName>{productName}</ProductName>
      </FormHeader>

      <RatingSection>
        <SectionLabel>
          별점을 선택해주세요 <RequiredMark>*</RequiredMark>
        </SectionLabel>
        <StarRating>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              filled={star <= formData.rating}
              hover={star <= hoverRating}
              onClick={() => handleRatingClick(star)}
              onMouseEnter={() => handleRatingHover(star)}
              onMouseLeave={() => handleRatingHover(0)}
            >
              ★
            </Star>
          ))}
        </StarRating>
        {(formData.rating > 0 || hoverRating > 0) && (
          <RatingText>
            {ratingLabels[hoverRating || formData.rating]}
          </RatingText>
        )}
      </RatingSection>

      <FormSection>
        <SectionLabel>리뷰 제목</SectionLabel>
        <Input
          value={formData.title || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="리뷰 제목을 입력해주세요 (선택사항)"
        />
      </FormSection>

      <FormSection>
        <SectionLabel>
          리뷰 내용 <RequiredMark>*</RequiredMark>
        </SectionLabel>
        <TextArea
          value={formData.comment}
          onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
          placeholder="제품 사용 후기를 자세히 작성해주세요. 다른 고객들에게 도움이 되는 솔직한 후기를 부탁드립니다."
        />
      </FormSection>

      <FormSection>
        <SectionLabel>리뷰 사진 (최대 5장)</SectionLabel>
        <ImageUploadSection>
          <ImageUploadButton
            type="button"
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            사진 선택
          </ImageUploadButton>
          <ImageUploadText>
            JPG, PNG, WebP 파일만 업로드 가능합니다 (파일당 최대 10MB)
          </ImageUploadText>
          <ImageUploadInput
            id="image-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImageUpload}
          />
          
          {imagePreviews.length > 0 && (
            <ImagePreviewGrid>
              {imagePreviews.map((preview, index) => (
                <ImagePreview key={index}>
                  <PreviewImage src={preview} alt={`리뷰 이미지 ${index + 1}`} />
                  <RemoveImageButton onClick={() => removeImage(index)}>
                    ×
                  </RemoveImageButton>
                </ImagePreview>
              ))}
            </ImagePreviewGrid>
          )}
        </ImageUploadSection>
      </FormSection>

      <FormSection>
        <SectionLabel>피부 타입</SectionLabel>
        <Select
          value={formData.skinType || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, skinType: e.target.value }))}
        >
          <option value="">선택해주세요</option>
          {skinTypeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </FormSection>

      <FormSection>
        <SectionLabel>피부 고민 (복수 선택 가능)</SectionLabel>
        <CheckboxGroup>
          {skinConcernOptions.map(concern => (
            <CheckboxItem key={concern}>
              <Checkbox
                type="checkbox"
                checked={formData.skinConcerns?.includes(concern) || false}
                onChange={(e) => handleSkinConcernChange(concern, e.target.checked)}
              />
              {concern}
            </CheckboxItem>
          ))}
        </CheckboxGroup>
      </FormSection>

      <FormSection>
        <SectionLabel>경험한 효과 (복수 선택 가능)</SectionLabel>
        <CheckboxGroup>
          {effectOptions.map(effect => (
            <CheckboxItem key={effect}>
              <Checkbox
                type="checkbox"
                checked={formData.effectsExperienced?.includes(effect) || false}
                onChange={(e) => handleEffectChange(effect, e.target.checked)}
              />
              {effect}
            </CheckboxItem>
          ))}
        </CheckboxGroup>
      </FormSection>

      <FormSection>
        <SectionLabel>사용 기간</SectionLabel>
        <Select
          value={formData.usageDuration || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, usageDuration: e.target.value }))}
        >
          <option value="">선택해주세요</option>
          {usageDurationOptions.map(duration => (
            <option key={duration} value={duration}>
              {duration}
            </option>
          ))}
        </Select>
      </FormSection>

      <FormSection>
        <SectionLabel>추천 의향</SectionLabel>
        <RecommendationSection>
          <RecommendationCard
            selected={formData.wouldRecommend}
            onClick={() => setFormData(prev => ({ ...prev, wouldRecommend: true }))}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👍</div>
            <div>추천해요</div>
          </RecommendationCard>
          <RecommendationCard
            selected={!formData.wouldRecommend}
            onClick={() => setFormData(prev => ({ ...prev, wouldRecommend: false }))}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👎</div>
            <div>추천하지 않아요</div>
          </RecommendationCard>
        </RecommendationSection>
      </FormSection>

      <FormSection>
        <SectionLabel>재구매 의향</SectionLabel>
        <RecommendationSection>
          <RecommendationCard
            selected={formData.repurchaseIntent}
            onClick={() => setFormData(prev => ({ ...prev, repurchaseIntent: true }))}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔄</div>
            <div>재구매 의향 있음</div>
          </RecommendationCard>
          <RecommendationCard
            selected={!formData.repurchaseIntent}
            onClick={() => setFormData(prev => ({ ...prev, repurchaseIntent: false }))}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>❌</div>
            <div>재구매 의향 없음</div>
          </RecommendationCard>
        </RecommendationSection>
      </FormSection>

      <FormActions>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          취소
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={isSubmitting || formData.rating === 0 || !formData.comment.trim()}
        >
          {isSubmitting ? '등록 중...' : '리뷰 등록'}
        </Button>
      </FormActions>
    </FormContainer>
  );
};