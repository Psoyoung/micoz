import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Product } from '../../types';

const WidgetContainer = styled(motion.div)`
  background: ${({ theme }) => theme.colors.secondary.ivory};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[6]};
  box-shadow: ${({ theme }) => theme.shadows.base};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const WidgetHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const WidgetIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.primary.sage};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`;

const WidgetTitle = styled.h4`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const ProductList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const ProductItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: white;
  transition: all ${({ theme }) => theme.transitions.normal};
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
    transform: translateY(-2px);
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const ProductImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  object-fit: cover;
  background: ${({ theme }) => theme.colors.gray[100]};
`;

const ProductInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProductName = styled.h5`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProductBrand = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const ProductPrice = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.sage};
`;

const ViewAllButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[4]};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.primary.sage};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.sage};
    color: ${({ theme }) => theme.colors.secondary.ivory};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export interface RecommendationWidgetProps {
  title: string;
  icon: string;
  products: Product[];
  maxItems?: number;
  showViewAll?: boolean;
  onProductClick?: (product: Product) => void;
  onViewAll?: () => void;
  className?: string;
}

export const RecommendationWidget: React.FC<RecommendationWidgetProps> = ({
  title,
  icon,
  products,
  maxItems = 3,
  showViewAll = false,
  onProductClick,
  onViewAll,
  className
}) => {
  const displayProducts = products.slice(0, maxItems);

  const formatPrice = (price: number): string => {
    return `₩${price.toLocaleString()}`;
  };

  const handleProductClick = (product: Product) => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  return (
    <WidgetContainer
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <WidgetHeader>
        <WidgetIcon>{icon}</WidgetIcon>
        <WidgetTitle>{title}</WidgetTitle>
      </WidgetHeader>

      {displayProducts.length > 0 ? (
        <>
          <ProductList>
            {displayProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ProductItem onClick={() => handleProductClick(product)}>
                  <ProductImage
                    src={product.images[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    loading="lazy"
                  />
                  <ProductInfo>
                    <ProductName>{product.name}</ProductName>
                    <ProductBrand>{product.brand}</ProductBrand>
                    <ProductPrice>{formatPrice(product.price)}</ProductPrice>
                  </ProductInfo>
                </ProductItem>
              </motion.div>
            ))}
          </ProductList>

          {showViewAll && onViewAll && products.length > maxItems && (
            <ViewAllButton onClick={onViewAll}>
              더 보기 ({products.length - maxItems}개 더)
            </ViewAllButton>
          )}
        </>
      ) : (
        <EmptyState>
          추천할 상품이 없습니다.
        </EmptyState>
      )}
    </WidgetContainer>
  );
};