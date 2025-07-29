import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

export interface Review {
  id: string;
  customerName: string;
  productName: string;
  rating: number;
  comment: string;
  date: string;
  image?: string;
  verified: boolean;
}

export interface ReviewSectionProps {
  reviews: Review[];
  className?: string;
}

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing[20]} 0;
  background: ${({ theme }) => theme.colors.secondary.ivory};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[16]} 0;
  }
`;

const ContentWrapper = styled.div`
  max-width: ${({ theme }) => theme.grid.container};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 ${({ theme }) => theme.spacing[4]};
  }
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[12]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-bottom: ${({ theme }) => theme.spacing[8]};
  }
`;

const SectionTitle = styled(motion.h2)`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  }
`;

const SectionSubtitle = styled(motion.p)`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize.base};
  }
`;

const ReviewsContainer = styled.div`
  position: relative;
  overflow: hidden;
`;

const ReviewsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing[8]};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${({ theme }) => theme.spacing[6]};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[4]};
  }
`;

const ReviewCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.secondary.ivory};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.base};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const CustomerInfo = styled.div`
  flex: 1;
`;

const CustomerName = styled.h4`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const ProductName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.primary.sage};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
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

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const StarRating = styled.div`
  display: flex;
  gap: 2px;
`;

const Star = styled.span<{ filled: boolean }>`
  color: ${({ filled, theme }) => 
    filled ? theme.colors.accent.roseGold : theme.colors.gray[300]
  };
  font-size: 18px;
`;

const RatingNumber = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-left: ${({ theme }) => theme.spacing[1]};
`;

const ReviewComment = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.primary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ReviewImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const ReviewDate = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[8]};
`;

const NavButton = styled.button<{ disabled?: boolean }>`
  background: ${({ theme }) => theme.colors.primary.sage};
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  color: ${({ theme }) => theme.colors.secondary.ivory};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary.deepForest};
    transform: scale(1.05);
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[300]};
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const PageIndicator = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const PageDot = styled.button<{ active: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  background: ${({ active, theme }) => 
    active ? theme.colors.primary.sage : theme.colors.gray[300]
  };
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: scale(1.2);
  }
`;

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, index) => (
    <Star key={index} filled={index < rating}>
      ★
    </Star>
  ));
};

export const ReviewSection: React.FC<ReviewSectionProps> = ({ 
  reviews, 
  className 
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const reviewsPerPage = 3;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  
  const currentReviews = reviews.slice(
    currentPage * reviewsPerPage,
    (currentPage + 1) * reviewsPerPage
  );

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <SectionContainer className={className}>
      <ContentWrapper>
        <SectionHeader>
          <SectionTitle
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            고객들의 진솔한 후기
          </SectionTitle>
          <SectionSubtitle
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            MICOZ와 함께한 고객들의 실제 경험을 확인해보세요
          </SectionSubtitle>
        </SectionHeader>

        <ReviewsContainer>
          <AnimatePresence mode="wait">
            <ReviewsGrid
              key={currentPage}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              {currentReviews.map((review, index) => (
                <ReviewCard
                  key={review.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <ReviewHeader>
                    <CustomerInfo>
                      <CustomerName>{review.customerName}</CustomerName>
                      <ProductName>{review.productName}</ProductName>
                    </CustomerInfo>
                    {review.verified && (
                      <VerifiedBadge>
                        구매 인증
                      </VerifiedBadge>
                    )}
                  </ReviewHeader>

                  <RatingContainer>
                    <StarRating>
                      {renderStars(review.rating)}
                    </StarRating>
                    <RatingNumber>({review.rating}.0)</RatingNumber>
                  </RatingContainer>

                  {review.image && (
                    <ReviewImage src={review.image} alt="고객 후기 사진" />
                  )}

                  <ReviewComment>{review.comment}</ReviewComment>
                  <ReviewDate>{review.date}</ReviewDate>
                </ReviewCard>
              ))}
            </ReviewsGrid>
          </AnimatePresence>
        </ReviewsContainer>

        {totalPages > 1 && (
          <NavigationContainer>
            <NavButton 
              onClick={prevPage} 
              disabled={currentPage === 0}
            >
              ←
            </NavButton>
            
            <PageIndicator>
              {Array.from({ length: totalPages }, (_, index) => (
                <PageDot
                  key={index}
                  active={index === currentPage}
                  onClick={() => goToPage(index)}
                />
              ))}
            </PageIndicator>
            
            <NavButton 
              onClick={nextPage} 
              disabled={currentPage === totalPages - 1}
            >
              →
            </NavButton>
          </NavigationContainer>
        )}
      </ContentWrapper>
    </SectionContainer>
  );
};