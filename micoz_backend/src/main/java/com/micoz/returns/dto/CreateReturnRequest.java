package com.micoz.returns.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateReturnRequest {

    /** CANCEL / EXCHANGE / RETURN */
    @NotBlank
    private String returnType;

    /** CHANGE_OF_MIND / DEFECT / WRONG_DELIVERY / ETC */
    @NotBlank
    private String returnReasonType;

    private String returnReason;

    @NotEmpty
    @Valid
    private List<ReturnItemInput> items;

    // 회수지 (RETURN/EXCHANGE 시 권장)
    private String pickupZipCode;
    private String pickupAddress;
    private String pickupAddressDetail;
    private String pickupPhone;
}
