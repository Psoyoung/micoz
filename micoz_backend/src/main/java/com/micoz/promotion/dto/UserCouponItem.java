package com.micoz.promotion.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserCouponItem {
    private Long userCouponSeq;
    private Long couponSeq;
    private String couponCode;
    private String couponName;
    /** PERCENT / FIXED */
    private String couponType;
    private BigDecimal discountValue;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscount;
    private String description;
    /** AVAILABLE / USED / EXPIRED */
    private String couponStatus;
    private OffsetDateTime issuedDate;
    private OffsetDateTime expireDate;
    private OffsetDateTime usedDate;
    private Long orderSeq;
}
