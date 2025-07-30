import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedPaymentMethod, setOrderNote } from '../../store/checkoutSlice';
import type { PaymentMethod as PaymentMethodType } from '../../store/checkoutSlice';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const PaymentMethodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const PaymentMethodCard = styled(motion.div)<{ selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[4]};
  border: 2px solid ${({ selected, theme }) => 
    selected ? theme.colors.primary.sage : theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ selected, theme }) => 
    selected ? theme.colors.primary.sage + '10' : 'white'};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.sage};
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const PaymentIcon = styled.div`
  font-size: 48px;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const PaymentName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  text-align: center;
`;

const PaymentDescription = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

const OrderNoteSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[6]};
`;

const OrderNoteTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: ${({ theme }) => theme.spacing[4]};
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-family: inherit;
  resize: vertical;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const PaymentSummary = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  margin-top: ${({ theme }) => theme.spacing[6]};
`;

const SummaryTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[2]} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};

  &:last-child {
    border-bottom: none;
    padding-top: ${({ theme }) => theme.spacing[4]};
    margin-top: ${({ theme }) => theme.spacing[2]};
    border-top: 2px solid ${({ theme }) => theme.colors.gray[300]};
  }
`;

const SummaryLabel = styled.span`
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const SummaryValue = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const TotalLabel = styled(SummaryLabel)`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const TotalValue = styled(SummaryValue)`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const AgreementSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.blue[50]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border-left: 4px solid ${({ theme }) => theme.colors.blue[400]};
`;

const AgreementTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const AgreementList = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};

  li {
    margin-bottom: ${({ theme }) => theme.spacing[1]};
  }
`;

const formatPrice = (price: number): string => {
  return `₩${price.toLocaleString()}`;
};

// 결제 방법별 설명
const paymentDescriptions: Record<string, string> = {
  'card': '신용카드 및 체크카드로 안전하게 결제',
  'kakaopay': '카카오톡으로 간편하게 결제',
  'tosspay': '토스앱으로 빠르고 안전하게 결제',
  'bank': '계좌이체로 결제 (입금 확인 후 배송)'
};

export const PaymentMethod: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    selectedPaymentMethod, 
    paymentMethods,
    selectedShippingMethod,
    orderNote
  } = useAppSelector(state => state.checkout);
  const { total, itemCount } = useAppSelector(state => state.cart);
  
  const [localOrderNote, setLocalOrderNote] = useState(orderNote);

  const handlePaymentMethodSelect = (method: PaymentMethodType) => {
    dispatch(setSelectedPaymentMethod(method));
  };

  const handleOrderNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const note = e.target.value;
    setLocalOrderNote(note);
    dispatch(setOrderNote(note));
  };

  // 총 결제 금액 계산
  const subtotal = total;
  const shippingCost = selectedShippingMethod?.price || 0;
  const finalTotal = subtotal + shippingCost;

  return (
    <Container>
      <Section>
        <SectionTitle>결제 방법 선택</SectionTitle>
        
        <PaymentMethodGrid>
          {paymentMethods.map((method, index) => (
            <PaymentMethodCard
              key={method.id}
              selected={selectedPaymentMethod?.id === method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onClick={() => handlePaymentMethodSelect(method)}
            >
              <PaymentIcon>{method.icon}</PaymentIcon>
              <PaymentName>{method.name}</PaymentName>
              <PaymentDescription>
                {paymentDescriptions[method.id]}
              </PaymentDescription>
            </PaymentMethodCard>
          ))}
        </PaymentMethodGrid>
      </Section>

      <Section>
        <SectionTitle>배송 요청사항</SectionTitle>
        <OrderNoteTextarea
          value={localOrderNote}
          onChange={handleOrderNoteChange}
          placeholder="배송 시 요청사항을 입력해주세요. (예: 부재 시 경비실에 맡겨주세요)"
          maxLength={200}
        />
      </Section>

      <PaymentSummary>
        <SummaryTitle>결제 정보</SummaryTitle>
        
        <SummaryRow>
          <SummaryLabel>상품 금액 ({itemCount}개)</SummaryLabel>
          <SummaryValue>{formatPrice(subtotal)}</SummaryValue>
        </SummaryRow>
        
        <SummaryRow>
          <SummaryLabel>
            배송비 {selectedShippingMethod && `(${selectedShippingMethod.name})`}
          </SummaryLabel>
          <SummaryValue>
            {shippingCost === 0 ? '무료' : formatPrice(shippingCost)}
          </SummaryValue>
        </SummaryRow>
        
        <SummaryRow>
          <TotalLabel>총 결제금액</TotalLabel>
          <TotalValue>{formatPrice(finalTotal)}</TotalValue>
        </SummaryRow>
      </PaymentSummary>

      <AgreementSection>
        <AgreementTitle>📋 주문 전 확인사항</AgreementTitle>
        <AgreementList>
          <li>주문 내용과 배송지 정보를 다시 한번 확인해주세요.</li>
          <li>결제 완료 후 주문 변경이나 취소가 어려울 수 있습니다.</li>
          <li>배송 일정은 상품 재고 상황에 따라 변경될 수 있습니다.</li>
          <li>무통장입금 선택 시 입금 확인 후 배송이 시작됩니다.</li>
        </AgreementList>
      </AgreementSection>
    </Container>
  );
};