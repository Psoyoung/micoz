package com.micoz.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.micoz.user.entity.UserAddress;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AddressResponse {
    private Long addressSeq;
    private String addressName;
    private String recipientName;
    private String recipientPhone;
    private String zipCode;
    private String address;
    private String addressDetail;
    private String defaultYn;

    public static AddressResponse from(UserAddress a) {
        return AddressResponse.builder()
                .addressSeq(a.getAddressSeq())
                .addressName(a.getAddressName())
                .recipientName(a.getRecipientName())
                .recipientPhone(a.getRecipientPhone())
                .zipCode(a.getZipCode())
                .address(a.getAddress())
                .addressDetail(a.getAddressDetail())
                .defaultYn(a.getDefaultYn())
                .build();
    }
}
