import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { deleteAddress, setDefaultAddress } from '../../store/addressSlice';
import { addToast } from '../../store/toastSlice';
import type { Address } from '../../store/checkoutSlice';
import { AddressModal } from '../AddressModal';

interface AddressManagerProps {
  onAddressSelect?: (address: Address) => void;
  selectedAddressId?: string;
  showSelectMode?: boolean;
}

const Container = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.base};
  overflow: hidden;
`;

const Header = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.secondary.korean};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary.deepForest};
  margin: 0;
`;

const AddButton = styled.button`
  background: ${({ theme }) => theme.colors.primary.sage};
  color: ${({ theme }) => theme.colors.secondary.ivory};
  border: none;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.deepForest};
    transform: translateY(-2px);
  }
`;

const AddressList = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const AddressCard = styled(motion.div)<{ selected?: boolean; isSelectable?: boolean }>`
  padding: ${({ theme }) => theme.spacing[5]};
  border: 2px solid ${({ selected, theme }) => 
    selected ? theme.colors.primary.sage : theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ selected, theme }) => 
    selected ? theme.colors.primary.sage + '10' : theme.colors.gray[50]};
  cursor: ${({ isSelectable }) => isSelectable ? 'pointer' : 'default'};
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ isSelectable, theme }) => isSelectable && `
    &:hover {
      border-color: ${theme.colors.primary.sage};
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.md};
    }
  `}
`;

const AddressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const AddressInfo = styled.div`
  flex: 1;
`;

const AddressName = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Name = styled.span`
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

const Phone = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

const AddressText = styled.div`
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const AddressActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: flex-end;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'danger' }>`
  background: none;
  border: 1px solid ${({ variant, theme }) => {
    switch (variant) {
      case 'danger': return theme.colors.red[300];
      default: return theme.colors.gray[300];
    }
  }};
  color: ${({ variant, theme }) => {
    switch (variant) {
      case 'danger': return theme.colors.red[600];
      default: return theme.colors.secondary.charcoal;
    }
  }};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  min-width: 80px;

  &:hover {
    background: ${({ variant, theme }) => {
      switch (variant) {
        case 'danger': return theme.colors.red[50];
        default: return theme.colors.gray[50];
      }
    }};
    border-color: ${({ variant, theme }) => {
      switch (variant) {
        case 'danger': return theme.colors.red[400];
        default: return theme.colors.primary.sage;
      }
    }};
  }
`;

const SetDefaultButton = styled(ActionButton)`
  color: ${({ theme }) => theme.colors.primary.sage};
  border-color: ${({ theme }) => theme.colors.primary.sage};

  &:hover {
    background: ${({ theme }) => theme.colors.primary.sage}10;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[6]};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

export const AddressManager: React.FC<AddressManagerProps> = ({
  onAddressSelect,
  selectedAddressId,
  showSelectMode = false
}) => {
  const dispatch = useAppDispatch();
  const { addresses } = useAppSelector(state => state.address);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleDeleteAddress = (address: Address) => {
    const message = address.isDefault 
      ? '기본 배송지를 삭제하시겠습니까?\n(다른 주소가 기본 배송지가 됩니다)'
      : '이 배송지를 삭제하시겠습니까?';
    
    if (window.confirm(message)) {
      dispatch(deleteAddress(address.id));
      dispatch(addToast({
        type: 'success',
        message: '배송지가 삭제되었습니다.'
      }));
    }
  };

  const handleSetDefault = (address: Address) => {
    if (!address.isDefault) {
      dispatch(setDefaultAddress(address.id));
      dispatch(addToast({
        type: 'success',
        message: '기본 배송지가 변경되었습니다.'
      }));
    }
  };

  const handleAddressClick = (address: Address) => {
    if (showSelectMode && onAddressSelect) {
      onAddressSelect(address);
    }
  };

  if (addresses.length === 0) {
    return (
      <Container>
        <Header>
          <Title>배송지 관리</Title>
          <AddButton onClick={handleAddAddress}>
            + 새 배송지 추가
          </AddButton>
        </Header>
        
        <EmptyState>
          <EmptyIcon>📍</EmptyIcon>
          <EmptyText>등록된 배송지가 없습니다</EmptyText>
          <AddButton onClick={handleAddAddress}>
            첫 번째 배송지 추가하기
          </AddButton>
        </EmptyState>

        <AddressModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          address={editingAddress}
        />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          {showSelectMode ? '배송지 선택' : '배송지 관리'}
        </Title>
        <AddButton onClick={handleAddAddress}>
          + 새 배송지 추가
        </AddButton>
      </Header>

      <AddressList>
        <AnimatePresence>
          {addresses.map((address, index) => (
            <AddressCard
              key={address.id}
              selected={showSelectMode && selectedAddressId === address.id}
              isSelectable={showSelectMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onClick={() => handleAddressClick(address)}
            >
              <AddressHeader>
                <AddressInfo>
                  <AddressName>
                    <Name>{address.name}</Name>
                    {address.isDefault && <DefaultBadge>기본 배송지</DefaultBadge>}
                  </AddressName>
                  <Phone>{address.phone}</Phone>
                  <AddressText>
                    ({address.zipCode}) {address.address}
                  </AddressText>
                  <AddressText>
                    {address.detailAddress}
                  </AddressText>
                </AddressInfo>

                {!showSelectMode && (
                  <AddressActions>
                    {!address.isDefault && (
                      <SetDefaultButton onClick={() => handleSetDefault(address)}>
                        기본 설정
                      </SetDefaultButton>
                    )}
                    <ActionButton onClick={() => handleEditAddress(address)}>
                      수정
                    </ActionButton>
                    <ActionButton 
                      variant="danger"
                      onClick={() => handleDeleteAddress(address)}
                    >
                      삭제
                    </ActionButton>
                  </AddressActions>
                )}
              </AddressHeader>
            </AddressCard>
          ))}
        </AnimatePresence>
      </AddressList>

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        address={editingAddress}
      />
    </Container>
  );
};