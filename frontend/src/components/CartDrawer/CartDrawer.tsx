import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  closeCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart 
} from '../../store/cartSlice';
import { Button } from '../Button';

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
`;

const DrawerContainer = styled(motion.div)`
  width: 480px;
  height: 100vh;
  background: ${({ theme }) => theme.colors.secondary.ivory};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100vw;
  }
`;

const DrawerHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
`;

const DrawerTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${({ theme }) => theme.colors.gray[600]};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.primary.deepForest};
  }
`;

const CartItemsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing[6]};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.primary.sage};
    border-radius: 3px;
  }
`;

const CartItem = styled(motion.div)`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const ItemImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  flex-shrink: 0;
`;

const ItemDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const ItemName = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin: 0;
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`;

const ItemVariant = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ItemPrice = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const ItemActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const QuantityButton = styled.button`
  width: 32px;
  height: 32px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  background: white;
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.gray[100]};
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QuantityDisplay = styled.span`
  min-width: 32px;
  text-align: center;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.red[500]};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[1]};
  font-size: 18px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.red[50]};
    color: ${({ theme }) => theme.colors.red[600]};
  }
`;

const EmptyCart = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const EmptyCartIcon = styled.div`
  font-size: 64px;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  opacity: 0.3;
`;

const EmptyCartText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const CartSummary = styled.div`
  background: white;
  padding: ${({ theme }) => theme.spacing[6]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[2]} 0;
`;

const SummaryLabel = styled.span`
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const SummaryValue = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const TotalRow = styled(SummaryRow)`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding-top: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

const TotalLabel = styled(SummaryLabel)`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const TotalValue = styled(SummaryValue)`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const ClearCartButton = styled.button`
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.red[300]};
  color: ${({ theme }) => theme.colors.red[600]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.red[50]};
    border-color: ${({ theme }) => theme.colors.red[400]};
  }
`;

const formatPrice = (price: number): string => {
  return `₩${price.toLocaleString()}`;
};

export const CartDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isOpen, items, total, itemCount } = useAppSelector(state => state.cart);

  const handleClose = () => {
    dispatch(closeCart());
  };

  const handleRemoveItem = (itemId: string) => {
    dispatch(removeFromCart(itemId));
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      dispatch(updateQuantity({ id: itemId, quantity: newQuantity }));
    }
  };

  const handleClearCart = () => {
    if (window.confirm('장바구니를 비우시겠습니까?')) {
      dispatch(clearCart());
    }
  };

  const handleCheckout = () => {
    handleClose();
    navigate('/checkout');
  };

  const subtotal = total;
  const shipping = subtotal >= 50000 ? 0 : 3000; // 5만원 이상 무료배송
  const finalTotal = subtotal + shipping;

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <DrawerContainer
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <DrawerHeader>
              <DrawerTitle>
                장바구니 ({itemCount}개)
              </DrawerTitle>
              <CloseButton onClick={handleClose}>×</CloseButton>
            </DrawerHeader>

            <CartItemsContainer>
              {items.length === 0 ? (
                <EmptyCart>
                  <EmptyCartIcon>🛒</EmptyCartIcon>
                  <EmptyCartText>장바구니가 비어있습니다</EmptyCartText>
                  <Button
                    variant="primary"
                    size="medium"
                    onClick={handleClose}
                  >
                    쇼핑 계속하기
                  </Button>
                </EmptyCart>
              ) : (
                <>
                  {items.map((item, index) => (
                    <CartItem
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <ItemImage src={item.image} alt={item.name} />
                      <ItemDetails>
                        <ItemName>{item.name}</ItemName>
                        {item.variant && (
                          <ItemVariant>옵션: {item.variant.name}</ItemVariant>
                        )}
                        <ItemPrice>{formatPrice(item.price)}</ItemPrice>
                        <ItemActions>
                          <QuantityControls>
                            <QuantityButton
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              -
                            </QuantityButton>
                            <QuantityDisplay>{item.quantity}</QuantityDisplay>
                            <QuantityButton
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.maxQuantity}
                            >
                              +
                            </QuantityButton>
                          </QuantityControls>
                          <RemoveButton
                            onClick={() => handleRemoveItem(item.id)}
                            title="상품 삭제"
                          >
                            🗑️
                          </RemoveButton>
                        </ItemActions>
                      </ItemDetails>
                    </CartItem>
                  ))}
                </>
              )}
            </CartItemsContainer>

            {items.length > 0 && (
              <CartSummary>
                <SummaryRow>
                  <SummaryLabel>상품금액</SummaryLabel>
                  <SummaryValue>{formatPrice(subtotal)}</SummaryValue>
                </SummaryRow>
                <SummaryRow>
                  <SummaryLabel>배송비</SummaryLabel>
                  <SummaryValue>
                    {shipping === 0 ? '무료' : formatPrice(shipping)}
                  </SummaryValue>
                </SummaryRow>
                <TotalRow>
                  <TotalLabel>총 결제금액</TotalLabel>
                  <TotalValue>{formatPrice(finalTotal)}</TotalValue>
                </TotalRow>
                
                <ActionButtons>
                  <Button
                    variant="primary"
                    size="large"
                    fullWidth
                    onClick={handleCheckout}
                  >
                    주문하기 ({formatPrice(finalTotal)})
                  </Button>
                  <ClearCartButton onClick={handleClearCart}>
                    장바구니 비우기
                  </ClearCartButton>
                </ActionButtons>
              </CartSummary>
            )}
          </DrawerContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
};