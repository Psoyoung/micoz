import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ReviewForm, ReviewFormData } from './ReviewForm';
import { ReviewCard } from './ReviewCard';
import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';
import { reviewService, Review, ReviewFilters, CreateReviewRequest } from '../../services/reviewService';

interface ReviewManagerProps {
  productId: string;
  productName: string;
  currentUserId?: string;
  isLoggedIn: boolean;
}

const ReviewContainer = styled.div`
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
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  padding-bottom: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[4]};
    align-items: stretch;
  }
`;

const ReviewTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin: 0;
`;

const FilterSection = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${({ theme }) => theme.spacing[3]};
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
  flex-wrap: wrap;
`;

const FilterLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  white-space: nowrap;
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
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
  gap: ${({ theme }) => theme.spacing[4]};
`;

const LoadMoreButton = styled(Button)`
  align-self: center;
  margin-top: ${({ theme }) => theme.spacing[6]};
`;

const NoReviews = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[6]};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[6]};
  color: ${({ theme }) => theme.colors.red[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[6]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

export const ReviewManager: React.FC<ReviewManagerProps> = ({
  productId,
  productName,
  currentUserId,
  isLoggedIn
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);

  const [filters, setFilters] = useState<ReviewFilters>({
    sortBy: 'newest'
  });

  const loadReviews = async (page: number = 1, resetList: boolean = true) => {
    try {
      setLoading(page === 1);
      const response = await reviewService.getProductReviews(productId, filters, page, 10);
      
      if (resetList) {
        setReviews(response.reviews);
      } else {
        setReviews(prev => [...prev, ...response.reviews]);
      }
      
      setCurrentPage(page);
      setHasMore(response.pagination.hasNextPage);
      setTotalReviews(response.pagination.totalCount);
      setError(null);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setError(err instanceof Error ? err.message : '리뷰를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(1, true);
  }, [productId, filters]);

  const handleSubmitReview = async (reviewData: ReviewFormData) => {
    try {
      setSubmittingReview(true);
      
      const createRequest: CreateReviewRequest = {
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        images: reviewData.images,
        skinType: reviewData.skinType,
        skinConcerns: reviewData.skinConcerns,
        effectsExperienced: reviewData.effectsExperienced,
        wouldRecommend: reviewData.wouldRecommend,
        repurchaseIntent: reviewData.repurchaseIntent,
        usageDuration: reviewData.usageDuration
      };

      await reviewService.createReview(productId, createRequest);
      
      setShowReviewForm(false);
      // Reload reviews to show the new review
      loadReviews(1, true);
      
      // Show success message (you might want to use a toast system)
      alert('리뷰가 성공적으로 등록되었습니다!');
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert(err instanceof Error ? err.message : '리뷰 등록에 실패했습니다.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleVoteHelpful = async (reviewId: string, isHelpful: boolean) => {
    if (!isLoggedIn || !currentUserId) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      await reviewService.voteHelpful(reviewId, isHelpful);
      
      // Update local state to reflect the vote
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              helpfulVotes: isHelpful ? review.helpfulVotes + 1 : review.helpfulVotes,
              totalVotes: review.totalVotes + 1
            }
          : review
      ));
    } catch (err) {
      console.error('Failed to vote:', err);
      alert(err instanceof Error ? err.message : '투표에 실패했습니다.');
    }
  };

  const handleFilterChange = (newFilters: Partial<ReviewFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadReviews(currentPage + 1, false);
    }
  };

  return (
    <ReviewContainer>
      <ReviewHeader>
        <ReviewTitle>
          상품 리뷰 ({totalReviews.toLocaleString()}개)
        </ReviewTitle>
        {isLoggedIn && (
          <Button
            variant="primary"
            onClick={() => setShowReviewForm(true)}
          >
            리뷰 작성
          </Button>
        )}
      </ReviewHeader>

      <FilterSection>
        <FilterGroup>
          <FilterLabel>평점:</FilterLabel>
          <FilterButton
            active={!filters.rating}
            onClick={() => handleFilterChange({ rating: undefined })}
          >
            전체
          </FilterButton>
          {[5, 4, 3, 2, 1].map(rating => (
            <FilterButton
              key={rating}
              active={filters.rating?.[0] === rating}
              onClick={() => handleFilterChange({ 
                rating: filters.rating?.[0] === rating ? undefined : [rating] 
              })}
            >
              {rating}★
            </FilterButton>
          ))}
        </FilterGroup>

        <FilterGroup>
          <FilterButton
            active={!!filters.verifiedOnly}
            onClick={() => handleFilterChange({ 
              verifiedOnly: !filters.verifiedOnly 
            })}
          >
            구매인증만
          </FilterButton>
          <FilterButton
            active={!!filters.hasPhotos}
            onClick={() => handleFilterChange({ 
              hasPhotos: !filters.hasPhotos 
            })}
          >
            포토리뷰만
          </FilterButton>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>정렬:</FilterLabel>
          <SortSelect
            value={filters.sortBy || 'newest'}
            onChange={(e) => handleFilterChange({ 
              sortBy: e.target.value as any 
            })}
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="most_helpful">도움순</option>
            <option value="highest_rating">별점 높은순</option>
            <option value="lowest_rating">별점 낮은순</option>
          </SortSelect>
        </FilterGroup>
      </FilterSection>

      {loading && currentPage === 1 ? (
        <LoadingMessage>리뷰를 불러오는 중...</LoadingMessage>
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : reviews.length === 0 ? (
        <NoReviews>
          아직 등록된 리뷰가 없습니다.<br />
          첫 리뷰를 남겨주세요!
        </NoReviews>
      ) : (
        <>
          <ReviewsList>
            <AnimatePresence>
              {reviews.map((review, index) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onVoteHelpful={handleVoteHelpful}
                  currentUserId={currentUserId}
                  showFullContent={false}
                />
              ))}
            </AnimatePresence>
          </ReviewsList>

          {hasMore && (
            <LoadMoreButton
              variant="secondary"
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? '불러오는 중...' : '더 보기'}
            </LoadMoreButton>
          )}
        </>
      )}

      <Modal
        isOpen={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        title="리뷰 작성"
      >
        <ReviewForm
          productId={productId}
          productName={productName}
          onSubmit={handleSubmitReview}
          onCancel={() => setShowReviewForm(false)}
          isSubmitting={submittingReview}
        />
      </Modal>
    </ReviewContainer>
  );
};