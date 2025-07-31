import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Review, formatRating, getHelpfulnessPercentage, getSkinTypeColor, getVerificationBadge } from '../../services/reviewService';
import { OptimizedImage } from '../Media/OptimizedImage';

const Card = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};
  padding: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.lg};
    transform: translateY(-2px);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[3]};
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  flex: 1;
`;

const UserAvatar = styled.div<{ image?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ image, theme }) => 
    image ? `url(${image}) center/cover` : theme.colors.gray[300]};
  flex-shrink: 0;
  border: 2px solid ${({ theme }) => theme.colors.gray[100]};
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const UserMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  flex-wrap: wrap;
`;

const SkinTypeBadge = styled.span<{ skinType: string }>`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background: ${({ skinType }) => getSkinTypeColor(skinType)}20;
  color: ${({ skinType }) => getSkinTypeColor(skinType)};
`;

const VerificationBadge = styled.span`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background: ${({ theme }) => theme.colors.green[100]};
  color: ${({ theme }) => theme.colors.green[700]};
`;

const RatingSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    justify-content: flex-start;
  }
`;

const RatingStars = styled.div`
  font-size: 18px;
  color: ${({ theme }) => theme.colors.yellow[500]};
`;

const RatingValue = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const ReviewDate = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const Content = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ReviewTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`;

const ReviewText = styled.p<{ expanded: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  
  ${({ expanded }) => !expanded && `
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary.sage};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  padding: 0;
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.deepForest};
    text-decoration: underline;
  }
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  max-width: 400px;
`;

const PhotoItem = styled.div`
  aspect-ratio: 1;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  transition: transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: scale(1.05);
  }
`;

const TagsSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const TagGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const TagLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-right: ${({ theme }) => theme.spacing[2]};
`;

const TagList = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const Tag = styled.span<{ variant: 'concern' | 'effect' }>`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  
  ${({ variant, theme }) => {
    if (variant === 'concern') {
      return `
        background: ${theme.colors.orange[100]};
        color: ${theme.colors.orange[700]};
      `;
    } else {
      return `
        background: ${theme.colors.green[100]};
        color: ${theme.colors.green[700]};
      `;
    }
  }}
`;

const RecommendationSection = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[2]};
  }
`;

const RecommendationItem = styled.div<{ positive: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ positive, theme }) => 
    positive ? theme.colors.green[700] : theme.colors.red[600]};

  &::before {
    content: ${({ positive }) => positive ? '"👍"' : '"👎"'};
    font-size: 16px;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[3]};
    align-items: flex-start;
  }
`;

const UsageInfo = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
    justify-content: space-between;
  }
`;

const ActionButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ active, theme }) => 
    active ? theme.colors.primary.sage : theme.colors.gray[600]};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
    color: ${({ theme }) => theme.colors.primary.sage};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HelpfulnessInfo = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

