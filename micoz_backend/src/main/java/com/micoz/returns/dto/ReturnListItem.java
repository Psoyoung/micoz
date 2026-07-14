package com.micoz.returns.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReturnListItem {
    private Long returnSeq;
    private String returnNo;
    private Long orderSeq;
    private String orderNo;
    private String returnType;
    private String returnStatus;
    private String returnReasonType;
    private OffsetDateTime requestedDate;
    private Integer totalItemCount;
}
