import React, { useContext } from 'react';
import styled from 'styled-components';
import { AuthContext } from '../../contexts/AuthContext';
import { RecommendationSection } from './RecommendationSection';
import { Product } from '../../types';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[8]} 0;
`;

const WelcomeSection = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const WelcomeTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const WelcomeSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  max-width: 800px;
  margin: 0 auto;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const RecommendationGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[12]};
`;

const GuestMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  margin: ${({ theme }) => theme.spacing[8]} 0;
`;

const GuestTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const GuestDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const LoginButton = styled.button`
  background: ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  border: none;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.deepForest};
    transform: translateY(-2px);
  }
`;

export interface PersonalizedRecommendationsProps {
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  onLogin?: () => void;
  className?: string;
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  onLogin,
  className
}) => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const isAuthenticated = auth?.isAuthenticated;

  if (!isAuthenticated || !user) {
    return (
      <Container className={className}>
        <GuestMessage>
          <GuestTitle>개인 맞춤 추천을 받아보세요</GuestTitle>
          <GuestDescription>
            로그인하시면 귀하의 취향과 관심사에 맞는 개인 맞춤 상품을 추천해드립니다.
            피부 타입, 구매 이력, 관심 상품을 바탕으로 최적의 뷰티 제품을 찾아보세요.
          </GuestDescription>
          <LoginButton onClick={onLogin}>
            로그인하기
          </LoginButton>
        </GuestMessage>
        
        {/* Show trending products for guest users */}
        <RecommendationSection
          title="인기 상품"
          subtitle="많은 분들이 선택한 베스트 아이템"
          description="현재 가장 인기 있는 뷰티 제품들을 만나보세요"
          type="trending"
          limit={8}
          showViewAll={true}
          onProductClick={onProductClick}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
        />
      </Container>
    );
  }

  return (
    <Container className={className}>
      <WelcomeSection>
        <WelcomeTitle>{user.firstName}님을 위한 맞춤 추천</WelcomeTitle>
        <WelcomeSubtitle>
          귀하의 피부 타입과 취향을 바탕으로 엄선한 제품들을 추천해드립니다.
          새로운 뷰티 경험을 시작해보세요.
        </WelcomeSubtitle>
      </WelcomeSection>

      <RecommendationGrid>
        {/* Personalized recommendations based on user profile */}
        <RecommendationSection
          title="나만을 위한 추천"
          subtitle="개인 맞춤형 상품"
          description="피부 타입과 관심사를 바탕으로 선별한 상품들"
          type="personalized"
          userId={user.id}
          limit={4}
          showViewAll={true}
          onProductClick={onProductClick}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
        />

        {/* Skin type specific recommendations */}
        <RecommendationSection
          title="피부 타입별 추천"
          subtitle={`${user.skinType || '모든'} 피부를 위한 제품`}
          description="귀하의 피부 타입에 최적화된 제품들을 만나보세요"
          type="skin-type"
          userId={user.id}
          limit={4}
          showViewAll={true}
          onProductClick={onProductClick}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
        />

        {/* Browsing history based recommendations */}
        <RecommendationSection
          title="최근 관심 상품과 유사한 제품"
          subtitle="둘러본 상품 기반 추천"
          description="최근 확인하신 상품과 비슷한 다른 제품들"
          type="browsing-history"
          userId={user.id}
          limit={4}
          showViewAll={true}
          onProductClick={onProductClick}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
        />

        {/* Purchase history based recommendations */}
        <RecommendationSection
          title="구매 이력 기반 추천"
          subtitle="이전 구매 상품과 어울리는 제품"
          description="구매하신 제품과 함께 사용하면 좋은 상품들"
          type="purchase-history"
          userId={user.id}
          limit={4}
          showViewAll={true}
          onProductClick={onProductClick}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
        />

        {/* Trending products */}
        <RecommendationSection
          title="지금 인기 상품"
          subtitle="트렌딩 아이템"
          description="현재 많은 분들이 관심을 갖고 있는 인기 제품들"
          type="trending"
          limit={4}
          showViewAll={true}
          onProductClick={onProductClick}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
        />
      </RecommendationGrid>
    </Container>
  );
};