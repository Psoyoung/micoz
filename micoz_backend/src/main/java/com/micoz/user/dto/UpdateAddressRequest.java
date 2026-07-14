package com.micoz.user.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAddressRequest {

    @Size(max = 100)
    private String addressName;

    @Size(max = 100)
    private String recipientName;

    @Size(max = 20)
    private String recipientPhone;

    @Size(max = 10)
    private String zipCode;

    @Size(max = 500)
    private String address;

    @Size(max = 500)
    private String addressDetail;
}
