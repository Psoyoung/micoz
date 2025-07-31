import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAppSelector } from '../../store/hooks';

const Container = styled.div`
  position: sticky;
  top: 100px;
`;

const SummaryCard = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};
  overflow: hidden;
`;

const Header = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.secondary.ivory};
`;

const Title = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin: 0;
`;

const Content = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const ItemsSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const SectionTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const Item = styled(motion.div)`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const ItemImage = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  flex-shrink: 0;
`;

const ItemDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
  word-break: break-word;
`;

const ItemVariant = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const ItemQuantityPrice = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Quantity = styled.span`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const Price = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const PricingSection = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding-top: ${({ theme }) => theme.spacing[4]};
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const PriceLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
`;

const PriceValue = styled.span<{ variant?: 'discount' | 'total' }>`
  font-size: ${({ theme, variant }) => 
    variant === 'total' ? theme.typography.fontSize.lg : theme.typography.fontSize.sm};
  font-weight: ${({ theme, variant }) => 
    variant === 'total' ? theme.typography.fontWeight.bold : theme.typography.fontWeight.medium};
  color: ${({ theme, variant }) => {
    if (variant === 'discount') return theme.colors.red[500];
    if (variant === 'total') return theme.colors.primary.deepForest;
    return theme.colors.secondary.charcoal;
  }};
`;

const TotalRow = styled(PriceRow)`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding-top: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[4]};
  margin-bottom: 0;
`;

const PromotionInfo = styled.div`
  background: ${({ theme }) => theme.colors.green[50]};
  color: ${({ theme }) => theme.colors.green[700]};
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const ShippingInfo = styled.div`
  background: ${({ theme }) => theme.colors.blue[50]};
  color: ${({ theme }) => theme.colors.blue[700]};
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const formatPrice = (price: number): string => {
  return `₩${price.toLocaleString()}`;
};

export const OrderSummary: React.FC = () => {
  const { items, subtotal, discount, shipping, total, promotionCode } = useAppSelector(state => state.cart);
  const { selectedShippingMethod } = useAppSelector(state => state.checkout);

  return (
    <Container>
      <SummaryCard>
        <Header>
          <Title>주문 요약</Title>
        </Header>
        
        <Content>
          <ItemsSection>
            <SectionTitle>주문 상품 ({items.length}개)</SectionTitle>
            <ItemsList>
              {items.map((item, index) => (
                <Item
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <ItemImage src={item.image} alt={item.name} />
                  <ItemDetails>
                    <ItemName>{item.name}</ItemName>
                    {item.variant && (
                      <ItemVariant>옵션: {item.variant.name}</ItemVariant>
                    )}
                    <ItemQuantityPrice>
                      <Quantity>수량 {item.quantity}개</Quantity>
                      <Price>{formatPrice(item.price * item.quantity)}</Price>
                    </ItemQuantityPrice>
                  </ItemDetails>
                </Item>
              ))}
            </ItemsList>
          </ItemsSection>

          {promotionCode && promotionCode.isValid && (
            <PromotionInfo>
              <span>🎫</span>
              <span>쿠폰 {promotionCode.code} 적용됨</span>
            </PromotionInfo>
          )}

          <PricingSection>
            <PriceRow>
              <PriceLabel>상품금액</PriceLabel>
              <PriceValue>{formatPrice(subtotal)}</PriceValue>
            </PriceRow>
            
            {discount > 0 && (
              <PriceRow>
                <PriceLabel>할인금액</PriceLabel>
                <PriceValue variant="discount">-{formatPrice(discount)}</PriceValue>
              </PriceRow>
            )}
            
            <PriceRow>
              <PriceLabel>배송비</PriceLabel>
              <PriceValue>
                {shipping === 0 ? '무료' : formatPrice(shipping)}
              </PriceValue>
            </PriceRow>
            
            <TotalRow>
              <PriceLabel>총 결제금액</PriceLabel>
              <PriceValue variant="total">{formatPrice(total)}</PriceValue>
            </TotalRow>
          </PricingSection>

          {selectedShippingMethod && (
            <ShippingInfo>
              <div>📦 {selectedShippingMethod.name}</div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                {selectedShippingMethod.description}
              </div>
            </ShippingInfo>
          )}
        </Content>
      </SummaryCard>
    </Container>
  );
};