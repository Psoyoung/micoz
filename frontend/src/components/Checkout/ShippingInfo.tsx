import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedAddress, setSelectedShippingMethod } from '../../store/checkoutSlice';
import type { Address, ShippingMethod } from '../../store/checkoutSlice';
import { AddressModal } from '../AddressModal';

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

const AddressGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const AddressCard = styled(motion.div)<{ selected: boolean }>`
  padding: ${({ theme }) => theme.spacing[4]};
  border: 2px solid ${({ selected, theme }) => 
    selected ? theme.colors.primary.sage : theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ selected, theme }) => 
    selected ? theme.colors.primary.sage + '10' : 'white'};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.sage};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const AddressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const AddressName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const DefaultBadge = styled.span`
  background: ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const AddressDetails = styled.div`
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const AddressPhone = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

const NewAddressButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[4]};
  border: 2px dashed ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: none;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.sage};
    color: ${({ theme }) => theme.colors.primary.sage};
    background: ${({ theme }) => theme.colors.primary.sage}10;
  }
`;

const ShippingMethodGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const ShippingMethodCard = styled(motion.div)<{ selected: boolean; disabled?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[4]};
  border: 2px solid ${({ selected, disabled, theme }) => {
    if (disabled) return theme.colors.gray[200];
    return selected ? theme.colors.primary.sage : theme.colors.gray[200];
  }};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ selected, disabled, theme }) => {
    if (disabled) return theme.colors.gray[50];
    return selected ? theme.colors.primary.sage + '10' : 'white';
  }};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.6 : 1};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    ${({ disabled, theme }) => !disabled && `
      border-color: ${theme.colors.primary.sage};
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.md};
    `}
  }
`;

const ShippingMethodInfo = styled.div`
  flex: 1;
`;

const ShippingMethodName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const ShippingMethodDescription = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const ShippingMethodDays = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.primary.sage};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ShippingMethodPrice = styled.div`
  text-align: right;
`;

const Price = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
`;

const FreePrice = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.green[600]};
`;

const formatPrice = (price: number): string => {
  return `₩${price.toLocaleString()}`;
};

export const ShippingInfo: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    selectedAddress, 
    selectedShippingMethod, 
    shippingMethods 
  } = useAppSelector(state => state.checkout);
  const { addresses } = useAppSelector(state => state.address);
  const { total } = useAppSelector(state => state.cart);
  
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // 기본 주소를 자동으로 선택
  useEffect(() => {
    if (!selectedAddress && addresses.length > 0) {
      const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
      dispatch(setSelectedAddress(defaultAddress));
    }
  }, [addresses, selectedAddress, dispatch]);

  const handleAddressSelect = (address: Address) => {
    dispatch(setSelectedAddress(address));
  };

  const handleShippingMethodSelect = (method: ShippingMethod) => {
    // 무료배송 조건 확인
    if (method.id === 'free' && total < 50000) {
      return; // 5만원 미만이면 무료배송 선택 불가
    }
    dispatch(setSelectedShippingMethod(method));
  };

  const isShippingMethodDisabled = (method: ShippingMethod) => {
    return method.id === 'free' && total < 50000;
  };

  return (
    <Container>
      <Section>
        <SectionTitle>배송지 선택</SectionTitle>
        
        <AddressGrid>
          {addresses.map((address, index) => (
            <AddressCard
              key={address.id}
              selected={selectedAddress?.id === address.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onClick={() => handleAddressSelect(address)}
            >
              <AddressHeader>
                <AddressName>{address.name}</AddressName>
                {address.isDefault && <DefaultBadge>기본 배송지</DefaultBadge>}
              </AddressHeader>
              
              <AddressDetails>
                <div>({address.zipCode}) {address.address}</div>
                <div>{address.detailAddress}</div>
              </AddressDetails>
              
              <AddressPhone>{address.phone}</AddressPhone>
            </AddressCard>
          ))}
          
          <NewAddressButton onClick={() => setIsAddressModalOpen(true)}>
            + 새 배송지 추가
          </NewAddressButton>
        </AddressGrid>
      </Section>

      <Section>
        <SectionTitle>배송 방법 선택</SectionTitle>
        
        <ShippingMethodGrid>
          {shippingMethods.map((method, index) => (
            <ShippingMethodCard
              key={method.id}
              selected={selectedShippingMethod?.id === method.id}
              disabled={isShippingMethodDisabled(method)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onClick={() => !isShippingMethodDisabled(method) && handleShippingMethodSelect(method)}
            >
              <ShippingMethodInfo>
                <ShippingMethodName>{method.name}</ShippingMethodName>
                <ShippingMethodDescription>{method.description}</ShippingMethodDescription>
                <ShippingMethodDays>배송 예정: {method.estimatedDays}</ShippingMethodDays>
                {method.id === 'free' && total < 50000 && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#ef4444', 
                    marginTop: '4px' 
                  }}>
                    5만원 이상 구매 시 이용 가능
                  </div>
                )}
              </ShippingMethodInfo>
              
              <ShippingMethodPrice>
                {method.price === 0 ? (
                  <FreePrice>무료</FreePrice>
                ) : (
                  <Price>{formatPrice(method.price)}</Price>
                )}
              </ShippingMethodPrice>
            </ShippingMethodCard>
          ))}
        </ShippingMethodGrid>
      </Section>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title="새 배송지 추가"
      />
    </Container>
  );
};