interface ReviewCardProps {
  review: Review;
  onVoteHelpful?: (reviewId: string, isHelpful: boolean) => void;
  onToggleLike?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  currentUserId?: string;
  showFullContent?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onVoteHelpful,
  onToggleLike,
  onReport,
  currentUserId,
  showFullContent = false
}) => {
  const [expanded, setExpanded] = useState(showFullContent);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  const isContentLong = review.content.length > 200;
  const isLiked = currentUserId ? review.likedBy.includes(currentUserId) : false;
  const helpfulnessPercentage = getHelpfulnessPercentage(review.helpfulVotes, review.totalVotes);

  const handleVoteHelpful = (isHelpful: boolean) => {
    if (onVoteHelpful && currentUserId) {
      onVoteHelpful(review.id, isHelpful);
    }
  };

  const handleToggleLike = () => {
    if (onToggleLike && currentUserId) {
      onToggleLike(review.id);
    }
  };

  const handleReport = () => {
    if (onReport && currentUserId) {
      const reason = prompt('신고 사유를 입력해주세요:');
      if (reason) {
        onReport(review.id);
      }
    }
  };

  return (
    <Card
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <UserInfo>
          <UserAvatar image={review.userAvatar} />
          <UserDetails>
            <UserName>
              {review.userName}
              {review.isVerifiedPurchase && (
                <VerificationBadge>{getVerificationBadge(true)}</VerificationBadge>
              )}
            </UserName>
            <UserMeta>
              {review.userAge && <span>{review.userAge}</span>}
              {review.userSkinType && (
                <SkinTypeBadge skinType={review.userSkinType}>
                  {review.userSkinType}
                </SkinTypeBadge>
              )}
              <ReviewDate>{formatDate(review.createdAt)}</ReviewDate>
            </UserMeta>
          </UserDetails>
        </UserInfo>
        
        <RatingSection>
          <RatingStars>{formatRating(review.rating)}</RatingStars>
          <RatingValue>{review.rating}/5</RatingValue>
        </RatingSection>
      </Header>

      <Content>
        <ReviewTitle>{review.title}</ReviewTitle>
        
        <ReviewText expanded={expanded || !isContentLong}>
          {review.content}
        </ReviewText>
        
        {isContentLong && !expanded && (
          <ExpandButton onClick={() => setExpanded(true)}>
            더 보기
          </ExpandButton>
        )}

        {review.photos.length > 0 && (
          <PhotoGrid>
            {review.photos.map((photo, index) => (
              <PhotoItem
                key={photo.id}
                onClick={() => setSelectedPhoto(index)}
              >
                <OptimizedImage
                  src={photo.url}
                  alt={photo.alt}
                  aspectRatio="1"
                />
              </PhotoItem>
            ))}
          </PhotoGrid>
        )}

        {(review.skinConcerns?.length || review.effectsExperienced?.length) && (
          <TagsSection>
            {review.skinConcerns && review.skinConcerns.length > 0 && (
              <TagGroup>
                <TagLabel>고민:</TagLabel>
                <TagList>
                  {review.skinConcerns.map((concern, index) => (
                    <Tag key={index} variant="concern">{concern}</Tag>
                  ))}
                </TagList>
              </TagGroup>
            )}
            
            {review.effectsExperienced && review.effectsExperienced.length > 0 && (
              <TagGroup>
                <TagLabel>효과:</TagLabel>
                <TagList>
                  {review.effectsExperienced.map((effect, index) => (
                    <Tag key={index} variant="effect">{effect}</Tag>
                  ))}
                </TagList>
              </TagGroup>
            )}
          </TagsSection>
        )}

        <RecommendationSection>
          <RecommendationItem positive={review.wouldRecommend}>
            {review.wouldRecommend ? '추천해요' : '추천하지 않아요'}
          </RecommendationItem>
          <RecommendationItem positive={review.repurchaseIntent}>
            {review.repurchaseIntent ? '재구매 의향 있음' : '재구매 의향 없음'}
          </RecommendationItem>
        </RecommendationSection>
      </Content>

      <Footer>
        <UsageInfo>
          {review.usageDuration && `사용기간: ${review.usageDuration}`}
        </UsageInfo>
        
        <Actions>
          <HelpfulnessInfo>
            {review.totalVotes > 0 && (
              <span>
                도움됨 {helpfulnessPercentage}% ({review.helpfulVotes}/{review.totalVotes})
              </span>
            )}
          </HelpfulnessInfo>
          
          {currentUserId && (
            <>
              <ActionButton onClick={() => handleVoteHelpful(true)}>
                👍 도움돼요
              </ActionButton>
              
              <ActionButton 
                active={isLiked}
                onClick={handleToggleLike}
              >
                {isLiked ? '❤️' : '🤍'} {review.likedBy.length}
              </ActionButton>
              
              <ActionButton onClick={handleReport}>
                🚨 신고
              </ActionButton>
            </>
          )}
        </Actions>
      </Footer>

      {/* Photo Modal would go here */}
      <AnimatePresence>
        {selectedPhoto !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.img
              src={review.photos[selectedPhoto].url}
              alt={review.photos[selectedPhoto].alt}
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                borderRadius: '12px'
              }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};