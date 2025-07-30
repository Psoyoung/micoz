import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch } from '../../store/hooks';
import { addAddress, updateAddress } from '../../store/addressSlice';
import { addToast } from '../../store/toastSlice';
import type { Address } from '../../store/checkoutSlice';
import { Button } from '../Button';
import { Input } from '../Input';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  address?: Address | null;
  title?: string;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[4]};
`;

const ModalContainer = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${({ theme }) => theme.shadows.xl};

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

const ModalHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
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
  color: ${({ theme }) => theme.colors.gray[400]};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const ModalContent = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[5]};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Required = styled.span`
  color: ${({ theme }) => theme.colors.red[500]};
  margin-left: ${({ theme }) => theme.spacing[1]};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: ${({ theme }) => theme.spacing[3]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const AddressSearchContainer = styled.div`
  position: relative;
`;

const AddressSearchButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]};
  border: 2px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: white;
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  text-align: left;
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.sage};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.sage};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary.sage}20;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.secondary.charcoal};
  cursor: pointer;
  user-select: none;
`;

const ModalFooter = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  justify-content: flex-end;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.red[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

// 다음/카카오 주소 API를 위한 타입 정의
declare global {
  interface Window {
    daum: any;
  }
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  address,
  title = '배송지 추가'
}) => {
  const dispatch = useAppDispatch();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    zipCode: '',
    address: '',
    detailAddress: '',
    isDefault: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 수정 모드일 때 기존 주소 데이터로 폼 초기화
  useEffect(() => {
    if (address) {
      setFormData({
        name: address.name,
        phone: address.phone,
        zipCode: address.zipCode,
        address: address.address,
        detailAddress: address.detailAddress,
        isDefault: address.isDefault
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        zipCode: '',
        address: '',
        detailAddress: '',
        isDefault: false
      });
    }
    setErrors({});
  }, [address, isOpen]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const openAddressSearch = () => {
    if (!window.daum) {
      // 카카오 주소 API 스크립트 동적 로드
      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.onload = () => {
        performAddressSearch();
      };
      document.head.appendChild(script);
    } else {
      performAddressSearch();
    }
  };

  const performAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        setFormData(prev => ({
          ...prev,
          zipCode: data.zonecode,
          address: data.address
        }));
      },
      theme: {
        bgColor: '#FFFFFF',
        searchBgColor: '#0B612D',
        contentBgColor: '#FFFFFF',
        pageBgColor: '#FFFFFF',
        textColor: '#333333',
        queryTextColor: '#FFFFFF'
      }
    }).open();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '받는 분 성함을 입력해주세요.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요.';
    } else if (!/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = '올바른 휴대폰 번호를 입력해주세요.';
    }

    if (!formData.zipCode) {
      newErrors.zipCode = '우편번호를 검색해주세요.';
    }

    if (!formData.address) {
      newErrors.address = '주소를 검색해주세요.';
    }

    if (!formData.detailAddress.trim()) {
      newErrors.detailAddress = '상세주소를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const addressData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      zipCode: formData.zipCode,
      address: formData.address,
      detailAddress: formData.detailAddress.trim(),
      isDefault: formData.isDefault
    };

    if (address) {
      // 수정 모드
      dispatch(updateAddress({ ...addressData, id: address.id }));
      dispatch(addToast({
        type: 'success',
        message: '배송지가 수정되었습니다.'
      }));
    } else {
      // 추가 모드
      dispatch(addAddress(addressData));
      dispatch(addToast({
        type: 'success',
        message: '새 배송지가 추가되었습니다.'
      }));
    }

    onClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      phone: '',
      zipCode: '',
      address: '',
      detailAddress: '',
      isDefault: false
    });
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <ModalContainer
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>{address ? '배송지 수정' : title}</ModalTitle>
              <CloseButton onClick={handleClose}>×</CloseButton>
            </ModalHeader>

            <ModalContent>
              <FormGroup>
                <Label>
                  받는 분 <Required>*</Required>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="받는 분 성함을 입력해주세요"
                  error={!!errors.name}
                />
                {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label>
                  연락처 <Required>*</Required>
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="010-1234-5678"
                  error={!!errors.phone}
                />
                {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label>
                  주소 <Required>*</Required>
                </Label>
                <FormRow>
                  <div>
                    <Input
                      value={formData.zipCode}
                      placeholder="우편번호"
                      readOnly
                      error={!!errors.zipCode}
                    />
                    {errors.zipCode && <ErrorMessage>{errors.zipCode}</ErrorMessage>}
                  </div>
                  <AddressSearchContainer>
                    <AddressSearchButton
                      type="button"
                      onClick={openAddressSearch}
                    >
                      {formData.address || '주소 검색'}
                    </AddressSearchButton>
                    {errors.address && <ErrorMessage>{errors.address}</ErrorMessage>}
                  </AddressSearchContainer>
                </FormRow>
              </FormGroup>

              <FormGroup>
                <Label>
                  상세주소 <Required>*</Required>
                </Label>
                <Input
                  value={formData.detailAddress}
                  onChange={(e) => handleInputChange('detailAddress', e.target.value)}
                  placeholder="동, 호수 등 상세주소를 입력해주세요"
                  error={!!errors.detailAddress}
                />
                {errors.detailAddress && <ErrorMessage>{errors.detailAddress}</ErrorMessage>}
              </FormGroup>

              <CheckboxContainer>
                <Checkbox
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                />
                <CheckboxLabel htmlFor="isDefault">
                  기본 배송지로 설정
                </CheckboxLabel>
              </CheckboxContainer>
            </ModalContent>

            <ModalFooter>
              <Button
                variant="secondary"
                size="medium"
                onClick={handleClose}
              >
                취소
              </Button>
              <Button
                variant="primary"
                size="medium"
                onClick={handleSubmit}
              >
                {address ? '수정 완료' : '추가 완료'}
              </Button>
            </ModalFooter>
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
};