import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Address } from './checkoutSlice';

interface AddressState {
  addresses: Address[];
  defaultAddressId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AddressState = {
  addresses: [
    // 샘플 주소 데이터
    {
      id: '1',
      name: '홍길동',
      phone: '010-1234-5678',
      zipCode: '06292',
      address: '서울특별시 강남구 강남대로 364',
      detailAddress: '101동 501호',
      isDefault: true
    },
    {
      id: '2',
      name: '김철수',
      phone: '010-9876-5432',
      zipCode: '13494',
      address: '경기도 성남시 분당구 판교로 235',
      detailAddress: '더샵 아파트 202동 1502호',
      isDefault: false
    }
  ],
  defaultAddressId: '1',
  isLoading: false,
  error: null,
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    // 주소 목록 로딩
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // 에러 설정
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // 주소 목록 설정
    setAddresses: (state, action: PayloadAction<Address[]>) => {
      state.addresses = action.payload;
    },
    
    // 새 주소 추가
    addAddress: (state, action: PayloadAction<Omit<Address, 'id'>>) => {
      const newAddress: Address = {
        ...action.payload,
        id: Date.now().toString(),
      };
      
      // 첫 번째 주소이거나 기본 주소로 설정된 경우
      if (state.addresses.length === 0 || newAddress.isDefault) {
        // 기존 기본 주소들을 일반 주소로 변경
        state.addresses.forEach(addr => {
          addr.isDefault = false;
        });
        newAddress.isDefault = true;
        state.defaultAddressId = newAddress.id;
      }
      
      state.addresses.push(newAddress);
    },
    
    // 주소 수정
    updateAddress: (state, action: PayloadAction<Address>) => {
      const updatedAddress = action.payload;
      const index = state.addresses.findIndex(addr => addr.id === updatedAddress.id);
      
      if (index !== -1) {
        // 기본 주소로 설정된 경우
        if (updatedAddress.isDefault) {
          // 기존 기본 주소들을 일반 주소로 변경
          state.addresses.forEach(addr => {
            addr.isDefault = false;
          });
          state.defaultAddressId = updatedAddress.id;
        }
        
        state.addresses[index] = updatedAddress;
      }
    },
    
    // 주소 삭제
    deleteAddress: (state, action: PayloadAction<string>) => {
      const addressId = action.payload;
      const addressToDelete = state.addresses.find(addr => addr.id === addressId);
      
      // 기본 주소를 삭제하는 경우
      if (addressToDelete?.isDefault && state.addresses.length > 1) {
        // 첫 번째 다른 주소를 기본 주소로 설정
        const remainingAddresses = state.addresses.filter(addr => addr.id !== addressId);
        if (remainingAddresses.length > 0) {
          remainingAddresses[0].isDefault = true;
          state.defaultAddressId = remainingAddresses[0].id;
        }
      } else if (state.addresses.length === 1) {
        state.defaultAddressId = null;
      }
      
      state.addresses = state.addresses.filter(addr => addr.id !== addressId);
    },
    
    // 기본 주소 설정
    setDefaultAddress: (state, action: PayloadAction<string>) => {
      const addressId = action.payload;
      
      // 모든 주소를 일반 주소로 변경
      state.addresses.forEach(addr => {
        addr.isDefault = false;
      });
      
      // 선택된 주소를 기본 주소로 설정
      const address = state.addresses.find(addr => addr.id === addressId);
      if (address) {
        address.isDefault = true;
        state.defaultAddressId = addressId;
      }
    },
  },
});

export const {
  setLoading,
  setError,
  setAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = addressSlice.actions;

export default addressSlice.reducer;