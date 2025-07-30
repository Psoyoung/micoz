import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Product } from '../components/ProductCard';
import { Button } from '../components/Button';
import { ProductDetailSections } from '../components/ProductDetailSections/ProductDetailSections';

interface ProductDetailPageProps {}

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

interface ProductDetailResponse {
  product: Product & {
    sku: string;
    ingredients: string[];
    usage?: string;
    trackInventory: boolean;
    variants: Array<{
      id: string;
      name: string;
      sku: string;
      price: number;
      inventory: number;
      position: number;
    }>;
    reviews: Review[];
  };
}

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.secondary.ivory};
`;

const Container = styled.div`
  max-width: ${({ theme }) => theme.grid.container};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[4]};
  }
`;

const ProductSection = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[12]};
  margin-bottom: ${({ theme }) => theme.spacing[16]};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[8]};
  }
`;

const ImageGallery = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const MainImage = styled(motion.div)`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  overflow: hidden;
  background: white;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
`;

const ThumbnailContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  overflow-x: auto;
  padding: 0 ${({ theme }) => theme.spacing[2]};

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.gray[200]};
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.primary.sage};
    border-radius: 2px;
  }
`;

const Thumbnail = styled(motion.div)<{ active: boolean }>`
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  cursor: pointer;
  border: 2px solid ${({ active, theme }) => 
    active ? theme.colors.primary.sage : 'transparent'};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }
`;

const ProductInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
`;

const Breadcrumb = styled.nav`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  a {
    color: ${({ theme }) => theme.colors.primary.sage};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ProductHeader = styled.div``;

const ProductTitle = styled(motion.h1)`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  }
`;

const ProductSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ProductMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const Brand = styled.span`
  background: ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const BadgeContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Badge = styled.div<{ type: 'new' | 'bestseller' | 'featured' }>`
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
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

const PriceSection = styled.div`
  background: white;
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Price = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const OriginalPrice = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.gray[500]};
  text-decoration: line-through;
`;

const DiscountBadge = styled.div`
  background: ${({ theme }) => theme.colors.accent.softCoral};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const VariantSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const VariantLabel = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const VariantOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const VariantOption = styled.button<{ selected: boolean }>`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  border: 2px solid ${({ selected, theme }) => 
    selected ? theme.colors.primary.sage : theme.colors.gray[300]};
  background: ${({ selected, theme }) => 
    selected ? theme.colors.primary.sage : 'white'};
  color: ${({ selected, theme }) => 
    selected ? theme.colors.secondary.ivory : theme.colors.secondary.charcoal};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const QuantitySelector = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const QuantityButton = styled.button`
  width: 36px;
  height: 36px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  background: white;
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QuantityInput = styled.input`
  width: 60px;
  height: 36px;
  text-align: center;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary.sage};
    outline-offset: -2px;
  }
`;

