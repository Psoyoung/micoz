import React from 'react';
import styled from 'styled-components';
import { RecommendationSection } from './RecommendationSection';
import { Product } from '../../types';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[8]} 0;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

export interface SimilarProductsProps {
  currentProduct: Product;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  className?: string;
}

export const SimilarProducts: React.FC<SimilarProductsProps> = ({
  currentProduct,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  className
}) => {
  return (
    <Container className={className}>
      <RecommendationSection
        title="이런 상품은 어떠세요?"
        subtitle="비슷한 제품 추천"
        description={`${currentProduct.name}과 유사한 다른 제품들을 확인해보세요`}
        type="similar"
        productId={currentProduct.id}
        limit={4}
        showViewAll={true}
        onProductClick={onProductClick}
        onAddToCart={onAddToCart}
        onToggleWishlist={onToggleWishlist}
      />
    </Container>
  );
};