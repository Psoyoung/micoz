package com.micoz.user.service;

import com.micoz.common.exception.BusinessException;
import com.micoz.common.response.ErrorCode;
import com.micoz.user.dto.AddressResponse;
import com.micoz.user.dto.CreateAddressRequest;
import com.micoz.user.dto.UpdateAddressRequest;
import com.micoz.user.entity.UserAddress;
import com.micoz.user.repository.UserAddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAddressService {

    private final UserAddressRepository userAddressRepository;

    @Transactional(readOnly = true)
    public List<AddressResponse> getMyAddresses(Long userSeq) {
        return userAddressRepository.findAllActiveByUserSeq(userSeq).stream()
                .map(AddressResponse::from)
                .toList();
    }

    @Transactional
    public AddressResponse create(Long userSeq, CreateAddressRequest req) {
        boolean wantDefault = Boolean.TRUE.equals(req.getIsDefault());
        // 첫 배송지는 기본 배송지로 자동 승격
        boolean firstAddress = userAddressRepository.findAllActiveByUserSeq(userSeq).isEmpty();
        boolean shouldBeDefault = wantDefault || firstAddress;

        if (shouldBeDefault) {
            clearDefaults(userSeq);
        }

        UserAddress saved = userAddressRepository.save(UserAddress.builder()
                .userSeq(userSeq)
                .addressName(req.getAddressName())
                .recipientName(req.getRecipientName())
                .recipientPhone(req.getRecipientPhone())
                .zipCode(req.getZipCode())
                .address(req.getAddress())
                .addressDetail(req.getAddressDetail())
                .defaultYn(shouldBeDefault ? "Y" : "N")
                .useYn("Y")
                .build());
        return AddressResponse.from(saved);
    }

    @Transactional
    public AddressResponse update(Long userSeq, Long addressSeq, UpdateAddressRequest req) {
        UserAddress addr = userAddressRepository.findActiveByAddressSeqAndUserSeq(addressSeq, userSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND));
        addr.update(req.getAddressName(), req.getRecipientName(), req.getRecipientPhone(),
                req.getZipCode(), req.getAddress(), req.getAddressDetail());
        return AddressResponse.from(addr);
    }

    @Transactional
    public void delete(Long userSeq, Long addressSeq) {
        UserAddress addr = userAddressRepository.findActiveByAddressSeqAndUserSeq(addressSeq, userSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND));
        addr.softDelete();
    }

    @Transactional
    public AddressResponse setDefault(Long userSeq, Long addressSeq) {
        UserAddress addr = userAddressRepository.findActiveByAddressSeqAndUserSeq(addressSeq, userSeq)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND));
        clearDefaults(userSeq);
        addr.markDefault();
        return AddressResponse.from(addr);
    }

    private void clearDefaults(Long userSeq) {
        userAddressRepository.findAllByUserSeqAndDefaultYnAndUseYn(userSeq, "Y", "Y")
                .forEach(UserAddress::unmarkDefault);
    }
}
