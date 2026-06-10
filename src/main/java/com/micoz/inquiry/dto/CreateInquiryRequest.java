package com.micoz.inquiry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateInquiryRequest {

    /** PRODUCT / ORDER / DELIVERY / RETURN / ETC */
    @NotBlank
    private String inquiryType;

    @NotBlank
    @Size(max = 100)
    private String title;

    @NotBlank
    private String content;

    /** Y / N (default N) */
    @Size(min = 1, max = 1)
    private String privateYn;

    private Long productSeq;
    private Long orderSeq;
}
