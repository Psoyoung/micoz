import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from '../ProductCard/ProductCard';
import { Product } from '../../types';

const CarouselContainer = styled.div`
  position: relative;
  padding: ${({ theme }) => theme.spacing[4]} 0;
`;

const CarouselHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const CarouselTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const CarouselControls = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const CarouselButton = styled.button<{ disabled?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  background: ${({ theme }) => theme.colors.secondary.ivory};
  color: ${({ theme, disabled }) => 
    disabled ? theme.colors.gray[400] : theme.colors.primary.sage};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all ${({ theme }) => theme.transitions.normal};
  font-size: 18px;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary.sage};
    color: ${({ theme }) => theme.colors.secondary.ivory};
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const CarouselWrapper = styled.div`
  overflow: hidden;
  position: relative;
`;

const CarouselTrack = styled(motion.div)`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  will-change: transform;
`;

const CarouselItem = styled.div<{ itemWidth: number }>`
  flex: 0 0 ${({ itemWidth }) => itemWidth}px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex: 0 0 280px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex: 0 0 250px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex: 0 0 200px;
  }
`;

const DotsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const Dot = styled.button<{ active?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: ${({ active, theme }) => 
    active ? theme.colors.primary.sage : theme.colors.gray[300]};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.sage};
  }
`;

export interface RecommendationCarouselProps {
  title: string;
  products: Product[];
  itemsPerView?: number;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  className?: string;
}

export const RecommendationCarousel: React.FC<RecommendationCarouselProps> = ({
  title,
  products,
  itemsPerView = 4,
  showDots = false,
  autoPlay = false,
  autoPlayInterval = 5000,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  className
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemWidth, setItemWidth] = useState(320);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Calculate item width based on container size
  useEffect(() => {
    const updateItemWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const gap = 16; // 4 spacing units
        const calculatedWidth = (containerWidth - (gap * (itemsPerView - 1))) / itemsPerView;
        setItemWidth(Math.max(calculatedWidth, 200));
      }
    };

    updateItemWidth();
    window.addEventListener('resize', updateItemWidth);
    return () => window.removeEventListener('resize', updateItemWidth);
  }, [itemsPerView]);

  // Auto play functionality
  useEffect(() => {
    if (!autoPlay || products.length <= itemsPerView) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const maxIndex = products.length - itemsPerView;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, products.length, itemsPerView]);

  const maxIndex = Math.max(0, products.length - itemsPerView);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;

  const goToPrev = () => {
    if (canGoPrev) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(Math.min(index, maxIndex));
  };

  const translateX = -(currentIndex * (itemWidth + 16)); // 16px gap

  if (products.length === 0) {
    return null;
  }

  return (
    <CarouselContainer ref={containerRef} className={className}>
      <CarouselHeader>
        <CarouselTitle>{title}</CarouselTitle>
        {products.length > itemsPerView && (
          <CarouselControls>
            <CarouselButton onClick={goToPrev} disabled={!canGoPrev}>
              ←
            </CarouselButton>
            <CarouselButton onClick={goToNext} disabled={!canGoNext}>
              →
            </CarouselButton>
          </CarouselControls>
        )}
      </CarouselHeader>

      <CarouselWrapper>
        <CarouselTrack
          ref={trackRef}
          animate={{ x: translateX }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {products.map((product, index) => (
            <CarouselItem key={product.id} itemWidth={itemWidth}>
              <ProductCard
                product={product}
                onProductClick={onProductClick}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                showWishlistButton={true}
              />
            </CarouselItem>
          ))}
        </CarouselTrack>
      </CarouselWrapper>

      {showDots && products.length > itemsPerView && (
        <DotsContainer>
          {Array.from({ length: maxIndex + 1 }, (_, index) => (
            <Dot
              key={index}
              active={index === currentIndex}
              onClick={() => goToSlide(index)}
            />
          ))}
        </DotsContainer>
      )}
    </CarouselContainer>
  );
};