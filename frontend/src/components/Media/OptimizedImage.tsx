import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const ImageContainer = styled.div<{ 
  width?: string; 
  height?: string; 
  aspectRatio?: string;
  borderRadius?: string;
}>`
  position: relative;
  width: ${({ width }) => width || '100%'};
  height: ${({ height }) => height || 'auto'};
  aspect-ratio: ${({ aspectRatio }) => aspectRatio || 'auto'};
  border-radius: ${({ borderRadius, theme }) => borderRadius || theme.borderRadius.base};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.gray[100]};
`;

const Image = styled(motion.img)<{ objectFit?: string }>`
  width: 100%;
  height: 100%;
  object-fit: ${({ objectFit }) => objectFit || 'cover'};
  object-position: center;
`;

const PlaceholderContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.gray[100]};
`;

const PlaceholderContent = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const PlaceholderIcon = styled.div`
  font-size: 48px;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  opacity: 0.6;
`;

const PlaceholderText = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const LoadingOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.gray[100]};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoadingSpinner = styled(motion.div)`
  width: 32px;
  height: 32px;
  border: 3px solid ${({ theme }) => theme.colors.gray[200]};
  border-top: 3px solid ${({ theme }) => theme.colors.primary.sage};
  border-radius: 50%;
`;

const ErrorOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.red[50]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.red[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
  padding: ${({ theme }) => theme.spacing[4]};
`;

const LazyContainer = styled.div`
  width: 100%;
  height: 100%;
  min-height: 200px;
`;

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: string;
  height?: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  borderRadius?: string;
  placeholder?: React.ReactNode;
  lazy?: boolean;
  quality?: number;
  formats?: string[];
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  aspectRatio,
  objectFit = 'cover',
  borderRadius,
  placeholder,
  lazy = true,
  quality = 80,
  formats = ['webp', 'jpg'],
  onLoad,
  onError,
  className
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [inView, setInView] = useState(!lazy);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, inView]);

  // Generate optimized image sources
  useEffect(() => {
    if (!inView) return;

    const generateOptimizedSrc = (originalSrc: string, format?: string, quality?: number): string => {
      // In a real application, this would generate URLs for image optimization services
      // like Cloudinary, ImageKit, or a custom image service
      
      // For now, we'll use the original source with some basic optimizations
      if (originalSrc.includes('unsplash.com')) {
        let optimizedSrc = originalSrc;
        
        // Add quality parameter for Unsplash
        const url = new URL(originalSrc);
        if (quality) {
          url.searchParams.set('q', quality.toString());
        }
        
        // Add format if specified
        if (format && format !== 'jpg') {
          url.searchParams.set('fm', format);
        }
        
        // Add auto optimization
        url.searchParams.set('auto', 'format');
        
        return url.toString();
      }
      
      return originalSrc;
    };

    // Try different formats in order of preference
    const tryLoadImage = async () => {
      for (const format of formats) {
        try {
          const optimizedSrc = generateOptimizedSrc(src, format, quality);
          await checkImageLoad(optimizedSrc);
          setCurrentSrc(optimizedSrc);
          return;
        } catch (error) {
          console.warn(`Failed to load image with format ${format}:`, error);
        }
      }
      
      // Fallback to original source
      try {
        await checkImageLoad(src);
        setCurrentSrc(src);
      } catch (error) {
        console.error('Failed to load image:', error);
        setImageState('error');
        onError?.();
      }
    };

    tryLoadImage();
  }, [inView, src, quality, formats, onError]);

  const checkImageLoad = (imageSrc: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = imageSrc;
    });
  };

  const handleImageLoad = () => {
    setImageState('loaded');
    onLoad?.();
  };

  const handleImageError = () => {
    setImageState('error');
    onError?.();
  };

  const defaultPlaceholder = (
    <PlaceholderContent>
      <PlaceholderIcon>🖼️</PlaceholderIcon>
      <PlaceholderText>이미지 로딩 중...</PlaceholderText>
    </PlaceholderContent>
  );

  return (
    <ImageContainer
      ref={containerRef}
      width={width}
      height={height}
      aspectRatio={aspectRatio}
      borderRadius={borderRadius}
      className={className}
    >
      {!inView ? (
        <LazyContainer>
          {placeholder || defaultPlaceholder}
        </LazyContainer>
      ) : (
        <>
          <AnimatePresence>
            {imageState === 'loading' && (
              <LoadingOverlay
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <LoadingSpinner
                  animate={{ rotate: 360 }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                />
              </LoadingOverlay>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {imageState === 'error' && (
              <ErrorOverlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
                  <div>이미지를 불러올 수 없습니다</div>
                </div>
              </ErrorOverlay>
            )}
          </AnimatePresence>

          {currentSrc && (
            <Image
              ref={imgRef}
              src={currentSrc}
              alt={alt}
              objectFit={objectFit}
              initial={{ opacity: 0 }}
              animate={{ opacity: imageState === 'loaded' ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
          )}
        </>
      )}
    </ImageContainer>
  );
};

// Gallery component for multiple optimized images
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  aspectRatio?: string;
  spacing?: string;
  columns?: number;
}

const GalleryContainer = styled.div<{ spacing: string; columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ columns }) => columns}, 1fr);
  gap: ${({ spacing }) => spacing};
  width: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(${({ columns }) => Math.min(columns, 3)}, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(${({ columns }) => Math.min(columns, 2)}, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const GalleryItem = styled.div`
  position: relative;
`;

const ImageCaption = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: white;
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  aspectRatio = '4/3',
  spacing = '16px',
  columns = 3
}) => {
  return (
    <GalleryContainer spacing={spacing} columns={columns}>
      {images.map((image, index) => (
        <GalleryItem key={index}>
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            aspectRatio={aspectRatio}
            borderRadius="12px"
          />
          {image.caption && (
            <ImageCaption>{image.caption}</ImageCaption>
          )}
        </GalleryItem>
      ))}
    </GalleryContainer>
  );
};