const StockStatus = styled.div<{ inStock: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ inStock, theme }) => 
    inStock ? theme.colors.green[600] : theme.colors.red[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const WishlistButton = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 2px solid ${({ active, theme }) => 
    active ? theme.colors.accent.softCoral : theme.colors.gray[300]};
  background: ${({ active, theme }) => 
    active ? theme.colors.accent.softCoral : 'white'};
  color: ${({ active, theme }) => 
    active ? 'white' : theme.colors.gray[600]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent.softCoral};
    color: ${({ theme }) => theme.colors.accent.softCoral};
  }

  svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ErrorMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  text-align: center;
  color: ${({ theme }) => theme.colors.red[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const formatPrice = (price: number): string => {
  return `₩${price.toLocaleString()}`;
};

export const ProductDetailPage: React.FC<ProductDetailPageProps> = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<ProductDetailResponse['product'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/products/${slug}`);
        if (!response.ok) {
          throw new Error('제품을 찾을 수 없습니다.');
        }
        const data: ProductDetailResponse = await response.json();
        setProduct(data.product);
        
        // 첫 번째 변형 옵션을 기본 선택으로 설정
        if (data.product.variants && data.product.variants.length > 0) {
          setSelectedVariant(data.product.variants[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '제품을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleQuantityChange = (newQuantity: number) => {
    if (product) {
      const maxQuantity = product.inventory;
      const validQuantity = Math.max(1, Math.min(newQuantity, maxQuantity));
      setQuantity(validQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const selectedVariantData = selectedVariant 
      ? product.variants.find(v => v.id === selectedVariant)
      : null;
    
    console.log('장바구니에 추가:', {
      product: product.name,
      variant: selectedVariantData?.name,
      quantity,
      price: selectedVariantData?.price || product.price
    });
    
    // 실제로는 Redux 액션이나 Context API 사용
  };

  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    console.log('위시리스트 토글:', product?.name);
    // 실제로는 API 호출
  };

  if (loading) return <LoadingSpinner>제품 정보를 불러오는 중...</LoadingSpinner>;
  if (error) return <ErrorMessage>오류: {error}</ErrorMessage>;
  if (!product) return <ErrorMessage>제품을 찾을 수 없습니다.</ErrorMessage>;

  const images = product.images && Array.isArray(product.images) 
    ? product.images 
    : JSON.parse(product.images || '[]');

  const selectedVariantData = selectedVariant 
    ? product.variants.find(v => v.id === selectedVariant)
    : null;

  const currentPrice = selectedVariantData?.price || product.price;
  const currentInventory = selectedVariantData?.inventory ?? product.inventory;
  const isInStock = currentInventory > 0;

  const discount = product.compareAtPrice 
    ? Math.round(((product.compareAtPrice - currentPrice) / product.compareAtPrice) * 100)
    : null;

  return (
    <PageContainer>
      <Container>
        <Breadcrumb>
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>홈</a>
          {' > '}
          <a href={`/${product.category.toLowerCase()}`} 
             onClick={(e) => { e.preventDefault(); navigate(`/${product.category.toLowerCase()}`); }}>
            {product.category}
          </a>
          {' > '}
          <span>{product.name}</span>
        </Breadcrumb>

        <ProductSection>
          <ImageGallery>
            <MainImage>
              <ProductImage 
                src={images[selectedImage] || '/placeholder-product.jpg'} 
                alt={product.name}
              />
            </MainImage>
            
            {images.length > 1 && (
              <ThumbnailContainer>
                {images.map((image: string, index: number) => (
                  <Thumbnail
                    key={index}
                    active={selectedImage === index}
                    onClick={() => setSelectedImage(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} />
                  </Thumbnail>
                ))}
              </ThumbnailContainer>
            )}
          </ImageGallery>

          <ProductInfo>
            <ProductHeader>
              <ProductMeta>
                <Brand>{product.brand}</Brand>
                <BadgeContainer>
                  {product.isNew && <Badge type="new">NEW</Badge>}
                  {product.isBestseller && <Badge type="bestseller">BEST</Badge>}
                  {product.featured && <Badge type="featured">FEATURED</Badge>}
                </BadgeContainer>
              </ProductMeta>

              <ProductTitle
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {product.name}
              </ProductTitle>

              <ProductSubtitle>
                {product.shortDescription || product.description}
              </ProductSubtitle>
            </ProductHeader>

            <PriceSection>
              <PriceContainer>
                <Price>{formatPrice(currentPrice)}</Price>
                {product.compareAtPrice && (
                  <>
                    <OriginalPrice>{formatPrice(product.compareAtPrice)}</OriginalPrice>
                    {discount && <DiscountBadge>{discount}% 할인</DiscountBadge>}
                  </>
                )}
              </PriceContainer>

              <StockStatus inStock={isInStock}>
                {isInStock ? `재고 ${currentInventory}개 남음` : '품절'}
              </StockStatus>

              {product.variants && product.variants.length > 0 && (
                <VariantSection>
                  <VariantLabel>옵션 선택</VariantLabel>
                  <VariantOptions>
                    {product.variants.map((variant) => (
                      <VariantOption
                        key={variant.id}
                        selected={selectedVariant === variant.id}
                        disabled={variant.inventory === 0}
                        onClick={() => setSelectedVariant(variant.id)}
                      >
                        {variant.name} {variant.inventory === 0 && '(품절)'}
                      </VariantOption>
                    ))}
                  </VariantOptions>
                </VariantSection>
              )}

              {isInStock && (
                <QuantitySelector>
                  <span>수량:</span>
                  <QuantityButton 
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </QuantityButton>
                  <QuantityInput
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    min="1"
                    max={currentInventory}
                  />
                  <QuantityButton 
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= currentInventory}
                  >
                    +
                  </QuantityButton>
                </QuantitySelector>
              )}

              <ActionButtons>
                <Button
                  variant="primary"
                  size="large"
                  fullWidth
                  disabled={!isInStock}
                  onClick={handleAddToCart}
                >
                  {isInStock ? '장바구니 담기' : '품절'}
                </Button>
                <WishlistButton
                  active={isWishlisted}
                  onClick={handleToggleWishlist}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </WishlistButton>
              </ActionButtons>
            </PriceSection>
          </ProductInfo>
        </ProductSection>

        <ProductDetailSections
          description={product.description}
          ingredients={product.ingredients}
          usage={product.usage}
          category={product.category}
          subCategory={product.subCategory}
        />
      </Container>
    </PageContainer>
  );
};