import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ProductCard } from '../ProductCard/ProductCard';
import { Product } from '../../types';
import { recommendationService } from '../../services/recommendationService';
import { useRecommendationAnalytics } from '../../hooks/useRecommendationAnalytics';

const SectionContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[8]} 0;
`;

const SectionHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const SectionDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[600]};
  max-width: 600px;
  margin: 0 auto;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing[6]};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: ${({ theme }) => theme.spacing[4]};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${({ theme }) => theme.spacing[3]};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[8]};
`;

const LoadingSpinner = styled(motion.div)`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.colors.gray[200]};
  border-top: 3px solid ${({ theme }) => theme.colors.primary.sage};
  border-radius: 50%;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const EmptyContainer = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ViewAllButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin: ${({ theme }) => theme.spacing[6]} auto 0;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background: transparent;
  border: 2px solid ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.primary.sage};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.sage};
    color: ${({ theme }) => theme.colors.secondary.ivory};
    transform: translateY(-2px);
  }
`;

export interface RecommendationSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  type: 'personalized' | 'similar' | 'trending' | 'skin-type' | 'browsing-history' | 'purchase-history';
  userId?: string;
  productId?: string;
  category?: string;
  limit?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  className?: string;
}

export const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  title,
  subtitle,
  description,
  type,
  userId,
  productId,
  category,
  limit = 4,
  showViewAll = false,
  onViewAll,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  className
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [algorithm, setAlgorithm] = useState<string>('collaborative_filtering');

  // Analytics hooks
  const { trackView, trackClick, trackConversion, getOptimizedAlgorithm } = useRecommendationAnalytics({
    recommendationType: type,
    userId,
    productIds: products.map(p => p.id),
    algorithm,
    context: { category, productId }
  });

  useEffect(() => {
    loadRecommendations();
  }, [type, userId, productId, category, limit]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get optimized algorithm from A/B testing
      const optimizedAlgorithm = await getOptimizedAlgorithm();
      setAlgorithm(optimizedAlgorithm);

      let recommendations: Product[] = [];

      switch (type) {
        case 'personalized':
          if (userId) {
            recommendations = await recommendationService.getPersonalizedRecommendations(userId, limit);
          }
          break;
        case 'similar':
          if (productId) {
            recommendations = await recommendationService.getSimilarProducts(productId, limit);
          }
          break;
        case 'trending':
          recommendations = await recommendationService.getTrendingProducts(limit, category);
          break;
        case 'skin-type':
          if (userId) {
            recommendations = await recommendationService.getSkinTypeRecommendations(userId, limit);
          }
          break;
        case 'browsing-history':
          if (userId) {
            recommendations = await recommendationService.getBrowsingHistoryRecommendations(userId, limit);
          }
          break;
        case 'purchase-history':
          if (userId) {
            recommendations = await recommendationService.getPurchaseHistoryRecommendations(userId, limit);
          }
          break;
        default:
          throw new Error(`Unknown recommendation type: ${type}`);
      }

      setProducts(recommendations);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setError('추천 상품을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Track view when products are loaded
  useEffect(() => {
    if (products.length > 0) {
      trackView();
    }
  }, [products, trackView]);

  // Enhanced product click handler with analytics
  const handleProductClick = (product: Product, index: number) => {
    trackClick(product.id, index);
    onProductClick?.(product);
  };

  // Enhanced add to cart handler with analytics
  const handleAddToCart = (product: Product, index: number) => {
    trackConversion(product.id, product.price);
    onAddToCart?.(product);
  };

  if (loading) {
    return (
      <SectionContainer className={className}>
        <SectionHeader>
          <SectionTitle>{title}</SectionTitle>
          {subtitle && <SectionSubtitle>{subtitle}</SectionSubtitle>}
          {description && <SectionDescription>{description}</SectionDescription>}
        </SectionHeader>
        <LoadingContainer>
          <LoadingSpinner
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </LoadingContainer>
      </SectionContainer>
    );
  }

  if (error) {
    return (
      <SectionContainer className={className}>
        <SectionHeader>
          <SectionTitle>{title}</SectionTitle>
          {subtitle && <SectionSubtitle>{subtitle}</SectionSubtitle>}
          {description && <SectionDescription>{description}</SectionDescription>}
        </SectionHeader>
        <ErrorContainer>
          <p>{error}</p>
        </ErrorContainer>
      </SectionContainer>
    );
  }

  if (products.length === 0) {
    return (
      <SectionContainer className={className}>
        <SectionHeader>
          <SectionTitle>{title}</SectionTitle>
          {subtitle && <SectionSubtitle>{subtitle}</SectionSubtitle>}
          {description && <SectionDescription>{description}</SectionDescription>}
        </SectionHeader>
        <EmptyContainer>
          <p>추천할 상품이 없습니다.</p>
        </EmptyContainer>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer className={className}>
      <SectionHeader>
        <SectionTitle>{title}</SectionTitle>
        {subtitle && <SectionSubtitle>{subtitle}</SectionSubtitle>}
        {description && <SectionDescription>{description}</SectionDescription>}
      </SectionHeader>
      
      <ProductGrid>
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <ProductCard
              product={product}
              onProductClick={() => handleProductClick(product, index)}
              onAddToCart={() => handleAddToCart(product, index)}
              onToggleWishlist={onToggleWishlist}
              showWishlistButton={true}
            />
          </motion.div>
        ))}
      </ProductGrid>

      {showViewAll && onViewAll && (
        <ViewAllButton onClick={onViewAll}>
          모두 보기
          <span>→</span>
        </ViewAllButton>
      )}
    </SectionContainer>
  );
};