import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from '../Button';

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  subCategory?: string;
  brand: string;
  slug: string;
  images: string[];
  isNew?: boolean;
  isBestseller?: boolean;
  featured?: boolean;
  inventory: number;
  variants?: ProductVariant[];
  rating: {
    average: number;
    count: number;
  };
  wishlistCount: number;
  createdAt: string;
  publishedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  inventory: number;
}

export interface ProductCardProps {
  product: Product;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  showWishlistButton?: boolean;
  className?: string;
}

const CardContainer = styled(motion.div)`
  background: ${({ theme }) => theme.colors.secondary.ivory};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.base};
  transition: all ${({ theme }) => theme.transitions.normal};
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${({ theme }) => theme.shadows.xl};
  }
`;

const CardLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;
  height: 100%;
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  background: ${({ theme }) => theme.colors.gray[100]};
  overflow: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    height: 250px;
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform ${({ theme }) => theme.transitions.normal};

  ${CardContainer}:hover & {
    transform: scale(1.05);
  }
`;

const BadgeContainer = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing[4]};
  left: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Badge = styled.div<{ type: 'new' | 'bestseller' | 'featured' }>`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  
  ${({ type, theme }) => {
    switch (type) {
      case 'new':
        return `
          background: ${theme.colors.accent.softCoral};
          color: ${theme.colors.secondary.ivory};
        `;
      case 'bestseller':
        return `
          background: ${theme.colors.primary.sage};
          color: ${theme.colors.secondary.ivory};
        `;
      case 'featured':
        return `
          background: ${theme.colors.primary.deepForest};
          color: ${theme.colors.secondary.ivory};
        `;
      default:
        return '';
    }
  }}
`;

const WishlistButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing[4]};
  right: ${({ theme }) => theme.spacing[4]};
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: rgba(255, 255, 255, 0.9);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.1);
  }

  svg {
    width: 20px;
    height: 20px;
    fill: ${({ theme }) => theme.colors.gray[600]};
    transition: fill ${({ theme }) => theme.transitions.normal};
  }

  &:hover svg {
    fill: ${({ theme }) => theme.colors.accent.softCoral};
  }
`;

const OutOfStockOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const CardContent = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const CategoryBrand = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Category = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.primary.sage};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Brand = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ProductName = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`;

const ProductDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const PriceRatingContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Price = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const OriginalPrice = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.gray[500]};
  text-decoration: line-through;
`;

const DiscountBadge = styled.span`
  background: ${({ theme }) => theme.colors.accent.softCoral};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Stars = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const Star = styled.div<{ filled: boolean }>`
  width: 16px;
  height: 16px;
  
  &::before {
    content: '★';
    color: ${({ filled, theme }) => 
      filled ? theme.colors.accent.softCoral : theme.colors.gray[300]};
    font-size: 16px;
  }
`;

const RatingText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const formatPrice = (price: number): string => {
  return `₩${price.toLocaleString()}`;
};

const calculateDiscount = (price: number, compareAtPrice: number): number => {
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

const renderStars = (rating: number) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  for (let i = 0; i < 5; i++) {
    stars.push(
      <Star key={i} filled={i < fullStars || (i === fullStars && hasHalfStar)} />
    );
  }
  
  return stars;
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  showWishlistButton = false,
  className,
}) => {
  const isOutOfStock = product.inventory === 0;
  const discount = product.compareAtPrice 
    ? calculateDiscount(product.price, product.compareAtPrice) 
    : null;


  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart && !isOutOfStock) {
      onAddToCart(product);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product);
    }
  };

  return (
    <CardContainer
      className={className}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CardLink to={`/product/${product.slug}`}>
      <ImageContainer>
        <ProductImage 
          src={product.images[0] || '/placeholder-product.jpg'} 
          alt={product.name}
          loading="lazy"
        />
        
        <BadgeContainer>
          {product.isNew && <Badge type="new">NEW</Badge>}
          {product.isBestseller && <Badge type="bestseller">BEST</Badge>}
          {product.featured && <Badge type="featured">FEATURED</Badge>}
        </BadgeContainer>

        {showWishlistButton && (
          <WishlistButton onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            handleWishlistToggle(e);
          }}>
            <svg viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </WishlistButton>
        )}

        {isOutOfStock && (
          <OutOfStockOverlay>
            품절
          </OutOfStockOverlay>
        )}
      </ImageContainer>

      <CardContent>
        <CategoryBrand>
          <Category>{product.category}</Category>
          <Brand>{product.brand}</Brand>
        </CategoryBrand>

        <ProductName>{product.name}</ProductName>
        
        <ProductDescription>
          {product.shortDescription || product.description}
        </ProductDescription>

        <PriceRatingContainer>
          <PriceContainer>
            <Price>{formatPrice(product.price)}</Price>
            {product.compareAtPrice && (
              <>
                <OriginalPrice>{formatPrice(product.compareAtPrice)}</OriginalPrice>
                {discount && <DiscountBadge>{discount}% 할인</DiscountBadge>}
              </>
            )}
          </PriceContainer>
          
          {product.rating.count > 0 && (
            <RatingContainer>
              <Stars>{renderStars(product.rating.average)}</Stars>
              <RatingText>
                {product.rating.average.toFixed(1)} ({product.rating.count})
              </RatingText>
            </RatingContainer>
          )}
        </PriceRatingContainer>

        <ButtonContainer>
          <Button 
            variant="secondary" 
            size="small" 
            fullWidth
          >
            자세히 보기
          </Button>
          {!isOutOfStock && (
            <Button 
              variant="primary" 
              size="small" 
              onClick={(e) => {
                if (e) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                handleAddToCart(e as React.MouseEvent);
              }}
            >
              장바구니
            </Button>
          )}
        </ButtonContainer>
      </CardContent>
      </CardLink>
    </CardContainer>
  );
};