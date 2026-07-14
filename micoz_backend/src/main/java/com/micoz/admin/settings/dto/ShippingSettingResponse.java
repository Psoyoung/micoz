package com.micoz.admin.settings.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** 배송 설정 조회 응답 (S-T2). updatedAt/updatedBy는 관리자 편의(마지막 변경 시각·자, S-Q4). */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ShippingSettingResponse {

    private Long shipSeq;
    private String shippingName;
    private BigDecimal shippingFee;
    private BigDecimal freeShippingMin;
    private BigDecimal remoteExtraFee;
    private String shippingNotice;
    private OffsetDateTime updatedAt;
    private String updatedBy;
}
