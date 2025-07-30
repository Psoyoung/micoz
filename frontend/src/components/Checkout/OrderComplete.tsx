import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearCart } from '../../store/cartSlice';
import { resetCheckout } from '../../store/checkoutSlice';
import { Button } from '../Button';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[6]};
  text-align: center;
`;

const SuccessIcon = styled(motion.div)`
  font-size: 80px;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  color: ${({ theme }) => theme.colors.green[500]};
`;

const Title = styled(motion.h2)`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }
`;

const Subtitle = styled(motion.p)`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const OrderInfoCard = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[6]};
  margin: ${({ theme }) => theme.spacing[8]} 0;
  box-shadow: ${({ theme }) => theme.shadows.base};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const OrderNumber = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[2]};
    text-align: center;
  }
`;

const OrderNumberLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const OrderNumberValue = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  font-family: monospace;
`;

const OrderDetailsGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing[4]};
  text-align: left;
`;

const OrderDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[3]} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};

  &:last-child {
    border-bottom: none;
    border-top: 2px solid ${({ theme }) => theme.colors.gray[200]};
    margin-top: ${({ theme }) => theme.spacing[2]};
    padding-top: ${({ theme }) => theme.spacing[4]};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    color: ${({ theme }) => theme.colors.primary.deepForest};
  }
`;

const DetailLabel = styled.span`
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const DetailValue = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const NextStepsCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.blue[50]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[6]};
  margin: ${({ theme }) => theme.spacing[6]} 0;
  border-left: 4px solid ${({ theme }) => theme.colors.blue[400]};
`;

const NextStepsTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const NextStepsList = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};

  li {
    margin-bottom: ${({ theme }) => theme.spacing[2]};
  }
`;

const ActionButtons = styled(motion.div)`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing[8]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: center;
  }
`;

const formatPrice = (price: number): string => {
  return `₩${price.toLocaleString()}`;
};

const generateOrderNumber = (): string => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `ORD${datePart}${randomPart}`;
};

export const OrderComplete: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { total, itemCount } = useAppSelector(state => state.cart);
  const { 
    selectedAddress, 
    selectedShippingMethod, 
    selectedPaymentMethod 
  } = useAppSelector(state => state.checkout);

  const orderNumber = generateOrderNumber();
  const shippingCost = selectedShippingMethod?.price || 0;
  const finalTotal = total + shippingCost;

  // 주문 완료 시 장바구니 비우기
  useEffect(() => {
    dispatch(clearCart());
  }, [dispatch]);

  const handleContinueShopping = () => {
    dispatch(resetCheckout());
    navigate('/');
  };

  const handleViewOrders = () => {
    dispatch(resetCheckout());
    navigate('/orders');
  };

  return (
    <Container>
      <SuccessIcon
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        ✅
      </SuccessIcon>

      <Title
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        주문이 완료되었습니다!
      </Title>

      <Subtitle
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        소중한 주문 감사합니다.<br />
        주문 확인 이메일을 발송해 드렸습니다.
      </Subtitle>

      <OrderInfoCard
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <OrderNumber>
          <OrderNumberLabel>주문번호</OrderNumberLabel>
          <OrderNumberValue>{orderNumber}</OrderNumberValue>
        </OrderNumber>

        <OrderDetailsGrid>
          <OrderDetailRow>
            <DetailLabel>주문 상품</DetailLabel>
            <DetailValue>{itemCount}개 상품</DetailValue>
          </OrderDetailRow>

          <OrderDetailRow>
            <DetailLabel>배송지</DetailLabel>
            <DetailValue>
              {selectedAddress?.name} ({selectedAddress?.address})
            </DetailValue>
          </OrderDetailRow>

          <OrderDetailRow>
            <DetailLabel>배송 방법</DetailLabel>
            <DetailValue>{selectedShippingMethod?.name}</DetailValue>
          </OrderDetailRow>

          <OrderDetailRow>
            <DetailLabel>결제 방법</DetailLabel>
            <DetailValue>{selectedPaymentMethod?.name}</DetailValue>
          </OrderDetailRow>

          <OrderDetailRow>
            <DetailLabel>상품 금액</DetailLabel>
            <DetailValue>{formatPrice(total)}</DetailValue>
          </OrderDetailRow>

          <OrderDetailRow>
            <DetailLabel>배송비</DetailLabel>
            <DetailValue>
              {shippingCost === 0 ? '무료' : formatPrice(shippingCost)}
            </DetailValue>
          </OrderDetailRow>

          <OrderDetailRow>
            <DetailLabel>총 결제금액</DetailLabel>
            <DetailValue>{formatPrice(finalTotal)}</DetailValue>
          </OrderDetailRow>
        </OrderDetailsGrid>
      </OrderInfoCard>

      <NextStepsCard
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <NextStepsTitle>📦 다음 단계</NextStepsTitle>
        <NextStepsList>
          <li>주문 확인 및 결제 승인이 완료되면 상품 준비를 시작합니다.</li>
          <li>배송 시작 시 SMS와 이메일로 송장번호를 안내해 드립니다.</li>
          <li>마이페이지에서 주문 상태와 배송 현황을 확인하실 수 있습니다.</li>
          <li>배송 관련 문의사항은 고객센터로 연락해 주세요.</li>
        </NextStepsList>
      </NextStepsCard>

      <ActionButtons
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Button
          variant="secondary"
          size="large"
          onClick={handleViewOrders}
        >
          주문 내역 보기
        </Button>
        
        <Button
          variant="primary"
          size="large"
          onClick={handleContinueShopping}
        >
          쇼핑 계속하기
        </Button>
      </ActionButtons>
    </Container>
  );
};