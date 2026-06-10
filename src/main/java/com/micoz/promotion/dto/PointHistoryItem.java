package com.micoz.promotion.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PointHistoryItem {
    private Long pointSeq;
    /** EARN / USE / EXPIRE / CANCEL */
    private String pointType;
    /** 적립 양수, 사용 음수 */
    private Integer pointAmount;
    private Integer balanceAfter;
    private String reason;
    private Long orderSeq;
    private OffsetDateTime expireDate;
    private OffsetDateTime createdDate;
}
