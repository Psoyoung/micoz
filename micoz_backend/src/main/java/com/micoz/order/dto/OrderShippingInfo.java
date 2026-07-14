package com.micoz.order.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderShippingInfo {
    private String recipientName;
    private String recipientPhone;
    private String zipCode;
    private String address;
    private String addressDetail;
    private String shippingMemo;
    private String trackingNo;
    private String shippingStatus;
    private OffsetDateTime shippedDate;
    private OffsetDateTime deliveredDate;
}
