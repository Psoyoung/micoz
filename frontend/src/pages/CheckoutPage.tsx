import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { nextStep, prevStep, setStep, resetCheckout } from '../store/checkoutSlice';
import { processPayment, resetPayment } from '../store/paymentSlice';
import { clearCart } from '../store/cartSlice';

// 단계별 컴포넌트들 (아래에서 구현)
import { CartReview } from '../components/Checkout/CartReview';
import { ShippingInfo } from '../components/Checkout/ShippingInfo';
import { PaymentMethod } from '../components/Checkout/PaymentMethod';
import { OrderComplete } from '../components/Checkout/OrderComplete';
import { OrderSummary } from '../components/Checkout/OrderSummary';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.gray[50]};
  padding-top: 80px;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[6]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[4]};
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[12]};
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  }
`;

const ProgressContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[12]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.spacing[2]};
  }
`;

const ProgressStep = styled.div<{ active: boolean; completed: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ active, completed, theme }) => {
    if (completed) {
      return `
        background: ${theme.colors.green[50]};
        color: ${theme.colors.green[700]};
      `;
    } else if (active) {
      return `
        background: ${theme.colors.primary.sage};
        color: ${theme.colors.secondary.ivory};
      `;
    } else {
      return `
        background: ${theme.colors.gray[100]};
        color: ${theme.colors.gray[500]};
      `;
    }
  }}

  &:hover {
    transform: translateY(-2px);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing[2]};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const StepNumber = styled.div`
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: currentColor;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  opacity: 0.8;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 20px;
    height: 20px;
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
  }
`;

const StepLabel = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: none;
  }
`;

const StepConnector = styled.div<{ active: boolean }>`
  width: 40px;
  height: 2px;
  background: ${({ active, theme }) => 
    active ? theme.colors.primary.sage : theme.colors.gray[300]};
  transition: background ${({ theme }) => theme.transitions.fast};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 20px;
  }
`;

const ContentContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: ${({ theme }) => theme.spacing[8]};
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[6]};
  }
`;

const MainContent = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};
  overflow: hidden;
`;

const SidebarContent = styled.div`
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    order: -1;
  }
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[6]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const NavButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  ${({ variant, theme }) => {
    if (variant === 'primary') {
      return `
        background: ${theme.colors.primary.sage};
        color: ${theme.colors.secondary.ivory};
        border: 2px solid ${theme.colors.primary.sage};
        
        &:hover:not(:disabled) {
          background: ${theme.colors.primary.deepForest};
          border-color: ${theme.colors.primary.deepForest};
          transform: translateY(-2px);
        }
      `;
    } else {
      return `
        background: white;
        color: ${theme.colors.secondary.charcoal};
        border: 2px solid ${theme.colors.gray[300]};
        
        &:hover:not(:disabled) {
          border-color: ${theme.colors.primary.sage};
          color: ${theme.colors.primary.sage};
        }
      `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { items, itemCount } = useAppSelector(state => state.cart);
  const { currentStep, steps, isProcessing } = useAppSelector(state => state.checkout);
  const { isProcessing: isPaymentProcessing, paymentStatus, currentOrder } = useAppSelector(state => state.payment);

  // 장바구니가 비어있으면 홈으로 리다이렉트
  useEffect(() => {
    if (itemCount === 0) {
      navigate('/');
    }
  }, [itemCount, navigate]);

  // 컴포넌트 언마운트 시 체크아웃 상태 초기화
  useEffect(() => {
    return () => {
      if (currentStep !== steps.length - 1) { // 주문 완료가 아닌 경우에만
        dispatch(resetCheckout());
      }
    };
  }, [dispatch, currentStep, steps.length]);

  const handleStepClick = (stepIndex: number) => {
    // 현재 단계보다 이전 단계로만 이동 가능
    if (stepIndex < currentStep) {
      dispatch(setStep(stepIndex));
    }
  };

  const handleNext = async () => {
    if (currentStep === steps.length - 2) {
      // 마지막 단계에서 결제 처리
      try {
        const result = await dispatch(processPayment()).unwrap();
        if (result) {
          dispatch(nextStep()); // 결제 완료 페이지로 이동
          dispatch(clearCart()); // 장바구니 비우기
        }
      } catch (error) {
        console.error('Payment failed:', error);
        // 에러는 PaymentMethod 컴포넌트에서 표시됨
      }
    } else {
      dispatch(nextStep());
    }
  };

  const handlePrev = () => {
    dispatch(prevStep());
  };

  const handleCancel = () => {
    if (window.confirm('주문을 취소하시겠습니까?')) {
      dispatch(resetCheckout());
      dispatch(resetPayment());
      navigate('/');
    }
  };

  // 각 단계별 컴포넌트 렌더링
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <CartReview />;
      case 1:
        return <ShippingInfo />;
      case 2:
        return <PaymentMethod />;
      case 3:
        return <OrderComplete />;
      default:
        return <CartReview />;
    }
  };

  // 다음 버튼 활성화 조건
  const canProceed = () => {
    const { selectedAddress, selectedShippingMethod, selectedPaymentMethod } = useAppSelector(state => state.checkout);
    
    switch (currentStep) {
      case 0:
        return items.length > 0;
      case 1:
        // 배송지와 배송방법이 선택되었는지 확인
        return selectedAddress !== null && selectedShippingMethod !== null;
      case 2:
        // 결제방법이 선택되었는지 확인
        return selectedPaymentMethod !== null;
      case 3:
        return false; // 마지막 단계
      default:
        return false;
    }
  };

  if (itemCount === 0) {
    return null; // 리다이렉트 중이므로 아무것도 렌더링하지 않음
  }

  return (
    <PageContainer>
      <Container>
        <Header>
          <Title>주문/결제</Title>
          
          {/* 진행 단계 표시 */}
          <ProgressContainer>
            {steps.map((step, index) => (
              <React.Fragment key={step}>
                <ProgressStep
                  active={currentStep === index}
                  completed={currentStep > index}
                  onClick={() => handleStepClick(index)}
                >
                  <StepNumber>
                    {currentStep > index ? '✓' : index + 1}
                  </StepNumber>
                  <StepLabel>{step}</StepLabel>
                </ProgressStep>
                
                {index < steps.length - 1 && (
                  <StepConnector active={currentStep > index} />
                )}
              </React.Fragment>
            ))}
          </ProgressContainer>
        </Header>

        <ContentContainer>
          <MainContent
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
            
            {currentStep < steps.length - 1 && (
              <NavigationButtons>
                <div>
                  {currentStep > 0 && (
                    <NavButton onClick={handlePrev} disabled={isProcessing}>
                      이전 단계
                    </NavButton>
                  )}
                  <NavButton 
                    onClick={handleCancel} 
                    disabled={isProcessing}
                    style={{ marginLeft: currentStep > 0 ? '12px' : '0' }}
                  >
                    주문 취소
                  </NavButton>
                </div>
                
                <NavButton
                  variant="primary"
                  onClick={handleNext}
                  disabled={!canProceed() || isProcessing || isPaymentProcessing}
                >
                  {isPaymentProcessing ? '결제 처리 중...' :
                   isProcessing ? '처리 중...' : 
                   currentStep === steps.length - 2 ? '결제하기' : '다음 단계'}
                </NavButton>
              </NavigationButtons>
            )}
          </MainContent>
          
          {/* 주문 요약 사이드바 */}
          <SidebarContent>
            <OrderSummary />
          </SidebarContent>
        </ContentContainer>
      </Container>
    </PageContainer>
  );
};