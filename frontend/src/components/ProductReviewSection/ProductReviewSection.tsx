import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  verified: boolean;
  helpful: number;
  createdAt: string;
  user: {
    name: string;
    avatar?: string;
  };
}

interface ProductReviewSectionProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

const ReviewContainer = styled.section`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};
  padding: ${({ theme }) => theme.spacing[8]};
  margin: ${({ theme }) => theme.spacing[8]} 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[6]};
  }
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  padding-bottom: ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[6]};
  }
`;

const RatingSummary = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing[4]};
  }
`;

const AverageRating = styled.div`
  text-align: center;
`;

const RatingNumber = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const StarDisplay = styled.div`
  display: flex;
  justify-content: center;
  gap: 2px;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Star = styled.span<{ filled: boolean }>`
  color: ${({ filled, theme }) => 
    filled ? theme.colors.accent.roseGold : theme.colors.gray[300]
  };
  font-size: 20px;
`;

const TotalReviews = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const RatingBreakdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  min-width: 200px;
`;

const RatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const RatingLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  width: 20px;
`;

const RatingBar = styled.div`
  flex: 1;
  height: 8px;
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  overflow: hidden;
`;

const RatingFill = styled.div<{ percentage: number }>`
  height: 100%;
  width: ${({ percentage }) => percentage}%;
  background: ${({ theme }) => theme.colors.accent.roseGold};
  transition: width ${({ theme }) => theme.transitions.normal};
`;

const RatingCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  width: 30px;
  text-align: right;
`;

const FilterSection = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
`;

const FilterLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ active, theme }) => 
    active ? theme.colors.primary.sage : theme.colors.gray[300]};
  background: ${({ active, theme }) => 
    active ? theme.colors.primary.sage : 'white'};
  color: ${({ active, theme }) => 
    active ? theme.colors.secondary.ivory : theme.colors.secondary.charcoal};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const SortSelect = styled.select`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background: white;
  cursor: pointer;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary.sage};
    outline-offset: -2px;
  }
`;

const ReviewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
  margin-top: ${({ theme }) => theme.spacing[8]};
`;

const ReviewCard = styled(motion.div)`
  padding: ${({ theme }) => theme.spacing[6]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const ReviewCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ReviewerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const ReviewerAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.primary.sage};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.secondary.ivory};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const ReviewerDetails = styled.div``;

const ReviewerName = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const ReviewDate = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ReviewRating = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const VerifiedBadge = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.primary.sage};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};

  &::before {
    content: '✓';
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary.sage};
    color: ${({ theme }) => theme.colors.secondary.ivory};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
  }
`;

const ReviewTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const ReviewComment = styled.p`
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ReviewImages = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  max-width: 400px;
`;

const ReviewImage = styled.img`
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: scale(1.05);
  }
`;

const ReviewActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const HelpfulButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const NoReviews = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[6]};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, index) => (
    <Star key={index} filled={index < rating}>
      ★
    </Star>
  ));
};

export const ProductReviewSection: React.FC<ProductReviewSectionProps> = ({
  reviews,
  averageRating,
  totalReviews
}) => {
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'helpful' | 'rating_high' | 'rating_low'>('newest');

  // Calculate rating breakdown
  const ratingBreakdown = useMemo(() => {
    const breakdown = [0, 0, 0, 0, 0];
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        breakdown[review.rating - 1]++;
      }
    });
    return breakdown.reverse(); // [5star, 4star, 3star, 2star, 1star]
  }, [reviews]);

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    let filtered = reviews;

    // Filter by rating
    if (filterRating) {
      filtered = filtered.filter(review => review.rating === filterRating);
    }

    // Filter by verified
    if (showVerifiedOnly) {
      filtered = filtered.filter(review => review.verified);
    }

    // Sort reviews
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'helpful':
          return b.helpful - a.helpful;
        case 'rating_high':
          return b.rating - a.rating;
        case 'rating_low':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });
  }, [reviews, filterRating, showVerifiedOnly, sortBy]);

  if (reviews.length === 0) {
    return (
      <ReviewContainer>
        <NoReviews>
          아직 등록된 리뷰가 없습니다.<br />
          첫 리뷰를 남겨주세요!
        </NoReviews>
      </ReviewContainer>
    );
  }

  return (
    <ReviewContainer>
      <ReviewHeader>
        <RatingSummary>
          <AverageRating>
            <RatingNumber>{averageRating.toFixed(1)}</RatingNumber>
            <StarDisplay>
              {renderStars(Math.round(averageRating))}
            </StarDisplay>
            <TotalReviews>{totalReviews}개의 리뷰</TotalReviews>
          </AverageRating>

          <RatingBreakdown>
            {ratingBreakdown.map((count, index) => {
              const rating = 5 - index;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              
              return (
                <RatingRow key={rating}>
                  <RatingLabel>{rating}★</RatingLabel>
                  <RatingBar>
                    <RatingFill percentage={percentage} />
                  </RatingBar>
                  <RatingCount>{count}</RatingCount>
                </RatingRow>
              );
            })}
          </RatingBreakdown>
        </RatingSummary>

        <FilterSection>
          <FilterGroup>
            <FilterLabel>평점:</FilterLabel>
            <FilterButton 
              active={filterRating === null}
              onClick={() => setFilterRating(null)}
            >
              전체
            </FilterButton>
            {[5, 4, 3, 2, 1].map(rating => (
              <FilterButton
                key={rating}
                active={filterRating === rating}
                onClick={() => setFilterRating(rating)}
              >
                {rating}★
              </FilterButton>
            ))}
          </FilterGroup>

          <FilterGroup>
            <FilterButton
              active={showVerifiedOnly}
              onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
            >
              구매인증만
            </FilterButton>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>정렬:</FilterLabel>
            <SortSelect 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="newest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="helpful">도움순</option>
              <option value="rating_high">별점 높은순</option>
              <option value="rating_low">별점 낮은순</option>
            </SortSelect>
          </FilterGroup>
        </FilterSection>
      </ReviewHeader>

      <ReviewsList>
        <AnimatePresence>
          {filteredAndSortedReviews.map((review, index) => (
            <ReviewCard
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <ReviewCardHeader>
                <ReviewerInfo>
                  <ReviewerAvatar>
                    {review.user.avatar ? (
                      <img src={review.user.avatar} alt={review.user.name} />
                    ) : (
                      review.user.name.charAt(0)
                    )}
                  </ReviewerAvatar>
                  <ReviewerDetails>
                    <ReviewerName>{review.user.name}</ReviewerName>
                    <ReviewDate>
                      {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                    </ReviewDate>
                  </ReviewerDetails>
                </ReviewerInfo>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <ReviewRating>
                    {renderStars(review.rating)}
                  </ReviewRating>
                  {review.verified && <VerifiedBadge>구매 인증</VerifiedBadge>}
                </div>
              </ReviewCardHeader>

              {review.title && <ReviewTitle>{review.title}</ReviewTitle>}
              
              <ReviewComment>{review.comment}</ReviewComment>

              {review.images && review.images.length > 0 && (
                <ReviewImages>
                  {review.images.map((image, imgIndex) => (
                    <ReviewImage
                      key={imgIndex}
                      src={image}
                      alt={`리뷰 이미지 ${imgIndex + 1}`}
                    />
                  ))}
                </ReviewImages>
              )}

              <ReviewActions>
                <HelpfulButton>
                  👍 도움이 돼요 ({review.helpful})
                </HelpfulButton>
              </ReviewActions>
            </ReviewCard>
          ))}
        </AnimatePresence>
      </ReviewsList>
    </ReviewContainer>
  );
};