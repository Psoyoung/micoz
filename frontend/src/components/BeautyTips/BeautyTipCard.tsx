import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { BeautyTip, beautyTipsService, getCategoryLabel, getDifficultyLabel, getDifficultyColor, formatDate } from '../../services/beautyTipsService';

interface BeautyTipCardProps {
  tip: BeautyTip;
  onVote?: (tipId: string, isUpvote: boolean) => void;
  onFollow?: (tipId: string) => void;
  onClick?: (tipId: string) => void;
  showFullContent?: boolean;
}

const CardContainer = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
  overflow: hidden;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.lg};
    transform: translateY(-2px);
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const ImageSection = styled.div`
  position: relative;
  height: 200px;
  overflow: hidden;
`;

const MainImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary.sage}15, ${({ theme }) => theme.colors.primary.deepForest}15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const CategoryBadge = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing[3]};
  left: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.primary.sage};
  color: white;
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const DifficultyBadge = styled.div<{ difficulty: string }>`
  position: absolute;
  top: ${({ theme }) => theme.spacing[3]};
  right: ${({ theme }) => theme.spacing[3]};
  background: ${({ difficulty }) => getDifficultyColor(difficulty as any)};
  color: white;
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const FeaturedBadge = styled.div`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing[3]};
  left: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.yellow[500]};
  color: ${({ theme }) => theme.colors.yellow[900]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ContentSection = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const TipHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const TipTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TipContent = styled.p<{ showFull?: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  
  ${({ showFull }) => !showFull && `
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`;

const TagsSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Tag = styled.span`
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[700]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const MetaSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.primary.sage};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const UserName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const DateText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const StatsSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const StatGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ActionSection = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const ActionButton = styled.button<{ active?: boolean; variant?: 'upvote' | 'downvote' | 'follow' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border: 1px solid ${({ active, variant, theme }) => {
    if (active) {
      return variant === 'upvote' ? theme.colors.green[500] :
             variant === 'downvote' ? theme.colors.red[500] :
             theme.colors.primary.sage;
    }
    return theme.colors.gray[300];
  }};
  background: ${({ active, variant, theme }) => {
    if (active) {
      return variant === 'upvote' ? theme.colors.green[50] :
             variant === 'downvote' ? theme.colors.red[50] :
             theme.colors.primary.sage + '15';
    }
    return 'white';
  }};
  color: ${({ active, variant, theme }) => {
    if (active) {
      return variant === 'upvote' ? theme.colors.green[700] :
             variant === 'downvote' ? theme.colors.red[700] :
             theme.colors.primary.sage;
    }
    return theme.colors.gray[600];
  }};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ variant, theme }) => 
      variant === 'upvote' ? theme.colors.green[400] :
      variant === 'downvote' ? theme.colors.red[400] :
      theme.colors.primary.sage
    };
    background: ${({ variant, theme }) => 
      variant === 'upvote' ? theme.colors.green[50] :
      variant === 'downvote' ? theme.colors.red[50] :
      theme.colors.primary.sage + '15'
    };
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const BeautyTipCard: React.FC<BeautyTipCardProps> = ({
  tip,
  onVote,
  onFollow,
  onClick,
  showFullContent = false
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const handleVote = async (e: React.MouseEvent, isUpvote: boolean) => {
    e.stopPropagation();
    if (isVoting) return;
    
    setIsVoting(true);
    try {
      if (onVote) {
        onVote(tip.id, isUpvote);
      } else {
        await beautyTipsService.voteBeautyTip(tip.id, isUpvote);
      }
    } catch (error) {
      console.error('Error voting on tip:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowing) return;
    
    setIsFollowing(true);
    try {
      if (onFollow) {
        onFollow(tip.id);
      } else {
        await beautyTipsService.followBeautyTip(tip.id);
      }
    } catch (error) {
      console.error('Error following tip:', error);
    } finally {
      setIsFollowing(false);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(tip.id);
    }
  };

  const mainImage = tip.images && tip.images.length > 0 ? tip.images[0] : null;

  return (
    <CardContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
    >
      <ImageSection>
        {mainImage ? (
          <MainImage src={mainImage} alt={tip.title} />
        ) : (
          <ImagePlaceholder>
            ✨
          </ImagePlaceholder>
        )}
        <CategoryBadge>
          {getCategoryLabel(tip.category)}
        </CategoryBadge>
        <DifficultyBadge difficulty={tip.difficulty}>
          {getDifficultyLabel(tip.difficulty)}
        </DifficultyBadge>
        {tip.featured && (
          <FeaturedBadge>
            추천
          </FeaturedBadge>
        )}
      </ImageSection>

      <ContentSection>
        <TipHeader>
          <TipTitle>{tip.title}</TipTitle>
          <TipContent showFull={showFullContent}>
            {tip.content}
          </TipContent>
        </TipHeader>

        {tip.tags.length > 0 && (
          <TagsSection>
            {tip.tags.slice(0, 3).map((tag, index) => (
              <Tag key={index}>#{tag}</Tag>
            ))}
            {tip.tags.length > 3 && (
              <Tag>+{tip.tags.length - 3}</Tag>
            )}
          </TagsSection>
        )}

        <MetaSection>
          <UserInfo>
            <UserAvatar>
              {tip.user.name.charAt(0)}
            </UserAvatar>
            <UserName>{tip.user.name}</UserName>
          </UserInfo>
          <DateText>{formatDate(tip.createdAt)}</DateText>
        </MetaSection>

        <StatsSection>
          <StatGroup>
            <StatItem>
              👁️ {tip.views.toLocaleString()}
            </StatItem>
            <StatItem>
              💬 {tip.commentCount}
            </StatItem>
            <StatItem>
              ❤️ {tip.followerCount}
            </StatItem>
          </StatGroup>

          <ActionSection>
            <ActionButton
              variant="upvote"
              onClick={(e) => handleVote(e, true)}
              disabled={isVoting}
            >
              👍 {tip.upvotes}
            </ActionButton>
            <ActionButton
              variant="downvote"
              onClick={(e) => handleVote(e, false)}
              disabled={isVoting}
            >
              👎 {tip.downvotes}
            </ActionButton>
            <ActionButton
              variant="follow"
              onClick={handleFollow}
              disabled={isFollowing}
            >
              {isFollowing ? '팔로우 중...' : '팔로우'}
            </ActionButton>
          </ActionSection>
        </StatsSection>
      </ContentSection>
    </CardContainer>
  );
};